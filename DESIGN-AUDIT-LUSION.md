# Tensionless Digital — Lusion Design Lens Audit

**Audited:** 2026-05-01
**Lens:** Bruno Imbrizi / Lusion design perspective (creative coding, interactive web animation, 3D visual storytelling)
**Method:** Playwright browser extraction + code analysis
**Viewport:** 1440×900
**Total scroll:** 12,759px (9 viewports)

---

## Executive Summary

This site aspires to be a Lusion-level interactive brand experience — scroll-driven narrative, Three.js atmosphere, canvas hero, cinematic scene transitions. The ambition is in the right place. But through the Lusion lens — where motion must reveal, performance is aesthetic, and world coherence is non-negotiable — the site reveals a gap between ambition and execution. The structural choices are often sound, but the craft details, animation philosophy, and world-building have significant room to tighten.

**Core tension:** The site has the *parts* of an immersive experience (pinned sections, particle systems, crossfade transitions) but doesn't fully commit to the *logic* that makes those parts cohere into a single world.

---

## 1. World Coherence — 4/10

The highest-priority dimension for Lusion — and the weakest here.

**What's working:**
- Color palette is consistent (grayscale throughout, no unmotivated brand color)
- Type system is consistent (serif display + sans functional)
- All sections use the same animation approach (GSAP + ScrollTrigger)
- Dark background throughout (except CTA)

**What's not working:**
- **Varying inner widths:** Case study inner = 860px, CTA inner = 520px, data-break = 900px. This is the biggest world-coherence violation. A Lusion site would use a consistent content width across all sections — the container IS the world boundary.
- **Grain texture on 2 of 9 sections:** Services and data-break have grain, the other 7 don't. This isn't a deliberate system — it reads as two different texture treatments. In Lusion terms, "sections belong to the same world." Grain is a world property, not a section decoration.
- **Horizontal padding:** 86.4px on services, 56px on pinned sections through inner containers. If the world has a rhythm, every section should follow it.
- **Background quote mark (`"` at 420px):** Present on testimonials, absent elsewhere. Why does only this section get a decorative typographic element? Either it's a world property or it's not.
- **Diamond icon (`svc-diamond`):** A 5px rotated square used once in service cards, never again. Visual vocabulary that appears once is noise, not a system.

**The spacer/divider problem:**
The site uses both animated section dividers (1px bars) AND section background changes as separators. Lusion would argue: pick ONE transition mechanism. Either the background changes IS the divider (clean, confident), OR you use a dedicated divider. Both signals together is hedging.

**Lusion verdict:** World coherence is the biggest missed opportunity. The site feels like 3 designers who agreed on a palette but not a spatial system. The Lusion principle — "sections belonging to the same world, not isolated flashy scenes" — is violated repeatedly.

---

## 2. Motion & Animation — 6/10

This is where the lens is most focused. Every animation is evaluated against "does this serve narrative, interaction, or comprehension?"

**Where motion serves:**

| Animation | Serves? | Assessment |
|-----------|---------|------------|
| Hero shard explosion → converge → text reveal | ✅ | Narrative-driven. Shards as attention metaphor, then text. This is good Lusion-type work. |
| Scene crossfades (Results/Testimonials/Process) | ✅ | Structural. Helps user understand "we're in a new scene now." The pure opacity crossfade (no y-offset) is the right call. |
| Clip-path word reveals on headlines | ✅ | Guides reading order. Parameterized and systematic across sections. |
| Count-up numbers (data-break, scene stats) | ✅ | Serves comprehension — makes abstract metrics feel concrete through motion. |
| Three.js ambient particles | ⚠️ | Subtle enough (25% opacity) — it adds atmospheric depth without calling attention. But what does it communicate about the content? If it's just "web3D atmosphere," Bruno would question it. Passes, barely. |

**Where motion doesn't serve:**

| Animation | Serves? | Assessment |
|-----------|---------|------------|
| Floating testimonial card drift | ❌ | 8 cards continuously oscillating with sine-wave x/y drift. Users scrolling through pinned quotes DON'T SEE THIS animation — it plays invisibly. Lusion would cut it immediately. |
| Process visual node system (5 dots, 3 rings, 3 lines) | ❌ | Abstract decorative state changes that tell the user nothing about "Discover → Strategy → Design → Build → Launch." Lusion: "If you removed all text, would this communicate?" No. |
| Shimmer gradient on "attention" | ❌ | Animation on one word in the hero. Doesn't serve comprehension, doesn't serve reading order, doesn't serve narrative. Lusion: "Motion reveals — what does this reveal?" Nothing. |
| Section dividers (3 animated scaleX bars) | ❌ | These are Lusion's nightmare — sections that don't trust their own background change to signal a transition. The section background IS the divider. Adding a 1px animated bar is hedging. |
| Grain texture animation | ❌ | Not an animation per se, but the inconsistency of grain on 2 of 9 sections creates a motion/texture system that contradicts itself. |

