/* globals gsap, ScrollTrigger */

// Contact form — opens mailto with the submitted data.
// Bound in index.html as onsubmit="return composeMail(this)", so it receives
// the FORM element, not an event. Returning false cancels the native submit.
window.composeMail = function (form) {
  var name = (form.querySelector('[name="name"]') || {}).value || '';
  var email = (form.querySelector('[name="email"]') || {}).value || '';
  var message = (form.querySelector('[name="message"]') || {}).value || '';
  var body = 'Name: ' + encodeURIComponent(name) +
    '%0D%0AEmail: ' + encodeURIComponent(email) +
    '%0D%0A%0D%0A' + encodeURIComponent(message) +
    '%0D%0A%0D%0A---%0D%0ASent from tensionlessdigital.com';
  window.location.href = 'mailto:hello@tensionlessdigital.com' +
    '?subject=Project%20Inquiry%20-%20' + encodeURIComponent(name) +
    '&body=' + body;
  form.reset();
  return false;
};

(function () {
  'use strict';

  /* ── Nav (no GSAP dependency) ───────────────────────────────────── */

  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!open));
      navLinks.classList.toggle('open', !open);
    });
    Array.prototype.forEach.call(navLinks.querySelectorAll('a'), function (link) {
      link.addEventListener('click', function () {
        navToggle.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('open');
      });
    });
  }

  var siteNav = document.getElementById('nav');
  if (siteNav) {
    window.addEventListener('scroll', function () {
      siteNav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  /* ── Guards ────────────────────────────────────────────────────── */

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);

  // Fallback: no GSAP or reduced motion — show final values statically.
  function setCountFinal(el) {
    var target = parseFloat(el.getAttribute('data-target'));
    if (isNaN(target)) return;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    el.textContent = prefix + target.toFixed(dec) + suffix;
  }

  function setCountsFinal() {
    Array.prototype.forEach.call(document.querySelectorAll('.count, .count-imm'), setCountFinal);
  }

  if (!hasGsap || reduceMotion) {
    setCountsFinal();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('gsap-active');
  gsap.defaults({ ease: 'power3.out' });

  // Mobile: pinned scenes render as a static stack with no scrub timeline to
  // animate them, so immutable counters show final values from the start.
  if (!window.matchMedia('(min-width: 769px)').matches) {
    Array.prototype.forEach.call(document.querySelectorAll('.count-imm'), setCountFinal);
  }

  /* ── Word-split for masked headline reveals ─────────────────────── */

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
      var children = Array.prototype.slice.call(node.childNodes);
      for (var j = 0; j < children.length; j++) {
        wrapWords(children[j]);
      }
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll('.s-head, .cta-h'), function (head) {
    Array.prototype.slice.call(head.childNodes).forEach(function (child) {
      wrapWords(child);
    });
  });

  /* ── Count-up ───────────────────────────────────────────────────── */

  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-target'));
    if (isNaN(target)) return;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var state = { v: 0 };
    el.textContent = prefix + '0' + suffix;
    gsap.to(state, {
      v: target,
      duration: 1.6,
      ease: 'expo.out',
      onUpdate: function () {
        el.textContent = prefix + state.v.toFixed(dec) + suffix;
      }
    });
  }

  /* ── Helpers ────────────────────────────────────────────────────── */

  function once(trigger, start) {
    return gsap.timeline({
      scrollTrigger: { trigger: trigger, start: start, once: true }
    });
  }

  // After a reveal completes, hand the element back to CSS: add `.in`
  // (which the :not(.in) gating no longer matches) and drop the inline
  // opacity so hover states like .svc-grid:hover .svc-card work again.
  function settle(root) {
    Array.prototype.forEach.call(root.querySelectorAll('.reveal'), function (el) {
      el.classList.add('in');
      gsap.set(el, { clearProps: 'opacity,visibility' });
    });
  }

  // Scramble a section kicker when it appears (reads data-final).
  function scrambleKicker(root) {
    var el = root.querySelector('.sec-kicker');
    return function () {
      if (el && window.tdScramble) window.tdScramble(el, { duration: 650 }).start();
    };
  }

  /* ── Services ───────────────────────────────────────────────────── */

  var services = document.getElementById('services');
  if (services) {
    once(services, 'top 72%')
      .to(services.querySelectorAll('.sec-kicker'), { autoAlpha: 1, duration: 0.5 }, 0)
      .call(scrambleKicker(services), [], 0.1)
      .to(services.querySelectorAll('.s-head'), { autoAlpha: 1, duration: 0.6 }, 0.1)
      .to(services.querySelectorAll('.s-head .word'), {
        clipPath: 'inset(0 0% 0 0)', duration: 0.7, stagger: 0.035, ease: 'power4.out'
      }, 0.15)
      .to(services.querySelectorAll('.s-body'), { autoAlpha: 1, duration: 0.6 }, 0.4)
      .to(services.querySelectorAll('.svc-card'), { autoAlpha: 1, duration: 0.8, stagger: 0.08 }, 0.5)
      .eventCallback('onComplete', function () { settle(services); });
  }

  /* ── Data break ─────────────────────────────────────────────────── */

  var dataBreak = document.getElementById('data-break');
  if (dataBreak) {
    once(dataBreak, 'top 78%')
      .to(dataBreak.querySelector('.sec-kicker'), { autoAlpha: 1, duration: 0.5 }, 0)
      .call(scrambleKicker(dataBreak), [], 0.1)
      .to(dataBreak.querySelectorAll('.stat-tile'), { autoAlpha: 1, duration: 0.7, stagger: 0.1 }, 0.1)
      .call(function () {
        Array.prototype.forEach.call(dataBreak.querySelectorAll('.count'), countUp);
      }, null, 0.3)
      .eventCallback('onComplete', function () { settle(dataBreak); });
  }

  /* ── Marquee (dual counter-scrolling rows) ──────────────────────── */

  var clients = document.getElementById('clients');
  if (clients) {
    once(clients, 'top 85%')
      .to(clients.querySelectorAll('.marq-track-a'), { autoAlpha: 1, duration: 0.7 }, 0)
      .to(clients.querySelectorAll('.marq-track-b'), { autoAlpha: 0.4, duration: 0.7 }, 0.15);
  }

  /* ── CTA ────────────────────────────────────────────────────────── */

  var contact = document.getElementById('contact');
  if (contact) {
    // Start after the Process overlay has mostly faded. If this runs at
    // 'top bottom', the form resolves underneath Process and then appears to
    // pop in once the overlay clears.
    var ctaFields = contact.querySelectorAll('.cta-form input, .cta-form textarea, .cta-form button');

    once(contact, 'top 62%')
      .to(contact.querySelectorAll('.cta-h .word'), {
        clipPath: 'inset(0 0% 0 0)', duration: 0.7, stagger: 0.035, ease: 'power4.out'
      }, 0)
      .fromTo(contact.querySelectorAll('.cta-availability'),
        { autoAlpha: 0, filter: 'blur(6px)' },
        { autoAlpha: 1, filter: 'blur(0px)', duration: 0.5, ease: 'power2.out' }, 0.3)
      .fromTo(contact.querySelectorAll('.cta-form'),
        { autoAlpha: 1, clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', duration: 0.85, ease: 'power3.inOut' }, 0.48)
      .fromTo(ctaFields,
        { autoAlpha: 0, filter: 'blur(5px)' },
        { autoAlpha: 1, filter: 'blur(0px)', duration: 0.48, stagger: 0.075, ease: 'power2.out' }, 0.58)
      .fromTo(contact.querySelectorAll('.cta-note'),
        { autoAlpha: 0, filter: 'blur(4px)' },
        { autoAlpha: 1, filter: 'blur(0px)', duration: 0.45, ease: 'power2.out' }, 1.05);
  }

  /* ── Footer ─────────────────────────────────────────────────────── */

  var footer = document.querySelector('footer');
  if (footer) {
    once(footer, 'top bottom')
      .fromTo(footer.querySelectorAll('.foot-links a, .foot-copy, .wordmark'),
        { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, stagger: 0.08 });
  }
})();
