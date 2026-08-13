# Tensionless Digital Handoff

## Current Project State

Last handoff: 2026-08-13 - Full architecture rewrite from the Phase-11-era "Results/Testimonials/Process" pinned-scene page to a 6-chapter cinematic single-page site ("Manifest → Arsenal → Proof → Verdict → Craft → Connect"), plus an SEO/accessibility/legal-pages pass. index.html: 482 lines (down from ~1696 — the old giant inline-script architecture described further below in "What Was Recently Changed" no longer exists; that section is kept as history only). Uncommitted changes as of this handoff: `animations.js`, `index.html`, `styles.css` modified; `404.html`, `privacy.html`, `terms.html`, `robots.txt`, `sitemap.xml` new/untracked.

## Immediate Handoff For Claude Code

Current intended state — verified working via static checks (`node --check` on all JS, tag-balance check, `git diff --check`) and a live Playwright audit (27/27 checks passed, zero console/page errors, full scroll + reverse scroll, all 6 sections present, new pages return 200):

- Site structure is now **chapter-based**, not the old Results/Testimonials/Process section-ID scheme. See Architecture Overview below for the current section IDs and files — do not assume old IDs like `#results` or `#testimonials` still exist.
- Legal pages (`privacy.html`, `terms.html`) are explicitly marked as drafts pending owner review — do not present them as final/reviewed.
- The CTA form is mailto-only (`composeMail()` in `animations.js`), with a `visibilitychange`-based success/fallback UX and an `aria-live="polite"` status region (`.cta-form-status`).
- **No vertical movement, no spillover, cinematic crossfade cuts** — these hard rules (below) still apply to the new chapter/pinned sections exactly as they did to the old ones.
- Segment animation work is still sensitive. Any future animation changes should be tiny, section-scoped, and browser-verified immediately.

Verification commands used at last handoff:
- `node --check animations.js && node --check hero.js && node --check threejs-scene.js`
- Tag-balance check on `index.html` (div/section/form/footer/nav/main/a all matched)
- `git diff --check`
- Live Playwright audit against `http://127.0.0.1:5173/index.html`: GSAP + ScrollTrigger present, all current section IDs found (`services`, `data-break`, `case-study`, `testimonials-imm`, `process-imm`, `contact`), full scroll + reverse scroll with zero console/page errors, footer legal links present and correct, `404.html`/`privacy.html`/`terms.html`/`robots.txt`/`sitemap.xml` all return 200, a genuinely missing path 404s correctly.

This is a static single-page site in `index.html` with the brand asset in `logo.svg`.

This folder is a git repository with existing local changes. Treat the working directory as the source of truth and avoid destructive file operations.

Local server:

```bash
python3 -m http.server 5173 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:5173/index.html
```

## User Preferences / Constraints

- Keep testimonial placeholders for now. The user explicitly said to execute improvements that do not need input and keep placeholders.
- Do not remove the animated hero. The hero animation is core to the page.
- The shard/particle animation should fill the full screen, not just one side.
- The header should appear when the headline begins, around the moment `We turn attention into revenue` starts showing.
- The full hero composition should fit inside the first frame/viewport when the headline is visible.
- The eyebrow text `Digital Marketing Agency· 120+ Campaigns Delivered` must not be blocked by the header.
- Use GSAP (3.12.5) for all animation work. GSAP skills were installed locally from `github.com/greensock/gsap-skills`.
- For visual edits, verify in browser screenshots. The in-app/browser view matters more than theoretical CSS correctness.
- **No vertical movement.** Scene transitions must use pure crossfades (opacity/autoAlpha). No y-offsets, no sliding. Scale is acceptable.
- **No spillover.** Each section's last scene must fade out before the next section enters the viewport.
- **Cinematic scene changes.** Sections should feel like full-viewport scene cuts, not scrolling down a page. Content changes, doesn't scroll.

## Hard Rule: DeepSeek Use codex For Visual & Web

When running on DeepSeek (non-multimodal), only use `codex` for these two things:

1. **Visual verification** — use codex to take screenshots and view them
2. **Web searches** — use codex for web search/lookups

Do NOT use any other tool for visual checks or web searches.

## Important Files

