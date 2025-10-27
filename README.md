# srpaokelsheaves — Arcane Archives

Single-file React + Vite app for publishing personal light novels (Xianxia, Wuxia, etc.).
Author/editor: **srpaokels**.

## Dev
```bash
npm i
npm run dev
```
## Build
```bash
npm run build
```
## Deploy
- Netlify / Cloudflare Pages.
- SPA fallback configured for `/novel/*` in `netlify.toml`.

## Content
Chapters can be served as files from `public/content/<slug>/chapters/*.md` and indexed by `public/content/index.json`.
