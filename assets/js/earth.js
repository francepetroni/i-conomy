/* Orbital Earth — the hero band above the homepage headline.
 *
 * A single full-band triangle; the fragment shader intersects an orthographic
 * ray with a sphere and shades the hit analytically. No 3D library: the whole
 * scene is one sphere, so a matrix stack and a scene graph would cost ~150 KB
 * to express four lines of maths.
 *
 * Two textures, both NASA public domain:
 *   earth-day.webp   RGB = Blue Marble Next Generation (topography, bathymetry)
 *   earth-mask.webp  R = Black Marble city lights · G = clouds · B = ocean mask
 *
 * Performance contract, because this sits above the H1:
 *   · <canvas> is not an LCP candidate in Chrome, so the headline stays the LCP
 *     element. Textures load at low priority, after the document has parsed.
 *   · The band's height is reserved in CSS, so nothing shifts when it paints.
 *   · The loop runs only while the band is on screen and the tab is visible.
 *   · prefers-reduced-motion gets one static frame, not a frozen black box.
 */
(function () {
  'use strict';

  var band = document.querySelector('[data-earth]');
  if (!band) return;

  var canvas = band.querySelector('canvas');
  var gl = canvas && canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power'
  });

  // No WebGL2 (or it was refused): leave the CSS still-frame in place.
  if (!gl) { band.classList.add('is-static'); return; }

  // Save-Data, or a 2G-class connection: 249 KB of decoration is not worth it.
  // The band keeps its reserved height and shows only its gradient, so nothing
  // shifts and no texture is ever requested.
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn && (conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || ''))) {
    band.classList.add('is-off');
    return;
  }

  var VERT = [
    '#version 300 es',
    'void main(){',
    // one oversized triangle covering the viewport — no vertex buffer needed
    '  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);',
    '  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAG = [
    '#version 300 es',
    'precision highp float;',
    'uniform vec2 uRes;',
    'uniform float uSpin;',
    'uniform float uGeom;',   // 0 = wide band, 1 = narrow/mobile
    'uniform sampler2D uDay;',
    'uniform sampler2D uMask;',
    'out vec4 outColor;',

    'const float PI  = 3.141592653589793;',
    'const float TAU = 6.283185307179586;',
    'const float TILT = 0.4101524;',              // 23.5 degrees
    'const vec3  SUN = vec3(-0.7817, 0.2606, 0.5665);',   // normalised, well off-axis

    'float hash21(vec2 p){',
    '  p = fract(p * vec2(123.34, 456.21));',
    '  p += dot(p, p + 45.32);',
    '  return fract(p.x * p.y);',
    '}',

    'mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }',
    'mat3 rotZ(float a){ float c=cos(a), s=sin(a); return mat3(c,-s,0., s,c,0., 0.,0.,1.); }',

    'vec2 equirect(vec3 n){',
    '  return vec2(atan(n.z, n.x) / TAU + 0.5, acos(clamp(n.y, -1.0, 1.0)) / PI);',
    '}',

    // Equirectangular wraps at u=0/1. Screen-space derivatives jump a full unit
    // across that seam and would pick the smallest mip, drawing a bright line
    // down the globe. Unwrap the derivative, then choose the mip explicitly.
    'vec3 sampleEq(sampler2D tex, vec2 uv){',
    '  vec2 dx = dFdx(uv), dy = dFdy(uv);',
    '  dx.x = fract(dx.x + 0.5) - 0.5;',
    '  dy.x = fract(dy.x + 0.5) - 0.5;',
    '  return textureGrad(tex, uv, dx, dy).rgb;',
    '}',

    'void main(){',
    '  vec2 frag = gl_FragCoord.xy;',
    '  float H = uRes.y;',

    // The globe is cropped by the bottom edge: we look at the sunlit cap of a
    // planet that continues past the band, the way it reads from low orbit.
    '  float R   = max(mix(0.86, 0.98, uGeom) * H, 0.50 * uRes.x * uGeom);',
    '  float sky = mix(0.085, 0.04, uGeom) * H;',
    '  vec2  C   = vec2(uRes.x * 0.5, H - sky - R);',

    '  vec2  d  = (frag - C) / R;',
    '  float r  = length(d);',
    '  float z  = sqrt(max(0.0, 1.0 - r * r));',

    // ---- deep space -------------------------------------------------------
    '  vec2 sp = frag / H * 15.0;',
    '  vec2 cell = floor(sp), f = fract(sp);',
    '  float pick = hash21(cell);',
    '  vec2 sPos = vec2(hash21(cell + 1.7), hash21(cell + 3.3));',
    '  float star = smoothstep(0.070, 0.0, length(f - sPos)) * step(0.905, pick);',
    '  star *= 0.25 + 0.75 * hash21(cell + 9.1);',
    '  vec3 col = vec3(0.0022, 0.0038, 0.0072);',
    '  col += vec3(0.0010, 0.0017, 0.0038) * smoothstep(1.0, 0.0, frag.y / H);',
    '  col += vec3(0.85, 0.90, 1.0) * star * 0.75;',

    // ---- atmospheric shell outside the disc --------------------------------
    '  vec3 outward = normalize(vec3(d, 0.0));',
    '  float sunSide = smoothstep(-0.25, 0.85, dot(outward, SUN));',
    '  float halo = exp(-max(r - 1.0, 0.0) * 13.0);',
    '  col += vec3(0.16, 0.38, 0.88) * halo * (0.22 + 1.05 * sunSide) * step(1.0, r);',

    // ---- the planet --------------------------------------------------------
    '  vec3 n = vec3(d, z);',
    '  mat3 surf  = rotZ(TILT) * rotY(uSpin);',
    '  mat3 cloudM = rotZ(TILT) * rotY(uSpin * 1.17 + 0.6);',
    '  vec2 uvS = equirect(transpose(surf) * n);',
    '  vec2 uvC = equirect(transpose(cloudM) * n);',

    '  vec3 albedo = sampleEq(uDay, uvS);',
    '  vec3 m      = sampleEq(uMask, uvS);',
    '  float cloud = sampleEq(uMask, uvC).g;',

    '  float lam = dot(n, SUN);',
    '  float day = smoothstep(-0.14, 0.26, lam);',

    // sun glint, oceans only
    '  vec3 hv = normalize(SUN + vec3(0.0, 0.0, 1.0));',
    '  float spec = pow(max(dot(n, hv), 0.0), 72.0) * m.b * 0.60;',

    '  vec3 surfCol = albedo * (day * 1.08 + 0.015);',
    '  surfCol += spec * day * vec3(1.0, 0.95, 0.86);',

    // cloud deck, lit by the same terminator and casting nothing (cheap, reads fine)
    '  surfCol = mix(surfCol, vec3(1.0, 0.99, 0.97) * (day * 0.98 + 0.025), cloud * 0.88);',

    // city lights emerge only where the sun has left, and dim under cloud
    '  float night = 1.0 - day;',
    '  surfCol += m.r * vec3(1.0, 0.76, 0.42) * night * (1.0 - cloud * 0.75) * 1.45;',

    // inner atmosphere: strongest at the limb, brightest where the sun grazes
    '  float rim = pow(1.0 - z, 3.2);',
    '  surfCol += vec3(0.30, 0.52, 0.96) * rim * smoothstep(-0.40, 0.65, lam) * 1.12;',

    // ---- composite, antialiased against the disc edge -----------------------
    '  float aa = fwidth(r) * 1.2;',
    '  float inside = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, r);',
    '  col = mix(col, surfCol, inside);',

    '  outColor = vec4(pow(max(col, 0.0), vec3(0.4545)), 1.0);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('[earth] shader:', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { band.classList.add('is-static'); return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[earth] link:', gl.getProgramInfoLog(prog));
    band.classList.add('is-static');
    return;
  }
  gl.useProgram(prog);

  var uRes  = gl.getUniformLocation(prog, 'uRes');
  var uSpin = gl.getUniformLocation(prog, 'uSpin');
  var uGeom = gl.getUniformLocation(prog, 'uGeom');
  gl.uniform1i(gl.getUniformLocation(prog, 'uDay'), 0);
  gl.uniform1i(gl.getUniformLocation(prog, 'uMask'), 1);

  var aniso = gl.getExtension('EXT_texture_filter_anisotropic');

  function upload(img, unit) {
    var tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, img);
    // wrap in longitude, clamp at the poles
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    if (aniso) {
      var max = gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
      gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, max));
    }
    return tex;
  }

  var w = 0, h = 0;

  // Phones ship 3x panels. The globe is a soft photographic image at ~190 px
  // tall, where 1.5x is indistinguishable from 3x and costs a quarter of the
  // fragments — which on a mid-range phone is the difference between warm and
  // cool in the hand.
  function pixelRatio() {
    var raw = window.devicePixelRatio || 1;
    return Math.min(raw, band.clientWidth < 560 ? 1.5 : 2);
  }

  function resize() {
    var dpr = pixelRatio();
    var cw = Math.max(1, Math.round(band.clientWidth * dpr));
    var ch = Math.max(1, Math.round(band.clientHeight * dpr));
    if (cw === w && ch === h) return false;
    w = cw; h = ch;
    canvas.width = w; canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
    // On a narrow band the globe has to grow and sit lower, or it reads as a
    // marble lost in a letterbox.
    var narrow = 1 - Math.min(1, Math.max(0, (band.clientWidth - 560) / 460));
    gl.uniform1f(uGeom, narrow);
    return true;
  }

  // Negative: Earth turns west to east, which reads as features tracking left
  // to right across the disc. One full rotation every 105 seconds.
  var SPIN = -(Math.PI * 2) / 105000;
  // Opening angle: Europe, the Atlantic and West Africa in frame, with the
  // terminator and the American city lights on the night limb. Also the frame
  // used when motion is reduced.
  var STILL = 1.9;

  var ready = false, running = false, raf = 0, painted = false, onScreen = true;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  function draw(spin) {
    gl.uniform1f(uSpin, spin);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!painted) { painted = true; band.classList.add('is-live'); }
  }

  var t0 = 0, spinAt = 0;

  function frame(now) {
    if (!running) return;
    if (!t0) t0 = now;
    spinAt = STILL + (now - t0) * SPIN;
    resize();
    draw(spinAt);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || !ready || !onScreen || document.hidden) return;
    if (reduced.matches) { resize(); draw(STILL); return; }
    running = true;
    t0 = performance.now() - (spinAt - STILL) / SPIN;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  // Only animate while the band is actually on screen and the tab is in front.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      onScreen ? start() : stop();
    }, { rootMargin: '120px' }).observe(band);
  }
  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });
  reduced.addEventListener('change', function () {
    stop();
    start();
  });
  window.addEventListener('resize', function () {
    if (!running && ready) { resize(); draw(spinAt || STILL); }
  }, { passive: true });

  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault();
    stop();
    band.classList.add('is-static');
  });

  // Textures are decorative: fetch them at low priority so they never contend
  // with the resources that decide LCP.
  function load(src) {
    return new Promise(function (res, rej) {
      var img = new Image();
      img.decoding = 'async';
      if ('fetchPriority' in img) img.fetchPriority = 'low';
      img.onload = function () { res(img); };
      img.onerror = rej;
      img.src = src;
    });
  }

  var base = band.getAttribute('data-earth') || '';
  Promise.all([load(base + 'earth-day.webp'), load(base + 'earth-mask.webp')])
    .then(function (imgs) {
      upload(imgs[0], 0);
      upload(imgs[1], 1);
      ready = true;
      resize();
      start();
    })
    .catch(function () { band.classList.add('is-static'); });
})();