**Missing motion opportunities:**

- **No parallax at all.** Lusion's work often uses subtle parallax to create depth layering. This site is all flat crossfades. That's a valid choice, but it means the depth comes only from the Three.js layer — and that layer is at 25% opacity.
- **No interaction-driven visual change.** Beyond mouse parallax on Three.js, nothing on the page changes its visual logic in response to user input. Lusion:"Interaction should alter the actual visual logic."
- **No reactive brand expression.** The particles and shards don't express brand traits — they're general "cool web stuff." Bruno would translate brand qualities into visual system parameters.

**Animation performance — systems check:**
- 661 continuously animated elements (450 shards + 200 particles + 8 drifting cards + 3 ambient scene elements)
- The drifting cards are the biggest system violation: 8 individual sine-wave calculations per frame, running whether the user can see them or not
- Bruno's approach: use instancing, move logic to shaders, cull what's not visible
- Here: per-element GSAP timelines running continuously for decorative elements

**Lusion verdict:** The hero and scene transitions are structurally sound. The decorative animations (card drift, process nodes, section dividers) are the kind of "effect-first" work Lusion rejects. The biggest miss is that no animation changes the visual logic meaningfully — everything plays on scroll regardless of what the user does.

---

## 3. Performance as Aesthetic — 5/10

Bruno's core principle: "Performance constraints are design constraints, not afterthoughts."

**What's good:**
- DOM ready at 317ms, full load at 324ms — excellent
- No Layout thrashing detected during sampling
- Three.js uses BufferGeometry (modern, efficient)
- Hero uses canvas (no DOM overhead for 450 elements)

**What's concerning:**
- **661 continuously animated elements** — Bruno would ask "how many of these are visible at any time?" Most aren't.
- **No LOD (level of detail) system** — the hero runs the same 450 shard simulation regardless of viewport or device capability
- **FPS degradation path:** The code has an FPS monitor that triggers at <30fps for 3 consecutive frames, but the degradation only reduces shard count in the hero. It doesn't disable the drifting cards or process nodes.
- **Mobile:** Hero canvas + Three.js still render on mobile (no media query disabling them). The prefers-reduced-motion check handles accessibility but not battery optimization. Lusion would disable both canvas layers on mobile.
- **CPU-driven decorative animation:** The 8 drifting cards use GSAP's update cycle, not GPU-composited animations. CSS transform-based animations would be more efficient if they must exist at all.

**Lusion verdict:** The loading speed is excellent. The continuous animation budget is too high for what it buys. The decorative animations (especially cards) should be killed or GPU-composited. The hero's FPS degradation should cascade to kill ALL continuous non-critical animations.

---

## 4. Systems Thinking — 5/10

Bruno builds systems, not one-offs. How does this site score on that dimension?

**What's systematic:**
- Split-headline clip-path reveal is used across multiple sections — good motion primitive
- Scene transition pattern is consistent (opacity crossfade, no y-offset) — good
- Color variables are centralized — good CSS system
- Type scale is disciplined — good typography system

**What's one-off:**
- **Each pinned section has its OWN timeline code** — Results, Testimonials, and Process each have inline GSAP timelines with hardcoded scene counts, fade positions, and stagger values. A Lusion system would parameterize: `createSceneTimeline(scenes, { fadeOutDuration: 0.4, fadeInDuration: 0.6, ... })`.
- **Individual element selectors everywhere** — `$('.res-scene-0-headline')`, `$('.testi-scene-2-name')`, etc. One-off selectors per element per scene. A system would iterate over scene data arrays.
- **Three.js scene is separate from the hero canvas** — Two independent visual systems doing different things. Lusion would likely unify: either use Three.js for everything (including shard effects) or use canvas for everything. Two renderers for one page is dual-system overhead.
- **Section dividers** — Each implemented as an individual ScrollTrigger, not a shared trigger system. (This was noted as partially fixed in Phase 10, but the implementation is still per-divider.)

**Missing system primitives:**
- No shared `fadeIn()` / `fadeOut()` / `revealWords()` utilities — each section reimplements these
- No data-driven scene content — scenes are hardcoded in HTML with individual classes
- No unified transition controller — each section manages its own timeline independently
- Bruno would build: one scene manager, one transition system, data-driven content

**Lusion verdict:** The site is built by someone who knows GSAP well but hasn't elevated to system-level thinking. The split-headline reveal is the only shared primitive. Everything else is custom-coded per section. For a 5-section page with 3 pinned timelines, this is still tech-debt-on-arrival.

---

## 5. Abstraction Over Literalism — 6/10

