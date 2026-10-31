# Cinematic JISR independent critique

VERDICT: ship

Current targeted recheck: both Major findings are resolved in the newly served bundle. No remaining Major or Critical issue was observed. Companion overlap is now a Minor visual issue: the affected control remains readable and clickable.

Reviewed the live page at `http://127.0.0.1:4173` in background Chromium. Fresh intro and ready screenshots cover 1280×844 and 390×844, AR/FR/EN, with light and dark OS preferences. Pointer was moved outside the viewport before final intro/ready captures. The site retains its ivory palette under either OS preference; no separate dark theme is offered.

## Current findings and resolution

| # | Severity | Finding | Evidence | Fix |
|---|----------|---------|----------|-----|
| 1 | Resolved Major | Reduced-motion intermediate scroll previously superimposed two scenes. The current bundle switches at progress .45: outgoing opacity 1/incoming 0 at .44; outgoing 0/incoming 1 at .45, .533 and .60. The corresponding accessibility state also changes. | `cinema-recheck-results.json`, all AR/FR/EN at both widths; visually inspected `cinema-recheck-390-ar-reduced.png`, `cinema-recheck-390-en-reduced.png`. Original failing evidence remains `cinema-critic-390-light-reduced.png`. | Complete. |
| 2 | Resolved Major | Desktop English and French first ready headlines now fit fully beside the phone; “Connect your way.” and “À votre manière.” are readable without occluded letters. | Fresh `cinema-recheck-1280-en-ready.png`, `cinema-recheck-1280-fr-ready.png`; `cinematic.css:84`, smaller first-line type scale. | Complete. |
| 3 | Minor | On the reduced-motion mobile download view, the companion still overlaps the right edge of the download control, but it now fades to .25 opacity and its hit surface is disabled. The icon and label remain readable. This is cosmetic and does not block shipping. | `cinema-recheck-390-download.png`; results record opacity .25, pointer-events none, `elementFromPoint` resolves to `download-apk`, and an actual click on this right-hand area downloads `JISR-Android.apk`. | Optional polish: relocate the reduced-motion companion to an empty region instead of fading over the button. |

The current recheck is `cinematic-critic-recheck.cjs`; its 24 stopped-scroll samples and focused control check are in `cinema-recheck-results.json`. It did not rerun unrelated gates. Original `cinema-critic-*` screenshots preserve the pre-fix findings and should not be mistaken for current failures.

## What is actually good

- The desert portal has a clear focal point and the light transition establishes a distinct second scene. The localized mobile ready screens have readable type, a clean phone silhouette and a clear download action.
- JISR’s actual app screenshots and supplied icon connect the cinematic introduction to a concrete Android product. Arabic is composed in RTL and the image language updates with the site language.

## Interaction verification

`cinematic-critic.cjs` completed: normal scroll reaches the accessible ready scene in all 12 language/viewport/OS-preference combinations; no horizontal overflow in those views; keyboard Enter triggers the companion press state; show/hide works; desktop navigation opens the demo section. Mobile intentionally hides desktop navigation. Both viewport download actions returned `JISR-Android.apk`, 63,891,521 bytes. Results are in `cinema-critic-results.json`. The script does not verify the APK’s behavior or audio output.

## Heuristic scripts

Ran the kit’s four requested scripts on `website/index.html` using the bundled Playwright dependency. Their real outputs:

- `taste_audit`: MED, three equal-size `BUTTON.demo-choice` siblings. This is appropriate for three equally selectable pictograms and does not justify a redesign.
- `slop_tells`: no measurable tells.
- `verify_responsive`: no horizontal overflow at 280/320/414px.
- `verify_overflow`: failed on five overlaps involving the loader’s “Skip introduction” button, underlying download controls and companion toggle. This script measures immediately from the file URL; those results describe the transient loader state. They are not proof of a persistent post-load collision.

These are heuristics, not evidence of visual quality, and their file-URL/load timing differs from the live screenshots.

## What I could not judge

- Real Android installation/runtime behavior, provider delivery, speech availability on a physical device, and touch scrolling on physical hardware were outside this browser critique.
- No paid animation implementation was accessed. This review assesses the rendered JISR implementation, not fidelity to private reference code.

Implementation files were not edited by this review. The current verdict reflects fresh screenshots and browser interaction against the served corrected bundle.
