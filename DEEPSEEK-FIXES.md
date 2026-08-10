# DeepSeek Fix Instructions — Tensionless Digital

Visual audit found 5 issues. Fix all of them. Use `codex` for screenshots to verify each fix.
Server runs at `http://127.0.0.1:5173/index.html`. Start it with `python3 -m http.server 5173 --bind 127.0.0.1` if not already running.

---

## FIX 2 — Testimonials: black dead zone at end of section

**File:** `immersive-sections.js`  
**Lines:** 257–259

**Problem:** After the last quote (`.testi-ms-2`) fades out at timeline position `22.5`, the section has 2.5 units of black before it unpins at `TDUR=25`. Also the trust statement that fills this gap is fading out at the same time it's supposed to be showing, creating a black void. The screenshot at 65% scroll shows a completely empty black frame.

**Fix:**

Change lines 257–259 from:
```js
testiTl.to('.testi-ms-2', { autoAlpha: 0, duration: 0.8, ease: 'expo.out' }, 22.5)
        .to(testiTrust, { autoAlpha: 0, duration: 0.5, ease: 'power2.inOut' }, 22.5);
```

To:
```js
testiTl.to('.testi-ms-2', { autoAlpha: 0, duration: 0.8, ease: 'expo.out' }, TDUR - 0.8)
        .to(testiTrust, { autoAlpha: 0, duration: 0.5, ease: 'power2.inOut' }, TDUR - 0.6);
```

This keeps something visible on screen until just before the section releases its pin.

**Verify:** Take a screenshot at 65% scroll. A quote or trust statement should be visible, not a black screen.

---

## FIX 3 — CTA headline ("Ready to stop guessing...") invisible

**Files:** `animations.js`

**Problem:** `animations.js` and the inline `<script>` in `index.html` (lines ~389–426) both try to control `.cta-h`. `animations.js` sets `.cta-h` to `autoAlpha: 0` and animates it as a whole element. The inline script then runs `clearProps: 'all'` to reset it, re-sets it to `autoAlpha: 0`, and splits it into `.word` child spans — then animates those words individually. The result: `animations.js` reveals the container element but the CSS rule `html.gsap-active .cta-h .word { opacity: 0 }` keeps words invisible, and the inline script's word-level animation may conflict with or be overridden by the container-level animation.

**Fix — three changes in `animations.js`:**

**Change 1:** Line 103 — remove `.cta-h` from the CTA group's `items` so `animations.js` does not touch the headline:
```js
// BEFORE:
{ root: '#contact', items: '.cta-h, .cta-availability, .cta-sub, .btn-dark, .btn-ink', variant: 'cta' },

// AFTER:
{ root: '#contact', items: '.cta-availability, .cta-sub, .btn-dark, .btn-ink', variant: 'cta' },
```

