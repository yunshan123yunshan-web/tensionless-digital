/**
 * Hero — Chrome-Shader Boot + Masked Headline Reveal + Scroll Fade-Out
 *
 * Sequence (desktop, full motion):
 *  1. WebGL chrome shader starts behind the boot veil.
 *  2. #boot "system calibration": the three logo strokes draw in, then the four
 *     boot lines scramble to their final copy, the mono footer fades, and the
 *     veil crossfades away (≤2s, skippable on scroll/click).
 *  3. Headline: three masked rows slide up from their clips with a stagger;
 *     eyebrow (scramble reveal), sub, actions, and scroll-hint fade in.
 *  4. Scrub fade-out: pure autoAlpha as the hero leaves (hard rule). The shader
 *     "fracture" ramps with the same progress, and the eyebrow re-scrambles to
 *     dissolve the composition.
 *
 * Reduced motion (.rm): boot hidden, masked rows stay fully visible, opacity-only
 * scrub fade still runs. Low LOD: shader init no-ops (CSS gradient fallback).
 */

(function () {
  'use strict';

  var docEl = document.documentElement;
  var rm = docEl.classList.contains('rm');
  var boot = document.getElementById('boot');

  if (!window.gsap || !window.ScrollTrigger) {
    if (boot) boot.style.display = 'none';
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  var FADE_TARGETS = '.hero-inner, .hero-scrollhint, .hud, .hud-cross';

  // WebGL chrome background — null on reduced-motion / lod-low / no WebGL.
  var chrome = null;
  if (window.tdChrome) chrome = window.tdChrome.init();

  // Hero scroll fade-out — opacity only, works in every mode.
  var exitScrambled = false;
  ScrollTrigger.create({
    trigger: '#hero-pin',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: function (self) {
      gsap.set(FADE_TARGETS, { autoAlpha: 1 - self.progress });
      if (chrome) chrome.setFracture(self.progress * 1.15);
      if (!exitScrambled && self.progress > 0.22 && !rm) {
        exitScrambled = true;
        var eyb = document.querySelector('.hero-eyebrow');
        if (eyb && window.tdScramble) window.tdScramble(eyb, { duration: 900 }).start();
      }
    }
  });

  // HUD telemetry — crosshair tracking + jittering readouts (moved from liquid.js).
  initHud();

  if (rm) {
    if (boot) boot.style.display = 'none';
    return;
  }

  // Initial states — rows hidden inside their clips, companions hidden.
  gsap.set('.hero-h1 .in', { autoAlpha: 0, yPercent: 110 });
  gsap.set(['.hero-eyebrow', '.hero-sub', '.hero-actions', '.hero-scrollhint'], { autoAlpha: 0 });

  // Prep the SVG stroke draw-in.
  var strokes = [].slice.call(document.querySelectorAll('.boot-stroke'));
  strokes.forEach(function (p) {
    var len = p.getTotalLength ? p.getTotalLength() : 220;
    p.setAttribute('stroke-dasharray', len);
    p.setAttribute('stroke-dashoffset', len);
  });

  // Boot line scramblers.
  var lineEls = [].slice.call(document.querySelectorAll('.boot-line'));
  var lineScr = lineEls.map(function (el) {
    return window.tdScramble ? window.tdScramble(el, { duration: 700 }) : null;
  });
  var eyebrowEl = document.querySelector('.hero-eyebrow');
  var eyebrowScr = eyebrowEl && window.tdScramble ? window.tdScramble(eyebrowEl, { duration: 700 }) : null;

  var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  // Boot — strokes draw in.
  tl.to('.boot-stroke', { strokeDashoffset: 0, duration: 0.5, ease: 'power2.inOut', stagger: 0.2 }, 0);

  // Boot lines appear then scramble, bottom-up stagger.
  lineEls.forEach(function (el, i) {
    var at = 0.08 + i * 0.3;
    tl.set(el, { autoAlpha: 1 }, at);
    if (lineScr[i]) tl.call(lineScr[i].start, [], at);
  });

  tl.to('.boot-mono', { autoAlpha: 1, duration: 0.5 }, 1.2);

  // Veil lift — pure crossfade (hard rule: no vertical movement).
  tl.to('#boot', { autoAlpha: 0, duration: 0.5, ease: 'power2.inOut' }, 1.55);
  tl.set('#boot', { display: 'none' }, 2.05);

  // Shader intensity ramps as the headline reaches full opacity.
  tl.to({ v: 0.15 }, {
    v: 1, duration: 1.8, ease: 'power1.out',
    onUpdate: function () { if (chrome) chrome.setIntensity(this.targets()[0].v); }
  }, 1.5);

  // Headline reveal — overlaps the veil lift for a seamless scene cut.
  tl.to('.hero-h1 .in', { autoAlpha: 1, yPercent: 0, duration: 1.0, stagger: 0.15, ease: 'power4.out' }, 1.6)
    .to('.hero-eyebrow', { autoAlpha: 1, duration: 0.6 }, 1.65)
    .to('.hero-sub', { autoAlpha: 1, duration: 0.6 }, 1.9)
    .to('.hero-actions', { autoAlpha: 1, duration: 0.6 }, 2.05)
    .to('.hero-scrollhint', { autoAlpha: 1, duration: 0.9, ease: 'power1.out' }, 2.3);
  if (eyebrowScr) tl.call(eyebrowScr.start, [], 1.68);

  // Skippable — scroll or click jumps the calibration straight to the end.
  var skipped = false;
  function skip() {
    if (skipped) return;
    if (boot && boot.style.display === 'none') return;
    skipped = true;
    window.removeEventListener('scroll', skip, { passive: true });
    window.removeEventListener('click', skip);
    tl.progress(1);
  }
  window.addEventListener('scroll', skip, { passive: true });
  window.addEventListener('click', skip);

  // Safety: the veil always lifts by ~2.1s even if something stalls.
  setTimeout(function () {
    if (!skipped && boot && boot.style.display !== 'none') skip();
  }, 2300);

  // HUD telemetry.
  function initHud() {
    var cross = document.getElementById('hud-cross');
    var coord = document.getElementById('hud-coord');
    if (cross && !rm) {
      document.addEventListener('mousemove', function (e) {
        cross.style.left = e.clientX + 'px';
        cross.style.top = e.clientY + 'px';
        if (coord) coord.textContent = 'x ' + e.clientX + ' — y ' + e.clientY;
      });
    }
    var base = { camp: 120, roas: 58.2, ctr: 4.7 };
    function jitter() {
      function set(id, txt) { var e = document.getElementById(id); if (e) e.textContent = txt; }
      set('hud-camp', String(Math.round(base.camp + (Math.random() * 2 - 1) * 3)));
      set('hud-roas', (base.roas + (Math.random() * 2 - 1) * 0.4).toFixed(1) + 'x');
      set('hud-ctr', (base.ctr + (Math.random() * 2 - 1) * 0.2).toFixed(2) + '%');
    }
    jitter();
    if (!rm) setInterval(jitter, 1500);
  }
})();
