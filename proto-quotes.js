/* What our clients say: quotes pegged to a washing line.
   - Drag sideways: the line carries the cards; let go and the nearest quote settles in front.
   - Pull the line down and let go: it twangs and the side cards bounce; the card being read stays put.
   - Tap a side card to bring it forward; ‹ › buttons and arrow keys do the same.
   Cards swing on their pegs while moving and hang straight and still once settled,
   so the quote in front is always easy to read. Reduced motion: instant switches, no swing.
   Works for any number of cards. Depends on proto-core.js (window.TD). */
(function () {
  'use strict';
  var TD = window.TD || { reduced: true };
  var stage = document.getElementById('q-stage');
  if (!stage) return;
  var cards = [].slice.call(stage.querySelectorAll('.q-card'));
  var N = cards.length;
  if (N < 2) return;
  var path = document.getElementById('q-line-path'), svg = stage.querySelector('.q-line');
  var countEl = document.getElementById('q-i'), totalEl = document.getElementById('q-n'), hint = document.getElementById('q-hint');
  var reduced = TD.reduced;

  var WIRE_TOP = 34, SAG = 26, TILT = 5;          // px, px, degrees for side cards
  var W = 0, cw = 0, spacing = 0, phone = false;
  var pos = 0, vel = 0, target = 0;               // pos: which card is in front (fractional while moving)
  var bow = 0, bowV = 0, bowX = 0;                // the pulled-down dip in the line and where it is
  var swing = cards.map(function () { return { a: 0, v: 0 }; });
  var drag = null, raf = 0, current = -1;

  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var mod = function (n, m) { return ((n % m) + m) % m; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  // where card i sits relative to the front, wrapped so the line loops
  var offset = function (i) { var d = mod(i - pos, N); return d > N / 2 ? d - N : d; };
  var restY = function (x) { return WIRE_TOP + SAG * Math.sin(Math.PI * clamp(x / W, 0, 1)); };
  var wireY = function (x) { return restY(x) + bow * Math.exp(-Math.pow((x - bowX) / (W * 0.28), 2)); };
  // the card being read keeps a stable position: the closer to the front, the less the line moves it
  var calm = function (ad) { return clamp(ad * 2, 0, 1); };

  function layout() {
    W = stage.clientWidth;
    phone = W < 700;
    cw = phone ? Math.round(W * 0.82) : Math.min(560, Math.round(W * 0.4));
    spacing = phone ? cw * 0.94 : cw * 0.95;
    stage.style.setProperty('--q-w', cw + 'px');
    var h = 0;
    cards.forEach(function (c) { h = Math.max(h, c.offsetHeight); });
    stage.style.height = Math.ceil(WIRE_TOP + SAG + h + 70) + 'px';
    if (!bowX) bowX = W / 2;
    render();
  }

  function render() {
    var front = mod(Math.round(pos), N);
    cards.forEach(function (c, i) {
      var d = offset(i), ad = Math.abs(d);
      var x = W / 2 + d * spacing, peg = restY(x) + (wireY(x) - restY(x)) * calm(ad);
      var scale = 1 - 0.18 * clamp(ad, 0, 1);
      var rot = clamp(d, -1, 1) * TILT * (i % 2 ? 1 : 0.7) + swing[i].a * (0.35 + 0.65 * calm(ad));
      c.style.transform = 'translate(' + (x - cw / 2).toFixed(1) + 'px,' + (peg - 2).toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
      c.style.opacity = clamp(2.7 - ad, 0, 1).toFixed(3);
      c.style.zIndex = String(100 - Math.round(ad * 10));
      c.style.visibility = ad > 2.7 ? 'hidden' : '';
      var on = i === front;
      c.classList.toggle('on', on);
      c.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    // the line: edge to edge, through every peg (pegs sit on it by construction)
    var pts = [], steps = 64;
    for (var k = 0; k <= steps; k++) { var px = -20 + (W + 40) * k / steps; pts.push(px.toFixed(1) + ',' + wireY(px).toFixed(1)); }
    path.setAttribute('d', 'M' + pts.join(' L'));
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + stage.clientHeight);
    if (front !== current) {
      current = front;
      countEl.textContent = pad(front + 1);
    }
  }

  function energy() {
    var e = Math.abs(target - pos) + Math.abs(vel) + Math.abs(bow) + Math.abs(bowV);
    swing.forEach(function (s) { e += Math.abs(s.a) * 0.1 + Math.abs(s.v); });
    return e;
  }

  function step() {
    raf = 0;
    if (!drag) {                                   // settle on the target card
      vel += (target - pos) * 0.07; vel *= 0.76; pos += vel;
    }
    if (!drag || drag.mode !== 'pull') {           // the line springs back and twangs
      bowV += -bow * 0.16; bowV *= 0.88; bow += bowV;
    }
    var cardVx = -vel * spacing;                   // cards swing against the way they travel
    swing.forEach(function (s, i) {
      var lift = bowV * Math.exp(-Math.pow((W / 2 + offset(i) * spacing - bowX) / (W * 0.28), 2));
      s.v += -s.a * 0.09 - cardVx * 0.018 + lift * 0.02 * (i % 2 ? 1 : -1) * calm(Math.abs(offset(i)));
      s.v *= 0.88; s.a = clamp(s.a + s.v, -8, 8);
    });
    render();
    if (drag || energy() > 0.02) raf = requestAnimationFrame(step);
    else { pos = target = Math.round(target); vel = bow = bowV = 0; swing.forEach(function (s) { s.a = s.v = 0; }); render(); }
  }
  var kick = function () { if (!raf && !reduced) raf = requestAnimationFrame(step); };   // reduced motion: no physics loop at all

  function go(to) {
    target = to;
    if (hint) hint.classList.add('gone');
    if (reduced) { pos = target; render(); return; }
    kick();
  }
  var goBy = function (n) { go(Math.round(target) + n); };

  // ── pointer: sideways drag moves the line; a downward pull bows it; a tap picks a card
  stage.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    var r = stage.getBoundingClientRect();
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, p0: pos, mode: null, lx: e.clientX, lt: e.timeStamp, vx: 0,
      card: e.target.closest && e.target.closest('.q-card'), left: r.left };
  });
  stage.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.mode) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      drag.mode = (!reduced && e.pointerType === 'mouse' && dy > Math.abs(dx)) ? 'pull' : 'slide';
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('dragging');
      if (hint) hint.classList.add('gone');
      kick();
    }
    if (drag.mode === 'slide') {
      var dt = Math.max(1, e.timeStamp - drag.lt);
      drag.vx = 0.7 * drag.vx + 0.3 * ((e.clientX - drag.lx) / dt);
      drag.lx = e.clientX; drag.lt = e.timeStamp;
      var np = drag.p0 - dx / spacing;
      vel = np - pos; pos = np;
      if (reduced) render();
    } else {
      bowX = e.clientX - drag.left;
      bow = 150 * Math.tanh(Math.max(0, dy) / 200);   // resists more the further you pull
      bowV = 0;
    }
  });
  function release(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null;
    stage.classList.remove('dragging');
    if (!d.mode) {                                   // a tap
      if (d.card) {
        var off = offset(cards.indexOf(d.card));
        if (Math.abs(off) > 0.5) go(Math.round(pos + off));
      }
      return;
    }
    if (d.mode === 'slide') {
      // a flick or a drag past 15% of a card always moves at least one card, never skips on a flick
      var base = Math.round(d.p0), moved = pos + clamp(-d.vx * 120 / spacing, -0.6, 0.6) - base;
      go(Math.abs(moved) < 0.15 ? base : base + Math.sign(moved) * Math.max(1, Math.round(Math.abs(moved))));
    } else {
      swing.forEach(function (s, i) { s.v += (Math.random() - 0.5) * 2.4 * calm(Math.abs(offset(i))); });
      kick();
    }
  }
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('dragstart', function (e) { e.preventDefault(); });

  stage.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { goBy(1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { goBy(-1); e.preventDefault(); }
  });
  document.getElementById('q-prev').addEventListener('click', function () { goBy(-1); });
  document.getElementById('q-next').addEventListener('click', function () { goBy(1); });

  if (totalEl) totalEl.textContent = pad(N);
  stage.classList.add('is-live');
  layout();
  if (window.ResizeObserver) new ResizeObserver(function () { if (stage.clientWidth !== W) layout(); }).observe(stage);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);   // card heights change once the serif loads
})();
