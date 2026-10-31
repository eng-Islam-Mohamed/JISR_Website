# Independent liquid glass critique

VERDICT: ship

No open Critical or Major findings after independent render recheck. One Minor material refinement remains; it does not block this version. There are not three evidence-backed reasons to reject the work.

| # | Severity | Finding | Evidence | Fix |
|---|---|---|---|---|
| 1 | Minor | The upper bridge crown retains a slightly milky lavender appearance. The newly visible transmitted wave makes the material legible as tinted glass, but the large crown remains less clear than the floating controls. | Latest `glass-recheck/glass-critic-native-stage.png` and `glass-recheck/glass-critic-1280-fr-hero.png`. The navy wave visibly changes direction/tint at the upper-right edge; the remaining lavender fill is visible above/below it. | Optional polish: further reduce the uniform crown tint while retaining its contour and narrow reflected edge. Do not weaken the already convincing floating controls. |

Resolved findings

- **Major material ambiguity — resolved.** Initial `glass-critic-native-stage.png` read predominantly as a pearl/chrome tube. Latest `glass-recheck/glass-critic-native-stage.png` shows a continuous navy/sky line visibly transmitted through the upper arch and narrower highlights. The original missing-transmission defect is resolved; the remaining milkiness is Minor.
- **Major mobile header overprint — resolved.** Initial `glass-critic-mobile-scrolled.png` at 390×844/scrollY=3324 shows “A world of pictures” merging with JISR/EN. At the same scroll position, latest `glass-recheck/glass-critic-mobile-scrolled.png` shows the complete readable title, with the now non-sticky header above the viewport (header y=-3324). BODY is focused and the skip link is not focused in both captures.

What is actually good

- The floating phrase/note provide convincing clear glass: displaced app content, reflected rims, and readable foreground labels. The material is now conspicuous. The oversized typography and asymmetric product stage still give the page a clear focal hierarchy.
- Real, localized app captures remain the product proof. The interactive example and selected showcase state remain easy to distinguish; the new material has not made the main text difficult to read.

Observed evidence

- Captured and inspected AR/EN/FR at 1280 and 390 widths under light and dark OS preference, with reduced motion and the pointer off the UI: `glass-critic-{1280,390}-{light,dark}-{ar,en,fr}.png`. Repeated the matrix after the fixes into `glass-recheck/`; independently inspected the changed native stage, desktop EN/FR and mobile AR/EN hero crops, and ordinary mobile scrolling viewport. The intended light branded design remains under dark OS preference.
- Repeated normal-motion interaction checks after the fixes: actual WebGL pixels change with the pointer; the nav lens moves and its Questions link reaches the section. Pictogram selection updates the phrase/state. All nine locale/showcase combinations load matching screenshots. All FAQ disclosures open/close. The motion control freezes the sculpture response. `glass-recheck/glass-critic-results.json` records these checks and no page errors.
- Fresh script output: `taste_audit.mjs` reports one MED equal-size `.demo-choice` heuristic, appropriate for mutually exclusive image choices and dismissed. `slop_tells.mjs` reports no measurable slop tells. These are heuristics, not proof of taste.
- `verify_overflow.mjs`: no silently clipped text or overlapping controls at 320/414/1280. `verify_responsive.mjs`: no horizontal overflow at 280/320/414. Live HTTP screenshot layouts after the fixes also measured scroll width equal to viewport width. The original header collision required actual scroll inspection and was not caught by these geometry scripts.

What I could not judge

- Audible speech quality, Android installation, and physical-device GPU performance were not tested in this critique.
- No separate dark website theme exists; dark OS preference against the intended light design was reviewed.
