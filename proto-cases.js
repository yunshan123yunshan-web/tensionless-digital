/* Proof: three case "moments", then one line that carries through to the end.
   - The three moments are one pinned reel. Each reads complete before anything
     moves (client, service, statement, image); scrolling opens it to show what
     we did and one lead result, then the next case wipes in sideways.
     Figures are revealed, never animated.
   - The thread: the reel's progress line fills along its bottom edge; at the
     seam it becomes the process line (pulled down through the three stages
     into a rising curve), and then it travels on and relaxes into the
     underline beneath "tension". One line from the cases to the contact.
   Every reel tween is a fromTo, so a refresh (resize, reload, breakpoint
   change) can rebuild any scroll position without inheriting stale state.
   Depends on proto-core.js (window.TD), GSAP + ScrollTrigger. */
(function () {
  'use strict';
  var TD = window.TD || { reduced: true };
  var reduced = TD.reduced || !window.gsap || !window.ScrollTrigger;
  if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  var reel = document.querySelector('.cases'), moments = [].slice.call(document.querySelectorAll('.moment'));
  var hudI = document.getElementById('reel-i'), bars = [].slice.call(document.querySelectorAll('.reel-bars i b'));
  var reelThread = document.getElementById('reel-thread'), eightText = document.getElementById('eight-text');

  /* ── the 8: the photo is clipped by a real "8" glyph sitting exactly where the numeral is.
     Opening zooms the glyph through its waist (the solid crossing), so the silhouette holds
     and the picture visibly expands out of the numeral rather than becoming a rectangle. ── */
  function measureEight(num, media) {
    var mr = media.getBoundingClientRect(), nr = num.getBoundingClientRect(), bl = num.querySelector('.bl').getBoundingClientRect();
    var cs = getComputedStyle(num), fs = parseFloat(cs.fontSize), x = nr.left - mr.left, y = bl.top - mr.top;
    eightText.setAttribute('x', x.toFixed(1)); eightText.setAttribute('y', y.toFixed(1));
    eightText.setAttribute('font-size', fs.toFixed(1)); eightText.setAttribute('font-weight', cs.fontWeight);
    eightText.setAttribute('font-family', cs.fontFamily);
    // find the waist on a small canvas: the middle run down the glyph's centre column
    var k = 0.25, c = document.createElement('canvas'), ctx = c.getContext('2d'), font = cs.fontWeight + ' ' + (fs * k) + 'px ' + cs.fontFamily;
    ctx.font = font;
    var mt = ctx.measureText('8'), lf = mt.actualBoundingBoxLeft, asc = mt.actualBoundingBoxAscent;
    c.width = Math.ceil(lf + mt.actualBoundingBoxRight) + 4; c.height = Math.ceil(asc + mt.actualBoundingBoxDescent) + 4;
    ctx.font = font; ctx.fillText('8', lf + 2, asc + 2);
    var d = ctx.getImageData(0, 0, c.width, c.height).data;
    var on = function (px, py) { return d[(py * c.width + px) * 4 + 3] > 128; };
    var cx = c.width >> 1, runs = [], s = -1;
    for (var py = 0; py <= c.height; py++) {
      var f = py < c.height && on(cx, py);
      if (f && s < 0) s = py;
      if (!f && s >= 0) { runs.push([s, py]); s = -1; }
    }
    var mid = c.height / 2, run = runs.reduce(function (a, r) { return Math.abs((r[0] + r[1]) / 2 - mid) < Math.abs((a[0] + a[1]) / 2 - mid) ? r : a; }, runs[0] || [mid - 4, mid + 4]);
    var wy = Math.round((run[0] + run[1]) / 2), hl = cx, hr = cx;
    while (hl > 0 && on(hl - 1, wy)) hl--;
    while (hr < c.width - 1 && on(hr + 1, wy)) hr++;
    var r = Math.max(4, Math.min(run[1] - run[0], hr - hl) / 2 / k);
    var px = x + ((hl + hr) / 2 - lf - 2) / k, pyy = y + (wy - asc - 2) / k;
    var far = Math.max(Math.hypot(px, pyy), Math.hypot(mr.width - px, pyy), Math.hypot(px, mr.height - pyy), Math.hypot(mr.width - px, mr.height - pyy));
    return { S: 1.15 * far / r, px: px, py: pyy };
  }
  function setEight(media, g, z) {
    var v = z >= 1 ? 'none' : 'url(#eightclip)';
    media.style.clipPath = v; media.style.webkitClipPath = v;
    if (z < 1) {
      var s = Math.exp(z * Math.log(g.S));   // zoom in log space: a steady push, not a lurch
      eightText.setAttribute('transform', 'translate(' + g.px.toFixed(1) + ' ' + g.py.toFixed(1) + ') scale(' + s.toFixed(4) + ') translate(' + (-g.px).toFixed(1) + ' ' + (-g.py).toFixed(1) + ')');
    }
  }

  /* ── one reel (desktop): the cases pin together as a single scene. Each opens, holds, then the
     next wipes in from the right while the last drifts left; a counter, the bars and the thread
     stay put across the whole reel, so it reads as one continuous piece. ── */
  function buildReel() {
    var OPEN = {
      wide: { from: 'inset(0% 0% 0% 0%)', to: 'inset(0% 42% 0% 0%)' },   // full-bleed image gives way to the detail panel
      crop: { from: 'inset(7% 12% 7% 12%)', to: 'inset(0% 0% 0% 0%)' }   // a large crop (result already on it) opens to the whole picture
    };
    var hold = 1.1,   // each finished result lands and sits still before the next handoff
        aligners = [], marks = [], shown = -1, tl = null;
    // start clean: nothing from a previous breakpoint's build may leak in
    moments.forEach(function (m) {
      gsap.set([m].concat([].slice.call(m.querySelectorAll('.m-media, .m-media img, .m-statement, .m-detail, .m-tag'))), { clearProps: 'all' });
    });
    reel.classList.add('is-reel');
    // rebuild the current frame from scratch: start state → measure → re-record → back to now
    var restore = function () {
      var now = tl.time();
      tl.progress(1).progress(0);
      aligners.forEach(function (f) { f(); });
      tl.invalidate().progress(1).progress(0).time(now);
      hud();
    };
    tl = gsap.timeline({ scrollTrigger: { trigger: reel, start: 'top top', end: '+=730%',   // four cases; keeps each result's hold at ~0.65 screens
      pin: true, scrub: 0.6, onRefresh: function () { if (tl) restore(); } } });

    moments.forEach(function (m, i) {
      var comp = m.dataset.comp, media = m.querySelector('.m-media'), detail = m.querySelector('.m-detail');
      var num = m.querySelector('.m-numeral'), img = media.querySelector('img');
      var t = tl.duration() + (i ? 0 : 0.1), open = 1;
      if (i) {   // the hand-off: imagery leads. The last case's words step back, the next picture wipes in
                 // from the right (its words held back, so the wipe never cuts through a headline), then the
                 // new words arrive together. Scrubbed, so scrolling back plays the exact mirror.
        var prev = moments[i - 1], words = function (mm) { return [].slice.call(mm.querySelectorAll('.m-k, .m-statement, .m-figure')); };
        tl.fromTo(words(prev).concat(prev.querySelector('.m-detail'), prev.querySelector('.m-tag')).filter(Boolean), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25, ease: 'power1.in', immediateRender: false }, t)
          .fromTo(m, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'power3.inOut' }, t + 0.15)
          .fromTo(prev, { xPercent: 0 }, { xPercent: -14, duration: 0.7, ease: 'power3.inOut', immediateRender: false }, t + 0.15)
          .fromTo(prev, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.01, ease: 'none', immediateRender: false }, t + 0.85)
          .fromTo(words(m), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'power1.out' }, t + 0.8);
        marks.push(t + 0.5);
        t += 1.1;
      }
      if (num && eightText) {   // the photo-filled 8 grows through its own waist until it is the whole frame
        var g = { S: 12, px: 0, py: 0 }, Z = { z: 0 };
        aligners.push(function () { var mg = measureEight(num, media); g.S = mg.S; g.px = mg.px; g.py = mg.py; });
        num.style.visibility = 'hidden';
        setEight(media, g, 0);
        open = 1.5;
        tl.fromTo(Z, { z: 0 }, { z: 1, duration: open, ease: 'power2.in', immediateRender: false, onUpdate: function () { setEight(media, g, Z.z); } }, t);
        if (img.decode) img.decode().then(function () { ScrollTrigger.refresh(); }, function () {});
      } else {
        tl.fromTo(media, { clipPath: OPEN[comp].from }, { clipPath: OPEN[comp].to, duration: 1, ease: 'power2.inOut' }, t)
          .fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1, ease: 'power2.out' }, t);
      }
      tl.fromTo(detail, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power2.out', immediateRender: false }, t + open - 0.55);
      gsap.set(detail, { autoAlpha: 0 });
      var tag = m.querySelector('.m-tag');   // optional image label, retained for older prototypes
      if (tag) { tl.fromTo(tag, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'power1.out', immediateRender: false }, t + open - 0.4); gsap.set(tag, { autoAlpha: 0 }); }
      tl.to({}, { duration: hold }, t + open);   // a stable hold on the finished result
    });

    function hud() {
      var time = tl.time(), idx = 0, segs = [0].concat(marks, [tl.duration()]);
      marks.forEach(function (mk, k) { if (time >= mk) idx = k + 1; });
      if (idx !== shown) { shown = idx; hudI.textContent = '0' + (idx + 1); }
      bars.forEach(function (bar, k) {   // each bar fills across its own case's stretch
        bar.style.transform = 'scaleX(' + clamp((time - segs[k]) / (segs[k + 1] - segs[k]), 0, 1).toFixed(3) + ')';
      });
      if (reelThread) reelThread.style.transform = 'scaleX(' + tl.progress().toFixed(4) + ')';
    }
    tl.eventCallback('onUpdate', hud);
    hud();
    return function () {   // breakpoint change: gsap.matchMedia reverts the tweens; undo the manual bits
      reel.classList.remove('is-reel');
      moments.forEach(function (m) {
        var media = m.querySelector('.m-media'), num = m.querySelector('.m-numeral');
        media.style.clipPath = ''; media.style.webkitClipPath = '';
        if (num) num.style.visibility = '';
      });
    };
  }

  /* ── phones: the cases simply stack, each with picture, headline and result together.
     Only the 8 moves: it opens out of the numeral as its picture scrolls up the screen. ── */
  function buildStack() {
    moments.forEach(function (m) {
      var media = m.querySelector('.m-media'), num = m.querySelector('.m-numeral');
      m.classList.add('open');
      if (!num || !eightText) return;
      var g = { S: 12, px: 0, py: 0 }, z = 0, apply = function () { setEight(media, g, z); };
      num.style.visibility = 'hidden';
      apply();
      ScrollTrigger.create({ trigger: media, start: 'top 45%', end: 'top 5%', scrub: 0.6,
        onRefresh: function (self) { var was = z; z = 0; apply(); var mg = measureEight(num, media); g.S = mg.S; g.px = mg.px; g.py = mg.py; z = was; apply(); },
        onUpdate: function (self) { z = self.progress * self.progress; apply(); } });   // eased in: the silhouette holds, then opens
    });
    return function () {
      moments.forEach(function (m) {
        var media = m.querySelector('.m-media'), num = m.querySelector('.m-numeral');
        m.classList.remove('open'); media.style.clipPath = ''; media.style.webkitClipPath = '';
        if (num) num.style.visibility = '';
      });
    };
  }

  if (reel && reduced) {   // no motion: each moment sits in the flow, already open
    moments.forEach(function (m) {
      var num = m.querySelector('.m-numeral');
      m.classList.add('open'); m.querySelector('.m-media').style.clipPath = 'none'; if (num) num.style.opacity = 0;
    });
  } else if (reel) {
    gsap.matchMedia().add({ phone: '(max-width: 899px)', desk: '(min-width: 900px)' }, function (ctx) {
      var undo = ctx.conditions.phone ? buildStack() : buildReel();
      ScrollTrigger.sort();   // a rebuilt reel must refresh before the sections below it
      return undo;
    });
  }

  /* ── the thread: process line → contact underline, drawn in one SVG over both sections ── */
  var fin = document.getElementById('finale'), proc = document.getElementById('process'), contact = document.getElementById('contact');
  var tense = document.getElementById('tense'), tPath = document.getElementById('thread-path'), tSvg = document.getElementById('thread');
  if (fin && proc && contact && tense && tPath) {
    var N = 120, ST = { p: 0, q: 0, wob: 0 }, settled = false;
    var stages = [].slice.call(proc.querySelectorAll('.proc-stages li')), dots = stages.map(function (li) { return li.querySelector('.proc-dot'); });
    var box = function (el, rf) { var r = el.getBoundingClientRect(); return { l: r.left - rf.left, r: r.right - rf.left, t: r.top - rf.top, b: r.bottom - rf.top }; };
    var resample = function (pts, n) {   // even spacing along the curve, so morphs stay smooth
      var acc = [0];
      for (var a = 1; a < pts.length; a++) acc.push(acc[a - 1] + Math.hypot(pts[a][0] - pts[a - 1][0], pts[a][1] - pts[a - 1][1]));
      var out = [], j = 0, len = acc[acc.length - 1];
      for (var q = 0; q <= n; q++) {
        var s = len * q / n;
        while (j < pts.length - 2 && acc[j + 1] < s) j++;
        var f = (s - acc[j]) / ((acc[j + 1] - acc[j]) || 1);
        out.push([lerp(pts[j][0], pts[j + 1][0], f), lerp(pts[j][1], pts[j + 1][1], f)]);
      }
      return out;
    };
    // where the process line settles: a rising curve through the stepped-up dots (desktop),
    // or a straight thread down through the stacked dots (phones)
    var procShape = function (W, rf) {
      var cs = dots.map(function (d) { var b = box(d, rf); return [(b.l + b.r) / 2, (b.t + b.b) / 2]; });
      if (W < 900) {
        var ya = box(dots[0], rf).t - 40, yb = box(dots[dots.length - 1], rf).b + 10;
        return resample([[cs[0][0], ya], [cs[0][0], yb]], N);
      }
      var last = cs[cs.length - 1], rise = Math.min(130, last[1] - box(proc, rf).t - 30);
      var K = [[0, cs[0][1] + 34]].concat(cs, [[W, last[1] - rise]]), dense = [];
      var cr = function (a, b, c, d, u) { return 0.5 * (2 * b + (c - a) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (3 * b - a - 3 * c + d) * u * u * u); };
      for (var sg = 0; sg < K.length - 1; sg++) {
        var k0 = K[Math.max(0, sg - 1)], k1 = K[sg], k2 = K[sg + 1], k3 = K[Math.min(K.length - 1, sg + 2)];
        for (var q = sg ? 1 : 0; q <= 24; q++) { var u = q / 24; dense.push([cr(k0[0], k1[0], k2[0], k3[0], u), cr(k0[1], k1[1], k2[1], k3[1], u)]); }
      }
      return resample(dense, N);
    };
    // the process line at progress p: it lies along its own path (the quotes now sit between it and the reel,
    // so it no longer sweeps in from the section's top edge across the labels), tangled early, then flowing.
    // drawThread only draws the first drawn(p) points, so the line grows from the first stage towards growth.
    var drawn = function (p) { return Math.max(1, Math.round(N * (1 - Math.pow(1 - p, 2)))); };
    var procPts = function (p, W, shape) {
      var phone = W < 900, pts = [];
      var amp = (phone ? 26 : 64) * Math.sin(Math.PI * Math.min(1, p / 0.85));   // friction: it tangles on the way, then flows
      for (var i = 0; i <= N; i++) {
        var u = i / N, wig = amp * Math.sin(Math.PI * u) * (Math.sin(i * 0.37) + 0.6 * Math.sin(i * 1.01 + 1.3) + 0.35 * Math.sin(i * 2.4 + 0.4)) / 1.6;
        pts.push([shape[i][0] + (phone ? wig : 0), shape[i][1] + (phone ? 0 : wig)]);
      }
      return pts;
    };
    // where the released line travels: out of the curve, down the empty right margin, then in
    // beneath the heading, ending on the underline (last stretch = exactly the word's width)
    var route = function (W, rf, E) {
      var te = box(tense, rf), Y = te.b - (te.b - te.t) * 0.06, K;
      if (W < 900) {   // phones: drop below the last stage's text before crossing to the margin
        // the crossing happens inside whatever gap is left between the last stage and the contact kicker
        var s3 = box(stages[stages.length - 1], rf).b, gap = Math.max(36, box(document.getElementById('contact-kicker'), rf).t - s3);
        // same shape as desktop, kept inside the screen: across the gap, down past the headline, slack under 'OUT.'
        K = [E, [E[0], s3 + gap * 0.3], [W * 0.6, s3 + gap * 0.55], [W - 26, Y - 50], [te.r + 40, Y + 14], [te.r, Y], [te.l, Y]];
      } else {
        // desktop: the arrow dives down a lane just right of the contact headline (inside the page, never on
        // the screen edge), then hangs slack below "OUT." like a rope and pulls taut under "tension"
        // first it drops down the margin until it is clear of the last stage's text, then one smooth bend
        var lane = clamp(headRight(rf) + 80, W * 0.55, W - 90), s3b = box(stages[stages.length - 1], rf).b;
        var sag = Math.min(34, (lane - te.r) * 0.06);
        K = [E, [W - 60, s3b + 30], [lane, Y - 90], [(lane + te.r) / 2, Y + sag], [te.r, Y], [te.l, Y]];
      }
      var cr = function (a, b, c, d, u) { return 0.5 * (2 * b + (c - a) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (3 * b - a - 3 * c + d) * u * u * u); }, out = [];
      for (var sg = 0; sg < K.length - 1; sg++) {
        var k0 = K[Math.max(0, sg - 1)], k1 = K[sg], k2 = K[sg + 1], k3 = K[Math.min(K.length - 1, sg + 2)];
        for (var q = 1; q <= 16; q++) { var u = q / 16; out.push([cr(k0[0], k1[0], k2[0], k3[0], u), cr(k0[1], k1[1], k2[1], k3[1], u)]); }
      }
      return { pts: out, uw: te.r - te.l, te: te, Y: Y };
    };
    // right edge of the contact headline's actual text (the h2 box itself spans the page)
    var headRight = function (rf) {
      var rg = document.createRange(), m = 0;
      rg.selectNodeContents(tense.closest('h2'));
      [].forEach.call(rg.getClientRects(), function (c) { m = Math.max(m, c.right); });
      return m - rf.left;
    };
    var smooth = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    var lengths = function (pts) { var acc = [0]; for (var a = 1; a < pts.length; a++) acc.push(acc[a - 1] + Math.hypot(pts[a][0] - pts[a - 1][0], pts[a][1] - pts[a - 1][1])); return acc; };
    var at = function (pts, acc, s) {
      var j = 0; while (j < pts.length - 2 && acc[j + 1] < s) j++;
      var f = clamp((s - acc[j]) / ((acc[j + 1] - acc[j]) || 1), 0, 1);
      return { j: j, p: [lerp(pts[j][0], pts[j + 1][0], f), lerp(pts[j][1], pts[j + 1][1], f)] };
    };
    var slice = function (pts, acc, s0, s1) {   // the stretch of a polyline between two arc lengths
      var a = at(pts, acc, s0), b = at(pts, acc, s1), out = [a.p];
      for (var k = a.j + 1; k <= b.j; k++) out.push(pts[k]);
      out.push(b.p);
      return out;
    };
    var poly = function (pts) { return 'M' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L'); };
    var arrow = function (pts, size) {   // arrowhead pointing along the curve's end
      if (size <= 0.5 || pts.length < 4) return '';
      var e = pts[pts.length - 1], b = pts[pts.length - 4], ang = Math.atan2(e[1] - b[1], e[0] - b[0]), d = '';
      [-0.5, 0.5].forEach(function (o) { d += ' M' + e[0].toFixed(1) + ',' + e[1].toFixed(1) + ' L' + (e[0] - size * Math.cos(ang + o)).toFixed(1) + ',' + (e[1] - size * Math.sin(ang + o)).toFixed(1); });
      return d;
    };
    var drawThread = function () {
      var W = fin.clientWidth, rf = fin.getBoundingClientRect(), shape = procShape(W, rf), phone = W < 900, d;
      tSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + fin.clientHeight);
      var p = reduced ? 1 : ST.p, q = reduced ? 0 : ST.q, cur = procPts(p, W, shape);
      var head = phone ? 0 : 16 * clamp((p - 0.85) / 0.15, 0, 1) * clamp(1 - q / 0.06, 0, 1);
      if (reduced) {   // both resting states at once (finished curve + underline); nothing travels
        var rr = route(W, rf, cur[N]);
        d = poly(cur) + arrow(cur, head) + ' M' + rr.te.r.toFixed(1) + ',' + rr.Y.toFixed(1) + ' L' + rr.te.l.toFixed(1) + ',' + rr.Y.toFixed(1);
      } else if (q <= 0) {
        var part = cur.slice(0, drawn(p) + 1);
        d = p > 0.001 ? poly(part) + arrow(part, head) : '';
      } else {   // released: the arrow keeps its head and extends down to the word; the tail lets go later
        var r = route(W, rf, cur[N]), all = cur.concat(r.pts), acc = lengths(all), Lc = acc[N], Lt = acc[acc.length - 1];
        var headS = lerp(Lc, Lt, smooth(0, 0.8, q)), tailS = lerp(0, Lt - r.uw, smooth(0.3, 1, q));
        var seg = slice(all, acc, tailS, headS);
        if (ST.wob) seg = seg.map(function (pt, k) { return [pt[0], pt[1] + ST.wob * Math.sin(Math.PI * k / (seg.length - 1))]; });
        d = poly(seg) + arrow(seg, (phone ? 10 : 16) * (1 - smooth(0.78, 0.96, q)));   // the head melts into the underline
        // a stage dot dims once the line has let go of it, so no dot is left floating on its own
        dots.forEach(function (dt) {
          var b = box(dt, rf), cx = (b.l + b.r) / 2, cy = (b.t + b.b) / 2, best = 0, bd = Infinity;
          for (var j = 0; j <= N; j++) { var dd = Math.pow(cur[j][0] - cx, 2) + Math.pow(cur[j][1] - cy, 2); if (dd < bd) { bd = dd; best = j; } }
          dt.style.opacity = tailS > acc[best] ? '0.25' : '';
        });
      }
      if (q <= 0 || reduced) dots.forEach(function (dt) { dt.style.opacity = ''; });
      tPath.setAttribute('d', d);
      tPath.style.strokeWidth = (2 + (reduced ? 0 : ST.q)).toFixed(2);
      // a step inks in the moment the growing line reaches its dot
      var tip = reduced || q > 0 ? N : drawn(p);
      stages.forEach(function (li, i) {
        var b = box(dots[i], rf), cx = (b.l + b.r) / 2, cy = (b.t + b.b) / 2, best = 0, bd = Infinity;
        for (var j = 0; j <= N; j++) { var dd = Math.pow(shape[j][0] - cx, 2) + Math.pow(shape[j][1] - cy, 2); if (dd < bd) { bd = dd; best = j; } }
        li.classList.toggle('on', reduced || (p > 0.001 && tip >= best));
      });
      // the reel's own line hands over the moment this one leaves the seam
      if (reelThread) reelThread.style.visibility = (ST.p > 0.001 || ST.q > 0) ? 'hidden' : '';
    };
    // the finished curve holds while the stages are read (process bottom 90% → contact top 55%), then releases
    if (!reduced) {
      ScrollTrigger.create({ trigger: proc, start: 'top 45%', end: 'bottom 90%', scrub: 0.6, refreshPriority: -1,
        onUpdate: function (self) { ST.p = self.progress; drawThread(); }, onRefresh: drawThread });
      // contact is the last section, so on short or tall phones the page can run out before its top
      // reaches 8%: the release always finishes within the scroll that actually exists
      var cTop = function () { return contact.getBoundingClientRect().top + scrollY; };
      var cEnd = function () { return Math.min(cTop() - innerHeight * 0.08, ScrollTrigger.maxScroll(window) - 2); };
      ScrollTrigger.create({ trigger: contact, scrub: 0.6, refreshPriority: -1,   // measured after the reel's pin
        start: function () { return Math.min(cTop() - innerHeight * 0.55, cEnd() - innerHeight * 0.3); }, end: cEnd,
        onUpdate: function (self) {
          ST.q = self.progress;
          if (ST.q > 0.995 && !settled) {   // it lands, gives once, then stillness
            settled = true;
            gsap.fromTo(ST, { wob: 7 }, { wob: 0, duration: 1.4, ease: 'elastic.out(1, 0.3)', onUpdate: drawThread });
            if (TD.pluckSound) TD.pluckSound(0.4, 0.3, 0);
          }
          if (ST.q < 0.6) settled = false;
          drawThread();
        },
        onRefresh: drawThread });
    }
    drawThread();
    addEventListener('resize', drawThread);
  }
  if (!reduced && document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  /* the services scene re-lays itself out ~150ms after a resize (proto-scene.js), i.e. after ScrollTrigger
     has already measured, which left the reel and the contact release on stale positions until a reload.
     Re-measure once the width has settled; height-only changes (phone address bar) are ignored. */
  if (!reduced) {
    var lastW = innerWidth, settle = null;
    addEventListener('resize', function () {
      if (innerWidth === lastW) return;
      lastW = innerWidth; clearTimeout(settle);
      settle = setTimeout(function () { ScrollTrigger.refresh(); }, 400);
    });
  }
})();
