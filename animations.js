

  // ─── Word-split headline animation ────────────────────────────
  function splitHeadlines() {
    function wrapWords(node) {
      if (node.nodeType === 3) {
        var text = node.textContent;
        if (!text.trim()) return;
        var frag = document.createDocumentFragment();
        var parts = text.split(/(\s+)/);
        for (var i = 0; i < parts.length; i++) {
          var part = parts[i];
          if (!part.trim()) {
            frag.appendChild(document.createTextNode(part));
          } else {
            var span = document.createElement('span');
            span.className = 'word';
            span.textContent = part;
            frag.appendChild(span);
          }
        }
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1 && node.tagName !== 'BR') {
        var children = Array.from(node.childNodes);
        for (var j = 0; j < children.length; j++) {
          wrapWords(children[j]);
        }
      }
    }
    document.querySelectorAll('.s-head').forEach(function(headline) {
      var children = Array.from(headline.childNodes);
      for (var k = 0; k < children.length; k++) {
        wrapWords(children[k]);
      }
    });
  }

  // Contact form — opens mailto with form data
  window.composeMail = function(e) {
    e.preventDefault();
    const name = e.target.querySelector('[name=name]').value;
    const email = e.target.querySelector('[name=email]').value;
    const message = (e.target.querySelector('[name=message]') || {}).value || '';
    const body = 'Name: ' + name + '%0D%0AEmail: ' + email + '%0D%0A%0D%0A' + encodeURIComponent(message) + '%0D%0A%0D%0A---%0D%0ASent from tensionlessdigital.com';
    window.location.href = 'mailto:hello@tensionlessdigital.com?subject=Project%20Inquiry%20-%20' + encodeURIComponent(name) + '&body=' + body;
    e.target.reset();
    return false;
  };

