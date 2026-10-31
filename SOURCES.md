# Design and code provenance

- **Portale blueprint:** supplied by the user on 29 October 2026. Its desert/glass-card scene, quadrilateral projection mathematics and animation sequence were adapted to JISR branding, localized copy and an actual app screenshot in place of the bank card. The scene was retrieved from the URL in that prompt: [desert.webp](https://assets.uberdesigner.ai/portale/desert.webp). The local file is `assets/portal/desert.webp`; browsers make no external request for it.
- **Ghost Buddy blueprint:** supplied by the user on 29 October 2026, including all nine typed Canvas modules. The original outline, eye geometry, expression blending, springs, click reactions, particles, sleep/wake behavior and hit-testing are retained. Changes: JISR token colors, transparent website integration, a smaller responsive size, scroll/cursor-following anchor, text/control avoidance, keyboard interaction, visibility controls and fuller reduced-motion behavior. The standalone dark background was intentionally omitted to preserve the website.
- **AnimMaster:** public [Scroll Animation](https://animmasterlib.dev/scroll) and [Mouse Effect](https://animmasterlib.dev/mouseeff) gallery previews informed text scrubbing, layered depth, magnetic hover and pointer tilt. These effects were implemented independently. The paid component source was not accessed, purchased or copied; this project does not claim to include that library.
- **GSAP 3.15.0 and ScrollTrigger:** npm dependency, bundled into the static `cinematic.js`. [Standard license](https://gsap.com/standard-license/). The bundle retains upstream legal comments. TypeScript and esbuild are build tools only.
- **JISR assets:** the user's original app icon, actual localized Flutter screenshots and existing bundled Manrope / IBM Plex Sans Arabic fonts. OFL font notices are in `assets/fonts`.

The existing static product page and all Android/backend resources were retained. No Sites service, external account, telemetry, cookies or payment integration was added.

## Approved client-preview revision

The user approved the generated blue/sage/ivory/lavender adaptation on 29 October 2026. It is saved as `assets/portal/jisr-dawn.png` and is the active hero scene. The original desert reference remains as historical source material. All app download controls are disabled and installer files are excluded from this repository and production build.


The user replaced the hero on 29 October 2026 with their supplied communication/tablet illustration, stored byte-for-byte as `assets/portal/jisr-connection.png`. The original central glass panel and JISR logo overlay remain visible over the supplied artwork, and the camera transition originates from this panel. Earlier backgrounds remain historical assets.

## Premium front-end layer (31 October 2026)

Added `premium.css` and `src/premium/` (smooth scrolling, scroll scenes, pointer effects, liquid glass). Everything is written for this static site in vanilla TypeScript + GSAP. No React component code was copied.

- **liquid_glass_widgets** ([github.com/sdegenaar/liquid_glass_widgets](https://github.com/sdegenaar/liquid_glass_widgets), MIT): the refraction model (rounded-rect SDF bezel, Snell refraction, RGB dispersion) and the underdamped "jelly" spring (damping ratio 0.73) were ported from its shaders and morph-engine docs into `src/premium/glass.ts`. Its rules (glass only on the navigation/control layer, never glass inside glass) decide where glass is used.
- **UX/UI Agent Skills** ([github.com/plugin87/ux-ui-agent-skills](https://github.com/plugin87/ux-ui-agent-skills), MIT): redesign workflow, motion choreography, cognitive-accessibility rules, the variance mandate for section layouts, and the no-emoji rule.
- **Skiper UI** ([skiper-ui.com](https://skiper-ui.com)): the sticky card stack ("Card stack scroll") and scroll text reveal patterns inspired "How it works" and the manifesto word fill. Attribution to Skiper UI is required by its free licence and is given here.
- **Vengeance UI** ([github.com/Ashutoshx7/VengenceUI](https://github.com/Ashutoshx7/VengenceUI), MIT): the glow-border card, magnetic spotlight marquee, expandable bento grid, stagger text and FAQ accordion inspired the spotlight tiles, scroll marquee, bento, heading reveals and accordion.
- **AnimMaster**: public gallery previews (scroll, mouse, text) informed the effect choices. The paid source was not accessed.
- **uberdesigner.ai**: the existing Portale hero (see above) is kept.
- **Lenis 1.3.27** (darkroom.engineering, MIT): vendored as a pre-bundled module in `src/vendor/lenis.mjs` with its licence header, so no new npm dependency is needed.

Design rule: motion follows the user. The marquee, word fills and card stack move only while you scroll. Nothing flashes. "Reduce motion" (footer, or the switch in the "Comfort" tile) and the OS setting turn off smooth scrolling, the cursor ring and every scene, and show all content statically.
