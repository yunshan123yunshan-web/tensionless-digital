/**
 * Immersive Sections — Cinematic Scroll-Driven Scene Transitions
 *
 * Three pinned sections (Case Study, Testimonials, Process) that replace
 * vertical scrolling with viewport-contained scene transitions.
 *
 * Constraints:
 *  - No y-axis movement for scene transitions (opacity/autoAlpha/scale only)
 *  - No spillover — each section's last scene fades before next section enters
 *  - GPU-friendly transforms only (opacity, scale, translateX, clip-path)
 *
 * Improvements applied (2026-05-01):
 *  - Count-up animations fire independently from scrubbed timeline
 *  - Compressed pin heights (300/250/300vh) to reduce scroll fatigue
 *  - Scene progress dot indicators on all three sections
 *  - Distinct per-scene background atmosphere (gradients/color temp)
 *  - Enlarged process visual with more dramatic per-step state changes
 *  - Floating testimonial cards show different people than main quotes
 *  - Tighter transition spacing, less dead-scroll between scenes
 */

(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();

  /* ──────────────────────────────────────────────────────────────
     Shared Helpers
     ────────────────────────────────────────────────────────────── */

  function initScenes(scenes, activeIndex) {
    scenes.forEach(function (scene, i) {
      gsap.set(scene, { autoAlpha: i === activeIndex ? 1 : 0 });
    });
  }

  /**
   * One-shot count-up — runs independently of any scrubbed timeline.
   * Fires a self-contained tween that is NOT tied to scroll position.
   */
  function fireCountUp(selector) {
    var els = document.querySelectorAll(selector);
    els.forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-target') || '0');
      var suffix = el.getAttribute('data-suffix') || '';
      // Reset to 0
      el.textContent = '0' + (suffix === 'x' ? 'x' : suffix);
      var state = { value: 0 };
      gsap.to(state, {
        value: target,
        duration: 1.2,
        ease: 'expo.out',
        onUpdate: function () {
          if (suffix === 'x') {
            el.textContent = state.value.toFixed(1) + 'x';
          } else {
            el.textContent = Math.round(state.value) + suffix;
          }
        }
      });
    });
  }

  /**
   * Build scene progress dots inside a container.
   * Returns the dot elements array for timeline animation.
   */
  function buildProgressDots(container, count) {
    var frag = document.createDocumentFragment();
    var dots = [];
    for (var i = 0; i < count; i++) {
      var dot = document.createElement('span');
      dot.className = 'imm-dot';
      if (i === 0) dot.classList.add('active');
      dot.setAttribute('aria-hidden', 'true');
      frag.appendChild(dot);
      dots.push(dot);
    }
    container.appendChild(frag);
    return dots;
  }

  /**
   * Create a pinned-scroll GSAP timeline with standard config.
   * trigger — element that controls scroll distance
   * pin — element to pin during scroll
   */
  function createPinnedTimeline(trigger, pin) {
    return gsap.timeline({
      scrollTrigger: {
        trigger: trigger,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        pin: pin,
        pinSpacing: true,
        anticipatePin: 1
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     CASE STUDY — 4 scenes, 300vh pin
     ═══════════════════════════════════════════════════════════════ */
  mm.add('(min-width: 769px) and (prefers-reduced-motion: no-preference)', function () {
    var csWrap = document.querySelector('#case-study');
    var csSticky = document.querySelector('.cs-sticky');
    var csScenes = gsap.utils.toArray('.cs-scene');
    var csPanels = document.querySelectorAll('.cs-panel');
    var csDotBar = document.querySelector('.cs-dot-bar');
    var csCountFired = false;

    if (!csWrap || !csScenes.length) return;

    // Build progress dots
    var csDots = csDotBar ? buildProgressDots(csDotBar, 4) : [];

    // Set initial states
    initScenes(csScenes, 0);
    gsap.set(csScenes.slice(1), { scale: 0.93 });
    gsap.set(csPanels, { autoAlpha: 0, scale: 0.92 });
    gsap.set('.cs-scene-bg', { opacity: 1 });
    gsap.set('.cs-orb', { autoAlpha: 0.7 });

    var csTl = createPinnedTimeline(csWrap, csSticky);

    var DUR = 30;

    // ── Abstract orbs — shift position & color temp per scene ──
    // S1→S2: orb1 drifts right + dims, orb2 drifts down
    csTl.to('.cs-orb-1', { x: 60, scale: 1.1, autoAlpha: 0.45, duration: 8, ease: 'power2.inOut' }, 3);
    csTl.to('.cs-orb-2', { y: 40, scale: 1.05, autoAlpha: 0.55, duration: 8, ease: 'power2.inOut' }, 3);
    // S2→S3: orb1 shifts blue-ish (done via bg), orb2 expands
    csTl.to('.cs-orb-1', { x: 100, scale: 1.3, duration: 8, ease: 'power2.inOut' }, 11);
    csTl.to('.cs-orb-2', { x: -30, y: 60, scale: 1.2, autoAlpha: 0.65, duration: 8, ease: 'power2.inOut' }, 11);
    // S3→S4: both orbs brighten and converge
    csTl.to('.cs-orb-1', { x: 40, scale: 1.15, autoAlpha: 0.7, duration: 8, ease: 'power2.inOut' }, 18);
    csTl.to('.cs-orb-2', { x: 0, y: 20, scale: 1.1, autoAlpha: 0.75, duration: 8, ease: 'power2.inOut' }, 18);

    // ── Background atmosphere shifts ──
    csTl.to('.cs-s1 .cs-scene-bg', { opacity: 0.4, duration: 3, ease: 'power2.inOut' }, 4);

    // ── Scene 01 → 02 (positions 5–6.5) ──
    csTl.to('.cs-s1', { autoAlpha: 0, duration: 0.8, ease: 'power2.inOut' }, 5)
       .to('.cs-s2', { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power3.out' }, 5.15);

    // ── S2 stat badge reveal ──
    csTl.fromTo('.cs-stat-badge', { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'power3.out' }, 5.8);

    // ── Scene 02 → 03 (positions 12–13.5) ──
    csTl.to('.cs-s2', { autoAlpha: 0, duration: 0.8, ease: 'power2.inOut' }, 12)
       .to('.cs-s3', { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power3.out' }, 12.15);

    // ── S3 panels slide in from sides ──
    csTl.fromTo('.cs-panel-l', { autoAlpha: 0, x: -40, scale: 0.93 }, { autoAlpha: 1, x: 0, scale: 1, duration: 1, stagger: 0.12, ease: 'power3.out' }, 12.8);
    csTl.fromTo('.cs-panel-r', { autoAlpha: 0, x: 40, scale: 0.93 },  { autoAlpha: 1, x: 0, scale: 1, duration: 1, stagger: 0.12, ease: 'power3.out' }, 12.8);

    // ── Scene 03 → 04 (positions 19–20.5) ──
    csTl.to('.cs-s3', { autoAlpha: 0, duration: 0.8, ease: 'power2.inOut' }, 19)
       .to('.cs-s4', { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power3.out' }, 19.15);

    // ── S4 count-up — fires independently (not scrubbed) ──
    csTl.call(function () {
      if (!csCountFired) {
        csCountFired = true;
        fireCountUp('.count-imm');
      }
    }, null, 19.5);
    // Reset flag when scrolling back before S4
    csTl.call(function () { csCountFired = false; }, null, 12);

    // ── Scene progress dots ──
    if (csDots.length) {
      var setActiveDot = function (idx) {
        csDots.forEach(function (d) { d.classList.remove('active'); });
        csDots[idx] && csDots[idx].classList.add('active');
      };
      csTl.call(function () { setActiveDot(1); }, null, 5.5);
      csTl.call(function () { setActiveDot(2); }, null, 12.5);
      csTl.call(function () { setActiveDot(3); }, null, 19.5);
    }

    // ── Final fade-out (positions 27–28) ──
    csTl.to('.cs-s4', { autoAlpha: 0, duration: 1, ease: 'expo.out' }, 27)
       .to('.cs-scene-bg', { opacity: 0, duration: 1, ease: 'expo.out' }, 27);

    // Extend
    csTl.to({}, { duration: 0.01 }, DUR);

    return function () {
      csTl.scrollTrigger && csTl.scrollTrigger.kill(true, true, true);
      csTl.kill();
      gsap.set(csScenes, { clearProps: 'opacity,visibility' });
      gsap.set(csPanels, { clearProps: 'opacity,transform,visibility' });
      gsap.set('.cs-scene-bg', { clearProps: 'opacity' });
      gsap.set('.cs-stat-badge', { clearProps: 'opacity,transform' });
      gsap.set('.cs-orb', { clearProps: 'opacity,transform' });
      if (csDots.length) {
        csDots.forEach(function (d) { d.className = 'imm-dot'; });
        csDots[0] && csDots[0].classList.add('active');
      }
    };
  });

  /* ═══════════════════════════════════════════════════════════════
     TESTIMONIALS — 3 quotes + 8 drifting background cards, 250vh pin
     ═══════════════════════════════════════════════════════════════ */
  mm.add('(min-width: 769px) and (prefers-reduced-motion: no-preference)', function () {
    var testiWrap = document.querySelector('#testimonials-imm');
    var testiSticky = document.querySelector('.testi-sticky');
    var testiMs = gsap.utils.toArray('.testi-ms');
    var testiTrust = document.querySelector('.testi-trust');
    var testiDotBar = document.querySelector('.testi-dot-bar');

    if (!testiWrap || !testiMs.length) return;

    var testiDots = testiDotBar ? buildProgressDots(testiDotBar, 4) : [];

    // ── Main testimonial scene transitions ──
    initScenes(testiMs, 0);
    gsap.set(testiMs.slice(1), { scale: 0.94 });
    gsap.set(testiTrust, { autoAlpha: 0 });

    var testiTl = createPinnedTimeline(testiWrap, testiSticky);

    var TDUR = 25;

    // ── Quote 0 → 1 (positions 5.5–7) ──
    testiTl.to('.testi-ms-0', { autoAlpha: 0, duration: 0.8, ease: 'power2.inOut' }, 5.5)
            .to('.testi-ms-1', { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power3.out' }, 5.7);

    // ── Quote 1 → 2 (positions 13–14.5) ──
    testiTl.to('.testi-ms-1', { autoAlpha: 0, duration: 0.8, ease: 'power2.inOut' }, 13)
            .to('.testi-ms-2', { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power3.out' }, 13.2);

    // ── Progress dots ──
    if (testiDots.length) {
      var setTestiDot = function (idx) {
        testiDots.forEach(function (d) { d.classList.remove('active'); });
        testiDots[idx] && testiDots[idx].classList.add('active');
      };
      testiTl.call(function () { setTestiDot(1); }, null, 6);
      testiTl.call(function () { setTestiDot(2); }, null, 13.5);
    }

    // ── Trust statement fades in (position 18) ──
    testiTl.to(testiTrust, { autoAlpha: 1, duration: 1.2, ease: 'power2.out' }, 18);
    if (testiDots.length) {
      testiTl.call(function () {
        testiDots.forEach(function (d) { d.classList.remove('active'); });
        testiDots[3] && testiDots[3].classList.add('active');
      }, null, 18);
    }

    // ── Final fade-out (positions 22.5–23.5) ──
    testiTl.to('.testi-ms-2', { autoAlpha: 0, duration: 0.8, ease: 'expo.out' }, 22.5)
            .to(testiTrust, { autoAlpha: 0, duration: 0.5, ease: 'power2.inOut' }, 22.5);

    testiTl.to({}, { duration: 0.01 }, TDUR);

    return function () {
      testiTl.scrollTrigger && testiTl.scrollTrigger.kill(true, true, true);
      testiTl.kill();
      gsap.set(testiMs, { clearProps: 'opacity,visibility' });
      gsap.set(testiTrust, { clearProps: 'opacity,visibility' });
      if (testiDots.length) {
        testiDots.forEach(function (d) { d.className = 'imm-dot'; });
        testiDots[0] && testiDots[0].classList.add('active');
      }
    };
  });

  /* ═══════════════════════════════════════════════════════════════
     PROCESS — 5 steps + progress rail + enlarged visual, 300vh pin
     ═══════════════════════════════════════════════════════════════ */
  mm.add('(min-width: 769px) and (prefers-reduced-motion: no-preference)', function () {
    var procWrap = document.querySelector('#process-imm');
    var procSticky = document.querySelector('.proc-sticky');
    var procSteps = gsap.utils.toArray('.proc-step');
    var procNum = document.querySelector('.proc-num');
    var procRailFill = document.querySelector('.proc-rail-fill');
    var procDotBar = document.querySelector('.proc-dot-bar');

    if (!procWrap || !procSteps.length) return;

    var procDots = procDotBar ? buildProgressDots(procDotBar, 5) : [];

    // Set initial states
    initScenes(procSteps, 0);
    gsap.set(procSteps.slice(1), { scale: 0.95 });

    var procTl = createPinnedTimeline(procWrap, procSticky);

    var PDUR = 30;

    // Step definitions: { num, fadeIn, fadeOut, railPct }
    var steps = [
      { num: '01', fadeIn: 0,    fadeOut: 4.5 },
      { num: '02', fadeIn: 4.7,  fadeOut: 9.5 },
      { num: '03', fadeIn: 9.7,  fadeOut: 14.5 },
      { num: '04', fadeIn: 14.7, fadeOut: 19.5 },
      { num: '05', fadeIn: 19.7, fadeOut: 26 }
    ];

    // ── Build step transitions ──
    steps.forEach(function (step, i) {
      var sel = '.proc-step[data-step="' + (i + 1) + '"]';

      // Fade in this step (scale 0.95→1 for dynamic entry)
      procTl.to(sel, { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'power3.out' }, step.fadeIn);

      // Update step number
      procTl.call(function () {
        if (procNum) procNum.textContent = step.num;
      }, null, step.fadeIn);

      // Fade out (except last step)
      if (i < steps.length - 1) {
        procTl.to(sel, { autoAlpha: 0, duration: 0.7, ease: 'power2.inOut' }, step.fadeOut);
      }
    });

    // ── Rail fill progression ──
    procTl.to(procRailFill, { height: '20%', duration: 0.8, ease: 'power2.inOut' }, 0)
           .to(procRailFill, { height: '40%', duration: 0.8, ease: 'power2.inOut' }, 4.5)
           .to(procRailFill, { height: '60%', duration: 0.8, ease: 'power2.inOut' }, 9.5)
           .to(procRailFill, { height: '80%', duration: 0.8, ease: 'power2.inOut' }, 14.5)
           .to(procRailFill, { height: '100%', duration: 0.8, ease: 'power2.inOut' }, 19.5);

    // ── Progress dots ──
    if (procDots.length) {
      var setProcDot = function (idx) {
        procDots.forEach(function (d) { d.classList.remove('active'); });
        procDots[idx] && procDots[idx].classList.add('active');
      };
      steps.forEach(function (step, i) {
        procTl.call(function () { setProcDot(i); }, null, step.fadeIn);
      });
    }

    // ── Final fade-out of step 5 (position 26–27) ──
    procTl.to('.proc-step[data-step="5"]', { autoAlpha: 0, duration: 0.8, ease: 'expo.out' }, 26);

    procTl.to({}, { duration: 0.01 }, PDUR);

    return function () {
      procTl.scrollTrigger && procTl.scrollTrigger.kill(true, true, true);
      procTl.kill();
      gsap.set(procSteps, { clearProps: 'opacity,visibility' });
      if (procRailFill) gsap.set(procRailFill, { clearProps: 'height' });
      if (procDots.length) {
        procDots.forEach(function (d) { d.className = 'imm-dot'; });
        procDots[0] && procDots[0].classList.add('active');
      }
    };
  });

})();
