"""Generate the translated copies of the site (/ru/, /ja/, /ko/, /pl/) from the English pages.

  python _i18n/build.py extract        -> _i18n/segments.json (every translatable English string)
  python _i18n/build.py check ru       -> lists strings with no Russian entry in _i18n/src/ru.json
  python _i18n/build.py build          -> writes every language folder + hreflang/switcher on all pages

The English pages are the source of truth: edit English, re-run `extract`, translate what
`check` reports into <lang>.json, then `build`. /zh/ is hand-written and is NOT generated;
`build` only refreshes its hreflang block and language menu.

The folder starts with "_" so GitHub Pages (Jekyll) does not publish it.
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = 'https://i-conomy.com/'

# Pages that exist in every language. Everything else (privacy, cookies, terms, assets) is
# English-only and is linked back to the root.
PAGES = ['index.html', 'about.html', 'heritage.html', 'contact.html', 'quote.html',
         'quote-high-power.html', 'quote-low-power.html', 'quote-piezo-custom.html',
         'quote-single-custom.html', 'technical-manual.html', 'thanks.html',
         'modules/index.html', 'modules/single-channel.html', 'modules/custom-systems.html',
         'modules/piezoelectric.html']

# code, hreflang, native name, og:locale, short label, email-subject tag
LANGS = [
    ('en', 'en', 'English', 'en_GB', 'EN', ''),
    ('zh', 'zh-Hans', '中文', 'zh_CN', '中文', '(ZH)'),
    ('ru', 'ru', 'Русский', 'ru_RU', 'RU', '(RU)'),
    ('ja', 'ja', '日本語', 'ja_JP', '日本語', '(JA)'),
    ('ko', 'ko', '한국어', 'ko_KR', '한국어', '(KO)'),
    ('pl', 'pl', 'Polski', 'pl_PL', 'PL', '(PL)'),
]
GENERATED = ['ru', 'ja', 'ko', 'pl']
LANG = {l[0]: l for l in LANGS}

BLOCK = set('html head body header nav main section article aside footer div p h1 h2 h3 h4 h5 h6 '
            'ul ol li table thead tbody tfoot tr td th form label button select option textarea '
            'input figure figcaption blockquote dl dt dd hr img iframe svg title meta link script '
            'style noscript details summary picture source video'.split())
TRANSLATABLE_ATTRS = ('alt', 'title', 'placeholder', 'aria-label', 'data-title')
META_KEYS = ('description', 'keywords', 'og:title', 'og:description', 'twitter:title',
             'twitter:description')
TOKEN = re.compile(r'(<!--.*?-->|<script\b.*?</script>|<style\b.*?</style>|<[^>]+>)', re.S | re.I)


def read(p):
    with open(os.path.join(ROOT, p), encoding='utf-8', newline='') as f:
        return f.read()


def write(p, s):
    full = os.path.join(ROOT, p)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8', newline='') as f:
        f.write(s)


def tag_name(tok):
    m = re.match(r'</?\s*([a-zA-Z0-9]+)', tok)
    return m.group(1).lower() if m else None


def worth(s):
    return bool(re.search(r'[A-Za-z]', re.sub(r'&[a-z]+;|&#\d+;', '', re.sub(r'<[^>]+>', '', s))))


def walk(html, fn):
    """Call fn(kind, text) for every translatable string and splice in its return value.

    kind is 'text' (a run of text + inline tags between block boundaries), 'attr', 'meta',
    'title' or 'json'. Returns the rewritten html."""
    out, run = [], []

    def flush():
        if not run:
            return
        s = ''.join(run)
        run.clear()
        m = re.match(r'^(\s*)(.*?)(\s*)$', s, re.S)
        core = m.group(2)
        if worth(core):
            # <a href="x">Home</a> -> translate just "Home", so the same label under a
            # different link path is one string, not two
            w = re.fullmatch(r'(<([a-zA-Z]+)\b[^>]*>)(\s*)([^<]*?)(\s*)(</\2>)', core, re.S)
            if w and worth(w.group(4)):
                core = w.group(1) + w.group(3) + fn('text', w.group(4)) + w.group(5) + w.group(6)
            else:
                core = fn('text', core)
        out.append(m.group(1) + core + m.group(3))

    in_title = False
    for tok in TOKEN.split(html):
        if not tok:
            continue
        if not tok.startswith('<'):
            if in_title:
                out.append(fn('title', tok) if worth(tok) else tok)
            elif not tok.strip() and '\n' in tok:
                # whitespace with a line break between two elements is source formatting:
                # treat it as a boundary so nav/footer/tag lists split into single items
                flush(); out.append(tok)
            else:
                run.append(tok)
            continue
        if tok.startswith('<!--'):
            flush(); out.append(tok); continue
        low = tok[:40].lower()
        if low.startswith('<script'):
            flush()
            if 'ld+json' in low:
                tok = re.sub(r'("(?:description|name)":\s*")((?:[^"\\]|\\.)*)(")',
                             lambda m: m.group(1) + (fn('json', m.group(2)) if worth(m.group(2)) else m.group(2)) + m.group(3), tok)
            out.append(tok); continue
        if low.startswith('<style'):
            flush(); out.append(tok); continue
        name = tag_name(tok)
        # translate attributes on any tag
        if name == 'meta':
            key = re.search(r'(?:name|property)="([^"]+)"', tok)
            if key and key.group(1) in META_KEYS:
                tok = re.sub(r'(content=")([^"]*)(")', lambda m: m.group(1) + fn('meta', m.group(2)) + m.group(3), tok)
        else:
            tok = re.sub(r'(\s(?:%s)=")([^"]*)(")' % '|'.join(TRANSLATABLE_ATTRS),
                         lambda m: m.group(1) + (fn('attr', m.group(2)) if worth(m.group(2)) else m.group(2)) + m.group(3), tok)
        if name == 'title':
            flush(); in_title = not tok.startswith('</'); out.append(tok); continue
        if name in BLOCK:
            flush(); out.append(tok)
        else:
            run.append(tok)
    flush()
    return ''.join(out)


def extract():
    seen = {}
    for p in PAGES:
        def rec(kind, s, p=p):
            seen.setdefault(s, p)
            return s
        walk(strip_menu(read(p)), rec)
    with open(os.path.join(HERE, 'segments.json'), 'w', encoding='utf-8') as f:
        json.dump(list(seen), f, ensure_ascii=False, indent=1)
    print(len(seen), 'segments,', sum(map(len, seen)), 'chars')


# Spec-table cells follow fixed patterns; translate them by rule instead of by hand.
AUTO = {
    'ru': {'to': ('от {a} до {b}'), 'max': 'макс. {v}', 'typ': 'тип. {v}'},
    'ja': {'to': ('{a}〜{b}'), 'max': '最大 {v}', 'typ': '標準 {v}'},
    'ko': {'to': ('{a} ~ {b}'), 'max': '최대 {v}', 'typ': '일반 {v}'},
    'pl': {'to': ('od {a} do {b}'), 'max': 'maks. {v}', 'typ': 'typ. {v}'},
}


def auto(lang, s):
    r = AUTO.get(lang)
    if not r:
        return None
    m = re.fullmatch(r'(\S+) to (\S+ V)', s)
    if m:
        return r['to'].format(a=m.group(1), b=m.group(2))
    m = re.fullmatch(r'(max|typ) (\S+ mV)', s)
    if m:
        return r[m.group(1)].format(v=m.group(2))
    return None


def load(lang):
    """src/<lang>.json maps English segment -> translation. Segments with no entry and no
    rule stay English (part numbers, values, proper names). Keys are the English text, so
    adding or reordering English content never shifts existing translations."""
    with open(os.path.join(HERE, 'segments.json'), encoding='utf-8') as f:
        segs = json.load(f)
    with open(os.path.join(HERE, 'src', lang + '.json'), encoding='utf-8') as f:
        src = {norm(k): v for k, v in json.load(f).items()}
    return {en: src.get(norm(en)) or auto(lang, en) or en for en in segs}


def norm(s):
    return re.sub(r'\s+', ' ', s).strip()


def check(lang):
    with open(os.path.join(HERE, 'src', lang + '.json'), encoding='utf-8') as f:
        src = {norm(k) for k in json.load(f)}
    with open(os.path.join(HERE, 'segments.json'), encoding='utf-8') as f:
        segs = json.load(f)
    miss = [s for s in segs if norm(s) not in src and not auto(lang, s)]
    for s in miss:
        print(repr(s[:120]))
    print(lang, len(miss), 'segments kept in English (fine for part numbers / names)')
    return miss


# ── language menu + hreflang ────────────────────────────────────────────────

def url_for(code, page):
    path = '' if page == 'index.html' else page
    return SITE + ('' if code == 'en' else code + '/') + path


def hreflang_block(page, indent='  '):
    lines = [f'{indent}<link rel="alternate" hreflang="{h}" href="{url_for(c, page)}">' for c, h, *_ in LANGS]
    lines.append(f'{indent}<link rel="alternate" hreflang="x-default" href="{url_for("en", page)}">')
    return '\n'.join(lines)


GLOBE = ('<svg class="lang-globe" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" '
         'stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9.5"/>'
         '<path d="M2.5 12h19M12 2.5c2.6 2.7 3.9 5.9 3.9 9.5s-1.3 6.8-3.9 9.5c-2.6-2.7-3.9-5.9-3.9-9.5s1.3-6.8 3.9-9.5z"/></svg>')


def lang_menu(cur, page, depth):
    """depth = how many folders the current file sits below the site root."""
    up = '../' * depth
    items = []
    for c, h, native, *_ in LANGS:
        href = up + ('' if c == 'en' else c + '/') + page
        cls = ' class="is-current" aria-current="true"' if c == cur else ''
        items.append(f'<a href="{href}" hreflang="{h}" lang="{h}"{cls}>{native}</a>')
    label = LANG[cur][4]
    return ('<div class="dropdown lang-menu">'
            f'<a href="{up + ("" if cur == "en" else cur + "/") + page}" class="lang-switch" aria-haspopup="true" '
            f'aria-label="Language: {LANG[cur][2]}">{GLOBE}<span>{label}</span></a>'
            '<div class="dropdown-menu">' + ''.join(items) + '</div></div>')


SWITCH_RE = re.compile(r'<a href="[^"]*" class="lang-switch"[^>]*>.*?</a>(?!</div>)|<div class="dropdown lang-menu">.*?</div></div>', re.S)
HREFLANG_RE = re.compile(r'(?:[ \t]*<link rel="alternate" hreflang="[^"]+" href="[^"]+">\r?\n?)+')


MENU_SLOT = '<i data-lang-menu></i>'


def strip_menu(s):
    """The language menu is generated, never translated: park a placeholder in its place so
    neither extract nor the translator ever sees its labels."""
    return SWITCH_RE.sub(MENU_SLOT, s, count=1)


def refresh_nav(s, cur, page, depth):
    s = s.replace(MENU_SLOT, lang_menu(cur, page, depth), 1)
    nl = '\r\n' if '\r\n' in s else '\n'
    s = SWITCH_RE.sub(lambda m: lang_menu(cur, page, depth), s, count=1)
    m = HREFLANG_RE.search(s)
    block = hreflang_block(page).replace('\n', nl) + nl
    if m:
        s = HREFLANG_RE.sub(lambda _: '', s)
        # put the block right after the canonical link
    s = re.sub(r'(<link rel="canonical" href="[^"]+">\r?\n)', lambda m2: m2.group(1) + block, s, count=1)
    return s


# ── page generation ─────────────────────────────────────────────────────────

def localise_links(s, code, page):
    depth = page.count('/') + 1          # pages live one folder deeper than the English ones
    def fix(m):
        attr, url = m.group(1), m.group(2)
        if re.match(r'^(https?:|mailto:|tel:|#|data:|javascript:)', url):
            return m.group(0)
        # resolve the English-relative url against the English page's folder
        base = os.path.dirname(page)
        target = os.path.normpath(os.path.join(base, url.split('#')[0].split('?')[0])).replace('\\', '/')
        rest = url[len(url.split('#')[0].split('?')[0]):]
        if target == '.':
            target = 'index.html'
        if target.endswith('/') or target in ('modules',):
            target = target.rstrip('/') + '/index.html'
        if target in PAGES:
            new = os.path.relpath(target, base or '.').replace('\\', '/')
        else:
            new = '../' * depth + target
        if url.endswith('/') and new.endswith('index.html'):
            new = new[:-len('index.html')] or './'
        return f'{attr}="{new}{rest}"'
    return re.sub(r'\b(href|src)="([^"]*)"', fix, s)


def build_lang(code):
    d = {norm(k): v for k, v in load(code).items()}
    missing = set()
    h = LANG[code][1]
    for page in PAGES:
        src = strip_menu(read(page))

        def tr(kind, s):
            v = d.get(norm(s))
            if v is None:
                missing.add(s)
                return s
            if kind in ('attr', 'meta'):
                v = v.replace('"', '&quot;')
            if kind == 'json':
                v = v.replace('\\', '\\\\').replace('"', '\\"')
            return v
        s = walk(src, tr)
        s = localise_links(s, code, page)
        s = s.replace('<html lang="en">', f'<html lang="{h}">', 1)
        s = s.replace('<meta property="og:locale" content="en_GB">', f'<meta property="og:locale" content="{LANG[code][3]}">')
        # absolute self-urls (canonical, og:url, breadcrumb items, form redirect) -> language folder
        def absfix(m):
            path = m.group(1)
            if path.startswith(('assets/', 'favicon')) or path.split('#')[0] in ('privacy.html', 'cookies.html', 'terms.html'):
                return m.group(0)
            return SITE + code + '/' + path
        s = re.sub(r'(?<=")' + re.escape(SITE) + r'([^"]*)(?=")', absfix, s)
        s = re.sub(r'(<input type="hidden" name="subject" value=")([^"(]*?)( - |")',
                   lambda m: m.group(1) + m.group(2).rstrip() + ' ' + LANG[code][5] + m.group(3), s)
        s = refresh_nav(s, code, page, page.count('/') + 1)
        write(code + '/' + page, s)
    if missing:
        print(code, 'untranslated:', len(missing))
        for m in sorted(missing)[:30]:
            print('   ', repr(m[:100]))


def build():
    for code in GENERATED:
        if os.path.exists(os.path.join(HERE, 'src', code + '.json')):
            build_lang(code)
    # English and Chinese: only the menu and hreflang
    for page in PAGES:
        write(page, refresh_nav(read(page), 'en', page, page.count('/')))
        zp = 'zh/' + page
        if os.path.exists(os.path.join(ROOT, zp)):
            write(zp, refresh_nav(read(zp), 'zh', page, page.count('/') + 1))
    sitemap()


def sitemap():
    old = read('sitemap.xml')
    prio = dict(re.findall(r'<loc>([^<]+)</loc>.*?<priority>([^<]+)</priority>', old, re.S))
    rows = ['<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    alts = lambda page: ''.join(f'\n    <xhtml:link rel="alternate" hreflang="{h}" href="{url_for(c, page)}"/>' for c, h, *_ in LANGS) + \
        f'\n    <xhtml:link rel="alternate" hreflang="x-default" href="{url_for("en", page)}"/>'
    for page in PAGES:
        if 'name="robots" content="noindex' in read(page):
            continue                      # noindex pages don't belong in a sitemap
        for c, *_ in LANGS:
            u = url_for(c, page)
            # always derive from the English priority, so re-running never drifts
            p = prio.get(url_for('en', page), '0.5')
            if c != 'en':
                p = '%.1f' % max(0.1, float(p) - 0.1)
            rows.append(f'  <url>\n    <loc>{u}</loc>{alts(page)}\n    <priority>{p}</priority>\n  </url>')
    for extra in ('privacy.html', 'cookies.html', 'terms.html'):
        u = SITE + extra
        rows.append(f'  <url>\n    <loc>{u}</loc>\n    <priority>{prio.get(u, "0.2")}</priority>\n  </url>')
    rows.append('</urlset>\n')
    write('sitemap.xml', '\n'.join(rows))


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'build'
    if cmd == 'extract':
        extract()
    elif cmd == 'check':
        check(sys.argv[2])
    else:
        build()