Does the visual language express brand traits abstractly through form, or does it decorate literally?

**What works:**
- The shard motif (angular particles converging into form) IS an abstraction — suggesting precision, focus, attention coalescing. This is the strongest single design decision on the page.
- Grayscale palette, no brand color — abstract confidence
- Service card polygon frames — abstract geometric motif
- The orb blobs in the case study section are actually good abstraction — data as atmosphere

**What doesn't:**
- **Case study content is generic.** "120% ROAS" and "58× ROI" are numbers without narrative. A Lusion approach would abstract the data into a visual system (data as spatial form, not text on a page).
- **Testimonials are literal quotes on dark backgrounds.** No visual translation of what "best decision we've made" feels like. The 8 floating cards try but fail because their drift is unmotivated by content.
- **Process steps are text lists.** 5 steps, each with a title and description. No visual manifestation of what "discover" vs "launch" means. The process node system tries but fails because the dots/rings/lines don't map to anything specific.

**The central miss:** The shards in the hero ARE good abstraction. But nothing carries that language through to the rest of the page. The angular shard motif could translate into service card corners, scene transition shapes, data visualization. Instead it appears once and vanishes.

**Lusion verdict:** The hero makes a strong abstract statement that the rest of the page doesn't fulfill. The case study, testimonials, and process are literal content displays. Lusion would carry the shard/angular language through: data as particle fields, testimonials as dynamic typographic systems, process as a spatial journey.

---

## 6. Design Without Ego — 7/10

Does the UI support content, or perform for itself?

**What's right:**
- Navigation is minimal (1 link). Almost invisible. This is correct — let the content lead.
- Button styles are restrained (10px/500/0.2em uppercase).
- No mega-menus, no modal popups, no cookie banners mentioned.
- No animated logo, no splash screen.

**What's wrong:**
- **The single-link hamburger menu on mobile.** 1 link behind a hamburger icon is design theater. Lusion would either show the link directly or not have a hamburger at all.
- **Section dividers** — again, these are the navigation performing for its own sake. The background changes suffice.
- **The 420px background quote mark.** A typographic decoration that says "look at this clever layout choice" rather than making the quote more readable. Lusion would remove it.
- **Contact = mailto: link.** The highest-friction conversion path. Lusion: design the conversion experience as intentionally as the brand experience. A mailto link says "we didn't finish this section."

**Lusion verdict:** The site mostly gets this right — the hero, content sections, and typography are given room. The exceptions (hamburger, dividers, quote mark, mailto) are where the site reaches for decoration instead of confidence.

---

## 7. Craft Execution — 6/10

The gap between ambition and execution. For a site with Lusion-level aspirations, this is the dimension to scrutinize hardest.

**What's polished:**
- Loading speed (324ms) — professional
- Type hierarchy — precise
- Scroll-to-scene mapping — well-calibrated timing
- Three.js integration — clean, well-contained
- Mobile fallback — responsible degradation

**What's rough:**
- **Easing choices.** The site uses `ease: 'expo.inOut'` for scene transitions — snappy, cinematic. But card reveals use `ease: 'power2.out'`, and older code shows `power3`. Lusion would use a strict easing system: ONE ease for entrances, ONE for exits, ONE for emphasis. Mixing eases weakens the motion language.
- **Animation timing feels determined by duration sliders, not by narrative beats.** Each scene fades over 0.4s, staggers over 0.15s. These feel like preference-tuning, not intentional pacing decisions.
- **Text animation is clip-path only.** No variation in how text enters — same `inset(0 100% 0 0) → inset(0 0% 0 0)` every time. Lusion would consider: does this headline enter differently from that one? What does the reveal method SAY about the content?
- **The CTA section is the weakest craft moment.** It has the narrowest container, a mailto link, and text that reads "Ready to stop guessing and start growing?" — the weakest copy on the page. For a site this ambitious visually, the conversion section should be the most crafted, not the least.
- **Footer is an afterthought.** Minimal content, minimal motion, minimal presence. On a brand site, the footer is where people who didn't convert look for contact info. It should be treated as a designed element, not a leftover.

**Lusion verdict:** The craft is uneven. The pinned sections and hero are the most polished. The CTA and footer feel rushed. Lusion's rule: "If you're going to make a product, make it beautiful." The beauty drops off sharply after the process section.

---

