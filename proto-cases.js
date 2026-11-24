/* Proof: three case "moments" and the working-with-us line,
   plus the contact ending.
   - The three moments are one pinned reel. Each reads complete before anything
     moves (client, service, statement, image); scrolling opens it to show what
     we did and one lead result, then the next case wipes in sideways.
     Figures are revealed, never animated.
   - The process line starts tangled and straightens as you scroll, lighting
     the three stages it connects.
   - Contact: a taut, jittery line crosses the screen and relaxes into the
     underline beneath "tension", then everything holds still.
   Depends on proto-core.js (window.TD), GSAP + ScrollTrigger. */
(function () {
  'use strict';
  var TD = window.TD || { reduced: true };
  var reduced = TD.reduced || !window.gsap || !window.ScrollTrigger;
  if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ── case moments: closed → open, per composition ── */
  var phone = matchMedia('(max-width: 899px)').matches;
  var OPEN = phone ? {   // phones: the image tops a column, so it simply opens to full
    wide: { from: 'inset(0% 0% 0% 0%)', to: 'inset(0% 0% 0% 0%)' },
    crop: { from: 'inset(6% 8% 6% 8%)', to: 'inset(0% 0% 0% 0%)' }
  } : {
    wide: { from: 'inset(0% 0% 0% 0%)', to: 'inset(0% 42% 0% 0%)' },    // full-bleed image gives way to the detail panel
    crop: { from: 'inset(7% 12% 7% 12%)', to: 'inset(0% 0% 0% 0%)' }    // a large crop (result already on it) opens to the whole picture
  };
  /* type: the photo inside the 8 is aligned to the full frame, so when the frame grows out of
     the numeral's box it reads as the picture spilling out of the 8 */
  function alignNumeral(num, media) {
    var im = media.querySelector('img'), nw = im.naturalWidth || 1600, nh = im.naturalHeight || 1000;
    var mr = media.getBoundingClientRect(), nr = num.getBoundingClientRect();
    var k = Math.max(mr.width / nw, mr.height / nh), bw = nw * k, bh = nh * k;
    num.style.backgroundSize = bw.toFixed(1) + 'px ' + bh.toFixed(1) + 'px';
    num.style.backgroundPosition = ((mr.width - bw) / 2 - (nr.left - mr.left)).toFixed(1) + 'px ' + ((mr.height - bh) / 2 - (nr.top - mr.top)).toFixed(1) + 'px';
    var c = function (v) { return Math.max(0, v).toFixed(1) + 'px'; };   // the numeral's box, as an inset of the frame
    return 'inset(' + c(nr.top - mr.top) + ' ' + c(mr.right - nr.right) + ' ' + c(mr.bottom - nr.bottom) + ' ' + c(nr.left - mr.left) + ')';
  }
  /* One reel: the cases pin together as a single scene. Each opens, holds, then the next
     wipes in from the right while the last drifts left; a counter and three bars stay put
     across the whole reel, so it reads as one continuous piece rather than three sections. */
  var reel = document.querySelector('.cases'), moments = [].slice.call(document.querySelectorAll('.moment'));
  var hudI = document.getElementById('reel-i'), bars = [].slice.call(document.querySelectorAll('.reel-bars i b'));
  if (reduced || !reel) {   // no motion: each moment sits in the flow, already open
    moments.forEach(function (m) {
      var num = m.querySelector('.m-numeral');
      m.classList.add('open'); m.querySelector('.m-media').style.clipPath = 'none'; if (num) num.style.opacity = 0;
    });
  } else {
    reel.classList.add('is-reel');
    var tl = gsap.timeline({ scrollTrigger: { trigger: reel, start: 'top top', end: '+=' + (phone ? 300 : 360) + '%',
      pin: true, scrub: 0.6, onRefresh: function () { realign(); tl.invalidate(); } } });
    var aligners = [], marks = [];
    var realign = function () { aligners.forEach(function (f) { f(); }); };
    moments.forEach(function (m, i) {
      var comp = m.dataset.comp, media = m.querySelector('.m-media'), detail = m.querySelector('.m-detail');
      var num = m.querySelector('.m-numeral'), img = media.querySelector('img'), stmt = m.querySelector('.m-statement');
      var t = tl.duration() + (i ? 0 : 0.15);   // the first moment reads complete before anything moves
      if (i) {   // the hand-off: the next case wipes in from the right, the last drifts left beneath it
        var prev = moments[i - 1];
        gsap.set(m, { clipPath: 'inset(0% 0% 0% 100%)' });
        tl.to(m, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'power3.inOut' }, t)
          .to(prev, { xPercent: -14, duration: 0.7, ease: 'power3.inOut' }, t)
          .set(prev, { autoAlpha: 0 }, t + 0.7);
        marks.push(t + 0.35);
        t += 0.7;
      }
      if (num) {   // the photo-filled 8; the frame fades in over it and grows out of its box
        var box = function () { return alignNumeral(num, media); };
        aligners.push(box);
        gsap.set(media, { autoAlpha: 0, clipPath: box() });
        tl.fromTo(media, { clipPath: box }, { clipPath: 'inset(0px 0px 0px 0px)', duration: 1, ease: 'power2.inOut', immediateRender: false }, t)
          .fromTo(media, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18, ease: 'none', immediateRender: false }, t + 0.02)
          .to(num, { opacity: 0, duration: 0.3, ease: 'power1.in' }, t + 0.12);
        if (img.decode) img.decode().then(function () { ScrollTrigger.refresh(); }, function () {});
      } else {
        gsap.set(media, { clipPath: OPEN[comp].from });
        tl.to(media, { clipPath: OPEN[comp].to, duration: 1, ease: 'power2.inOut' }, t)
          .fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1, ease: 'power2.out' }, t);
      }
      // phones: the statement gives its place to the details, so each case still fits one screen
      if (phone) tl.to(stmt, { autoAlpha: 0, duration: 0.25, ease: 'power1.in' }, t + 0.3);
      tl.fromTo(detail, { autoAlpha: 0, x: phone ? 0 : 40 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power2.out', immediateRender: false }, t + (phone ? 0.58 : 0.45));
      gsap.set(detail, { autoAlpha: 0 });
      tl.to({}, { duration: 0.3 }, t + 1);   // a short hold on the open composition
    });
    var shown = -1;
    var hud = function () {
      var time = tl.time(), idx = 0, segs = [0].concat(marks, [tl.duration()]);
      marks.forEach(function (mk, k) { if (time >= mk) idx = k + 1; });
      if (idx !== shown) { shown = idx; hudI.textContent = '0' + (idx + 1); }
      bars.forEach(function (bar, k) {   // each bar fills across its own case's stretch
        var f = Math.min(1, Math.max(0, (time - segs[k]) / (segs[k + 1] - segs[k])));
        bar.style.transform = 'scaleX(' + f.toFixed(3) + ')';
      });
    };
    tl.eventCallback('onUpdate', hud); hud();
  }

  /* ── the working-with-us line ── */
  var proc = document.getElementById('process');
  if (proc) {
    var pPath = document.getElementById('proc-path'), pSvg = document.getElementById('proc-line');
    var stages = [].slice.call(proc.querySelectorAll('.proc-stages li')), dots = stages.map(function (li) { return li.querySelector('.proc-dot'); });
    var P = { p: reduced ? 1 : 0 };
    var drawProc = function () {
      var W = proc.clientWidth, H = proc.clientHeight, r0 = proc.getBoundingClientRect(), d0 = dots[0].getBoundingClientRect();
      var y0 = d0.top + d0.height / 2 - r0.top, amp = 64 * Math.pow(1 - P.p, 1.4), pts = [];
      pSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      if (W < 900) {   // phones: the stages stack, so the line runs down through the dots
        var dl = dots[dots.length - 1].getBoundingClientRect(), x0 = d0.left + d0.width / 2 - r0.left;
        var ya = d0.top - r0.top - 40, yb = dl.bottom - r0.top + 10, a = 26 * Math.pow(1 - P.p, 1.4);
        for (var q = 0; q <= 60; q++) {
          var yy = lerp(ya, yb, q / 60), ev = Math.sin(Math.PI * q / 60);
          pts.push((q ? 'L' : 'M') + (x0 + a * ev * (Math.sin(yy * 0.05) + 0.6 * Math.sin(yy * 0.13 + 1))).toFixed(1) + ',' + yy.toFixed(1));
        }
        pPath.setAttribute('d', pts.join(' '));
        stages.forEach(function (li, i) { li.classList.toggle('on', P.p >= [0.12, 0.5, 0.88][i]); });
        return;
      }
      // desktop: the line settles into a rising curve through the stepped-up dots, then kicks
      // upward past the last stage (growth, not a flatline); the tangle rides on top of it
      var cs = dots.map(function (d) { var r = d.getBoundingClientRect(); return [r.left + r.width / 2 - r0.left, r.top + r.height / 2 - r0.top]; });
      var last = cs[cs.length - 1], rise = Math.min(180, last[1] - 30);
      var K = [[0, cs[0][1] + 34]].concat(cs, [[W, last[1] - rise]]);
      var cr = function (a, b, c, d, u) { return 0.5 * (2 * b + (c - a) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (3 * b - a - 3 * c + d) * u * u * u); };
      for (var sg = 0; sg < K.length - 1; sg++) {
        var k0 = K[Math.max(0, sg - 1)], k1 = K[sg], k2 = K[sg + 1], k3 = K[Math.min(K.length - 1, sg + 2)];
        for (var q2 = sg ? 1 : 0; q2 <= 24; q2++) {
          var u = q2 / 24, x = cr(k0[0], k1[0], k2[0], k3[0], u), base = cr(k0[1], k1[1], k2[1], k3[1], u);
          var env = Math.sin(Math.PI * Math.min(1, x / W));
          var y = lerp(y0, base, 1 - Math.pow(1 - P.p, 2)) + amp * env * (Math.sin(x * 0.029) + 0.6 * Math.sin(x * 0.081 + 1.3) + 0.35 * Math.sin(x * 0.19 + 0.4)) / 1.6;
          pts.push((pts.length ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1));
        }
      }
      if (P.p > 0.85) {   // the arrowhead arrives with the finished curve, pointing along its end
        var ah = 16 * Math.min(1, (P.p - 0.85) / 0.15), pe = pts[pts.length - 1].slice(1).split(','), pb = pts[pts.length - 4].slice(1).split(',');
        var ex = +pe[0], ey = +pe[1], ang = Math.atan2(ey - pb[1], ex - pb[0]);
        [-0.5, 0.5].forEach(function (o) {
          pts.push('M' + ex.toFixed(1) + ',' + ey.toFixed(1) + ' L' + (ex - ah * Math.cos(ang + o)).toFixed(1) + ',' + (ey - ah * Math.sin(ang + o)).toFixed(1));
        });
      }
      pPath.setAttribute('d', pts.join(' '));
      stages.forEach(function (li, i) { li.classList.toggle('on', P.p >= [0.12, 0.5, 0.88][i]); });
    };
    if (reduced) drawProc();
    else gsap.to(P, { p: 1, ease: 'none', onUpdate: drawProc,
      scrollTrigger: { trigger: proc, start: 'top 45%', end: 'bottom 70%', scrub: 0.6, onRefresh: drawProc } });
    addEventListener('resize', drawProc);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawProc);
  }

  /* ── contact: the taut line relaxes into the underline ── */
  var contact = document.getElementById('contact'), tense = document.getElementById('tense');
  var tPath = document.getElementById('taut-path'), tSvg = document.getElementById('taut');
  if (contact && tense && tPath) {
    var T = { p: reduced ? 1 : 0, wob: 0 }, settled = reduced, t0 = performance.now();
    var drawTaut = function () {
      var W = contact.clientWidth, H = contact.clientHeight, rc = contact.getBoundingClientRect(), re = tense.getBoundingClientRect();
      var L = re.left - rc.left, R = re.right - rc.left, Y = re.bottom - rc.top - re.height * 0.06;
      var e = 1 - Math.pow(1 - T.p, 3);
      var x0 = lerp(-24, L, e), x1 = lerp(W + 24, R, e);
      var amp = 9 * (1 - e), n = Math.max(12, Math.round((x1 - x0) / 20)), ph = (performance.now() - t0) / 70;
      tSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var pts = [];
      for (var k = 0; k <= n; k++) {
        var tooth = (k === 0 || k === n) ? 0 : (k % 2 ? -1 : 1) * (amp + 0.8 * amp * Math.sin(ph + k));   // taut lines buzz
        var wob = T.wob * Math.sin(Math.PI * k / n);                                                     // the final slack
        pts.push((k ? 'L' : 'M') + lerp(x0, x1, k / n).toFixed(1) + ',' + (Y + tooth + wob).toFixed(1));
      }
      tPath.setAttribute('d', pts.join(' '));
    };
    drawTaut();
    if (!reduced) {
      ScrollTrigger.create({ trigger: contact, start: 'top 85%', end: 'top 12%', scrub: 0.5,
        onUpdate: function (self) {
          T.p = self.progress;
          if (T.p > 0.995 && !settled) {   // one soft settle, then stillness
            settled = true;
            gsap.fromTo(T, { wob: 7 }, { wob: 0, duration: 1.4, ease: 'elastic.out(1, 0.3)', onUpdate: drawTaut });
            if (TD.pluckSound) TD.pluckSound(0.4, 0.3, 0);
          }
          if (T.p < 0.6) settled = false;
          drawTaut();
        },
        onRefresh: drawTaut });
      // the buzz only runs while the line is still taut and on screen
      gsap.ticker.add(function () {
        if (T.p > 0.02 && T.p < 0.995) drawTaut();
      });
    }
    addEventListener('resize', drawTaut);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawTaut);
  }
})();