(() => {
  // Hamburger menu toggle
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navToggle.getAttribute('aria-expanded') === 'true' ? false : true;
      navToggle.setAttribute('aria-expanded', open);
      navLinks.classList.toggle('open', open);
    });
    // Close menu on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('open');
      });
    });
  }

  const siteNav = document.getElementById('nav');
  siteNav && window.addEventListener('scroll', () => {
    siteNav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  const pageReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  const countEls = Array.from(document.querySelectorAll('.count'));

  function setCountsFinal() {
    countEls.forEach(el => { el.textContent = el.dataset.n || el.textContent; });
  }

  if (pageReduceMotion || !window.gsap || !window.ScrollTrigger) {
    revealEls.forEach(el => el.classList.add('in'));
    setCountsFinal();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  document.documentElement.classList.add('gsap-active');
  gsap.defaults({ ease: 'power3.out' });
  countEls.forEach(el => { el.textContent = '0'; });

  // Split headlines into word spans for staggered reveal
  splitHeadlines();

  const groups = [
    { root: '#services', items: '.s-label, .s-head, .s-body, .svc-card', variant: 'services' },
    { root: '#data-break', items: '.db-inner', variant: 'data-break' },
    { root: '#contact', items: '.cta-availability, .cta-sub, .btn-dark, .btn-ink', variant: 'cta' },
    { root: 'footer', items: '.footer-logo, .footer-links li, .footer-copy', variant: 'footer' }
  ];

  const animatedItems = new Set(revealEls);
  groups.forEach(config => {
    const root = document.querySelector(config.root);
    if (!root) return;
    root.querySelectorAll(config.items).forEach(el => animatedItems.add(el));
  });
  // Replace .s-head containers with their word children for animation
  animatedItems.forEach(function(el) {
    if (el.classList.contains('s-head')) {
      animatedItems.delete(el);
      el.querySelectorAll('.word').forEach(function(w) { animatedItems.add(w); });
    }
  });
  gsap.set(Array.from(animatedItems), { autoAlpha: 0, y: 28 });

  groups.forEach(config => {
    const root = document.querySelector(config.root);
    if (!root) return;

    if (config.variant === 'services') {
      gsap.set(root.querySelectorAll('.svc-card'), { x: 60, y: 40, rotation: -3, scale: 0.8 });
    }
    if (config.variant === 'results') {
      gsap.set(root.querySelectorAll('.res-card'), { y: 64, rotation: -2 });
      gsap.set(root.querySelectorAll('.cs-headline'), { y: 24, scale: 0.88 });
      gsap.set(root.querySelectorAll('.cs-stats'), { y: 18, x: -14 });
    }
    if (config.variant === 'testimonials') {
      gsap.set(root.querySelectorAll('.testi-stat'), { y: 24, scale: 0.9 });
      gsap.set(root.querySelectorAll('.testi-card'), { y: 56, rotation: -2, scale: 0.95 });
      gsap.set(root.querySelectorAll('.testi-featured'), { scale: 0.95, y: 20 });
    }
    if (config.variant === 'process') {
      gsap.set(root.querySelectorAll('.proc-step'), { y: 56, rotation: -1.5 });
    }
  });

  function countUp(el) {
    const target = Number(el.dataset.n || 0);
    const state = { value: 0 };
    gsap.to(state, {
      value: target,
      duration: 0.8,
      ease: 'expo.out',
      onUpdate: () => { el.textContent = Math.round(state.value); }
    });
  }

  function revealGroup(config, root) {
    const q = selector => Array.from(root.querySelectorAll(selector));
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out', overwrite: 'auto' },
      onStart: () => root.classList.add('in-view'),
      onComplete: () => {
        gsap.set(q(config.items), { clearProps: 'transform,willChange,visibility' });
      }
    });

    if (config.variant === 'services') {
      tl.to(q('.s-label'), { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' })
        .to(q('.s-head .word'), { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.035, ease: 'power2.out' }, '-=0.15')
        .to(q('.s-body'), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.1')
        .to(q('.svc-card'), {
          autoAlpha: 1, x: 0, y: 0, rotation: 0, scale: 1,
          duration: 1, stagger: { each: 0.1, from: 'center' }, ease: 'power3.out'
        }, '-=0.4');
      return tl;
    }

    if (config.variant === 'results') {
      tl.to(q('.s-label'), { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' })
        .to(q('.s-head .word'), { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.035, ease: 'power2.out' }, '-=0.15')
        .to(q('.s-body'), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.1')
        .to(q('.res-card'), { autoAlpha: 1, y: 0, rotation: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }, '-=0.5')
        .to(q('.cs-headline'), { autoAlpha: 1, y: 0, scale: 1.06, duration: 0.5, stagger: 0.08, ease: 'expo.out' }, '-=0.35')
        .to(q('.cs-headline'), { scale: 1, duration: 0.3, stagger: 0.08, ease: 'power2.out' })
        .to(q('.cs-stats'), { autoAlpha: 1, y: 0, x: 0, duration: 0.4, stagger: 0.04, ease: 'power2.out' }, '-=0.1');
      return tl;
    }

    if (config.variant === 'testimonials') {
      tl.to(q('.s-label'), { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' })
        .to(q('.s-head .word'), { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' }, '-=0.1')
        .to(q('.testi-featured'), { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' }, '-=0.2')
        .to(q('.testi-stat'), { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.08, ease: 'power3.out' }, '-=0.25')
        .to(q('.testi-card'), { autoAlpha: 1, y: 0, rotation: 0, scale: 1, duration: 0.75, stagger: 0.1, ease: 'power3.out' }, '-=0.25');
      return tl;
    }

    if (config.variant === 'process') {
      tl.to(q('.s-label'), { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' })
        .to(q('.s-head .word'), { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.035, ease: 'power2.out' }, '-=0.1')
        .to(q('.s-body'), { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, '-=0.1')
        .to(q('.proc-step'), { autoAlpha: 1, y: 0, rotation: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }, '-=0.2');
      return tl;
    }

    if (config.variant === 'data-break') {
      root.querySelectorAll('.count').forEach(function(el) { countUp(el); });
      tl.to(q('.db-inner'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' });
      return tl;
    }

    if (config.variant === 'cta') {
      tl.to(q('.cta-availability, .cta-sub, .btn-dark, .btn-ink'), { autoAlpha: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' });
      return tl;
    }

    tl.to(q(config.items), {
      autoAlpha: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.07,
      ease: 'power3.out'
    });
    return tl;
  }

  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    groups.forEach(config => {
      const root = document.querySelector(config.root);
      if (!root) return;
      ScrollTrigger.create({
        trigger: root,
        start: 'top 92%',
        once: true,
        onEnter: () => {
          revealGroup(config, root);
          // Success ripple for results section
          if (config.variant === 'results' && typeof window.addRemnantBurst === 'function') {
            window.addRemnantBurst(window.innerWidth / 2, window.innerHeight * 0.5);
          }
          // Final shard burst for CTA section
          if (config.variant === 'cta' && typeof window.addRemnantBurst === 'function') {
            window.addRemnantBurst(window.innerWidth * 0.5, window.innerHeight * 0.4);
            // Second burst after a brief delay
            setTimeout(function() {
              if (typeof window.addRemnantBurst === 'function') {
                window.addRemnantBurst(window.innerWidth * 0.3, window.innerHeight * 0.6);
                window.addRemnantBurst(window.innerWidth * 0.7, window.innerHeight * 0.3);
              }
            }, 300);
            // Auto-cleanup: fade out after bursts finish
            setTimeout(function() {
              var rc = document.getElementById('remnant-canvas');
              if (rc) {
                gsap.to(rc, { opacity: 0, duration: 0.45, ease: 'power2.out' });
              }
            }, 2500);
          }
        }
      });
    });
    return () => ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  });


})();