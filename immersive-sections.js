/**
 * Immersive Sections — Pinned Cinematic Scene Transitions
 *
 * Three pinned sections (Case Study, Testimonials, Process) driven by
 * scroll-scrubbed timelines inside gsap.matchMedia — desktop only, no
 * reduced-motion. Scene changes stay inside the site's hard rule: no
 * vertical translation. Only crossfades (autoAlpha), horizontal reel
 * motion (xPercent on the case track), rotation (process orbital), and
 * scale are used.
 *
 * Case Study  — horizontal reel: the 400vw track pans sideways so each of
 *   the 4 slides centers in the viewport. The centered slide's counters
 *   count up once, the dot bar syncs, and the last slide fades before the
 *   next section enters.
 * Testimonials — theater: proven crossfade sequence (quote 1 → 2 → 3 →
 *   trust row) with a subtle scale for depth.
 * Process — orbital ring: a focus dot orbits each node; the active node
 *   lights, the numeral updates, and the step copy crossfades in the stage.
 */

(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();
  var DESKTOP = '(min-width: 769px) and (prefers-reduced-motion: no-preference)';

  /* ── shared helpers ─────────────────────────────────────────────── */

  function buildProgressDots(container, count) {
    if (!container) return [];
    var dots = [];
    var i;
    for (i = 0; i < count; i += 1) {
      var dot = document.createElement('span');
      dot.className = 'imm-dot';
      if (i === 0) dot.classList.add('active');
      container.appendChild(dot);
      dots.push(dot);
    }
    return dots;
  }

  function setDot(dots, index) {
    dots.forEach(function (dot, i) {
      dot.classList.toggle('active', i === index);
    });
  }

  function createPinnedTimeline(trigger, pin) {
    return gsap.timeline({
      scrollTrigger: {
        trigger: trigger,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        pin: pin,
        pinSpacing: true,
        anticipatePin: 1
      }
    });
  }

  function entranceTimeline(trigger, add) {
    // 'top bottom' (not 'top 90%'): these triggers sit right after another
    // pinned section, whose pin-spacer pushes this section's real arrival
    // later than a plain 90%-of-viewport threshold assumes. Starting at
    // 'top bottom' guarantees the previous pin has released first.
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: trigger,
        start: 'top bottom',
        toggleActions: 'play none none none'
      }
    });
    add(tl);
    return tl;
  }

  function scrambleKicker(root) {
    return function () {
      var el = root && root.querySelector('.mono[data-scramble]');
      if (el && window.tdScramble) window.tdScramble(el, { duration: 650 }).start();
    };
  }

  function fireCountUps(scene) {
    Array.prototype.forEach.call(scene.querySelectorAll('.count-imm'), function (el) {
      var target = parseFloat(el.getAttribute('data-target'));
      if (isNaN(target)) return;
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      el.textContent = prefix + '0' + suffix;
      var state = { v: 0 };
      gsap.to(state, {
        v: target,
        duration: 1.6,
        ease: 'expo.out',
        onUpdate: function () {
          el.textContent = prefix + state.v.toFixed(dec) + suffix;
        }
      });
    });
  }

  // tl.call fires on both scroll directions — only ever count once per scene.
  function countOnce(scene) {
    if (scene.__counted) return;
    scene.__counted = true;
    fireCountUps(scene);
  }

  function clearScenes(scenes, innerSel) {
    scenes.forEach(function (scene) {
      scene.__counted = false;
      gsap.set(scene, { clearProps: 'opacity,visibility,transform' });
      Array.prototype.forEach.call(scene.querySelectorAll(innerSel), function (el) {
        el.style.opacity = '';
        el.style.visibility = '';
      });
    });
  }

  function resetDots(dots) {
    dots.forEach(function (d) { d.classList.remove('active'); });
    if (dots[0]) dots[0].classList.add('active');
  }

  // power1.inOut, 0..1 — mirrors the per-segment pan easing so the
  // scrub-driven reel decelerates as each slide centers.
  function easeInOut01(p) {
    return p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p);
  }

  /* ── CASE STUDY — horizontal reel ───────────────────────────────── */

  var csWrap = document.getElementById('case-study');
  var csSticky = csWrap && csWrap.querySelector('.imm-sticky');
  if (csWrap && csSticky) {
    mm.add(DESKTOP, function () {
      var slides = Array.prototype.slice.call(csWrap.querySelectorAll('.cs-slide'));
      var track = csWrap.querySelector('.cs-track');
      if (slides.length < 4 || !track) return;

      var innerSel = '.cs-label, .cs-head, .cs-body, .cs-stat, .cs-panel';
      var kicker = csWrap.querySelector('.cs-gallery-kicker');
      slides.forEach(function (slide) {
        gsap.set(slide.querySelectorAll(innerSel), { autoAlpha: 0 });
      });
      gsap.set(track, { xPercent: 0 });
      if (kicker) gsap.set(kicker, { autoAlpha: 0 });

      var dots = buildProgressDots(csWrap.querySelector('.cs-dot-bar'), slides.length);
      var indexNum = csWrap.querySelector('.cs-index-num');

      // Kicker fades with scene 1, same as the slide content — it must not
      // be visible before the entrance timeline actually plays, since that
      // would double-expose it against the previous section's exit fade.
      entranceTimeline(csWrap, function (tl) {
        if (kicker) tl.to(kicker, { autoAlpha: 1, duration: 0.5 }, 0);
        tl.to(slides[0].querySelectorAll(innerSel), { autoAlpha: 1, duration: 0.7, stagger: 0.1 }, 0)
          .call(scrambleKicker(csWrap), null, 0.2)
          .call(function () { countOnce(slides[0]); }, null, 0.6);
      });

      // Slide centers along the pin. One master tween drives the pan and
      // syncs dots/counters from its own progress — .call at exact tween
      // boundaries does not fire when the scrub rests there, so sync lives
      // in onUpdate instead (holds correctly in both scroll directions).
      // DUR raised from 30 to 34 and slide 4's center pushed from 23 to 25
      // (CENTER[0..2] unchanged): slides 1-3 each got ~7 units of dwell
      // between their center and the next slide's center, but slide 4 only
      // had until DUR - 5 = 25 before its own fade-out started — a ~2-unit
      // window once its reveal (CENTER[3] - 2.2) finished, which real
      // scroll (with scrub: 1 lag) blew through entirely, skipping straight
      // from slide 3 to a blank frame without slide 4 ever reading clearly.
      // The extra 4 units give slide 4 the same real dwell the others get.
      var DUR = 34;
      var CENTER = [2, 9, 16, 25];
      var X = [0, -25, -50, -75];

      var drive = { u: 0 };
      var active = 0;
      var tl = createPinnedTimeline(csWrap, csSticky);
      tl.to(drive, { u: 1, duration: DUR, ease: 'none', onUpdate: syncGallery }, 0);

      // Reveal each incoming slide's content while it is still sliding in —
      // before it centers — so the reel never sits on a bare panel between
      // slides. The fade finishes just as the panel enters the viewport.
      for (var j = 1; j < slides.length; j += 1) {
        tl.fromTo(slides[j].querySelectorAll(innerSel),
          { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.55, stagger: 0.07 }, CENTER[j] - 2.2);
      }

      function syncGallery() {
        var u = drive.u * DUR;
        var xp = X[0];
        for (var i = 0; i < X.length - 1; i += 1) {
          if (u <= CENTER[i + 1]) {
            var p = Math.min(1, Math.max(0, (u - CENTER[i]) / (CENTER[i + 1] - CENTER[i])));
            xp = X[i] + (X[i + 1] - X[i]) * easeInOut01(p);
            break;
          }
        }
        if (u > CENTER[X.length - 1]) xp = X[X.length - 1];
        gsap.set(track, { xPercent: xp });
        var idx = Math.round(-xp / 25);
        if (idx !== active) {
          active = idx;
          setDot(dots, idx);
          if (indexNum) indexNum.textContent = '0' + (idx + 1);
        }
        if (u >= CENTER[idx] + 0.3) countOnce(slides[idx]);
      }

      // Keep slide 4 visible through the pin release. The Verdict section
      // should not begin covering Proof while the fourth case is still being
      // introduced; once the pin releases, the whole Proof sticky naturally
      // scrolls away and Verdict enters from below.

      return function () {
        clearScenes(slides, innerSel);
        gsap.set(track, { clearProps: 'xPercent' });
        if (kicker) gsap.set(kicker, { clearProps: 'opacity,visibility' });
        resetDots(dots);
      };
    });
  }

  /* ── TESTIMONIALS — 3 quotes + trust row ────────────────────────── */

  var testiWrap = document.getElementById('testimonials-imm');
  var testiSticky = testiWrap && testiWrap.querySelector('.imm-sticky');
  if (testiWrap && testiSticky) {
    mm.add(DESKTOP, function () {
      var scenes = Array.prototype.slice.call(testiWrap.querySelectorAll('.testi-scene'));
      if (scenes.length < 3) return;
      var s1 = scenes[0], s2 = scenes[1], s3 = scenes[2];
      var trust = testiWrap.querySelector('.testi-trust');
      var trustInner = trust && trust.querySelectorAll('.testi-trust-inner > *');
      var kicker = testiWrap.querySelector('.testi-theater-kicker');

      scenes.forEach(function (scene) {
        gsap.set(scene.querySelectorAll('.testi-glyph, .testi-quote, .testi-author'), { autoAlpha: 0 });
      });
      gsap.set([s2, s3], { scale: 1.04 });
      if (trust && trustInner.length) {
        gsap.set(trustInner, { autoAlpha: 0 });
      }
      if (kicker) gsap.set(kicker, { autoAlpha: 0 });

      var dots = buildProgressDots(testiWrap.querySelector('.testi-dot-bar'), 4);

      // Scene 1's reveal lives inside the pinned timeline itself (not a
      // separate ScrollTrigger) because this section follows another pinned
      // section: an independent 'top bottom'/'top 90%' trigger fires based
      // on document position, which the previous section's pin-spacer can
      // satisfy well before that pin actually releases — producing a
      // double-exposure of both sections' content. Gating on the pinned
      // timeline's own start guarantees this only plays once the case-study
      // pin has released and this section is truly on screen. The kicker
      // label is markup-level always-on, so it needs the same gating —
      // otherwise it renders as soon as .testi-sticky enters the viewport,
      // well before the pin (and the previous section's exit fade) resolve.
      var DUR = 25;
      var tl = createPinnedTimeline(testiWrap, testiSticky);
      // s1's own opacity is NOT set on tl at position 0: a scrub timeline's
      // .set() at position 0 renders eagerly the instant it's added — and
      // keeps re-rendering that eager frame on every ScrollTrigger.refresh()
      // (which fires automatically once after setup and on window resize),
      // regardless of any gsap.set() called afterward to counter it. That
      // eager autoAlpha:1 left s1's empty panel visible from page load,
      // double-exposed against Case Study. A separate ScrollTrigger.create()
      // below (start: 'top top', matching the pin exactly) only fires once
      // the pin genuinely engages, so it isn't subject to the eager-render
      // problem. tl above still owns scale/content once s1 IS visible.
      tl.set(s1, { scale: 1 }, 0)
        .to(s1.querySelectorAll('.testi-glyph, .testi-quote, .testi-author'),
          { autoAlpha: 1, duration: 0.7, stagger: 0.15 }, 0)
        .call(scrambleKicker(testiWrap), null, 0);
      if (kicker) tl.to(kicker, { autoAlpha: 1, duration: 0.5 }, 0);
      // Scene 1's own opacity reveal: onEnter/onLeaveBack callbacks instead of a
      // play/reverse timeline, because a deep scroll-jump (scroll restoration,
      // End key, hash-URL load) re-fires onEnter while the scrub is already
      // mid-timeline — a plain play resurrected s1 at opacity 1 and left it
      // double-exposed over s2/s3 when scrolling back up through the pin. The
      // u-guard only reveals s1 while the scrub is still inside scene 1's own
      // window (fade-out at position 5 of DUR 25); a hard hide on upward exit
      // keeps the pin-start boundary clean.
      function syncFirstTestimonial() {
        var pin = tl.scrollTrigger;
        var y = pin.scroll();
        var u = (y - pin.start) / (pin.end - pin.start) * DUR;
        gsap.set(s1, { autoAlpha: (y < pin.start || u < 5) ? 1 : 0 });
      }

      ScrollTrigger.create({
        trigger: testiWrap,
        start: 'top bottom',
        end: 'bottom top',
        onEnter: syncFirstTestimonial,
        onEnterBack: syncFirstTestimonial,
        onUpdate: syncFirstTestimonial,
        onLeaveBack: function () { gsap.set(s1, { autoAlpha: 0 }); }
      });

      [[s1, s2, 5], [s2, s3, 10.5]].forEach(function (pair, idx) {
        var out = pair[0], inn = pair[1], at = pair[2];
        tl.to(out, { autoAlpha: 0, scale: 0.98, duration: 0.8, ease: 'power1.inOut' }, at)
          .to(inn, { autoAlpha: 1, scale: 1, duration: 0.8, ease: 'power1.inOut' }, at + 0.8)
          .fromTo(inn.querySelectorAll('.testi-glyph, .testi-quote, .testi-author'),
            { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, stagger: 0.14 }, at + 1.0)
          .call(setDot, [dots, idx + 1], at + 0.9);
      });

      // Keep the trust row visible through the pin release. Craft should not
      // start entering while Verdict's fourth state is still being introduced;
      // once the pin releases, the whole Verdict sticky scrolls away normally
      // and Craft enters from below.
      if (trust && trustInner.length) {
        tl.to(s3, { autoAlpha: 0, scale: 0.98, duration: 0.8, ease: 'power1.inOut' }, 15.5)
          .fromTo(trustInner, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, stagger: 0.15 }, 16.3)
          .call(setDot, [dots, 3], 16.4);
      } else {
        tl.to(s3, { autoAlpha: 0, scale: 0.98, duration: 1.5, ease: 'power1.inOut' }, 15.5);
      }

      return function () {
        clearScenes(scenes, '.testi-glyph, .testi-quote, .testi-author');
        if (trust && trustInner.length) {
          gsap.set(trust, { clearProps: 'opacity,visibility' });
          gsap.set(trustInner, { clearProps: 'opacity,visibility' });
        }
        if (kicker) gsap.set(kicker, { clearProps: 'opacity,visibility' });
        resetDots(dots);
      };
    });
  }

  /* ── PROCESS — orbital ring ─────────────────────────────────────── */

  var procWrap = document.getElementById('process-imm');
  var procSticky = procWrap && procWrap.querySelector('.imm-sticky');
  if (procWrap && procSticky) {
    mm.add(DESKTOP, function () {
      var steps = Array.prototype.slice.call(procWrap.querySelectorAll('.proc-step'));
      var nodes = Array.prototype.slice.call(procWrap.querySelectorAll('.proc-node-ring'));
      var focus = procWrap.querySelector('.proc-focus');
      var num = procWrap.querySelector('.proc-num');
      var kicker = procWrap.querySelector('.proc-kicker');
      var orbit = procWrap.querySelector('.proc-orbit');
      if (steps.length < 5) return;

      var innerSel = '.proc-step-label, .proc-step-name, .proc-step-desc';
      steps.forEach(function (step) {
        gsap.set(step.querySelectorAll(innerSel), { autoAlpha: 0 });
      });
      gsap.set(steps.slice(1), { autoAlpha: 0 });
      if (focus) gsap.set(focus, { rotation: 0 });
      if (kicker) gsap.set(kicker, { autoAlpha: 0 });
      // The ring itself is markup-level always-on, same issue as the kicker —
      // ungated it bleeds through the CTA card below once .proc-sticky enters
      // the viewport ahead of this pin actually resolving.
      if (orbit) gsap.set(orbit, { autoAlpha: 0 });

      var dots = buildProgressDots(procWrap.querySelector('.proc-dot-bar'), steps.length);

      function setActiveStep(index) {
        nodes.forEach(function (node, i) { node.classList.toggle('active', i === index); });
        setDot(dots, index);
        if (num) {
          num.textContent = '0' + (index + 1);
          gsap.fromTo(num, { autoAlpha: 0.2, scale: 0.96 },
            { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power2.out' });
        }
      }

      // Step 0's reveal lives inside the pinned timeline itself, not a
      // separate ScrollTrigger — see the matching comment in the Testimonials
      // block above. Process follows Testimonials (also pinned), so the same
      // premature-reveal risk applies here.
      // DUR raised from 30 to 34 (SEG unchanged) so step 5's reveal at 25
      // (finishes ~26.2) has real daylight before the fade-out margin below —
      // widening that margin to DUR - 6 without also extending DUR would have
      // started fading step 5 out at 24, before it had even finished revealing.
      var DUR = 34;
      var SEG = [
        { at: 3, step: 0 },
        { at: 8.5, step: 1 },
        { at: 14, step: 2 },
        { at: 19.5, step: 3 },
        { at: 25, step: 4 }
      ];

      var tl = createPinnedTimeline(procWrap, procSticky);
      // steps[0]'s own opacity is NOT set on tl at position 0 — same reason
      // as Testimonials' s1 above: a scrub timeline's .set() at position 0
      // renders eagerly on creation and again on every ScrollTrigger.refresh(),
      // regardless of any gsap.set() called afterward. A separate
      // ScrollTrigger.create() below (start: 'top top', matching the pin)
      // only fires once the pin genuinely engages.
      tl.to(steps[0].querySelectorAll(innerSel), { autoAlpha: 1, duration: 0.6, stagger: 0.1 }, 0)
        .call(scrambleKicker(procWrap), null, 0);
      // kicker/orbit reveal moved off the shared scrub timeline (tl) onto
      // the same instant toggleActions timeline as steps[0]: a scrub:1
      // fade-in here was still subject to lag at the exact pixel the
      // previous section's pin releases, so kicker/orbit could render
      // partway-faded-in (e.g. opacity 0.73) at the same instant Testimonials'
      // trust row was still partway-faded-out — a residual double-exposure
      // even after widening Testimonials' own fade-out margin.
      // Same guard as Testimonials' scene-1 reveal above: onEnter/onLeaveBack
      // instead of a play/reverse timeline, so a deep scroll-jump that re-fires
      // onEnter cannot resurrect steps[0]/kicker/orbit at opacity 1 once the
      // scrub has advanced past them. Each element hides once the scrub passes
      // its own fade-out (step 0 at SEG[1].at, ring/kicker at DUR - 6).
      function syncProcessEntrance() {
        var pin = tl.scrollTrigger;
        var y = pin.scroll();
        var u = (y - pin.start) / (pin.end - pin.start) * DUR;
        gsap.set(steps[0], { autoAlpha: (y < pin.start || u < SEG[1].at) ? 1 : 0 });
        gsap.set([kicker, orbit].filter(Boolean), { autoAlpha: 1 });
      }

      ScrollTrigger.create({
        trigger: procWrap,
        start: 'top bottom',
        end: 'bottom top',
        onEnter: syncProcessEntrance,
        onEnterBack: syncProcessEntrance,
        onUpdate: syncProcessEntrance,
        onLeaveBack: function () {
          gsap.set(steps[0], { autoAlpha: 0 });
          gsap.set([kicker, orbit].filter(Boolean), { autoAlpha: 0 });
        }
      });
      setActiveStep(0);

      // Focus dot orbits to each node (per-segment, eases as it lands).
      var prev = 0;
      SEG.forEach(function (seg) {
        if (focus) {
          tl.to(focus, { rotation: seg.step * 72, duration: seg.at - prev, ease: 'power1.inOut' }, prev);
        }
        prev = seg.at;
      });

      // Node light / numeral / dots sync from timeline progress so they hold
      // at rest (scrub-safe both directions).
      var drive = { u: 0 };
      var active = 0;
      tl.to(drive, { u: 1, duration: DUR, ease: 'none', onUpdate: syncProcess }, 0);

      // Offset by 0.7 (the fade-out duration below) so the ring/numeral
      // switch when the incoming card starts fading in, not when the
      // outgoing card starts fading out — otherwise there's a ~0.7-unit
      // window where the numeral already reads the next step while its
      // card is still visibly showing the previous one.
      function syncProcess() {
        var u = drive.u * DUR;
        var idx = 0;
        for (var i = 0; i < SEG.length; i += 1) { if (u >= SEG[i].at + 0.7) idx = i; }
        if (idx !== active) { active = idx; setActiveStep(idx); }
      }

      SEG.forEach(function (seg, idx) {
        if (idx > 0) {
          var prevStep = steps[idx - 1];
          var curr = steps[idx];
          tl.to(prevStep, { autoAlpha: 0, duration: 0.7, ease: 'power1.inOut' }, seg.at)
            .to(curr, { autoAlpha: 1, duration: 0.7, ease: 'power1.inOut' }, seg.at + 0.7)
            .fromTo(curr.querySelectorAll(innerSel),
              { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, stagger: 0.09 }, seg.at + 0.9);
        }
      });

      // Keep the final Process state alive through the pin release. The CTA
      // card does not enter the viewport until after the pin ends, so fading
      // Process inside this scrubbed timeline creates a blank frame. Instead,
      // the whole sticky layer crossfades out as the CTA scrolls in.
      var contact = document.getElementById('contact');
      if (contact) {
        ScrollTrigger.create({
          trigger: contact,
          start: 'top bottom',
          end: 'top 56%',
          scrub: true,
          onUpdate: function (self) {
            gsap.set(procSticky, { autoAlpha: 1 - self.progress });
          },
          onLeave: function () { gsap.set(procSticky, { autoAlpha: 0 }); },
          onEnterBack: function (self) { gsap.set(procSticky, { autoAlpha: 1 - self.progress }); },
          onLeaveBack: function () { gsap.set(procSticky, { autoAlpha: 1 }); }
        });
      }

      return function () {
        clearScenes(steps, innerSel);
        nodes.forEach(function (n) { n.classList.remove('active'); });
        if (focus) focus.style.transform = '';
        if (num) {
          num.textContent = '01';
          num.style.opacity = '';
          num.style.visibility = '';
          num.style.transform = '';
        }
        if (kicker) gsap.set(kicker, { clearProps: 'opacity,visibility' });
        if (orbit) gsap.set(orbit, { clearProps: 'opacity,visibility' });
        resetDots(dots);
      };
    });
  }
})();