## 8. The Lusion Scorecard

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **World Coherence** | 4/10 | Inconsistent widths, grain on 2/9 sections, varying padding, orphan motifs (diamond, quote mark). Sections don't feel like one world. |
| **Motion Serves Narrative** | 6/10 | Hero and scene transitions work. Floating cards, process nodes, section dividers are decorative. No interaction-driven visual change. |
| **Performance as Aesthetic** | 5/10 | Loads fast (324ms). But 661 continuously animated elements with no LOD system, no mobile GPU throttling, FPS degradation doesn't cascade far enough. |
| **Systems Thinking** | 5/10 | One shared primitive (split-headline reveal). Everything else is hand-coded per section. No data-driven scene system, no unified transition controller. |
| **Abstraction Over Literalism** | 6/10 | Shard motif is the strongest abstract choice. But it doesn't carry through the rest of the page. Data, testimonials, process are literal text displays. |
| **Design Without Ego** | 7/10 | Mostly restrained. Hamburger, dividers, quote mark, mailto are ego moments. Navigation and typography are correctly restrained. |
| **Craft Execution** | 6/10 | Hero and scene transitions are polished. Easing system is inconsistent. CTA and footer feel rushed. Animation timing feels arbitrary. |
| **Overall** | **5.6/10** | Ambitious, well-loaded, structurally sound in places. But world coherence and systems thinking need significant work to reach Lusion-level craft. |

---

## 9. Lusion-Filtered Recommendations

### Must Fix (world coherence, motion philosophy)

1. **Unify content container widths.** Pick 860px (or whatever the dominant width is) and use it for ALL content sections. The CTA should be as wide as the case studies. The data-break should not be wider. One world, one grid.

2. **Kill the floating testimonial cards.** 8 continuously drifting cards that users don't see while scrolling is the clearest violation of "motion reveals, doesn't decorate." Either remove them entirely or anchor 2-3 to specific content meaning.

3. **Kill or rebuild the process visual node system.** If the dots/rings/lines don't communicate process-specific information (which step is "discover" vs "launch"), they're decoration. Either make them actually represent the process or remove them.

4. **Systematize or remove grain texture.** Grain on 2 of 9 sections is a world-coherence violation. Apply to all dark sections or none. Lusion would likely remove it — grain adds texture but doesn't communicate brand meaning.

5. **Remove the section dividers.** The section background change IS the divider. Adding 1px animated bars signals "we don't trust our own section transitions." Confidence means picking one mechanism.

### Should Fix (performance, craft, systems)

6. **Unify easing across all animations.** Pick one ease for entrances, one for exits, one for emphasis. Apply everywhere. Currently mixing expo.inOut, power2.out, power3 — weakens motion language.

7. **Build a scene transition system.** Parameterize the pinned-scene pattern: `createSceneTransition(scenes, { fadeOut, fadeIn, staggerBetween, ... })`. Results, Testimonials, and Process should share code, not each have inline timelines.

8. **Remove the shimmer animation on "attention."** It doesn't serve comprehension. Bruno: "motion reveals — what does it reveal?" Nothing.

9. **Replace mailto: with a designed contact section.** The conversion moment should be as crafted as the hero. A mailto link is the lowest-craft way to handle contact.

10. **Remove the 420px background quote mark.** Typographic decoration that adds nothing to comprehension. Lusion: "design without ego."

### Nice to Fix (elevation)

11. **Carry the shard motif through the page.** The hero introduces angular particles as a visual language. Translate that into data visualization, scene transition shapes, or section graphics. A motif that appears once is an idea that wasn't followed.

12. **Add interaction-driven visual change.** Currently nothing on the page changes its visual logic in response to user behavior. Lusion: "Interaction should alter the actual visual logic." A simple example: selected/hovered service cards could affect the Three.js particle field color or density.

13. **Add a LOD system for animations.** On mobile, disable Three.js + hero canvas. On low-performance desktop, kill decorative animations (cards, nodes, section dividers). On high-performance, unlock everything. Performance degradation should cascade, not just reduce shard count.

14. **Redesign the CTA section.** Widest container (not narrowest), stronger copy (the current line is generic), form instead of mailto, and motion that signals this is the climax of the scroll journey, not the exit.

---

## 10. Summary

This site has a Lusion-level ambition in a Lusion-compatible medium (scroll-driven narrative, WebGL, canvas shards, cinematic transitions). The structural foundation — loading speed, type discipline, color restraint, mobile fallback — is professional.

**The gap is in execution depth:** The site uses 661 continuously animated elements without asking whether each one serves the narrative. The content containers vary between 520px and 900px without a rationale. The easing system mixes three different patterns. Section-specific visual motifs (diamond, quote mark, grain, orbs) appear in one section and vanish.

**Through the Lusion lens, the site is about 60% of the way there.** It has the right parts. It needs:
1. **World unification** — consistent widths, consistent textures, consistent spatial system
2. **Motion philosophy** — kill decorative animations, let every reveal serve comprehension
3. **Systems thinking** — parameterize, centralize, share code between sections
4. **Craft follow-through** — unify easing, redesign the CTA, finish the footer

The hero says "we turn attention into revenue." The Lusion question would be: does every pixel on this page earn the attention it asks for?
