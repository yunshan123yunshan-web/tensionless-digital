/**
 * Immersive Sections — Pinned Cinematic Scene Transitions
 *
 * Three pinned sections (Case Study, Testimonials, Process) driven by
 * scroll-scrubbed timelines inside gsap.matchMedia — desktop only, no
 * reduced-motion. Every scene change is a pure crossfade (autoAlpha +
 * subtle scale). No y translation, per the site's hard rule.
 *
 * Each section gets a short non-scrubbed "entrance" reveal (trigger
 * 'top 90%') so its first scene is already composed as it approaches the
 * pin; the pinned timeline then owns the crossfades. Scene inner content
 * is pre-hidden and re-staged so reveals read as mask/fade staggers, not a
 * flat fade of the whole frame.
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
        end: 'bottom bottom',
        scrub: 1,
        pin: pin,
        pinSpacing: true,
        anticipatePin: 1
      }
    });
  }

  function entranceTimeline(trigger, add) {
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: trigger,
        start: 'top 90%',
        toggleActions: 'play none none none'
      }
    });
    add(tl);
    return tl;
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

  /* ── CASE STUDY — 4 scenes ──────────────────────────────────────── */

  var csWrap = document.getElementById('case-study');
  var csSticky = csWrap && csWrap.querySelector('.imm-sticky');
  if (csWrap && csSticky) {
    mm.add(DESKTOP, function () {
      var scenes = Array.prototype.slice.call(csWrap.querySelectorAll('.cs-scene'));
      if (scenes.length < 4) return;
      var s1 = scenes[0];

      // Pre-stage: hide inner content; back scenes 2-4 down slightly so the
      // crossfade-in reads as an approach.
      scenes.forEach(function (scene) {
        gsap.set(scene.querySelectorAll('.cs-label, .cs-head, .cs-body, .cs-stat, .cs-panel'), { autoAlpha: 0 });
      });
      gsap.set(scenes.slice(1), { scale: 1.04 });

      var dots = buildProgressDots(csWrap.querySelector('.cs-dot-bar'), scenes.length);

      entranceTimeline(csWrap, function (tl) {
        tl.to(s1.querySelectorAll('.cs-label, .cs-head, .cs-body'), { autoAlpha: 1, duration: 0.7, stagger: 0.12 }, 0)
          .to(s1.querySelectorAll('.cs-stat'), { autoAlpha: 1, duration: 0.5, stagger: 0.1 }, 0.35)
          .to(s1.querySelectorAll('.cs-panel'), { autoAlpha: 1, duration: 0.5, stagger: 0.1 }, 0.6)
          .call(function () { countOnce(s1); }, null, 0.5);
      });

      var DUR = 28;
      var tl = createPinnedTimeline(csWrap, csSticky);
      tl.set(s1, { autoAlpha: 1, scale: 1 }, 0);

      [4.5, 10.5, 16.5].forEach(function (at, idx) {
        var out = scenes[idx];
        var inn = scenes[idx + 1];
        tl.to(out, { autoAlpha: 0, scale: 0.98, duration: 0.8, ease: 'power1.inOut' }, at)
          .to(inn, { autoAlpha: 1, scale: 1, duration: 0.8, ease: 'power1.inOut' }, at + 0.8)
          .fromTo(inn.querySelectorAll('.cs-label, .cs-head, .cs-body'),
            { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, stagger: 0.12 }, at + 1.0)
          .fromTo(inn.querySelectorAll('.cs-stat'),
            { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, stagger: 0.1 }, at + 1.3)
          .fromTo(inn.querySelectorAll('.cs-panel'),
            { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, stagger: 0.12 }, at + 1.55)
          .call(setDot, [dots, idx + 1], at + 0.9)
          .call(countOnce, [inn], at + 1.4);
      });

      // Last scene fades out before the next section enters.
      tl.to(scenes[3], { autoAlpha: 0, scale: 0.98, duration: 0.8, ease: 'power1.inOut' }, DUR - 0.8);

      return function () {
        clearScenes(scenes, '.cs-label, .cs-head, .cs-body, .cs-stat, .cs-panel');
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

      scenes.forEach(function (scene) {
        gsap.set(scene.querySelectorAll('.testi-glyph, .testi-quote, .testi-author'), { autoAlpha: 0 });
      });
      gsap.set([s2, s3], { scale: 1.04 });
      if (trust && trustInner.length) {
        gsap.set(trustInner, { autoAlpha: 0 });
      }

      var dots = buildProgressDots(testiWrap.querySelector('.testi-dot-bar'), 4);

      entranceTimeline(testiWrap, function (tl) {
        tl.to(s1.querySelectorAll('.testi-glyph, .testi-quote, .testi-author'),
          { autoAlpha: 1, duration: 0.7, stagger: 0.15 }, 0);
      });

      var DUR = 25;
      var tl = createPinnedTimeline(testiWrap, testiSticky);
      tl.set(s1, { autoAlpha: 1, scale: 1 }, 0);

      [[s1, s2, 5], [s2, s3, 10.5]].forEach(function (pair, idx) {
        var out = pair[0], inn = pair[1], at = pair[2];
        tl.to(out, { autoAlpha: 0, scale: 0.98, duration: 0.8, ease: 'power1.inOut' }, at)
          .to(inn, { autoAlpha: 1, scale: 1, duration: 0.8, ease: 'power1.inOut' }, at + 0.8)
          .fromTo(inn.querySelectorAll('.testi-glyph, .testi-quote, .testi-author'),
            { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, stagger: 0.14 }, at + 1.0)
          .call(setDot, [dots, idx + 1], at + 0.9);
      });

      if (trust && trustInner.length) {
        tl.to(s3, { autoAlpha: 0, scale: 0.98, duration: 0.8, ease: 'power1.inOut' }, 15.5)
          .fromTo(trustInner, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, stagger: 0.15 }, 16.3)
          .call(setDot, [dots, 3], 16.4)
          .to(trust, { autoAlpha: 0, duration: 0.8, ease: 'power1.inOut' }, DUR - 0.8);
      } else {
        tl.to(s3, { autoAlpha: 0, scale: 0.98, duration: 0.8, ease: 'power1.inOut' }, DUR - 0.8);
      }

      return function () {
        clearScenes(scenes, '.testi-glyph, .testi-quote, .testi-author');
        if (trust && trustInner.length) {
          gsap.set(trust, { clearProps: 'opacity,visibility' });
          gsap.set(trustInner, { clearProps: 'opacity,visibility' });
        }
        resetDots(dots);
      };
    });
  }

  /* ── PROCESS — 5 steps + scroll-filled rail ─────────────────────── */

  var procWrap = document.getElementById('process-imm');
  var procSticky = procWrap && procWrap.querySelector('.imm-sticky');
  if (procWrap && procSticky) {
    mm.add(DESKTOP, function () {
      var steps = Array.prototype.slice.call(procWrap.querySelectorAll('.proc-step'));
      var railFill = procWrap.querySelector('.proc-rail-fill');
      var nodes = Array.prototype.slice.call(procWrap.querySelectorAll('.proc-node'));
      var num = procWrap.querySelector('.proc-num');
      if (!steps.length || !railFill) return;

      steps.forEach(function (step) {
        gsap.set(step.querySelectorAll('.proc-step-name, .proc-step-desc'), { autoAlpha: 0 });
      });
      gsap.set(steps.slice(1), { autoAlpha: 0 });

      var dots = buildProgressDots(procWrap.querySelector('.proc-dot-bar'), steps.length);

      function setActiveStep(index) {
        nodes.forEach(function (node, i) { node.classList.toggle('lit', i === index); });
        setDot(dots, index);
        if (num) {
          num.textContent = '0' + (index + 1);
          gsap.fromTo(num, { autoAlpha: 0.2, scale: 0.96 },
            { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power2.out' });
        }
      }

      entranceTimeline(procWrap, function (tl) {
        tl.to(steps[0].querySelectorAll('.proc-step-name, .proc-step-desc'),
          { autoAlpha: 1, duration: 0.6, stagger: 0.12 }, 0);
      });

      var DUR = 30;
      var SEG = [
        { at: 3, rail: 20 },
        { at: 8.5, rail: 40 },
        { at: 14, rail: 60 },
        { at: 19.5, rail: 80 },
        { at: 25, rail: 100 }
      ];

      var tl = createPinnedTimeline(procWrap, procSticky);
      tl.set(steps[0], { autoAlpha: 1 }, 0);
      setActiveStep(0);
      tl.call(setActiveStep, [0], 0);

      // Rail fills continuously across the whole pin.
      var prev = 0;
      SEG.forEach(function (seg) {
        tl.to(railFill, { height: seg.rail + '%', duration: seg.at - prev, ease: 'none' }, prev);
        prev = seg.at;
      });

      // Step crossfades + node/number sync.
      SEG.forEach(function (seg, idx) {
        tl.call(setActiveStep, [idx], seg.at);
        if (idx > 0) {
          var prevStep = steps[idx - 1];
          var curr = steps[idx];
          tl.to(prevStep, { autoAlpha: 0, duration: 0.7, ease: 'power1.inOut' }, seg.at)
            .to(curr, { autoAlpha: 1, duration: 0.7, ease: 'power1.inOut' }, seg.at + 0.7)
            .fromTo(curr.querySelectorAll('.proc-step-name, .proc-step-desc'),
              { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, stagger: 0.1 }, seg.at + 0.9);
        }
      });

      // Last step + numeral fade out before CTA.
      tl.to(steps[steps.length - 1], { autoAlpha: 0, duration: 0.8, ease: 'power1.inOut' }, DUR - 0.8);
      if (num) tl.to(num, { autoAlpha: 0, duration: 0.6, ease: 'power1.inOut' }, DUR - 0.6);

      return function () {
        clearScenes(steps, '.proc-step-name, .proc-step-desc');
        if (railFill) railFill.style.height = '';
        nodes.forEach(function (n) { n.classList.remove('lit'); });
        if (num) {
          num.textContent = '01';
          num.style.opacity = '';
          num.style.visibility = '';
          num.style.transform = '';
        }
        resetDots(dots);
      };
    });
  }
})();
