# Cinematic website verification — 29 October 2026

This supersedes the previous homepage/material reports. Android application source, APK and Supabase resources were not changed.

## Implemented

- User-supplied Portale composition: actual image-byte loader and font readiness, skip control, word blur reveal, sunset glass portal with JISR branding, scroll-coupled camera approach and quadrilateral face/expansion, ivory transition and a localized application phone reveal.
- The pinned experience uses native CSS sticky and GSAP ScrollTrigger with a scrubbed 1.5-viewport transition and a brief reading interval before the existing content. Browser scrolling is preserved. Intro scrolling is unlocked when loading/intro ends or is skipped; a failed scene request also releases it.
- The supplied Ghost Buddy body, 72-point eye morphs, spring dynamics, hover/press/startle, particles/ripples, sleep/wake and touch handling are integrated on a transparent Canvas. It uses JISR colors and a smaller follower anchored to pointer/scroll position. It avoids measured headings/controls, fades and stops intercepting input during crossings, supports keyboard press, and can be hidden.
- Independent implementations of public AnimMaster gallery ideas: text opacity/translation scrub, product depth, magnetic controls and pointer-driven phone tilt. No paid AnimMaster component source is included.
- Reduced motion skips the scale/blur intro, removes camera/dolly/portal travel and float/tilt, switches complete scenes without text overlap, and stops idle companion animation. Touch scroll and text selection remain native.

## Fresh automated evidence

- Strict TypeScript compilation and esbuild bundle succeeded. The bundle includes GSAP; production is static and needs no installed npm runtime.
- `qa/cinematic-check.cjs`: 18 AR/FR/EN × 280/320/390/768/1280/1440 viewport combinations without horizontal overflow or clipped measured title/CTA text. Portal projection grows, second scene becomes visible and accessible, header changes material, localized screen sources match language.
- Companion keyboard Enter produces press expression; show/hide button works. Main pictogram selection, all three screenshot tabs and FAQ disclosures work. Actual browser APK download matches its original byte count and SHA-256.
- axe: zero WCAG A/AA violations in the tested Arabic lower-page state. This is not an all-platform accessibility certification. See `cinematic-axe.json`.
- No JavaScript: original app introduction, lower sections and APK link remain visible. A blocked desert image request does not leave the page locked or its content hidden. No normal-page JavaScript errors or failed HTTP responses in the tested flow. Results: `cinematic-results.json`.
- Toolkit `verify_states`: 80 measured states pass interactive default/hover/focus contrast. `verify_responsive`: 280/320/414 at 1.25× root font passes. Source hardcode gate passes for cinematic stylesheet/entry; the reference-provided physics/shape arithmetic is retained in its typed modules. Token validation: 54 tokens.
- The kit's own `accuracy_report` was not used to manufacture a website quality score. The token contrast utility requires the toolkit semantic schema; actual rendered contrast was tested instead. Old material-specific WebGL tests target the superseded homepage and do not certify this version.

## Independent visual review

`CINEMATIC_CRITIQUE.md`: inspected 1280/390, all three languages, light/dark OS preference, normal and reduced motion. Two Major findings were fixed and independently rechecked: overlapping reduced-motion scene text and a phone covering the end of desktop EN/FR titles. The reviewer checked 24 stopped reduced-motion states. Verdict: ship. Companion proximity to a mobile download CTA was recorded as Minor; the CTA remained clickable, and subsequent anchor handling also lets the companion leave protected content while hovered.

## Limits

No claim of pixel-identical reference reproduction: content, branding, app presentation, accessibility behavior, keyboard access and mobile scrolling were adapted for JISR. This remains an independently authored static integration rather than the reference's React scaffold. No commercial AnimMaster source license was assumed.

Chromium desktop/headless and mobile emulation were tested. Actual phone touch feel, hardware GPU/frame pacing, all Safari/Firefox versions and audible voice output were not verified. The unchanged APK remains development-signed and labeled as a test build. No public hosting deployment was performed.
