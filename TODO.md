# TODO — francepetroni.github.io

## Design & UX

- [ ] Impeccable polish pass (`/impeccable polish`) when site is close to go-live — target score ≥ 28/32
- [ ] Consolidate the type scale: the site uses ~19 distinct `font-size` values, eleven of them
      crammed between `.75rem` and `.97rem` and visually indistinguishable. Define a scale in
      `style.css` (steps ≥ 1.25 ratio) and replace the inline sizes. This is what the recurring
      `flat-type-hierarchy` design-hook finding refers to — pre-existing, site-wide, not a
      content-migration issue. NOTE: the Chinese pages under `/zh/` mirror the English markup,
      inline styles included, so the same inline sizes now exist in both trees — fix them with one
      pass over both, not separately.
- [ ] Reconsider the 3px `border-left` accent on `.product-category h3` and `.heritage-item`
      (`style.css` ~L182 / ~L187). The design hook flags it as a stock "side-tab" motif; it now
      repeats on every product section and heritage entry. Either soften it (1px, or a colour much
      closer to `--border`) or drop it and lean on spacing. Visual decision — needs a human eye.
- [ ] Product cards on `index.html` homepage: add real product images inside cards
- [x] Technical Manual prefill bug: fixed the way the old site did it — each spec-table row now has its
  own "Request" link in a Technical Manual column, carrying that model in `?model=`. The single
  section-level button (which always pre-filled "HV3 + 150V") is gone, and `.btn-outline` with it.
- [x] Collaboration logos: all 16 identified from the WordPress originals and given real `alt` text
      in `index.html`; also placed on `heritage.html` beside the Italian collaboration list, where the
      old site showed them

## SEO

- [x] Page titles and descriptions rewritten around the queries engineers actually use (part families, voltages, qualification facts)
- [x] Canonical URLs (absolute) on all 17 indexable pages
- [x] JSON-LD: Organization on the homepage, Product on the three module pages
- [x] `sitemap.xml` — 17 canonical URLs, priority-weighted
- [x] `robots.txt` pointing at the sitemap, `thanks.html` excluded
- [x] Open Graph tags on every page
- [x] Twitter/X card tags on every page

## Assets & Performance

- [x] Favicon set (.ico + 16/32 px PNG + apple-touch-icon) on all 33 pages, plus `theme-color`
- [ ] Add `<picture>`/`<source type="image/webp">` fallback for non-WebP browsers (or accept WebP-only given target audience)
- [x] `width`/`height` on all 194 images, read from the files themselves (CLS)
- [ ] Verify all images have meaningful `alt` text

## Content

- [x] Add YouTube launch video embed — CSES-01 launch (embedded in `heritage.html`)
- [ ] `heritage.html`: add timeline or visual of heritage missions (CSES-01, CSES-02, IBIS2 INAF, Beijing Conveyi)
- [ ] `about.html`: add full team section if more members join
- [x] Product galleries: every WooCommerce gallery image is now on its page, in the original order
  (6 low power, 6 high power, 9 custom, 3 piezo). The low-power and high-power folders had been
  swapped, so both sections were showing the wrong product's photos — found by matching each file
  against the WordPress originals, and corrected.

## Infrastructure & Structure

- [ ] Review and clean file/folder structure — keep root tidy, verify no orphaned files
- [ ] Add `404.html` custom error page
- [ ] Consider moving inline `<style>` blocks from individual pages into `style.css`
- [x] `cookies.html` and `terms.html`: real content in place, verified against the WordPress original

## Accessibility

- [ ] Audit color contrast ratios (WCAG 2.1 AA) — especially on dark hero sections
- [ ] Verify all interactive elements reachable by keyboard
- [ ] Add `aria-current="page"` to active nav links

## Internationalisation

- [x] Chinese site under `/zh/` — 15 pages: home, 3 module pages + index, about, heritage, contact,
  5 quote forms, technical manual, thank-you
