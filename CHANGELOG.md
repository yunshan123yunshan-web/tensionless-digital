# Changelog

## 2026-05-02 — Visual Fixes & Section Cleanup

### Fixed
- **Testimonials dead zone**: Last quote now fades at `TDUR - 0.8` instead of hardcoded position `22.5`, keeping content visible until the section unpins. No more black void at section end.
- **CTA headline invisible**: Removed conflicting `.cta-h` control from `animations.js` so the inline word-split timeline owns the headline reveal. Words now fade in correctly on scroll.
- **Process content positioning**: Changed `.proc-layout` from CSS grid to flexbox with `align-self: stretch` on `.proc-center` and `justify-content: center` on `.proc-step`. Step content now centers vertically instead of anchoring at the bottom.
- **Stats counters stuck at 0**: `countUp()` now fires immediately when the data-break section triggers, instead of waiting for a `.call()` callback after the reveal animation.
- **Services cards invisible on entry**: Reduced initial animation offset from `{x:160, y:120, scale:0.55}` to `{x:60, y:40, scale:0.8}` so cards are partially visible when the section enters the viewport.
- **Section ID references**: Fixed `#results` → `#case-study` and `#process` → `#process-imm` in `threejs-scene.js` ScrollTrigger scroll-progress array. Removed 3 stale group entries from `animations.js` that referenced non-existent section IDs.
