# Verification — 28 October 2026

**Latest revision:** the stronger Liquid Glass redesign is verified separately in `GLASS_VERIFICATION.md` and `glass-redesign-critique.md`. The original implementation results below are retained as historical evidence; the new material, shader lifecycle and updated layout have their own fresh results.

## Website

- `npm run check`: local HTML assets present, all 12 localized app captures present, APK size/SHA-256 equal to `downloads/release.json`.
- JavaScript syntax checked with Node. Production runtime has zero npm dependencies.
- `browser-check.cjs`: AR/FR/EN at 280, 320, 390, 768, 1280, 1440 pixels, no horizontal overflow or clipped measured text. Real browser APK download matched the release manifest byte count and SHA-256.
- Browser interactions verified: language and direction changes; picture selection updates the phrase; tab click/arrow/Home behavior updates screenshots; all four FAQ disclosures; language menu Escape; motion preference persistence; content and download link available without JavaScript; no page errors or HTTP failures during the test.
- Speech failure path tested with an injected failing browser adapter. This proves the visible error state, not audible playback. The independent critic also observed the genuine missing-Arabic-voice state.
- axe-core: zero reported WCAG A/AA violations in the final Arabic mobile test state. This is an automated result for that state, not a certification of every platform or assistive technology.

## UX/UI toolkit gates against website/index.html

Actual output is retained in the adjacent `.log` files.

| Gate | Result |
|---|---|
| verify_states | 65 element-state measurements; interactive contrast passed default/hover/focus |
| verify_responsive | Passed 280/320/414; also separately passed at 1.25× root font |
| verify_keyboard | 23 controls and one composite widget reachable and operable |
| verify_target_size | 47 targets at 414/1280; toolkit minimum or its exceptions satisfied |
| verify_mobile_first | Base styles fit 320 with width media/container rules removed |
| verify_reduced_motion | Policy present, animation stopped, no lost content |
| verify_overflow | No clipped text or overlapping controls at 320/414/1280 |
| slop_tells | No measurable tells; heuristic only |
| taste_audit | One MED for equal picture-choice buttons, deliberately retained for equal accessibility; independent critic accepted this |
| validate_tokens | 35 tokens, valid JSON and references |
| lint_hardcodes | No hardcoded values found in index.html, styles.css, app.js |
| check_no_emoji | No emoji in those three UI source files |

The toolkit's `accuracy_report` is its internal self-test, not a website audit, so it was not used to invent a project score. The standalone `validate_contrast` expects the kit's semantic schema; the website uses its own token schema and actual rendered contrast was checked with verify_states and axe instead. The separate toolkit axe wrapper was not run; axe itself was injected into the real HTTP page. No claim is made about unrun gates.

Independent visual review: see `critique.md`. Arabic, French and English were inspected at 1280/390 under light and dark OS preference. The single screenshot-localization finding was fixed with fresh Flutter captures and independently rechecked. Final verdict: ship; no open findings. Dark OS preference preserves the intended light brand theme; no separate dark theme is advertised.

## Android artifact

- `flutter analyze`: no issues found.
- `flutter test`: 59 tests passed.
- `flutter test ../website/qa/capture_app_test.dart --update-goldens`: three tests passed, generating all 12 screenshots from actual Flutter widgets with real bundled fonts.
- `flutter build apk --release`: succeeded.
- APK: 63,891,521 bytes, v0.1.0+3; minimum API 24, target API 36; ARM64, ARMv7, x86_64.
- SHA-256: `0016a470f65a31674c143952e913a4774150240d9ff8b6ba3d19782f39bd8c86`.
- Current project Gradle configuration signs release builds with its existing development key. The website discloses this as a test build outside Google Play. No mobile implementation or backend resources were changed.

## Limits

No public deployment, domain, physical-phone APK installation, real-device audio verification, physical-device animation profiling or full screen-reader session was performed for this website task. Browser speech depends on installed voices. Real SMS/SOS/provider delivery was outside scope and is not represented as successful by the website.

## Reproduction

Start `npm run dev` in website. QA uses Playwright and axe-core as development tools, never in production. Set `QA_NODE_MODULES` to a directory containing Playwright if it is supplied by the environment, then run `node qa/browser-check.cjs`; axe-core can be installed locally in `qa/node_modules`. No environment-specific absolute paths are embedded in the site.

Toolkit example from repository root:

```powershell
$env:DS_REQUIRE_BROWSER='1'
$env:QA_NODE_MODULES='<directory containing playwright>'
node --loader ./website/qa/resolve-loader.mjs .agents/ux-ui-agent-skills/scripts/verify_states.mjs website/index.html
$env:PYTHONUTF8='1'
python .agents/ux-ui-agent-skills/scripts/validate_tokens.py website/design-tokens.json
```