- `index.html` (482 lines): main page. Six `data-chapter` acts (0-5) — boot sequence, chapter rail, WebGL hero, then five `<section>`/pinned-scene acts. See Architecture Overview below for the current section IDs.
- `logo.svg` / `tensionless digital logo.svg`: brand logo assets. `favicon.svg` is the actual favicon referenced in `<head>`.
- `hero-scroll.html`: older/small reference file, not the active page.
- `fonts/`: local font assets.
- `chrome-shader.js`: raw-WebGL domain-warped fbm noise shader for the hero's liquid-chrome background (`window.tdChrome.init()`), plus a shared text-scramble utility (`window.tdScramble()`) used by the boot sequence and section kickers. No-ops on reduced-motion, lod-low/lod-medium, or missing WebGL — falls back to the CSS `.chrome` gradient. Has a `u_velocity` uniform wired to mouse speed for fracture-intensity response. Loaded first, before `hero.js`.
- `hero.js`: Hero canvas/animation logic (shards, logo reveal, constellation dissolve, word-rotor headline). Includes `TEXT_FADE` and `DISSIPATE` acts to prevent dead scroll at hero end.
- `animations.js`: GSAP ScrollTrigger definitions for non-hero, non-pinned content — reveals, count-ups, marquee, mobile nav, footer, and `composeMail()` (the mailto contact-form handler with visibility-based success detection).
- `immersive-sections.js`: The three pinned cinematic sections — Case Study (horizontal reel), Testimonials (theater crossfade), Process (orbital ring) — driven by `gsap.matchMedia()` scroll-scrubbed timelines, desktop only. See Architecture Overview below.
- `interactive.js`: Chapter rail scroll-progress tracking (with a no-GSAP fallback), cursor/magnetic-button effects, and other cross-cutting interaction wiring. Loaded with a cache-busting `?v=` query string — bump it when editing this file if changes don't appear to take.
- `threejs-scene.js`: Three.js ambient particle scene. 200 drifting particles behind content sections, camera responds to mouse and scroll. Fades in after hero, out before CTA.
- `styles.css` (1451 lines): Global styles, variables, utility classes, responsive rules, chapter rail, footer/CTA/etc.
- `404.html`, `privacy.html`, `terms.html`: standalone on-brand pages, self-contained inline CSS. Privacy/terms are explicitly marked as drafts pending owner review.
- `robots.txt`, `sitemap.xml`: SEO crawlability files.
- `audit-visual.js`, `dense-scroll-capture.js`, `verify-audit-regressions.js`, `verify-scene0-gating.js`: ad hoc Playwright audit/verification scripts from prior sessions, not part of the shipped site — safe to ignore unless resuming that specific audit work.

## Architecture Overview

### Chapter structure

The page is organized into 6 acts, tracked via `data-chapter="0"`-`"5"` on top-level elements and mirrored in the chapter rail (`#chapters` in `index.html`, right-edge nav dots):

| Chapter | Rail label | Section ID | Element |
|---|---|---|---|
| 0 | Manifest | `#hero-pin` | `.hero-pin-wrap` — WebGL chrome-shader hero |
| 1 | Arsenal | `#services`, `#data-break` | services grid + telemetry stat strip + logo marquee |
| 2 | Proof | `#case-study` | `.imm-pin-wrap.cs-gallery` — horizontal case-study reel |
| 3 | Verdict | `#testimonials-imm` | `.imm-pin-wrap` — testimonial theater |
| 4 | Craft | `#process-imm` | `.imm-pin-wrap` — process orbital ring |
| 5 | Connect | `#contact` | CTA + footer |

The old Results/Testimonials/Process section IDs and the ~1696-line inline-script architecture described in "What Was Recently Changed" below **no longer exist** — that log is kept as historical record of the pre-rewrite page, not a description of current code.

### Pinned cinematic sections (`immersive-sections.js`)

Three sections use `.imm-pin-wrap` + `.imm-sticky` (GSAP ScrollTrigger `pin`, desktop-only via `gsap.matchMedia()`, no reduced-motion):

