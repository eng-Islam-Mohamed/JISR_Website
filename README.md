# JISR Website

Client presentation of JISR, an accessible Android communication app. Arabic (RTL), French and English; cinematic glass portal, interactive Canvas companion, and reduced-motion support.

**Preview only:** application download controls are disabled. No APK, release metadata, private credentials or Flutter project is included in the deployment.

## Development

```sh
npm ci
npm run dev
```

## Build and deploy

```sh
npm run build
```

Publish `dist/`. Vercel uses the included `vercel.json`. Node.js 20 or newer is needed for builds; production is static. `npm run compile` checks strict TypeScript and bundles GSAP/ScrollTrigger and the companion code. `npm run check` validates required assets and disabled download markup.

The approved JISR blue/sage/ivory/lavender background is `assets/portal/jisr-dawn.png`. See `SOURCES.md` for design provenance. Fonts and their OFL notices are bundled locally. No third-party network services are required by the running website.

Sources: `src/cinematic.ts`, `src/quad.ts`, `src/ghost/`, `app.js`; styling: `styles.css`, `glass.css`, `cinematic.css`; shared tokens: `design-tokens.json`. The generated `tokens.css` and `cinematic.js` are included for static previews.

`qa/preview-check.cjs` verifies the approved image hash, localized layouts, disabled download controls and absence of public installer URLs using Playwright. Set `JISR_SITE_URL` to the preview or production URL. QA can use an externally provided Playwright installation via `QA_NODE_MODULES`.
