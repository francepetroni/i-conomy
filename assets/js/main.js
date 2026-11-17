// Mobile nav toggle
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.querySelector('.nav-toggle');
  const nav    = document.querySelector('nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  // Dropdown toggle on mobile tap + keyboard on desktop
  document.querySelectorAll('.dropdown > a').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (window.innerWidth <= 1200) {   // same breakpoint as the collapsed menu in style.css
        e.preventDefault();
        this.closest('.dropdown').classList.toggle('open');
      }
    });
    link.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.closest('.dropdown').classList.toggle('open');
      }
    });
  });

  // Close dropdown on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.dropdown.open').forEach(function (d) {
        d.classList.remove('open');
      });
    }
  });

  // Web3Forms: submit over fetch so the visitor stays on the page.
  // Without JS the form still POSTs normally and lands on thanks.html.
  // Field names must stay ASCII: Web3Forms decodes multipart field *names* as
  // Latin-1, so a Chinese name="姓名" reaches the inbox as "Å§å". Values are fine.
  var MSG = {
    en: ['Sending…', 'Thank you — your message has been sent. We will get back to you shortly.',
         'Sorry, the message could not be sent. Please email us directly at '],
    zh: ['正在发送…', '谢谢！您的信息已发送，我们会尽快回复您。', '抱歉，信息未能发送。请直接发送邮件至 '],
    ru: ['Отправка…', 'Спасибо! Ваше сообщение отправлено. Мы скоро свяжемся с вами.',
         'К сожалению, сообщение не удалось отправить. Напишите нам напрямую: '],
    ja: ['送信中…', 'ありがとうございます。メッセージは送信されました。追ってご連絡いたします。',
         '申し訳ありません。送信できませんでした。こちらまで直接メールをお送りください：'],
    ko: ['보내는 중…', '감사합니다. 메시지가 전송되었습니다. 곧 연락드리겠습니다.',
         '죄송합니다. 메시지를 보내지 못했습니다. 다음 주소로 직접 이메일을 보내 주십시오: '],
    pl: ['Wysyłanie…', 'Dziękujemy — wiadomość została wysłana. Wkrótce się odezwiemy.',
         'Niestety nie udało się wysłać wiadomości. Napisz do nas bezpośrednio: ']
  };
  var m = MSG[(document.documentElement.lang || 'en').slice(0, 2).toLowerCase()] || MSG.en;
  var T = { sending: m[0], ok: m[1], err: m[2] };
  document.querySelectorAll('form[action*="api.web3forms.com"]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      var button = form.querySelector('button[type="submit"]');
      var label  = button ? button.textContent : '';

      if (status) { status.className = 'form-status is-pending'; status.textContent = T.sending; }
      if (button) { button.disabled = true; button.textContent = T.sending; }

      var data = new FormData(form);
      // Put the requested model in the e-mail subject so enquiries can be sorted
      // from the inbox list: "Technical Manual request (ZH) – HV3 + 1500V".
      var model = (data.get("Model's Name") || '').toString().trim();
      var subject = (data.get('subject') || '').toString();
      if (model && subject) data.set('subject', subject + ' – ' + model.slice(0, 80));

      fetch(form.action, { method: 'POST', body: data })
        .then(function (r) { return r.json().catch(function () { return { success: r.ok }; }); })
        .then(function (data) {
          if (data.success) {
            // Land on the thank-you page: it tells the visitor what happens next, and its
            // page views are the only way the (cookieless) analytics can count enquiries.
            var redirect = form.querySelector('input[name="redirect"]');
            if (redirect && redirect.value) {
              var path = new URL(redirect.value, location.href).pathname;
              location.href = location.origin + path;
              return;
            }
            form.reset();
            if (status) {
              status.className = 'form-status is-ok';
              status.textContent = T.ok;
            }
          } else {
            throw new Error(data.message || 'submit failed');
          }
        })
        .catch(function () {
          if (status) {
            status.className = 'form-status is-error';
            status.innerHTML = T.err +
                               '<a href="mailto:info@i-conomy.com">info@i-conomy.com</a>.';
          }
        })
        .finally(function () {
          if (button) { button.disabled = false; button.textContent = label; }
        });
    });
  });

  // YouTube facade -> real player on click (link to youtube.com still works without JS)
  document.querySelectorAll('.video-facade[data-yt]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var f = document.createElement('iframe');
      f.className = 'video-frame';
      f.src = 'https://www.youtube-nocookie.com/embed/' + a.dataset.yt + '?autoplay=1';
      f.title = a.dataset.title || '';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      f.allowFullscreen = true;
      a.replaceWith(f);
      f.focus();
    });
  });

  // Mark active nav link
  const path = window.location.pathname.replace(/\/$/, '') || '/index.html';
  document.querySelectorAll('nav a').forEach(function (a) {
    const href = a.getAttribute('href').replace(/\/$/, '');
    if (path.endsWith(href) && href !== '' && href !== '#') {
      a.classList.add('active');
    }
  });

  // ── Product gallery lightbox ──────────────────────────────────────────────
  const galleries = document.querySelectorAll('.product-img-gallery');
  if (!galleries.length) return;

  let group = [];      // images of the gallery currently open
  let index = 0;
  let lastFocus = null;

  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Product image viewer');
  box.innerHTML =
    '<button class="lb-close" aria-label="Close">&times;</button>' +
    '<button class="lb-nav lb-prev" aria-label="Previous image">&#8249;</button>' +
    '<figure class="lb-figure"><img alt=""><figcaption></figcaption></figure>' +
    '<button class="lb-nav lb-next" aria-label="Next image">&#8250;</button>';
  document.body.appendChild(box);

  const img = box.querySelector('img');
  const cap = box.querySelector('figcaption');
  const btnPrev = box.querySelector('.lb-prev');
  const btnNext = box.querySelector('.lb-next');

  function show(i) {
    index = (i + group.length) % group.length;
    const src = group[index];
    img.classList.remove('is-in');
    img.src = src.currentSrc || src.src;
    img.alt = src.alt || '';
    cap.textContent = src.alt || '';
    cap.hidden = !src.alt;
    // restart the entry transition on the new frame
    requestAnimationFrame(function () { img.classList.add('is-in'); });
    const many = group.length > 1;
    btnPrev.hidden = !many;
    btnNext.hidden = !many;
  }

  function open(gallery, img0) {
    group = Array.prototype.slice.call(gallery.querySelectorAll('img'));
    lastFocus = document.activeElement;
    box.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    show(group.indexOf(img0));
    box.querySelector('.lb-close').focus();
  }

  function close() {
    box.classList.remove('is-open');
    document.body.style.overflow = '';
    img.classList.remove('is-in');
    if (lastFocus) lastFocus.focus();
  }

  galleries.forEach(function (g) {
    g.querySelectorAll('img').forEach(function (im) {
      im.tabIndex = 0;
      im.setAttribute('role', 'button');
      im.addEventListener('click', function () { open(g, im); });
      im.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(g, im); }
      });
    });
  });

  box.querySelector('.lb-close').addEventListener('click', close);
  btnPrev.addEventListener('click', function () { show(index - 1); });
  btnNext.addEventListener('click', function () { show(index + 1); });
  box.addEventListener('click', function (e) { if (e.target === box) close(); });

  document.addEventListener('keydown', function (e) {
    if (!box.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
    else if (e.key === 'Tab') {   // keep focus inside the dialog
      const f = Array.prototype.filter.call(
        box.querySelectorAll('button'), function (b) { return !b.hidden; });
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // swipe between images on touch devices
  let x0 = null;
  box.addEventListener('touchstart', function (e) { x0 = e.changedTouches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 45) show(index + (dx < 0 ? 1 : -1));
    x0 = null;
  }, { passive: true });
});