- **Case Study** (`#case-study`, `data-pin-height="360"`): a `400vw`-wide `.cs-track` of 4 `.cs-slide` panels pans sideways (`xPercent`) so each slide centers in the viewport in turn. Centered slide's counters count up once; dot bar and `.cs-index` numeral sync to position.
- **Testimonials** (`#testimonials-imm`, `data-pin-height="180"`): crossfade theater — `.testi-s1` → `.testi-s2` → `.testi-s3` → `.testi-trust` row, via `autoAlpha` and a subtle scale for depth. Active scene carries `.scene-active`.
- **Process** (`#process-imm`, `data-pin-height="250"`): an orbital ring (`#proc-ring`) with a focus dot that rotates between 5 nodes; the active node lights, `#proc-num` updates, and the matching `.proc-step` crossfades in `.proc-stage`. Active step carries `.scene-active`.

All three obey the site's hard rule: **no vertical translation** — only `autoAlpha`/opacity crossfades, horizontal `xPercent` (case-study reel only), rotation (process ring only), and scale.

### Key: Scroll-to fix in Playwright tests

For reliable ScrollTrigger screenshot tests, set the scroll position, wait for animation frames, and call `ScrollTrigger.update()`/`ScrollTrigger.refresh()` when sampling computed styles. Direct screenshots after `window.scrollTo()` worked in the latest audit when followed by a short wait. When Playwright isn't installed in this project's own `node_modules`, it's available system-wide via `/Users/tiffanychoo/projects/anchora-instagram-clone/node_modules/playwright` — run scripts from that directory (or copy the script there) so `require('playwright')` resolves; if the default chromium executable path errors with "doesn't exist," check `~/Library/Caches/ms-playwright/` for whichever chromium revision is actually installed and pass it as `executablePath`.

## What Was Recently Changed

> **Historical record only (through the "Scroll Profile" section below).** Everything from here through "Scroll Profile (normalized)" describes the pre-rewrite Results/Testimonials/Process architecture (April 30, 2026 and earlier), which was superseded by the August 2026 chapter-based rewrite described in Architecture Overview above. Section IDs, line numbers, and file names below (e.g. `#results`, `#testimonials`, `#process`) no longer exist in the codebase. Kept for institutional memory of past bugs and their fixes, not as a guide to current code.

### Phase 11 - Section Background Consolidation & Visual Audit (2026-04-30)

User request: review the whole project, consolidate and record what changed, then audit the whole page visually so each section has one consistent background color and sections/segments do not overlap.

**Fix 1 - Removed overlap layers** (`index.html`, `styles.css`):
- Removed the inline `#services::before`, `.data-break::before`, `#results::before`, `#testimonials::before`, and `#process::before` overlap-gradient block.
- Removed the standalone `<div class="section-transition dark-to-light"></div>` and its gradient CSS.
- Removed the CTA texture `::after` overlay so the CTA background remains a single `--off-white` field.

**Fix 2 - Explicit section backgrounds** (`styles.css`):
- `#services`: `var(--ink)`
- `#data-break`: `var(--ink)`
- `#results`: `var(--ink)` through inline section CSS
- `#testimonials`: `var(--ink-mid)`
- `#process`: `var(--ink-soft)`
- `#contact`: `var(--off-white)`
- `footer`: `var(--ink)`

**Fix 3 - No stacked pinned-scene content** (`index.html`):
- Results and Testimonials transitions now fade the outgoing scene out before the incoming scene fades in. This keeps a paused scrub position from showing two quotes/case studies on top of each other.
- Process step transitions now use the same sequence: outgoing step fades out, then incoming step fades in. At audit points only one Process step is visible.

**Fix 4 - Restored hidden section reveals** (`index.html`, `styles.css`):
- Reintroduced GSAP ScrollTriggers for Services, Results intro, Testimonials intro, Process intro, and the Data-break metric strip.
- Services and Data-break were previously staying visually blank because their old reveal trigger had been killed and not recreated.
- Reveal defaults no longer include `translateY`; content reveals with opacity/clip-path only.

