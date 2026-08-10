/**
 * Hero — Cinematic Opening + Char-Split Headline + Scroll Fade-Out
 *
 * Sequence (desktop, full motion):
 *  1. #boot veil — three chrome title lines reveal progressively, then the
 *     veil fades, revealing the liquid canvas already animating behind it.
 *  2. #hero-h1 is split into <span class="ch"> chars (preserving the serif
 *     <em>), then flipped in with a char stagger.
 *  3. A scrubbed ScrollTrigger fades hero text to 0 as the section leaves the
 *     viewport — pure opacity, no translation (hard rule).
 *
 * Reduced motion (.rm): boot is hidden by CSS and the headline is never split;
 * everything stays visible. Low LOD: boot still plays (it is text-only).
 */

(function () {
  var rm = document.documentElement.classList.contains('rm');
  var boot = document.getElementById('boot');
  var h1 = document.getElementById('hero-h1');

  // No GSAP, no animation — never let the boot veil trap the page.
  if (!window.gsap || !window.ScrollTrigger) {
    if (boot) boot.style.display = 'none';
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  var FADE_TARGETS = '.hero-inner, .hero-scrollhint, .hud, .hud-cross';

  // Hero scroll fade-out — works in every mode (opacity only).
  ScrollTrigger.create({
    trigger: '#hero-pin',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: function (self) {
      gsap.set(FADE_TARGETS, { autoAlpha: 1 - self.progress });
    }
  });

  if (rm) {
    if (boot) boot.style.display = 'none';
    return;
  }

  /* ── Char split ─────────────────────────────────────────────── */
  function splitChars(el) {
    Array.prototype.slice.call(el.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        if (!child.textContent.trim()) return;
        var frag = document.createDocumentFragment();
        Array.prototype.forEach.call(child.textContent, function (c) {
          var s = document.createElement('span');
          s.className = 'ch';
          s.textContent = c === ' ' ? ' ' : c;
          frag.appendChild(s);
        });
        el.replaceChild(frag, child);
      } else if (child.nodeType === 1 && child.tagName.toLowerCase() === 'em') {
        splitChars(child);
      }
    });
  }

  function play() {
    if (!h1) return;

    splitChars(h1);

    gsap.set('.hero-h1 .ch', {
      autoAlpha: 0,
      rotationX: 40,
      y: 18,
      transformOrigin: '50% 100%',
      transformPerspective: 700
    });
    gsap.set(['.hero-eyebrow', '.hero-sub', '.hero-actions', '.hero-scrollhint'], { autoAlpha: 0 });

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to('.boot-title', { autoAlpha: 1, duration: 0.7, stagger: 0.34 }, 0.1)
      .to('.boot-mono', { autoAlpha: 1, duration: 0.6 }, 1.2)
      .to('#boot', { autoAlpha: 0, duration: 0.75, ease: 'power2.inOut' }, 1.85)
      .set('#boot', { display: 'none' }, 2.6)
      .to('.hero-h1 .ch', { autoAlpha: 1, rotationX: 0, y: 0, duration: 1.1, stagger: 0.016 }, 1.7)
      .to('.hero-eyebrow', { autoAlpha: 1, duration: 0.6 }, 1.7)
      .to('.hero-sub', { autoAlpha: 1, duration: 0.6 }, 1.95)
      .to('.hero-actions', { autoAlpha: 1, duration: 0.6 }, 2.1)
      .to('.hero-scrollhint', { autoAlpha: 1, duration: 0.9, ease: 'power1.out' }, 2.45);

    // Skippable — first real scroll jumps straight to the end.
    var skipped = false;
    function skip() {
      if (skipped || window.scrollY < 20) return;
      skipped = true;
      window.removeEventListener('scroll', skip, { passive: true });
      tl.progress(1);
    }
    window.addEventListener('scroll', skip, { passive: true });
  }

  // Wait for webfonts so the split chars lay out at final metrics.
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 2000); })]).then(play);
  } else {
    play();
  }
})();
