(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;
  var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch) return;
  if (!window.gsap) return;

  var html = document.documentElement;

  /* ═══════════════════════════════════════════════════════════════
     1. Custom Cursor — dot + ring, ring expands on hoverables
     ═══════════════════════════════════════════════════════════════ */

  var dot = document.createElement('div');
  dot.id = 'cursor-dot';
  var ring = document.createElement('div');
  ring.id = 'cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  html.classList.add('custom-cursor');

  var mouse = { x: -100, y: -100 };
  var dotPos = { x: -100, y: -100 };
  var ringPos = { x: -100, y: -100 };
  var ringScale = 1;
  var visible = false;

  function animCursor() {
    if (!visible) { requestAnimationFrame(animCursor); return; }

    dotPos.x += (mouse.x - dotPos.x) * 0.25;
    dotPos.y += (mouse.y - dotPos.y) * 0.25;
    ringPos.x += (mouse.x - ringPos.x) * 0.08;
    ringPos.y += (mouse.y - ringPos.y) * 0.08;

    dot.style.transform = 'translate(' + dotPos.x + 'px,' + dotPos.y + 'px) translate(-50%,-50%)';
    ring.style.transform = 'translate(' + ringPos.x + 'px,' + ringPos.y + 'px) translate(-50%,-50%) scale(' + ringScale + ')';

    requestAnimationFrame(animCursor);
  }

  document.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (!visible) {
      visible = true;
      dotPos.x = mouse.x; dotPos.y = mouse.y;
      ringPos.x = mouse.x; ringPos.y = mouse.y;
      gsap.set([dot, ring], { autoAlpha: 1 });
    }
  });

  document.addEventListener('mouseleave', function () {
    visible = false;
    gsap.set([dot, ring], { autoAlpha: 0 });
  });

  var hoverSel = 'a, button, .svc-card, .cs-panel, .btn-base, input, textarea, .nav-toggle, select, .imm-dot';
  document.addEventListener('mouseenter', function (e) {
    if (e.target.closest(hoverSel)) {
      ringScale = 1.8;
      gsap.to(dot, { scale: 0.3, duration: 0.2, ease: 'power2.out' });
    }
  }, true);
  document.addEventListener('mouseleave', function (e) {
    if (e.target.closest(hoverSel)) {
      ringScale = 1;
      gsap.to(dot, { scale: 1, duration: 0.3, ease: 'power2.out' });
    }
  }, true);

  animCursor();

  /* ═══════════════════════════════════════════════════════════════
     2. Magnetic Buttons — follow cursor within bounds
     ═══════════════════════════════════════════════════════════════ */

  var magneticEls = document.querySelectorAll('[data-magnetic]');
  magneticEls.forEach(function (el) {
    var cx = 0, cy = 0;
    var ticking = false;

    el.addEventListener('mouseenter', function () {
      var r = el.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
      ticking = false;
    });

    el.addEventListener('mousemove', function (e) {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var dx = e.clientX - cx;
        var dy = e.clientY - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var maxDist = 120;
        var str = Math.max(0, 1 - dist / maxDist);
        var range = 10;
        gsap.to(el, {
          x: dx * str * (range / maxDist),
          y: dy * str * (range / maxDist),
          duration: 0.3, ease: 'power2.out', overwrite: 'auto'
        });
        ticking = false;
      });
    });

    el.addEventListener('mouseleave', function () {
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
    });
  });

  /* ═══════════════════════════════════════════════════════════════
     3. Content Parallax — decorative elements drift with mouse
        Uses CSS translate property (NOT transform) to avoid
        conflicting with CSS animations or ScrollTrigger timelines.
     ═══════════════════════════════════════════════════════════════ */

  var parallaxEls = document.querySelectorAll('[data-parallax]');
  parallaxEls.forEach(function (el) {
    var depth = parseFloat(el.getAttribute('data-parallax')) || 0.05;
    var ticking = false;

    el.addEventListener('mousemove', function (e) {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var rect = el.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty('--px', (x * depth * 100).toFixed(1) + 'px');
        el.style.setProperty('--py', (y * depth * 100).toFixed(1) + 'px');
        ticking = false;
      });
    });

    el.addEventListener('mouseleave', function () {
      el.style.setProperty('--px', '0px');
      el.style.setProperty('--py', '0px');
    });
  });

})();
