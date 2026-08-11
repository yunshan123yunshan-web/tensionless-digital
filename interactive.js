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
  // Capture-phase entry into the page can target the document itself, which
  // has no .closest — guard on nodeType 1 (Element) before walking up.
  document.addEventListener('mouseenter', function (e) {
    if (e.target && e.target.nodeType === 1 && e.target.closest(hoverSel)) {
      ringScale = 1.8;
      gsap.to(dot, { scale: 0.3, duration: 0.2, ease: 'power2.out' });
    }
  }, true);
  document.addEventListener('mouseleave', function (e) {
    if (e.target && e.target.nodeType === 1 && e.target.closest(hoverSel)) {
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

  /* ═══════════════════════════════════════════════════════════════
     4. Tilt Cards — subtle 3D rotate + spotlight glare position
     ═══════════════════════════════════════════════════════════════ */

  var tiltEls = document.querySelectorAll('[data-tilt]');
  tiltEls.forEach(function (el) {
    var ticking = false;
    var rect = el.getBoundingClientRect();

    el.addEventListener('mouseenter', function () {
      rect = el.getBoundingClientRect();
    });

    el.addEventListener('mousemove', function (e) {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        gsap.to(el, {
          rotationX: (0.5 - py) * 10,
          rotationY: (px - 0.5) * 12,
          transformPerspective: 900,
          duration: 0.4,
          ease: 'power2.out',
          overwrite: 'auto'
        });
        el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
        ticking = false;
      });
    });

    el.addEventListener('mouseleave', function () {
      gsap.to(el, { rotationX: 0, rotationY: 0, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
      el.style.setProperty('--gx', '50%');
      el.style.setProperty('--gy', '0%');
    });
  });

  /* ═══════════════════════════════════════════════════════════════
     5. Chapter Rail — click-to-jump, active highlight, progress fill,
        act-card chapter-cut label
     ═══════════════════════════════════════════════════════════════ */

  var rail = document.getElementById('chapters');
  var fill = document.getElementById('chapters-fill');
  var actCard = document.getElementById('act-card');
  if (rail && fill) {
    var chapLinks = Array.prototype.slice.call(rail.querySelectorAll('.chap'));
    var ACTS = [
      { name: 'Manifest', num: '01' },
      { name: 'Arsenal', num: '02' },
      { name: 'Proof', num: '03' },
      { name: 'Verdict', num: '04' },
      { name: 'Craft', num: '05' },
      { name: 'Connect', num: '06' }
    ];
    var starts = [];
    var maxScroll = 1;
    var currentChap = -1;
    var ticking = false;

    function measureChapters() {
      starts = chapLinks.map(function (link) {
        var el = document.querySelector(link.getAttribute('href'));
        return el ? el.offsetTop : 0;
      });
      maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    }
    measureChapters();

    function chapterIndex(y) {
      var idx = 0;
      for (var i = 0; i < starts.length; i += 1) {
        if (y >= starts[i]) idx = i;
      }
      return idx;
    }

    function flashActCard(idx) {
      var a = ACTS[idx] || ACTS[0];
      var numEl = actCard.querySelector('.act-card-num');
      var nameEl = actCard.querySelector('.act-card-name');
      if (numEl) numEl.textContent = a.num;
      if (nameEl) nameEl.textContent = a.name;
      gsap.killTweensOf(actCard);
      gsap.fromTo(actCard, { autoAlpha: 0, scale: 0.96 },
        { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'power2.out' });
      gsap.to(actCard, { autoAlpha: 0, scale: 0.98, duration: 0.8, ease: 'power2.in', delay: 1.6 });
    }

    function paintChapter(idx) {
      if (idx === currentChap) return;
      currentChap = idx;
      chapLinks.forEach(function (link, i) {
        link.classList.toggle('active', i === idx);
      });
      if (actCard) flashActCard(idx);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        fill.style.height = (Math.min(1, y / maxScroll) * 100).toFixed(2) + '%';
        paintChapter(chapterIndex(y));
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    // Initial state — paint active chapter without flashing an act card.
    currentChap = chapterIndex(window.scrollY);
    chapLinks.forEach(function (link, i) {
      link.classList.toggle('active', i === currentChap);
    });
    onScroll();
  }

  // Smooth-scroll any in-page hash link (chapter rail, nav, hero, footer).
  // Excludes the skip link so keyboard focus still jumps natively.
  // Driven by a GSAP tween (not native behavior:'smooth') because native
  // smooth-scroll drops a new scrollTo issued while the previous animation
  // is still settling — a real user clicking chapters in a row would hit it.
  var scrollTween = null;
  function smoothScrollTo(top) {
    var state = { y: window.scrollY };
    if (scrollTween) scrollTween.kill();
    var dist = Math.abs(top - state.y);
    var dur = Math.min(1.6, Math.max(0.7, 0.5 + dist / 2500));
    scrollTween = gsap.to(state, {
      y: top,
      duration: dur,
      ease: 'power2.inOut',
      onUpdate: function () { window.scrollTo({ top: state.y, behavior: 'instant' }); },
      onComplete: function () {
        scrollTween = null;
        window.scrollTo({ top: top, behavior: 'instant' });
      }
    });
  }
  // Let a manual wheel interrupt the jump instead of fighting the user.
  window.addEventListener('wheel', function () {
    if (scrollTween) { scrollTween.kill(); scrollTween = null; }
  }, { passive: true });

  document.addEventListener('click', function (e) {
    var link = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!link || link.classList.contains('skip-link')) return;
    var href = link.getAttribute('href');
    if (!href || href.length < 2) return;
    var target = document.getElementById(href.slice(1));
    var top = target ? target.offsetTop : 0;
    if (Math.abs(window.scrollY - top) < 4) return;
    e.preventDefault();
    smoothScrollTo(top);
  });

  // Re-measure chapter boundaries when the layout shifts.
  var measureTick = false;
  function reMeasure() {
    if (measureTick) return;
    measureTick = true;
    requestAnimationFrame(function () {
      measureChapters();
      paintChapter(chapterIndex(window.scrollY));
      measureTick = false;
    });
  }
  window.addEventListener('resize', reMeasure);
  window.addEventListener('load', reMeasure);

})();
