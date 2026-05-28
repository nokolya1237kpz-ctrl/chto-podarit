# Production Stability

## First render rules

- Public pages must not depend on ePN, Admitad, parser providers, Google scripts, or external product images during first render.
- Google Analytics and Yandex.Metrika are loaded with `lazyOnload`, so blocked analytics domains should not block the app UI.
- Product images use lazy loading and local placeholder fallback.
- Public Supabase reads should use a short timeout and show empty states instead of blocking the page.

## Health checks

- `/api/health` returns app and Supabase availability:
  `{ ok, app, supabase, timestamp }`.
- `/admin/system-status` shows Supabase status, environment flags, API health, provider status, and last errors.

## Domains

- Keep one canonical domain in `NEXT_PUBLIC_SITE_URL`.
- Prefer HTTPS only. Avoid mixed content in imported product image URLs.
- If both `www` and root domains are connected, redirect one to the canonical domain at DNS/CDN level.
- For the Cyrillic domain, keep punycode configured correctly in DNS and hosting provider.

## Vercel and unstable regions

For Russia and other unstable regions, place Cloudflare in front of Vercel:

- DNS proxy enabled for the site domain.
- Full HTTPS.
- Cache static assets.
- Keep analytics and external providers optional/lazy.
- Do not call marketplace parsers during public page render.
