# TODO — francepetroni.github.io

## Design & UX

- [ ] Impeccable polish pass (`/impeccable polish`) when site is close to go-live — target score ≥ 28/32
- [ ] Product cards on `index.html` homepage: add real product images inside cards
- [ ] Technical Manual prefill bug: "Request Technical Manual" on `single-channel.html` always pre-fills "HV3 + 150V" regardless of row — needs per-row or model-select approach
- [ ] Update collaboration logo alt text in `index.html`: only ASI, UniBO, UniTO identified — identify remaining partners and update `alt` attributes

## SEO

- [ ] Optimize all page titles for target keywords (ITAR-FREE, HV module, space, piezoelectric)
- [ ] Add `<link rel="canonical">` to all pages
- [ ] Add structured data (JSON-LD): Organization, Product
- [ ] Add `sitemap.xml`
- [ ] Add `robots.txt`
- [ ] Add Open Graph tags (`og:title`, `og:description`, `og:image`) to all pages
- [ ] Add Twitter/X Card meta tags

## Assets & Performance

- [ ] Generate favicon `.ico` from logo (`assets/img/logo/logo.webp`) — add `<link rel="icon">` to all pages
- [ ] Add `<picture>`/`<source type="image/webp">` fallback for non-WebP browsers (or accept WebP-only given target audience)
- [ ] Add `width` and `height` attributes to all `<img>` tags to prevent layout shift (CLS)
- [ ] Verify all images have meaningful `alt` text

## Content

- [ ] Add YouTube launch video embed — CSES-02 launch: https://www.youtube.com/watch?v=NscPB6RfjB0
  - Candidate pages: `heritage.html`, `index.html` hero section
- [ ] `heritage.html`: add timeline or visual of heritage missions (CSES-01, CSES-02, IBIS2 INAF, Beijing Conveyi)
- [ ] `about.html`: add full team section if more members join

## Infrastructure & Structure

- [ ] Review and clean file/folder structure — keep root tidy, verify no orphaned files
- [ ] Add `404.html` custom error page
- [ ] Consider moving inline `<style>` blocks from individual pages into `style.css`
- [ ] `cookies.html` and `terms.html`: fill with real content (currently placeholders)

## Accessibility

- [ ] Audit color contrast ratios (WCAG 2.1 AA) — especially on dark hero sections
- [ ] Verify all interactive elements reachable by keyboard
- [ ] Add `aria-current="page"` to active nav links
