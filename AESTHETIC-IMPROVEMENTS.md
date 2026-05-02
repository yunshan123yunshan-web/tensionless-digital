# Aesthetic Improvements — Tensionless Digital

> Execution spec for DeepSeek. Read every fix fully before touching code.
> Verify with `agent-browser` screenshots after each fix group.
> Hard constraints (DO NOT violate):
> - No y-axis movement on any element (no translateY, no `y:` in GSAP tweens)
> - Scene transitions are crossfade only (autoAlpha / opacity)
> - Keep all existing animation architecture intact — do not rewrite timelines
> - All JS changes must pass `node --check`
> - Test server: `http://127.0.0.1:5173/index.html`

---

## Fix 1 — Services: increase card corner bracket visibility

**Problem:** `.svc-card::before` and `.svc-card::after` corner brackets are `rgba(200,204,210,.08)` — nearly invisible against `--ink`. They only become readable on hover. The section lacks any resting-state detail.

**File:** `styles.css`

Change the resting-state border opacity on both pseudo-elements from `.08` to `.18`:

```css
/* BEFORE */
.svc-card::before {
  border-top: 1.5px solid rgba(200,204,210,.08);
  border-left: 1.5px solid rgba(200,204,210,.08);
}
.svc-card::after {
  border-bottom: 1.5px solid rgba(200,204,210,.08);
  border-right: 1.5px solid rgba(200,204,210,.08);
}

/* AFTER */
.svc-card::before {
  border-top: 1.5px solid rgba(200,204,210,.18);
  border-left: 1.5px solid rgba(200,204,210,.18);
}
.svc-card::after {
  border-bottom: 1.5px solid rgba(200,204,210,.18);
  border-right: 1.5px solid rgba(200,204,210,.18);
}
```

Hover state stays `.55` — no change there.

---

## Fix 2 — Services: increase card divider line visibility

**Problem:** `.svc-card` right-border dividers are `rgba(200,204,210,.07)` — invisible. They exist to separate columns but don't read at all.

**File:** `styles.css`

Change `.svc-card` border-right from `.07` to `.14`:

```css
/* BEFORE */
.svc-card {
  border-right: 1px solid rgba(200,204,210,.07);
}

/* AFTER */
.svc-card {
  border-right: 1px solid rgba(200,204,210,.14);
}
```

---

## Fix 3 — Data Break: add a subtle top/bottom rule to frame the metrics

**Problem:** The data-break section sits between Services and Marquee with the same `--ink` background and no visual frame. The metrics float in undifferentiated black space with nothing anchoring them.

**File:** `styles.css`

Add top and bottom border to `.data-break`:

```css
/* BEFORE */
.data-break {
  padding: 64px 56px;
  background: var(--ink);
}

/* AFTER */
.data-break {
  padding: 64px 56px;
  background: var(--ink);
  border-top: 1px solid rgba(200,204,210,.08);
  border-bottom: 1px solid rgba(200,204,210,.08);
}
```

---

## Fix 4 — Data Break: increase label size and metric number brightness

**Problem:** `.db-lbl` is `9px` — below readable threshold. `.db-num` uses `var(--white)` which is correct but the label being nearly invisible breaks the stat/label pairing.

**File:** `styles.css`

Change `.db-lbl` font-size from `9px` to `10px` and increase letter-spacing slightly:

```css
/* BEFORE */
.db-lbl {
  font-size: 9px;
  letter-spacing: .18em;
}

/* AFTER */
.db-lbl {
  font-size: 10px;
  letter-spacing: .2em;
}
```

---

## Fix 5 — Testimonials: add a large decorative opening quote mark

**Problem:** The testimonial quotes are beautiful but read as floating text with no typographic framing. A large background quotation mark (non-semantic, aria-hidden) would anchor the quote visually and add depth without adding clutter.

**File:** `index.html` and `styles.css`

In `index.html`, find each `.testi-scene` div. Each contains a `.testi-quote` element. Add a `<span class="testi-deco-quote" aria-hidden="true">"</span>` as the first child inside each `.testi-scene`:

Find this pattern (repeated 4 times, one per scene):
```html
<div class="testi-scene ...">
```

Add as the first child inside each one:
```html
<span class="testi-deco-quote" aria-hidden="true">"</span>
```

In `styles.css`, add after the `.testi-scene` rules:

```css
.testi-deco-quote {
  position: absolute;
  top: 12%;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--serif);
  font-size: clamp(160px, 20vw, 260px);
  font-weight: 300;
  line-height: 1;
  color: var(--white);
  opacity: 0.03;
  pointer-events: none;
  user-select: none;
  letter-spacing: -.02em;
}
```

---

## Fix 6 — Testimonials: tighten the vertical dead space

**Problem:** The quote sits at roughly 40–60% of the viewport vertically, with ~40% empty sky above and ~30% below. It feels like a sparse slide deck rather than a cinematic frame.

**File:** `styles.css`

Find the `.testi-scene` rule (or the flex container inside it that centers content). The content is likely centered with `align-items: center`. Change it to sit slightly above center:

Find where `.testi-scene` or its inner wrapper uses `justify-content: center` or `align-items: center` for vertical placement. Add `padding-top: 8vh` to pull the content slightly upward, giving the attribution line more breathing room below:

```css
/* Find the class that wraps quote + author inside each testi-scene */
/* It is likely .testi-q-wrap or similar — check the HTML structure */
/* If the quote is directly in .testi-scene with flex centering, add: */
.testi-scene {
  padding-top: 8vh;
}
```

> **Note for DeepSeek:** Read the actual `.testi-scene` HTML structure in `index.html` first. Find the inner wrapper class. Apply the padding to whatever element currently centers the quote vertically, not the outer scene container if it clips overflow.

---

## Fix 7 — Process: remove the intrusive right-edge polygon shard

**Problem:** The process section has a `<div class="shard shard-spin">` at `right: -60px` that rotates through the right edge of the sticky container. Even with `overflow: hidden` on `.imm-sticky`, the partially clipped rotating diamond is visually disruptive — it reads as a layout error, not intentional decoration. The process section's minimal left-column layout has no corresponding visual on the right to balance it, making the shard feel accidental.

**File:** `index.html`

Find the shard inside `.proc-sticky`:
```html
<div class="shard shard-spin" style="width:280px;height:280px;top:5%;right:-60px;opacity:0.02" aria-hidden="true" data-parallax="0.06"></div>
```

Either remove this element entirely, or change its opacity from `0.02` to `0` to make it invisible:

```html
<!-- OPTION A: remove entirely -->
<!-- delete the line -->

<!-- OPTION B: zero opacity (safer, keeps DOM) -->
<div class="shard shard-spin" style="width:280px;height:280px;top:5%;right:-60px;opacity:0" aria-hidden="true" data-parallax="0.06"></div>
```

Use Option A (remove entirely).

---

## Fix 8 — Process: vertically center the step content in the viewport

**Problem:** Step content (number, title, description) sits in the lower-left quadrant of the viewport. The layout uses `top: 80px` on `.proc-layout` which starts content just below the nav. With the content block being ~200px tall, it reads as bottom-third anchored when the viewport is 900px.

**File:** `styles.css`

The `.proc-layout` is `position: absolute; top: 80px; right: 0; bottom: 0; left: 0; display: flex; align-items: center`. The `align-items: center` already centers vertically within the available space. The issue is `top: 80px` shortens the box from the top, so center is pushed downward. 

Change `align-items: center` to place content slightly above true center by adding `padding-bottom: 10vh`:

```css
/* BEFORE */
.proc-layout {
  position: absolute;
  top: 80px;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 0 56px;
  gap: 48px;
}

/* AFTER */
.proc-layout {
  position: absolute;
  top: 80px;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 0 56px 10vh;
  gap: 48px;
}
```

---

## Fix 9 — CTA: add space between headline and availability line