**Verification**:
- Syntax checks passed for `animations.js`, `hero.js`, `threejs-scene.js`, and the inline `index.html` script.
- Browser visual audit screenshots: `/tmp/td-visual-audit-final11/`.
- Audit data confirmed no overlap pseudo-elements remain on Services, Data-break, Results, Testimonials, or Process (`::before`/`::after` content is `none`), no `.section-transition` exists, and the sampled Results/Testimonials/Process frames show only one active scene/step at a time.
- Pixel samples confirmed pinned Results and Process backgrounds stay edge-to-edge at their section exits after the sticky width/z-index fix.

### Visual Audit & Polish (2026-04-30)

Five-phase visual audit addressing dead frames, hero idle zone, green removal, dark-to-light transition smoothing, and Three.js ambient scene.

### Phase 1 — Dead Frame Compression (index.html) — CORRECTED

The Process section's last-scene fade-out was compressed from 3s to 0.4s (`ease: 'expo.inOut'`). Results and Testimonials were NOT changed at this time (they still had `duration: 2.4` at `dur - 3.4`) — this was corrected in Phase 6.

| Section | Before | After (Phase 1) |
|---|---|---|
| Results | `duration: 3` at `dur - 3` | `duration: 2.4` at `dur - 3.4` (NOT changed) |
| Testimonials | `duration: 3` at `dur - 3` | `duration: 2.4` at `dur - 3.4` (NOT changed) |
| Process (step) | `duration: 3` at `dur - 3` | `duration: 0.4` at `dur - 0.4` |
| Process (frame) | `duration: 2` at `dur - 3` | `duration: 0.4` at `dur - 0.6` |

### Phase 2 — Hero Dead Zone Fix (hero.js)

Added two new acts to the hero timeline:
- `TEXT_FADE: { start: 0.78, end: 0.92 }` — all hero text multiplies opacity by `(1 - easeIn(textFadeT))`, smoothly fading to 0
- `DISSIPATE: { start: 0.75, end: 0.95 }` — shard alpha multiplied by a dissipate curve, fading the constellation to invisible

Before: text stayed at full opacity from progress 0.75 to 1.0 (~87vh of dead scroll). After: text fades out by 0.92, shards by 0.95.

### Phase 3 — Green Removal (styles.css)

Testimonials background changed from `--ink-verdant (#282c20)` to `--ink-mid (#1e1e1e)`:
- Line 402: `#testimonials { background: var(--ink-verdant); }` → `var(--ink-mid)`
- Line 443: `.testi-card:hover { background: #111; }` → `var(--ink)`

The testimonial section now sits naturally between Results (`--ink-soft`) and Process (`--ink-soft`) with no color jump. The transition gradient pseudo-element at line 208 already targeted `--ink-mid`, so the seam is continuous.

### Phase 4 — Dark-to-Light Transition (styles.css)

The gradient between Process (`--ink-soft`) and CTA (`--off-white`) was lengthened and smoothed:
- Height: 80px → 160px (mobile: 80px)
- Gradient: 2-stop → 5-stop: `--ink-soft 0% → --ink-mid 25% → --ink-muted 50% → rgba(90,96,103,0.4) 75% → --off-white 100%`

Previously the 80px gradient scrolled past in <0.1s. Now at 160px with intermediate stops it feels like a gradual atmospheric shift.

### Phase 5 — Three.js Ambient Scene (new file: threejs-scene.js)

Persistent Three.js particle field behind content sections:
- 200 particles in a flat disc (y-range compressed by 0.3×) — chrome/steel colors with additive blending at 25% opacity
- Camera: PerspectiveCamera(60) at z=300, auto Y-rotation at 0.0003 rad/frame
- Mouse parallax: camera lerps ±8px from center on mouse move
- Scroll response: camera Z oscillates ±15 units via `sin(scrollProgress * 2π)`, driven by ScrollTrigger tracking across #services, #results, and #process
- Twinkle: one random particle per frame oscillates size with phase offset
- ScrollTrigger fade-in after hero (trigger: `#services`, `top bottom-=200`) → 0.2 opacity
- ScrollTrigger fade-out before CTA (trigger: `#contact`, `top bottom-=200`)
- Graceful degradation: no-op if Three.js fails to load or prefers-reduced-motion is set
- CDN: three.js r128 from cdnjs

### Phase 7 — Testimonials Reconstruction (2026-04-30)