**Change 2:** Lines 142–146 — remove the entire `if (config.variant === 'cta')` block in the setup loop, since it only sets initial state on `.cta-h` and `.cta-right > *` (which doesn't exist in the HTML):
```js
// DELETE these lines:
if (config.variant === 'cta') {
  gsap.set(root.querySelector('.cta-h'), { x: -24, y: 0 });
  gsap.set(root.querySelectorAll('.cta-right > *'), { x: 24, y: 0 });
  gsap.set(root.querySelectorAll('.btn-dark'), { scale: 0.92 });
}
```

**Change 3:** Lines 217–223 — remove the `.cta-h` animation from `revealGroup`'s CTA variant. Leave the rest intact:
```js
// BEFORE:
if (config.variant === 'cta') {
  tl.to(q('.cta-h'), { autoAlpha: 1, x: 0, duration: 0.7, ease: 'expo.out' })
    .to(q('.cta-right > *'), { autoAlpha: 1, x: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' }, '-=0.3')
    .to(q('.btn-dark'), { scale: 1.04, duration: 0.4, ease: 'power2.out' }, '-=0.2')
    .to(q('.btn-dark'), { scale: 1, duration: 0.3, ease: 'power2.out' });
  return tl;
}

// AFTER:
if (config.variant === 'cta') {
  tl.to(q('.cta-availability, .cta-sub, .btn-dark, .btn-ink'), { autoAlpha: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' });
  return tl;
}
```

After this change `animations.js` handles only the sub-elements, and the inline script in `index.html` owns `.cta-h` entirely — splitting it into words and revealing them on scroll.

**Verify:** Take a screenshot at 100% scroll. The headline "Ready to stop guessing and start growing?" should be visible in large serif above the form.

---

## FIX 4 — Process section: content stuck at bottom of viewport

**File:** `styles.css`

**Problem:** The `.proc-layout` grid uses `position: absolute; inset: 0; align-items: center` — which should center content vertically in the 100vh container — but the step content (number + title + description) renders at the bottom 30% of the viewport, leaving ~60% blank dark space above it.

**Fix:** Change `.proc-layout` to use flexbox instead of grid, which is more reliable for vertical centering in a pinned container:

```css
/* BEFORE: */
.proc-layout {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
  padding: 0 56px;
  gap: 48px;
}

/* AFTER: */
.proc-layout {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 0 56px;
  gap: 48px;
}
```

Also, set an explicit width on `.proc-left` so it doesn't collapse:
```css
/* ADD this rule after .proc-left: */
.proc-left {
  flex-shrink: 0;
  width: 120px;
}
```

And ensure `.proc-center` takes remaining space:
```css
/* MODIFY .proc-center: */
.proc-center {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  min-height: 200px;
}
```

**Verify:** Screenshot at 80% scroll. The "Strategy" step number and text should appear centered vertically in the viewport (roughly middle of screen height), not at the bottom.

---

## FIX 5 — Stats counters stuck at 0

**File:** `animations.js`

**Problem:** The data-break stats (Campaigns Delivered, × Highest ROAS, etc.) show `0` when their section is visible. The count-up animation fires via a GSAP `.call()` callback after a `revealGroup` ScrollTrigger, but the trigger uses `start: 'top 92%'` which may fire late and the async tween may not complete before screenshots or real viewport renders show the numbers.

**Fix 1:** In `animations.js`, change the data-break ScrollTrigger start to fire earlier and make it more reliable:

Find the `ScrollTrigger.create` call inside `mm.add` (around line 240). Change `start: 'top 92%'` to `start: 'top 80%'`.

```js
// BEFORE:
ScrollTrigger.create({
  trigger: root,
  start: 'top 92%',
  once: true,
  ...
```

Wait — all groups share one ScrollTrigger.create call. Instead, add a specific earlier start just for the data-break group. The simplest fix: inside `revealGroup` for `data-break`, fire `countUp` immediately when the function is called (not after the reveal animation). Change:

```js
if (config.variant === 'data-break') {
  tl.to(q('.db-inner'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' })
    .call(function() {
      root.querySelectorAll('.count').forEach(function(el) { countUp(el); });
    });
  return tl;
}
```

To:

```js
if (config.variant === 'data-break') {
  root.querySelectorAll('.count').forEach(function(el) { countUp(el); });
  tl.to(q('.db-inner'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' });
  return tl;
}
```

This fires the count-up at the same moment the reveal animation starts, so the numbers are counting as the section fades in — more satisfying and reliable.

**Verify:** Screenshot at 32% scroll (just past the data-break section appearing). The numbers should show values greater than 0 — ideally their final values (120, 58, 6, 100) or mid-count.

---

## FIX 6 — Services section: cards invisible on entry

**File:** `animations.js`

**Problem:** Service cards are initialized at `x: 160, y: 120, rotation: -4, scale: 0.55` — dramatically off-screen. The ScrollTrigger fires at `start: 'top 92%'` which is almost at the bottom of the viewport. The combination of very-late trigger + large offsets means cards are invisible while the section is already substantially in view.

**Fix:** Reduce the initial offset so cards are already partially visible when they begin their animation:

Change lines 127–128 from:
```js
gsap.set(root.querySelectorAll('.svc-card'), { x: 160, y: 120, rotation: -4, scale: 0.55 });
```

To:
```js
gsap.set(root.querySelectorAll('.svc-card'), { x: 60, y: 40, rotation: -3, scale: 0.8 });
```

And in the corresponding `revealGroup` animation (line 174–177), reduce the duration slightly so the reveal feels snappier:
```js
.to(q('.svc-card'), {
  autoAlpha: 1, x: 0, y: 0, rotation: 0, scale: 1,
  duration: 0.7, stagger: { each: 0.08, from: 'center' }, ease: 'power3.out'
}, '-=0.4');
```

**Verify:** Screenshot at 22% scroll. At least some service cards should be partially visible/mid-animation rather than the section appearing completely empty.

---

## After All Fixes

Run a full scroll audit with Playwright screenshots at 0%, 20%, 30%, 50%, 60%, 65%, 70%, 80%, 90%, 95%, 100% scroll and verify:

- [ ] 65%: Testimonial quote or trust statement visible (not black)
- [ ] 100%: CTA headline "Ready to stop guessing..." visible above the form
- [ ] 80%: Process step content centered vertically in viewport (not bottom-anchored)
- [ ] 30%: Data-break stats show numbers > 0
- [ ] 22%: Service cards partially visible / animating in

Run `node --check animations.js && node --check immersive-sections.js` to confirm no syntax errors before taking screenshots.