**Problem:** The `.cta-availability` line (`• ACCEPTING 1 NEW CLIENT THIS QUARTER`) overlaps the descenders of the headline above it. The headline has `line-height: .92` which tucks lines tightly, and the availability line has only `margin-bottom: 4px` but no top spacing.

**File:** `styles.css`

Add `margin-top: 16px` to `.cta-availability`:

```css
/* BEFORE */
.cta-availability {
  font-family: var(--sans);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: var(--chrome-hi);
  margin-bottom: 4px;
}

/* AFTER */
.cta-availability {
  font-family: var(--sans);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: var(--chrome-hi);
  margin-top: 16px;
  margin-bottom: 4px;
}
```

---

## Fix 10 — CTA: make the pulsing dot on availability line actually pulse

**Problem:** The `&#9679;` dot before "ACCEPTING 1 NEW CLIENT" is a static unicode character. A slow CSS pulse animation would signal live/real-time availability and add life to an otherwise static block.

**File:** `styles.css`

Replace the static dot with a `::before` pseudo-element that pulses. First, remove the `&#9679;` from the HTML and replace with a CSS pseudo-element:

In `index.html`, find:
```html
<p class="cta-availability">&#9679; Accepting 1 new client this quarter.</p>
```
Change to:
```html
<p class="cta-availability">Accepting 1 new client this quarter.</p>
```

In `styles.css`, update `.cta-availability`:
```css
.cta-availability::before {
  content: '';
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--chrome-hi);
  margin-right: 8px;
  vertical-align: middle;
  animation: avail-pulse 2.4s ease-in-out infinite;
}

@keyframes avail-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.7); }
}
```

---

## Fix 11 — Footer: add a thin decorative rule above the logo

**Problem:** The footer has `border-top: 1px solid rgba(200,204,210,.07)` which is already there but barely visible. The footer content (logo left, nav center, copyright right) works but the vertical rhythm between the CTA section and footer feels abrupt without visual breathing room.

**File:** `styles.css`

Increase the footer border-top opacity from `.07` to `.12` and add `padding-top: 56px` (check current value — increase if already 44px):

```css
/* Find footer rule — currently: */
footer {
  padding: 44px 56px 40px;
  background: var(--ink);
  border-top: 1px solid rgba(200,204,210,.07);
  ...
}

/* Change border-top opacity: */
border-top: 1px solid rgba(200,204,210,.12);
```

---

## Verification checklist

After all fixes, run:

```bash
node --check animations.js
node --check immersive-sections.js
node --check interactive.js
```

Then visual checks with agent-browser:

```bash
agent-browser open http://127.0.0.1:5173/index.html
agent-browser set viewport 1440 900

# Services — check card borders and corners visible
agent-browser eval "window.scrollTo(0, 3200)" && sleep 2
agent-browser screenshot /tmp/fix-services.png

# Data break — check ruled borders and label size
agent-browser eval "window.scrollTo(0, 4000)" && sleep 2
agent-browser screenshot /tmp/fix-databreak.png

# Testimonials — check deco quote mark and vertical position
agent-browser eval "window.scrollTo(0, 7000)" && sleep 2
agent-browser screenshot /tmp/fix-testi.png

# Process — verify shard is gone, content centered
agent-browser eval "window.scrollTo(0, 9200)" && sleep 2
agent-browser screenshot /tmp/fix-process.png

# CTA — check headline/availability spacing and pulsing dot
agent-browser eval "window.scrollTo(0, 12000)" && sleep 2
agent-browser screenshot /tmp/fix-cta.png

agent-browser close
```

Confirm in screenshots:
- [ ] Service card column dividers and corner brackets visible at rest (not just hover)
- [ ] Data break has a top and bottom rule framing the metrics
- [ ] Testimonials have faint oversized `"` behind the quote text
- [ ] No rotating diamond shard visible in process section
- [ ] Process step content reads as vertically centered, not bottom-anchored
- [ ] Availability line has clear separation from headline descenders
- [ ] Availability dot pulses (visible in static screenshot as a small filled circle)
- [ ] Footer border-top is slightly more visible
