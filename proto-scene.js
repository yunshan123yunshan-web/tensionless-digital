/* CHAOS → CHOREOGRAPHY. One fictional campaign (Moss & Mortar) suspended in
   chaos; "Make it work together" coordinates it into ad → landing page →
   enquiry with a short sequence of distinct actions. Positions are % of the
   stage; widths are fixed per layout so card heights stay predictable.
   Depends on proto-core.js (window.TD). */
(function () {
  'use strict';
  var TD = window.TD || { reduced: true };
  var reduced = TD.reduced || !window.gsap;
  var scene = document.getElementById('services'), stage = document.getElementById('stage');
  if (!scene || !stage) return;

  var KEYS = ['search', 'seo', 'ad', 'lp', 'enq', 'infl', 'swatch', 'sticker', 'cursor'];
  var art = {};
  KEYS.forEach(function (k) { art[k] = stage.querySelector('[data-k="' + k + '"]'); });
  var floats = {}; KEYS.forEach(function (k) { floats[k] = art[k].querySelector('.float'); });
  var world = document.getElementById('world');

  /* [left%, top%, rotation, scaleX, scaleY, z]; widths in % of stage width */
  var LAYOUT = {
    desk: {
      /* stage aspect 1.36 → card height % of stage = width% × 1.36 × (card h/w) */
      width: { search: 25, seo: 21, ad: 17, lp: 46, enq: 24, infl: 21, swatch: 10, sticker: 8, cursor: 3.2 },
      /* disconnected: opposing angles, clashing scale (search oversized, page undersized), the
         inflatable crushed flat between the ad and the page, which both press over it */
      chaos: { search: [62, 1, 12, .95, .95, 6], seo: [2, 5, -10, .95, .95, 3], ad: [4, 50, -14, 1, 1, 5], lp: [33, 29, 4, 1, 1, 9], enq: [70, 72, 12, 1, 1, 8],
        infl: [16, 60, 6, .46, 1.16, 4], swatch: [92, 40, -18, 1, 1, 2], sticker: [91, 10, 20, 1, 1, 2], cursor: [82, 84, 140, .9, .9, 10] }
    },
    mob: {
      /* stage aspect .73 → card height % = width% × .73 × (card h/w). Cards keep their size; the
         stack overlaps more (page tucks under the ad's footer, enquiry onto the page) so it is shorter */
      /* v13: a wider phone stage (aspect 1.15) so the whole section fits one screen */
      width: { search: 46, seo: 42, ad: 28, lp: 74, enq: 44, infl: 26, swatch: 15, sticker: 13, cursor: 6 },
      chaos: { search: [-8, 0, -12, 1, 1, 6], seo: [56, -2, 9, .95, .95, 3], ad: [72, 34, 14, 1, 1, 5], lp: [10, 24, -4, 1, 1, 9], enq: [40, 72, -12, 1, 1, 8],
        infl: [31, 2, 8, .46, 1.14, 4], swatch: [84, 72, 18, 1, 1, 2], sticker: [-3, 76, -16, 1, 1, 2], cursor: [80, 86, 140, 1, 1, 10] }
    }
  };
  /* DEPTH, the pieces live in a shallow 3D space. Disconnected: scattered in depth, each on its
     own tilt (search nearest; the page far back and angled; the inflatable trapped between the ad
     in front and the page behind). Aligned: everything on ONE plane, facing you. Inside a 3D
     context z-index no longer orders siblings, so the aligned plane uses tiny z offsets instead.
     [translateZ px, rotationX, rotationY, shadow lift 0–1] */
  var DEPTH = {
    chaos: { search: [40, -8, -14, .6], seo: [10, 8, 16, .5], ad: [50, 6, 18, .6], lp: [70, 2, -8, 1], enq: [190, -6, 6, .7],
      infl: [80, 0, 0, 0], swatch: [-220, 10, 25, .1], sticker: [-160, 0, 0, .2], cursor: [200, 0, 0, .9] }
  };

  /* ALIGNED: the selected service's piece takes the centre, big and forward; the other four
     pieces sit in the corners, smaller and set back; the small props fill the gaps. Every
     service has its own arrangement, so switching services reshuffles the whole board.
     Slots are in stage-width units (x 0–100, y 0–stage height); widths in % of stage width. */
  var RATIO = { search: .62, seo: .62, ad: 1.42, lp: .78, enq: .5, infl: 1, swatch: 1, sticker: 1 };
  var SLOTS = {
    /* desktop: the headline now sits above the stage, so all four corners are free */
    desk: { c: [50, 33], corners: { tl: [12, 13], tr: [88, 13], bl: [12, 47], br: [88, 49] },
      big: { lp: 48, search: 38, seo: 38, ad: 24 }, small: { lp: 26, search: 25, seo: 25, ad: 14, enq: 24 },
      decor: { lm: [33, 56], rm: [88, 31], tc: [50, 5], bc: [64, 57] }, dw: { infl: 14, swatch: 10, sticker: 8 } },
    /* phones: the chosen piece large on top, the other four as a row of thumbnails underneath */
    mob: { c: [50, 36], corners: { tl: [13, 76], tr: [38, 78], bl: [63, 76], br: [87, 78] },
      big: { lp: 64, search: 58, seo: 56, ad: 34 }, small: { lp: 22, search: 22, seo: 22, ad: 13, enq: 22 },
      decor: { lm: [8, 40], rm: [92, 40], tc: [8, 9], bc: [92, 9] }, dw: { infl: 15, swatch: 12, sticker: 12 } }
  };
  /* per focus: which corner each other piece takes, which gap each prop takes (and its tilt) */
  var ARRANGE = {
    lp:     { corners: { search: 'tl', ad: 'bl', seo: 'tr', enq: 'br' }, decor: { infl: ['rm', -8], swatch: ['lm', 8], sticker: ['bc', -10] } },
    search: { corners: { seo: 'tl', ad: 'bl', enq: 'tr', lp: 'br' }, decor: { infl: ['bc', -6], swatch: ['lm', 10], sticker: ['tc', 12] } },
    ad:     { corners: { search: 'tl', seo: 'bl', lp: 'tr', enq: 'br' }, decor: { infl: ['lm', 10], swatch: ['tc', -6], sticker: ['rm', -12] } },
    seo:    { corners: { enq: 'tl', lp: 'bl', search: 'tr', ad: 'br' }, decor: { infl: ['rm', -8], swatch: ['bc', 6], sticker: ['lm', 10] } }
  };
  var DECOR_Z = { infl: -60, swatch: -50, sticker: 10 };
  /* desktop pictures a size up in the scattered state: each card grows about its own centre.
     The aligned grid has no spare room (a bigger centre piece covers the corners), so it keeps its sizes. */
  var GROW = { desk: 1.18, mob: 1 };
  var focusKey = 'lp';
  var mode = 'desk', state = 'chaos', tl = null, shuffle = null;
  function pickMode() { return matchMedia('(max-width: 899px)').matches ? 'mob' : 'desk'; }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function stageH() { return stage.clientHeight / stage.clientWidth * 100; }   // stage height in stage-width units
  function place(k) {   // aligned placement: { cx, cy, w, rot, z, lift } in stage-width units
    var S = SLOTS[mode], A = ARRANGE[focusKey], c, d;
    if (k === focusKey) return { cx: S.c[0], cy: S.c[1], w: S.big[k], rot: 0, z: 40, lift: .65 };
    if (A.corners[k]) { c = S.corners[A.corners[k]]; return { cx: c[0], cy: c[1], w: S.small[k], rot: 0, z: k === 'enq' ? -10 : -40, lift: .15 }; }
    d = A.decor[k]; c = S.decor[d[0]];
    return { cx: c[0], cy: c[1], w: S.dw[k], rot: d[1], z: DECOR_Z[k], lift: .1 };
  }
  function orderProps(k) {
    if (k === 'cursor') {
      var cp = ctaPoint();
      return { left: cp.x + '%', top: cp.y + '%', width: LAYOUT[mode].width.cursor + '%', rotation: 0, scaleX: 1, scaleY: 1, zIndex: 9, opacity: 1,
        z: 60, rotationX: 0, rotationY: 0, '--lift': 0 };
    }
    var q = place(k), H = stageH(), h = q.w * RATIO[k];
    var left = clamp(q.cx - q.w / 2, -2, 102 - q.w), top = clamp(q.cy - h / 2, 1, H - 1 - h);
    return { left: left + '%', top: top / H * 100 + '%', width: q.w + '%', rotation: q.rot, scaleX: 1, scaleY: 1,
      zIndex: k === focusKey ? 6 : 4, opacity: 1, z: q.z, rotationX: 0, rotationY: 0, '--lift': q.lift };
  }
  function props(k, st) {
    if (st === 'order') return orderProps(k);
    var p = LAYOUT[mode].chaos[k];
    var rot = p[2];   // full-strength scatter: the mess is the fun
    var w0 = LAYOUT[mode].width[k], g = k === 'cursor' ? 1 : GROW[mode], w = w0 * g;
    var left = clamp(p[0] - (w - w0) / 2, Math.min(p[0], -2), Math.max(p[0], 102 - w));
    // cards along the top edge keep their top (growing up would push them into the headline)
    var top = k === 'cursor' || p[1] < 10 ? p[1] : p[1] - (w - w0) * RATIO[k] / stageH() * 50;
    var o = { left: left + '%', top: top + '%', width: w + '%', rotation: rot, scaleX: p[3], scaleY: p[4], zIndex: p[5], opacity: 1 };
    // phones get shallower scattered depth
    var mob = mode === 'mob', d = DEPTH.chaos[k], m = mob ? .5 : 1, a = mob ? .7 : 1;
    o.z = d[0] * m; o.rotationX = d[1] * a; o.rotationY = d[2] * a; o['--lift'] = d[3];
    return o;
  }
  function setArt(el, o) {
    if (window.gsap) { gsap.set(el, o); return; }
    el.style.left = o.left; el.style.top = o.top; el.style.width = o.width; el.style.zIndex = o.zIndex;
    el.style.transform = 'translateZ(' + o.z + 'px) rotateX(' + o.rotationX + 'deg) rotateY(' + o.rotationY + 'deg) rotate(' + o.rotation + 'deg) scale(' + o.scaleX + ',' + o.scaleY + ')';
    el.style.setProperty('--lift', o['--lift']);
  }

  /* where the landing page's CTA sits once the page has landed (cursor target), in stage %.
     Card content is sized in cqi, so the CTA's offsets scale with the page's final width. */
  function ctaPoint() {
    var o = orderProps('lp'), cta = document.getElementById('lp-cta');
    var sw = stage.clientWidth, sh = stage.clientHeight, r = parseFloat(o.width) / 100 * sw / (art.lp.offsetWidth || 1);
    var x = parseFloat(o.left) / 100 * sw + (cta.offsetLeft + cta.offsetWidth * 0.62) * r;
    var y = parseFloat(o.top) / 100 * sh + (cta.offsetTop + cta.offsetHeight * 0.55) * r;
    return { x: x / sw * 100, y: y / sh * 100 };
  }

  /* connector arrows, computed from the ALIGNED layout of the current focus */
  var links = document.getElementById('links');
  function rectOf(k) {
    var o = orderProps(k), sw = stage.clientWidth, sh = stage.clientHeight, w = parseFloat(o.width) / 100 * sw;
    return { x: parseFloat(o.left) / 100 * sw, y: parseFloat(o.top) / 100 * sh, w: w, h: w * RATIO[k] };
  }
  /* one arrow from rect a to rect b: straight down/up when stacked, otherwise into b's facing side
     (an elbow when a sits above or below that side) */
  function conn(a, b) {
    var G = 8, acx = a.x + a.w / 2, acy = a.y + a.h / 2, bcx = b.x + b.w / 2, bcy = b.y + b.h / 2;
    var ov = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), x, y1, y2, m;
    if (ov > Math.min(a.w, b.w) * .3) {
      var down = bcy > acy; x = (Math.max(a.x, b.x) + Math.min(a.x + a.w, b.x + b.w)) / 2;
      y1 = down ? a.y + a.h : a.y; y2 = down ? b.y - G : b.y + b.h + G; m = (y1 + y2) / 2;
      return [x, y1, [x, m], [x, m], x, y2];
    }
    var right = bcx > acx, x2 = right ? b.x - G : b.x + b.w + G;
    y2 = clamp(acy, b.y + b.h * .3, b.y + b.h * .7);
    if (y2 > a.y + 8 && y2 < a.y + a.h - 8) {
      var x1 = right ? a.x + a.w : a.x; m = (x1 + x2) / 2;
      return [x1, y2, [m, y2], [m, y2], x2, y2];
    }
    x = clamp(x2, a.x + a.w * .25, a.x + a.w * .75); y1 = y2 > acy ? a.y + a.h : a.y;
    return [x, y1, [x, y2], [x + (x2 - x) * .4, y2], x2, y2];
  }
  function routes() {   // the focused service's route through the funnel
    if (focusKey === 'lp') return [['search', 'lp'], ['seo', 'lp'], ['ad', 'lp'], ['lp', 'enq']];
    return [[focusKey, 'lp'], ['lp', 'enq']];
  }
  function drawLinks() {
    var sw = stage.clientWidth, sh = stage.clientHeight;
    links.setAttribute('viewBox', '0 0 ' + sw + ' ' + sh);
    var paths = routes().map(function (l) { return conn(rectOf(l[0]), rectOf(l[1])); });
    // alignment guides: the focused piece's edges extended across the stage, the grid everything snaps to
    var f = rectOf(focusKey);
    var guides = [[0, f.y, sw, f.y], [0, f.y + f.h, sw, f.y + f.h], [f.x, 0, f.x, sh]];
    links.innerHTML = '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
      '<path d="M0,0 L10,5 L0,10 z" fill="#050507" stroke="none"/></marker></defs>' +
      guides.map(function (g) { return '<line class="guide" x1="' + g[0].toFixed(1) + '" y1="' + g[1].toFixed(1) + '" x2="' + g[2].toFixed(1) + '" y2="' + g[3].toFixed(1) + '"/>'; }).join('') +
      paths.map(function (p) {
        return '<path marker-end="url(#ah)" d="M' + p[0].toFixed(1) + ',' + p[1].toFixed(1) + ' C' + p[2][0].toFixed(1) + ',' + p[2][1].toFixed(1) +
          ' ' + p[3][0].toFixed(1) + ',' + p[3][1].toFixed(1) + ' ' + p[4].toFixed(1) + ',' + p[5].toFixed(1) + '"/>';
      }).join('');
    return [].slice.call(links.querySelectorAll('path[marker-end]'));
  }

  var makeBtn = document.getElementById('make'), makeLabel = makeBtn.querySelector('.make-label'), replayBtn = document.getElementById('replay');
  var swapOrder = scene.querySelector('.s-order'), swapChaos = scene.querySelector('.s-chaos');
  function setState(st) {
    state = st;
    scene.dataset.state = st;
    var done = st === 'order';
    makeLabel.textContent = done ? 'Working together' : 'Make it work together';
    makeBtn.setAttribute('aria-disabled', String(done));
    replayBtn.hidden = !done;
    markPath();
    swapOrder.setAttribute('aria-hidden', String(!done));
    swapChaos.setAttribute('aria-hidden', String(done));
  }
  function applyState(st) {   // instant, used for load, resize, reduced motion and replay reset
    if (tl) { tl.kill(); tl = null; }
    if (shuffle) { shuffle.kill(); shuffle = null; }
    if (window.gsap) { gsap.killTweensOf(world); gsap.set(world, { rotationX: 0, rotationY: 0 }); gsap.set(links, { opacity: 1 }); }
    KEYS.forEach(function (k) { setArt(art[k], props(k, st)); });
    if (window.gsap) { gsap.set(swapOrder, { clearProps: 'clipPath' }); gsap.set(swapChaos, { clearProps: 'clipPath' }); }
    if (st === 'order') {
      drawLinks().forEach(function (p) { p.style.strokeDasharray = 'none'; });
      [].forEach.call(links.querySelectorAll('line.guide'), function (g) { g.style.opacity = 0.45; });
    }
    setState(st);
  }

  /* The coordination. The inflatable is the trigger: crushed flat between the ad and the
     page, it is released first and its expansion pushes the cards apart, the ad slides
     firmly into its column, search glides, the page lands with weight. Then the alignment
     guides snap in, the route draws, the cursor clicks, and the enquiry pops in as the finish. */
  function play() {
    if (tl) tl.kill();
    setState('moving');
    var O = function (k) { return props(k, 'order'); };
    var paths = drawLinks(), guides = [].slice.call(links.querySelectorAll('line.guide'));
    paths.forEach(function (p) { var L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
    var cta = document.getElementById('lp-cta');
    gsap.set(links, { opacity: 1 });
    tl = gsap.timeline({ onComplete: function () { setState('order'); if (TD.pluckSound) TD.pluckSound(0.7, 0.6, 3); } });
    // the view swings round as the pieces converge onto one plane, for a moment you see the depth, then squares up
    var cam = mode === 'mob' ? [7, -10] : [9, -16];
    gsap.killTweensOf(world);
    tl.to(world, { rotationX: cam[0], rotationY: cam[1], duration: 0.55, ease: 'power2.out' }, 0.05)
      .to(world, { rotationX: 0, rotationY: 0, duration: 0.95, ease: 'power3.inOut' }, 0.62);
    // (cards converge via their own tweens below, which carry z / tilt / lift.) The inflatable rises in front
    // of everything as it bursts free, in 3D, depth (not z-index) decides what is in front, then sinks behind.
    tl.to(art.infl, { z: 140, duration: 0.3, ease: 'power3.out' }, 0)
      .to(art.infl, { z: O('infl').z, duration: 0.7, ease: 'power2.inOut' }, 0.55)
      .to(art.sticker, { z: O('sticker').z, '--lift': O('sticker')['--lift'], duration: 0.5, ease: 'power2.out' }, 0.3);
    // 1 · release: the inflatable over-inflates past its shape, then settles once
    tl.set(art.infl, { zIndex: 9 }, 0)
      .to(art.infl, { scaleX: 1.12, scaleY: 0.94, duration: 0.32, ease: 'power3.out' }, 0)
      .call(function () { if (TD.pluckSound) TD.pluckSound(0.9, 0.3, 0); }, null, 0.05)
      .to(art.infl, { scaleX: 1, scaleY: 1, duration: 1.0, ease: 'elastic.out(1, 0.45)' }, 0.32)
      .to(art.infl, { left: O('infl').left, top: O('infl').top, width: O('infl').width, rotation: O('infl').rotation, duration: 0.85, ease: 'power2.inOut' }, 0.2)
      .set(art.infl, { zIndex: O('infl').zIndex }, 1.05)
      .to(art.cursor, { opacity: 0, duration: 0.15 }, 0)
      .to(art.enq, { opacity: 0, scale: 0.85, duration: 0.2, ease: 'power2.in' }, 0)
      // 2 · pushed into place, each with its own weight
      .to(art.ad, Object.assign(O('ad'), { duration: 0.55, ease: 'power4.out' }), 0.14)
      .to(art.search, Object.assign(O('search'), { duration: 0.5, ease: 'expo.out' }), 0.2)
      .to(art.seo, Object.assign(O('seo'), { duration: 0.55, ease: 'power3.out' }), 0.24)
      .to(art.lp, Object.assign(O('lp'), { scaleX: 1.035, scaleY: 1.035, duration: 0.6, ease: 'power3.inOut' }), 0.26)
      .to(art.lp, { scaleX: 1, scaleY: 1, duration: 0.22, ease: 'power2.out' }, 0.86)
      .to(art.swatch, Object.assign(O('swatch'), { duration: 0.5, ease: 'power3.inOut' }), 0.3)
      .set(art.sticker, { zIndex: 8 }, 0.3)
      .to(art.sticker, { left: O('sticker').left, top: O('sticker').top, width: O('sticker').width, rotation: O('sticker').rotation, scale: 1.35, duration: 0.4, ease: 'power2.out' }, 0.3)
      .to(art.sticker, { scale: 1, duration: 0.14, ease: 'power4.in' }, 0.72)
      // 3 · the grid it all snapped to
      .fromTo(guides, { opacity: 0, attr: { 'stroke-dashoffset': 40 } }, { opacity: 1, attr: { 'stroke-dashoffset': 0 }, duration: 0.35, stagger: 0.06, ease: 'power2.out' }, 0.82)
      .to(guides, { opacity: 0.45, duration: 0.5 }, 1.4)
      .to(paths, { strokeDashoffset: 0, duration: 0.35, ease: 'power2.inOut', stagger: 0.12 }, 1.0)
      .set(art.cursor, Object.assign(props('cursor', 'chaos'), { opacity: 0 }), 1.05)
      .to(art.cursor, Object.assign(O('cursor'), { opacity: 1, duration: 0.35, ease: 'power3.out' }), 1.1)
      .call(function () { cta.classList.add('pressed'); }, null, 1.48)
      .to(art.cursor, { scale: 0.85, duration: 0.07, yoyo: true, repeat: 1 }, 1.46)
      .call(function () { cta.classList.remove('pressed'); }, null, 1.65)
      .set(art.enq, Object.assign(O('enq'), { opacity: 0, scale: 0.6 }), 1.55)
      .to(art.enq, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2.4)' }, 1.58)
      .to(swapChaos, { clipPath: 'inset(0 0 0 100%)', duration: 0.4, ease: 'power3.inOut' }, 1.5)
      .fromTo(swapOrder, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.5, ease: 'power3.out' }, 1.62);
  }

  /* switching services once aligned: every piece lifts off the plane at its own height, they
     cross over each other to the new arrangement, and settle; the route redraws to the new focus */
  function reshuffle() {
    if (shuffle) shuffle.kill();
    gsap.killTweensOf(world);
    var paths = drawLinks(), guides = [].slice.call(links.querySelectorAll('line.guide'));
    paths.forEach(function (p) { var L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
    gsap.set(guides, { opacity: 0 });
    shuffle = gsap.timeline({ onComplete: function () { shuffle = null; } });
    shuffle.fromTo(links, { opacity: 0 }, { opacity: 1, duration: 0.01 }, 0)
      .to(world, { rotationY: 6, rotationX: 4, duration: 0.4, ease: 'power2.out' }, 0)
      .to(world, { rotationY: 0, rotationX: 0, duration: 0.6, ease: 'power3.inOut' }, 0.4);
    ['lp', 'search', 'seo', 'ad', 'enq', 'infl', 'swatch', 'sticker', 'cursor'].forEach(function (k, i) {
      var o = orderProps(k), t = i * 0.035, isF = k === focusKey;
      var peak = isF ? 200 : 40 + (i % 3) * 45, spin = (i % 2 ? 1 : -1) * (isF ? 8 : 14);
      var move = { left: o.left, top: o.top, width: o.width, '--lift': o['--lift'], duration: 0.8, ease: 'power3.inOut' };
      shuffle.to(art[k], move, t)
        .to(art[k], { z: peak, rotationY: spin, rotation: o.rotation + (i % 2 ? 6 : -6), duration: 0.38, ease: 'power2.out' }, t)
        .to(art[k], { z: o.z, rotationY: 0, rotation: o.rotation, duration: 0.5, ease: 'back.out(1.4)' }, t + 0.38);
    });
    shuffle.fromTo(guides, { opacity: 0 }, { opacity: 0.45, duration: 0.4, stagger: 0.05 }, 0.8)
      .to(paths, { strokeDashoffset: 0, duration: 0.35, ease: 'power2.inOut', stagger: 0.08 }, 0.85)
      .call(function () { if (TD.pluckSound) TD.pluckSound(0.5, 0.35, 1); }, null, 0.85);
  }

  /* You make it happen: the scattered campaign waits for the button (or a service pick). */
  makeBtn.addEventListener('click', function () {
    if (state !== 'chaos') return;
    if (reduced) { applyState('order'); return; }
    play();
  });
  replayBtn.addEventListener('click', function () {
    applyState('chaos');
    requestAnimationFrame(play);
  });

  /* ── services: the selected service's piece takes the centre of the composition ── */
  /* Copy lives in the HTML (.svc-copy) so crawlers and no-JS readers get it; this only adds layout keys. */
  var SERVICES = [
    { k: 'lp', slug: 'landing-pages', name: 'Landing pages' },
    { k: 'search', slug: 'google-ads', row: 'paid', name: 'Google Ads' },
    { k: 'ad', slug: 'meta-ads', name: 'Facebook Ads' },
    { k: 'seo', slug: 'seo', row: 'org', name: 'SEO' }
  ].map(function (s) {
    var el = scene.querySelector('.svc-copy [data-svc="' + s.k + '"]');
    var txt = function (c) { return el ? el.querySelector('.' + c).textContent : ''; };
    return Object.assign({}, s, { p: txt('svc-p'), get: txt('svc-get'), fix: txt('svc-fix') });
  });
  var picks = [].slice.call(scene.querySelectorAll('.pick')), picksBox = scene.querySelector('.svc-picks'), current = 0;
  var exLine = document.getElementById('ex-line');
  var explain = document.getElementById('svc-explain'), exP = document.getElementById('ex-p'), exGet = document.getElementById('ex-get'),
    exFix = document.getElementById('ex-fix'), exCta = document.getElementById('ex-cta'), exMore = document.getElementById('ex-more');
  function choose(i, silent) {
    var s = SERVICES[i];
    picks.forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === i)); });
    current = i; placeExplain();
    KEYS.forEach(function (k) { art[k].classList.toggle('is-focus', k === s.k); });
    var changed = focusKey !== s.k; focusKey = s.k;
    if (!silent) {
      if (state === 'chaos') { if (reduced) applyState('order'); else play(); }   // a pick before the button assembles around it
      else if (changed) {
        if (state === 'moving' && tl) tl.progress(1);   // finish the assembly, then reshuffle from there
        if (reduced) applyState('order'); else reshuffle();
      }
    }
    art.search.dataset.row = s.row || '';
    markPath();
    exLine.textContent = picks[i].querySelector('.pick-line').textContent;
    exP.textContent = s.p; exGet.textContent = s.get; exFix.textContent = '“' + s.fix + '”';
    exMore.href = '/services/' + s.slug + '/';
    exCta.textContent = 'Ask about ' + (s.k === 'lp' ? 'landing pages' : s.name) + ' →';
    if (!silent && TD.setTopic) TD.setTopic(s.name + ': ' + s.fix.replace(/\.$/, ''));
  }
  var hoverPickTimer;
  var canHover = matchMedia('(hover: hover) and (pointer: fine)');
  picks.forEach(function (b, i) {
    function activate() {
      clearTimeout(hoverPickTimer);
      if (current !== i || state === 'chaos') choose(i);
    }
    b.addEventListener('click', activate);
    b.addEventListener('focus', function () { if (b.matches(':focus-visible')) activate(); });
    b.addEventListener('pointerenter', function (e) {
      art[SERVICES[i].k].classList.add('is-peek');
      if (canHover.matches && e.pointerType !== 'touch') {
        clearTimeout(hoverPickTimer);
        hoverPickTimer = setTimeout(activate, 140);
      }
    });
    b.addEventListener('pointerleave', function () {
      clearTimeout(hoverPickTimer);
      art[SERVICES[i].k].classList.remove('is-peek');
    });
  });
  /* Keep the service targets stationary while hovering; details follow the list. */
  function placeExplain() {
    picksBox.insertAdjacentElement('afterend', explain);
  }
  /* the selected service's route (piece → page → enquiry) stays at full strength; the rest dims */
  function markPath() {
    var on = {}; routes().forEach(function (r) { on[r[0]] = on[r[1]] = true; });
    ['search', 'seo', 'ad', 'lp', 'enq'].forEach(function (k) { art[k].classList.toggle('is-dim', state === 'order' && !on[k]); });
  }

  /* ── pointer: nearby decorative pieces lean away a little (desktop, motion allowed) ── */
  var DECOR = ['infl', 'sticker', 'swatch', 'cursor'], movers = {}, inView = false;
  if (!reduced && matchMedia('(pointer: fine)').matches) {
    DECOR.forEach(function (k) {
      movers[k] = { x: gsap.quickTo(floats[k], 'x', { duration: 0.8, ease: 'power3.out' }), y: gsap.quickTo(floats[k], 'y', { duration: 0.8, ease: 'power3.out' }) };
    });
    new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }).observe(stage);
    stage.addEventListener('pointermove', function (e) {
      if (!inView || state === 'moving') return;
      DECOR.forEach(function (k) {
        var r = art[k].getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dx = cx - e.clientX, dy = cy - e.clientY, dist = Math.hypot(dx, dy), R = 300;
        var f = dist < R ? (1 - dist / R) * 22 : 0;
        movers[k].x(dist ? dx / dist * f : 0); movers[k].y(dist ? dy / dist * f : 0);
      });
    });
    stage.addEventListener('pointerleave', function () { DECOR.forEach(function (k) { movers[k].x(0); movers[k].y(0); }); tiltX(0); tiltY(0); });
    // the whole space tilts a little toward the pointer while it is still disconnected
    var tiltX = gsap.quickTo(world, 'rotationX', { duration: 1, ease: 'power3.out' }), tiltY = gsap.quickTo(world, 'rotationY', { duration: 1, ease: 'power3.out' });
    stage.addEventListener('pointermove', function (e) {
      if (!inView || state !== 'chaos') return;
      var r = stage.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
      tiltY(nx * 9); tiltX(-ny * 6);
    });
  }

  /* ── layout, resize, orientation ── */
  mode = pickMode();
  applyState(reduced ? 'order' : 'chaos');   // reduced motion: no entrance, start assembled
  choose(0, true);
  var rt = null;
  addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var m = pickMode(), finishing = state === 'moving';
      mode = m; placeExplain();
      applyState(finishing ? 'order' : state);
    }, 150);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (state === 'order') drawLinks(); });
})();
