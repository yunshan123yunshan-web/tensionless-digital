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
      slides.forEach(function (slide) {
        gsap.set(slide.querySelectorAll(innerSel), { autoAlpha: 0 });
      });
      gsap.set(track, { xPercent: 0 });

      var dots = buildProgressDots(csWrap.querySelector('.cs-dot-bar'), slides.length);
      var indexNum = csWrap.querySelector('.cs-index-num');

      entranceTimeline(csWrap, function (tl) {
        tl.to(slides[0].querySelectorAll(innerSel), { autoAlpha: 1, duration: 0.7, stagger: 0.1 }, 0)
          .call(scrambleKicker(csWrap), null, 0.2)
          .call(function () { countOnce(slides[0]); }, null, 0.6);
      });

      // Slide centers along the pin. One master tween drives the pan and
      // syncs dots/counters from its own progress — .call at exact tween
      // boundaries does not fire when the scrub rests there, so sync lives
      // in onUpdate instead (holds correctly in both scroll directions).
      var DUR = 30;
      var CENTER = [2, 9, 16, 23];
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

      // Last slide fades out before the next section enters.
      tl.to(slides[slides.length - 1], { autoAlpha: 0, duration: 0.8, ease: 'power1.inOut' }, DUR - 0.8);

      return function () {
        clearScenes(slides, innerSel);
        gsap.set(track, { clearProps: 'xPercent' });
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
          { autoAlpha: 1, duration: 0.7, stagger: 0.15 }, 0)
          .call(scrambleKicker(testiWrap), null, 0.2);
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

  /* ── PROCESS — orbital ring ─────────────────────────────────────── */

  var procWrap = document.getElementById('process-imm');
  var procSticky = procWrap && procWrap.querySelector('.imm-sticky');
  if (procWrap && procSticky) {
    mm.add(DESKTOP, function () {
      var steps = Array.prototype.slice.call(procWrap.querySelectorAll('.proc-step'));
      var nodes = Array.prototype.slice.call(procWrap.querySelectorAll('.proc-node-ring'));
      var focus = procWrap.querySelector('.proc-focus');
      var num = procWrap.querySelector('.proc-num');
      if (steps.length < 5) return;

      var innerSel = '.proc-step-label, .proc-step-name, .proc-step-desc';
      steps.forEach(function (step) {
        gsap.set(step.querySelectorAll(innerSel), { autoAlpha: 0 });
      });
      gsap.set(steps.slice(1), { autoAlpha: 0 });
      if (focus) gsap.set(focus, { rotation: 0 });

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

      entranceTimeline(procWrap, function (tl) {
        tl.to(steps[0].querySelectorAll(innerSel),
          { autoAlpha: 1, duration: 0.6, stagger: 0.1 }, 0)
          .call(scrambleKicker(procWrap), null, 0.2);
      });

      var DUR = 30;
      var SEG = [
        { at: 3, step: 0 },
        { at: 8.5, step: 1 },
        { at: 14, step: 2 },
        { at: 19.5, step: 3 },
        { at: 25, step: 4 }
      ];

      var tl = createPinnedTimeline(procWrap, procSticky);
      tl.set(steps[0], { autoAlpha: 1 }, 0);
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

      function syncProcess() {
        var u = drive.u * DUR;
        var idx = 0;
        for (var i = 0; i < SEG.length; i += 1) { if (u >= SEG[i].at) idx = i; }
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

      // Last step + numeral fade out before CTA.
      tl.to(steps[steps.length - 1], { autoAlpha: 0, duration: 0.8, ease: 'power1.inOut' }, DUR - 0.8);
      if (num) tl.to(num, { autoAlpha: 0, duration: 0.6, ease: 'power1.inOut' }, DUR - 0.6);

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
        resetDots(dots);
      };
    });
  }
})();