- [x] Flag language switcher in the navbar, both directions, on all 29 paired pages
- [x] Reciprocal `hreflang` (en / zh-Hans / x-default) + sitemap with `xhtml:link` alternates
- [ ] **Have the Chinese text reviewed by a native technical speaker before go-live** — translated by
  Claude, not by a professional translator. Terminology to verify in particular: 灌封 (potting),
  压摆率 (slew rate), 总剂量 (total dose), 标准具 (etalon), 焦平面仪器 (focal plane instrument)
- [ ] Legal pages (privacy, cookies, terms) are English-only by choice — translating legal text
  without review creates liability. Decide whether to have them translated professionally
- [ ] Consider Baidu Webmaster Tools submission + ICP filing implications if targeting mainland China seriously

## SEO — second pass (performance + entities)

- [x] Fonts moved out of the CSS `@import` into `<head>` with preconnect + `display=swap` — the
  `@import` was the worst case for LCP: browser had to fetch CSS, parse it, *then* discover the fonts
- [x] Dedicated hero image (1200x900, 87 KB) replacing the 2560x1920 / 456 KB original, preloaded
  with `fetchpriority="high"`; the full-resolution file stays for the lightbox
- [x] BreadcrumbList on 14 pages, FAQPage (8 Q&A) on both module indexes, richer Organization
  (VAT, parent company, areaServed, knowsAbout) and WebSite on both home pages — 26 valid JSON-LD blocks
- [x] `meta keywords` on all indexable pages: Google ignores them, **Baidu still reads them**
- [x] Thin form pages set to `noindex,follow` in both languages; sitemap trimmed to the 19 pages
  that carry real content, so authority is not diluted

### Not code — business decisions that gate Chinese ranking
- [ ] **ICP filing (Beian)**: roughly 85% of top Baidu results hold one. A foreign company cannot file
  directly — it needs a Chinese entity or an authorised partner. Without it Baidu visibility stays capped
- [ ] **Hosting**: GitHub Pages is slow (and intermittently unreachable) from mainland China. A mainland
  or Hong Kong mirror would materially change Baidu performance
- [ ] Submit the sitemap to Baidu Webmaster Tools (ziyuan.baidu.com) and Google Search Console
- [ ] Backlinks are the factor no on-page work can replace: INFN/INAF/ASI project pages, CSES mission
  pages and supplier directories linking to i-conomy.com would move rankings more than any tag

## International reach — third pass (2026-11-17)

- [x] **Form e-mails garbled in Chinese**: Web3Forms decodes multipart field *names* as Latin-1, so
  `name="姓名"` arrived as `Å§å`. All form field names are now ASCII (same keys as the English forms);
  only the visible labels are translated. Never use non-ASCII `name=` attributes on a form again
- [x] Requested model appended to the e-mail subject by `main.js` (`… (ZH) – HV3 + 1500V`)
- [x] Google Fonts self-hosted in `assets/fonts/` (latin, latin-ext, cyrillic) and inlined at the top
  of `style.css` — Google Fonts is blocked in mainland China and was render-blocking. This supersedes
  the "preconnect + display=swap" item above
- [x] YouTube on `heritage.html` replaced by a click-to-load preview (YouTube is blocked in China)
- [x] New languages generated from English by `_i18n/build.py`: `/ru/`, `/ja/`, `/ko/`, `/pl/`.
  Edit English → `python _i18n/build.py extract` → translate new indices in `_i18n/src/<lang>.json`
  → `python _i18n/build.py build` (also refreshes menu, hreflang and sitemap). `/zh/` stays hand-written
- [ ] **Native-speaker review** of ru / ja / ko / pl (machine-quality technical translation)
- [x] Cloudflare Web Analytics: site token in every page (site switched to "JS Snippet installation" in the dashboard)
- [ ] After pushing: `python _tools/indexnow.py` (Bing, Yandex, Naver, Seznam)
- [ ] Register + verify + submit sitemap: Google Search Console, Bing Webmaster, Yandex Webmaster,
  Naver Search Advisor, Baidu Ziyuan (check Baidu's crawl diagnosis: GitHub has blocked Baiduspider before)
- [ ] Legal pages stay English-only; footer links in the new languages are marked "(EN)"