The Testimonials desktop pinned timeline was completely missing after the Results horizontal scroll conversion. All 4 scenes stacked at `position: absolute` with no GSAP controlling visibility — scenes 1-3 were visible overlapping scene 0.

**Fix 1 — Reconstructed Testimonials mm.add timeline** (index.html:1269): Added full mm.add block with `pin: '.testi-sticky'` scrub timeline. S0→S1 at position 7, S1→S2 at 17, S2→S3 at 27, last-scene fade at fixed position 37 (was `dur - 0.4`, which compressed S3 to ~25px of visible scroll).

**Fix 2 — CSS initial state** (index.html:126-128): Added `html.gsap-active .testi-scene:not(.scene-active) { opacity: 0; visibility: hidden; }` to hide non-active scenes before ScrollTrigger activates.

**Fix 3 — Pin-wrap height** (styles.css): 200vh → 250vh to provide enough scroll distance for all 4 scenes with the extended timeline (position 37 last-scene fade vs 30.5 total duration).

**Verification**: All 4 scenes transition (S0→S1→S2→S3 with opacity crossfades). Last scene fades out before Process enters. Pin-wrap: 2250px (250vh), total scroll: 15207px.

### Phase 8 — Process Step 4 Decompression (2026-04-30)

The Process step 4 (data-step="4") had the same `dur - 0.4` compression as Testimonials S3. With timeline duration ~30.5, the last-scene fade at `dur - 0.4 = 30.1` gave step 4 only ~0.1 timeline units (~3px of scroll) between becoming fully visible and fading out.

**Fix 1 — Last-scene fade position** (index.html:1630-1631): Changed from `Math.max(0, dur - 0.4)` and `Math.max(0, dur - 0.6)` to fixed positions `37` and `36.8`. The `var dur = tl.duration()` calculation was removed since it's no longer needed. Step 4 now gets from ~30 to 37 = 7 units of solo time.

**Fix 2 — Pin-wrap height** (styles.css): 150vh → 200vh (1800px, providing 900px of scroll for the extended 37.5-unit timeline).

**Verification**: Step 4 now reaches opacity 1.00 at prog=0.99+ (was reaching ~0.75 with immediate fade-out). Total page scroll: 15657px.

### Phase 9 — Process Timeline Compression & Spillover Fix (2026-04-30)

The Process section's 4-step crossfade timeline was compressed to eliminate overlap between the last step and the CTA entrance. The section divider enters viewport at scroll ~11493, but the old timeline positioned step 4 reveal at unit 27 (scroll 11699) and exit fade at unit 35 (scroll 12057+) — after the CTA was already visible.

**Fix 1 — Compressed crossfade positions** (index.html:1580-1632):
| Event | Before | After |
|---|---|---|
| Step 1→2 crossfade | 7/8 | 4/6 |
| Step 2→3 crossfade | 17/18 | 9/11 |
| Step 3→4 crossfade | 27/28 | 14/16 |
| Frame exit fade | 29.8 (0.4s) | 17 (3s) |
| Step 4 exit fade | 30 (0.4s) | 18 (3s) |
| Timeline extender | — | callback at 37 |

**Fix 2 — pin-wrap height** (index.html:539): 200vh → 250vh (2250px, providing 12507px total scroll, was 12057px). Extra scroll distance separates Process end from CTA entrance.

**Fix 3 — Thread rail line progression** (index.html:1578,1598,1615,1632): 20% at pos 3, 33% at pos 3, 66% at pos 8, 100% at pos 13 (was 33% pos 1, 66% pos 6, 100% pos 16).

**Verification**: Process step 4 fully visible at 86-88% scroll. Frame and step 4 both at opacity 0.00 by 90%. Section divider enters at ~92% with clean separation — no Process content overlaps with dark-to-light gradient or CTA.

### Phase 10 — Dead Code Cleanup & Divider Fix (2026-04-30)

Full codebase audit identifying and fixing dead code and latent bugs:

