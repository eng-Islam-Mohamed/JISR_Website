# Liquid Glass redesign verification

28 October 2026. Website only; no Flutter source, Android artifact, Supabase resources or application data changed.

## Change

The earlier flat arches were replaced with a native WebGL bridge sculpture. Its rounded surface refracts a procedural sky/lilac backdrop using separate optical indices, with Fresnel reflection, narrow highlights and transmitted background waves. This is a rendered scene, not a capture of the DOM. Actual DOM backdrop displacement is limited to the floating cards via a generated edge map and SVG filter where supported. CSS materials remain available independently of WebGL.

The navigation has a pointer/focus-following lens. Floating controls, the demonstration panel, screenshot scene and download treatment share a richer material module and the same 46 design tokens. The header remains in normal flow to avoid text overlap when scrolling.

## Fresh checks

- `npm run check`: local dependencies and all 12 localized Flutter captures exist; the unchanged APK matches its byte count and SHA-256.
- `browser-check.cjs`: AR/FR/EN at 280/320/390/768/1280/1440, no horizontal overflow or clipped measured text. Picture selection, voice error feedback, tab keyboard controls, FAQ, language, reduced-motion persistence, no-JavaScript content and actual APK download pass. axe reports zero WCAG A/AA violations in the tested Arabic mobile state. Results in `browser-results.json` and `axe.json`.
- `glass-check.cjs`: shader compiled and rendered; actual pointer uniforms changed; navigation lens moved; system reduced motion stopped shader travel; WebGL reported zero errors after rendering and after context restoration. Forced graphics-context loss showed the CSS fallback, and restoration rebuilt the shader. Stubbed WebGL absence preserved app imagery, CSS material and APK availability. Mobile back buffer is capped at CSS-pixel resolution. Results in `glass-results.json`.
- Toolkit checks: interactive contrast (65 states), keyboard (23 controls plus one composite), target size (47 targets), mobile-first base layer, overflow, responsiveness and reduced-motion gates pass. Responsive zoom was separately checked at 1.25×. Fresh logs are named `glass-*.log`.
- Token validation: 46 valid tokens. Hardcode/emoji checks cover `index.html`, both stylesheets and both product JavaScript files. Syntax checked with Node.
- Slop heuristic: no measurable tells. Taste heuristic: the same MED for three equal picture-selection buttons, intentionally retained as an accessible selector, not a repeated feature-card layout. These checks do not establish aesthetic quality.

## Independent visual review

See `glass-redesign-critique.md` and screenshots in `glass-recheck/`. The critic inspected AR/FR/EN at 1280/390 in light/dark OS preference. Two Major findings were fixed and independently rechecked: opaque-looking upper reflections and a sticky header that overprinted scrolled content. Verdict: ship; no open Major or Critical finding. The remaining lavender milkiness is recorded as Minor material polish.

## Limits

Chromium automation and software/desktop WebGL were tested; real mobile GPU performance, all Safari/Firefox versions, physical-device interaction and audible speech quality were not measured. SVG backdrop filters differ between engines; the CSS material and normal content do not rely on them. No numeric frame-rate or universal-browser claim is made. This task did not republish the website or retest installation of the unchanged, development-signed Android APK.

Implementation references: [MDN backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter), [MDN WebGL practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices). These informed feature fallback and rendering limits; the product checks above are local evidence.
