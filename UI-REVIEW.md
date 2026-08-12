# Tensionless Digital - UI Review

**Audited:** 2026-08-12
**Scope:** Current static one-page website in this working tree
**Local URL:** `http://127.0.0.1:5173/index.html`
**Screenshots:** `/tmp/td-audit-20260812124224/` and `.planning/ui-reviews/current-20260812-123808/`
**Status:** Post-fix audit passed

## Change Review

Recent local changes are concentrated in the main site files:

| File | Current Change |
|---|---|
| `index.html` | Increased Case Study, Verdict, and Process pin heights so final scenes have enough dwell time; Proof and Verdict now give their 4th states room before the next section enters. |
| `styles.css` | Added pin-spacer height correction, raised sticky HUD/kicker clearance, added native hash scroll margins, and kept pinned scenes above CTA while active. |
| `animations.js` | Delayed CTA reveal until the Process pin has actually released. |
| `immersive-sections.js` | Fixed pinned-section overlap, blank start states, Proof-card-4 dwell, Verdict trust-row dwell, and Process-to-CTA handoff. |
| `interactive.js` | Added mobile-only fixed-header offset for in-page nav clicks. |
| `chrome-shader.js` | Disabled the heavy WebGL hero shader on `lod-medium` mobile devices, leaving the CSS fallback. |
| `audit-visual.js` | Updated visual regression checks for Proof-card-4-to-Verdict, Verdict-trust-to-Craft, and Process-to-CTA handoffs. |

## Pillar Scores

| Pillar | Score | Result |
|---|---:|---|
| Copywriting | 3/4 | Clear service/proof/CTA copy; contact still relies on `mailto:` without in-page success/error feedback. |
| Visuals | 3/4 | Hero, services, proof, testimonials, process, CTA, and footer render without blank sampled frames. |
| Color | 3/4 | Cohesive dark chrome palette; some hardcoded rgba/gradient values remain. |
| Typography | 3/4 | Strong hierarchy; several one-off micro sizes remain. |
| Spacing | 3/4 | Desktop and mobile nav targets now clear the fixed header. |
| Experience Design | 3/4 | ScrollTrigger scenes, mobile fallback, and Process-to-CTA handoff pass browser checks; `mailto:` UX remains a product limitation. |

**Overall: 18/24**

## Fixed Findings

1. **Blank pinned-section starts fixed.** Testimonials and Process now show the first scene/step while entering and at exact pin start.
2. **Proof-to-Verdict handoff fixed.** Proof card 4 now stays visible through the Proof pin release, and Verdict is held below the viewport until card 4 has had its full dwell.
3. **Verdict-to-Craft handoff fixed.** The Verdict trust row now stays visible through the Verdict pin release, and Craft is held below the viewport until the trust row has had its full dwell.
4. **Process-to-CTA blank gap fixed.** The final Process step stays visible through the pin release, then the whole Process layer crossfades out as CTA enters.
5. **Mobile header collision fixed.** Mobile nav clicks subtract the fixed header height plus a gap; native hash links also get `scroll-margin-top`.
6. **Mobile lag risk reduced.** `lod-medium` devices skip the WebGL hero shader and use the CSS chrome fallback.

## Verification

Commands/checks run:

```bash
node --check animations.js
node --check immersive-sections.js
node --check hero.js
node --check threejs-scene.js
node --check chrome-shader.js
node --check interactive.js
node --check audit-visual.js
node verify-scene0-gating.js
node verify-audit-regressions.js
node audit-visual.js http://127.0.0.1:5173/index.html
git diff --check
```

Browser verification results:

- No page errors.
- GSAP and ScrollTrigger active on desktop.
- Desktop visual audit passed across hero, services, data, marquee, Case Study, Testimonials, Process, CTA, and footer.
- Case Study, Testimonials, and Process sampled without scene overlap.
- Proof-card-4-to-Verdict handoff passed: card 4 remains fully visible at Proof pin end while Verdict is still below the viewport.
- Verdict-trust-to-Craft handoff passed: the trust row remains visible at Verdict pin end while Craft is still below the viewport.
- Process-to-CTA handoff passed: Process remains visible until CTA enters, then fades fully away.
- Mobile static fallback passed with all major sections visible and no horizontal overflow.
- Mobile in-page nav clicks passed: visible targets landed at least 86px below the fixed nav.
- Mobile LOD check passed: `data-lod="medium"` and `tdChrome.status="disabled:lod-medium"`.

## Remaining Nonblocking Notes

- The contact form opens `mailto:` and resets immediately; a real submit flow or visible status message would improve trust.
- CSS still contains many one-off color and typography values; token cleanup would improve maintainability but is not blocking the visual/animation audit.