**Fix 1 — Dead CSS removed** (styles.css): Removed ~170 lines of unused selectors from old grid-based layouts that were replaced by pinned scene transitions:
- `.res-grid`, `.res-card`, `.cs-headline`, `.cs-industry`, `.cs-narrative`, `.cs-stats`, `.cs-stat` (old Results grid)
- `.testi-grid`, `.testi-featured`, `.testi-card`, `.testi-stat`, `.testi-stat-num`, `.testi-stat-lbl` (old Testimonials grid)
- `.proc-steps` (old Process grid wrapper)
- `.proc-track`, `.proc-track-line`, `.proc-icon`, `.proc-node` (unused process elements)
- `.svc-icon-placeholder`, `.res-img-placeholder`, `.testi-author-avatar`, `.testi-quote-close` (unused placeholder elements)
- `--ink-verdant` CSS variable (unused since Phase 3 green removal)
- Corresponding media query rules for all removed selectors

**Fix 2 — Section divider ScrollTriggers restored** (index.html:1211-1223): The inline JS kill loop was catching section divider ScrollTriggers along with pinned-section triggers. Added re-created ScrollTriggers for all `.section-divider` elements after the kill loop so dividers animate between every section (previously only the Process→CTA divider worked).

**Fix 3 — Dead `revealSectionOnEnter` removed** (index.html:1236-1253): A function that was never called. Sections are handled by individual mm.add blocks.

**Fix 4 — Dead inline CSS removed** (index.html `<style>` block): Removed `.res-card`, `.res-card:hover`, `.res-card:hover .cs-headline` selectors (lines 182-193) — leftover from the old Results grid layout, not referenced by any current HTML.

**Fix 5 — Process→CTA divider data-trigger fixed** (index.html:1141): Changed `data-trigger="cta"` to `data-trigger="contact"`. The CTA section is `id="contact"`, so `document.getElementById('cta')` returned null and the divider had never animated.

**Fix 6 — Kill loop entry cleaned** (index.html:1209): Changed `'cta'` to `'contact'` in the kill loop. The old entry never matched any element since no section has `id="cta"`.

**Verification**: styles.css reduced from ~968 to ~797 lines. All section dividers now animate (including Process→CTA). No dead CSS remains in either styles.css or the inline `<style>` block. No functional changes to any pinned timeline at that point. Historical line count: index.html 1653 lines (was ~1666).

### Phase 6 — Scroll Audit & Fixes (2026-04-30)

Frame-by-frame Playwright scroll audit identified and fixed three issues:

**Fix 1 — Results last-scene fade-out** (index.html:1803): Changed from `duration: 2.4, ease: 'power2.inOut'` at `dur - 3.4` to `duration: 0.4, ease: 'expo.inOut'` at `dur - 0.4`. Scene 3 content was only 51% visible at 60% scroll before being faded out; now reaches 99% at 60%.

**Fix 2 — Testimonials last-scene fade-out** (index.html:1619): Same change as Results. Scene 3 was only 75% visible at 78% scroll; now reaches 100%.

**Fix 3 — Footer trigger never fired** (index.html:1687): Changed `start: 'top 85%'` to `start: 'top bottom'`. The footer's top never reached 85% from viewport top within available scroll (max 87% at full scroll), so `top 85%` never triggered. Footer links stayed clipped (`inset(0px 100% 0px 0px)`) and footer copy stayed at `opacity: 0`. Now uses `top bottom` (enters viewport) to trigger clip-path reveals and copy fade-in. Verified working — `clipPath: inset(0px 0% 0px 0px)` and `opacity: 1` at full scroll.

### CSS Transform & y-Offset Cleanup (previous session)

All `transform: translateY(...)` initial states and GSAP `y: N` animation values were removed:

| Removed From | Values Removed |
|---|---|
| Process step content (CSS + 4× fromTo) | `translateY(20px)`, `y: 24` |
| Results industry/narrative/stats (CSS) | `translateY(8px)`, `translateY(16px)` |
| Results narrative GSAP fromTo | `y: 16` |
| Testimonials name/role/stats (CSS) | `translateY(8px)`, `translateY(12px)` |
| Data-break labels (CSS + GSAP to) | `translateY(8px)`, `y: 0` |
| Footer copy (CSS + GSAP to) | `translateY(8px)`, `y: 0` |
| Mobile fallback animations (3×) | `y: 40` |

