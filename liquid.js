/* Tensionless Digital — liquid chrome atmosphere + HUD telemetry */
(function () {
  'use strict';

  var docEl = document.documentElement;
  var rm = docEl.classList.contains('rm');
  var lod = docEl.classList.contains('lod-low') ? 'low' : (docEl.classList.contains('lod-medium') ? 'medium' : 'high');

  /* ── liquid canvas atmosphere ─────────────────────────────────── */
  function initLiquid() {
    var cv = document.getElementById('liquid');
    if (!cv || rm || lod === 'low') return;
    var ctx = cv.getContext('2d');
    var W, H, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    var scroll = 0; /* 0..1 — feeds blob drift so the field shifts as you move through the page */

    var blobs = [];
    var PALETTE = [
      ['rgba(230,236,243,', 'rgba(120,138,158,'],   // bright chrome
      ['rgba(168,192,214,', 'rgba(90,110,132,'],
      ['rgba(110,231,214,', 'rgba(60,120,140,'],    // teal glint
      ['rgba(143,176,255,', 'rgba(80,100,170,']     // blue glint
    ];
    var COUNT = lod === 'medium' ? 7 : 10;

    function makeBlob() {
      return {
        x: Math.random(), y: Math.random(),
        r: 0.14 + Math.random() * 0.26,
        drift: Math.random() * Math.PI * 2,
        sp: 0.1 + Math.random() * 0.22,
        o: 0.07 + Math.random() * 0.11,
        c: PALETTE[Math.floor(Math.random() * PALETTE.length)]
      };
    }
    for (var i = 0; i < COUNT; i++) blobs.push(makeBlob());

    function resize() {
      W = cv.width = Math.round(window.innerWidth * dpr);
      H = cv.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    window.addEventListener('mousemove', function (e) {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    });

    function scrollProgress() {
      var max = (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight;
      return max > 0 ? window.scrollY / max : 0;
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      scroll += (scrollProgress() - scroll) * 0.04;

      for (var i = 0; i < blobs.length; i++) {
        var b = blobs[i];
        b.drift += 0.0022 + scroll * 0.0012;
        var bx = b.x + Math.sin(b.drift) * 0.08 + (mouse.x - 0.5) * b.o * 3.2 + scroll * 0.05;
        var by = b.y + Math.cos(b.drift * 1.3) * 0.08 + (mouse.y - 0.5) * b.o * 3.2 - scroll * 0.05;
        var px = bx * W, py = by * H, r = b.r * Math.min(W, H);
        var g = ctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, b.c[0] + (b.o + 0.07) + ')');
        g.addColorStop(1, b.c[1] + '0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }

      /* slow diagonal sheen sweep across the field */
      var sweep = (scroll * 1.4 + performance.now() * 0.00004) % 2 - 1;
      var sx = (sweep * 0.7 + 0.15) * W;
      var sg = ctx.createLinearGradient(sx - W * 0.4, 0, sx + W * 0.4, H * 0.6);
      sg.addColorStop(0, 'rgba(255,255,255,0)');
      sg.addColorStop(0.5, 'rgba(214,226,240,0.05)');
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, W, H);

      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ── HUD crosshair + jittering telemetry ──────────────────────── */
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

  window.tdLiquid = { initLiquid: initLiquid, initHud: initHud };
})();