All section-to-section transitions are now pure opacity/autoAlpha crossfades.

### Spillover Prevention

Each section's last scene fades out before the next section enters.

| Section → Next | Fade | Duration |
|---|---|---|
| Results scene 3 → Testimonials | timeline position `37` | 0.4s expo.inOut |
| Testimonials scene 3 → Process | timeline position `37` | 0.4s expo.inOut |
| Process step 4 → CTA | timeline position `18`; frame fades at `19.2` | 1.2s power2.inOut |

### Pin Heights

Results uses **300vh**. Testimonials and Process use **250vh**.

### Shared Behaviors

- **Services**: clip-path word reveals on card names, hover dimming on sibling cards, angular polygon frames
- **Data-break / Proof bar**: staggered center-out divider lines, clip-path number reveals, count-up animation, label fades
- **Marquee**: auto-scrolling logo track with gradient fade edges
- **Atmosphere canvas**: persistent drifting particles, fades in past hero, fades out before CTA
- **CTA**: split left/right, headline word clip reveals, fade-up on availability/sub/text/form
- **Footer**: clip-path link reveals, fade-up on copyright
- **Mobile** (max-width 768px): all pinned sections fall back to `position: relative; height: auto;` with simple stagger fade-ups (no pin, no scrub timeline)

## Verification Results

Playwright audit against 1440×900 viewport:

```
Console errors:              0 ✓
Three.js loaded:             r128 ✓
Three.js errors:             0 ✓
Testimonials bg:             rgb(30,30,30) = --ink-mid ✓ (no green)
Section transition height:   160px ✓
Hero TEXT_FADE config:       0.78-0.92 ✓ (fades to 0 by scrollY ~2700)
Hero DISSIPATE config:       0.75-0.95 ✓
Dead frame expo.inOut fades: 2 replacements found (Process uses 3s power2.inOut) ✓
Results last scene (60%):    opacity 0.99 ✓ (was 0.51 before Phase 6)
Process exit (90%):          frame 0.00, step4 0.00 ✓ (no spillover into CTA)
Process→CTA no overlap:      divider enters at 92%, Process content at 0 by 90% ✓
Testimonials scene 3 visible: all 4 scenes transition (S3 at prog=0.79+) ✓ (was missing Scene 3 before fix)
CTA visible at end:          all 7 words opacity 1 ✓
Footer clip-path revealed:   inset(0px 0% 0px 0px) ✓
Footer copy fade-in:         opacity 1 ✓
All sections present:        ✓
Reverse scroll:              scrub reverses smoothly ✓
Mobile (390×844):            sticky→static fallback, all sections present ✓
Section dividers animated:   all 7 fire correctly ✓ (was 6/7 before cta→contact fix)
No dead .res-card CSS:       styles.css ✓, inline <style> ✓ (was present before Phase 10)
No data-trigger="cta":       index.html ✓ (was present before Phase 10)
No 'cta' in kill loop:       index.html ✓ (was present before Phase 10)
```

### Scroll Profile (normalized)

| Scroll % | What's Visible |
|---|---|
| 0-30% | Hero canvas — shard explosion → converge → flash → dissolve → text reveals |
| 30-31% | Hero fade-out (TEXT_FADE 0.78-0.92), shards dissipate (0.75-0.95) |
| 31-43% | Services section — headline reveals, card reveals |
| 43-44% | Data Break — metrics count-up, divider reveals |
| 44-45% | Marquee — auto-scrolling logo track |
| 45-61% | Results — 4 case study scenes, intro overlay fades out, scenes crossfade with clip-path word reveals |
| 61-79% | Testimonials — 4 quote scenes with clip-path word reveals, name/role stagger |
| 79-90% | Process — 4 steps in frame with thread rail fill, step crossfades with content stagger |
| 91-98% | CTA — split layout, headline clip reveals, form, proof metrics |
| 98-100% | Footer — link clip reveals, copyright fade-up |

## Useful Commands

```bash
# JS syntax check (all files)
node --check animations.js && node --check hero.js && node --check chrome-shader.js && \
  node --check immersive-sections.js && node --check interactive.js && node --check threejs-scene.js

# Extract and check inline <script> blocks in index.html
python3 -c "
import re
html = open('index.html').read()
for i, s in enumerate(re.findall(r'<script>(.*?)</script>', html, re.DOTALL)):
    open(f'/tmp/inline_{i}.js', 'w').write(s)
"
for f in /tmp/inline_*.js; do node --check "$f"; done

# Check for any remaining y-values (hard rule: no vertical movement in scene transitions)
grep -n 'y:' index.html immersive-sections.js | grep -v 'font-\|display:\|flex-\|align-\|justify-\|transform:\|scroll-\|letter-\|clip-\|border\|opacity\|var(--\|line-height\|background\|keyframes\|@media\|stagger\|delay\|strokeDash'

# Check Three.js CDN loaded (r128)
curl -sI https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js | head -1

# Check server
lsof -nP -iTCP:5173 -sTCP:LISTEN

# Full-page Playwright screenshot (playwright may not be installed in this project —
# run from a sibling project that has it, e.g. anchora-instagram-clone/node_modules,
# and pass an explicit executablePath if the default chromium revision is missing;
# see ~/Library/Caches/ms-playwright/ for what's actually installed)
node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await p.goto('http://127.0.0.1:5173/index.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: '/tmp/td-fullpage.png', fullPage: true });
  await b.close();
})();
"
```

## Known Open Items

- Testimonials use real placeholder-style attribution (`A. Chen`, `M. Torres`, `J. Patel` — initials + role, not full names) rather than bracketed `[ Client Name ]` placeholders. Confirm with the user whether these should become real client names/logos before launch.
- CTAs still use `mailto:` links (`composeMail()` in `animations.js`). A calendar embed/link was recommended but not implemented because it needs user choice/provider.
- `privacy.html` and `terms.html` are explicitly marked as drafts pending legal review — do not treat as final/publishable without the user confirming.
- No analytics/tracking is wired up (`privacy.html` accurately states this). Revisit if the user wants conversion tracking.
- No `<img>` tags exist anywhere in the site — all visuals are CSS/canvas/SVG/WebGL, so image alt-text and compression audits are not applicable.
- `threejs-scene.js` loads Three.js r128 from CDN. If the CDN URL changes or the API breaks, the scene silently degrades (no-op). Update the URL in index.html if needed.
- `chrome-shader.js` is raw WebGL with no fallback library — if it fails to init, the hero background falls back to the CSS `.chrome` gradient only (no particle motion).

## Aesthetic Direction

Keep the current direction restrained, dark, editorial, and high-end. Current design tokens (`styles.css` `:root`, as of the August 2026 chapter rewrite):

- `--bg` (#050507) / `--bg-deep` (#040406): primary backgrounds
- `--bg-sec` (rgba(5,5,7,.88)): secondary/overlay background
- `--glass` / `--glass-hi`: translucent panel fills (glassmorphism-style `.panel.holo` cards)
- `--text` (#e9edf2) / `--dim` (#7d8794) / `--faint` (#4c545e): text hierarchy
- `--glint-a` (#8fb0ff) / `--glint-b` (#6ee7d6): accent highlights (cool blue / teal)
- `--chrome`: animated linear-gradient used by the `.chrome` text-clip effect
- `--display` (Archivo), `--mono` (JetBrains Mono), `--serif` (Cormorant Garamond, italic)

Note: the older `--ink`/`--ink-soft`/`--ink-mid`/`--chrome-hi`/`--steel` variables from the pre-rewrite palette no longer exist in `:root` — a few CSS rules still reference them only as fallback values inside `var(--x, fallback)`, which resolve to the literal fallback since the variable itself is undefined.

- Large serif display typography (headlines) with sans-serif for labels/body.
- Angular particles/shards as the signature visual motif; WebGL liquid-chrome shader drives the hero background.
- Minimal UI chrome.
- No generic SaaS cards, gradient blobs, decorative marketing fluff, or over-rounded components.
- Scene transitions should feel like cinematic cuts — crossfade, rotation (process ring), or horizontal reel motion (case study) only, never vertical sliding.
- Clip-path reveals on headlines: `inset(0 100% 0 0)` → `inset(0 0% 0 0)`.
