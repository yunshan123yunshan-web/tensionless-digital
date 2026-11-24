/* PROOF: selecting a client recomposes the visual — the previous composition
   stays on screen and wipes away over the new one while its mock-ups land from
   opposite sides. Reported
   figures are swapped while hidden and never animate through other values —
   only their underline moves. Depends on proto-core.js (window.TD). */
(function () {
  'use strict';
  var TD = window.TD || { reduced: true };
  var reduced = TD.reduced || !window.gsap;
  var caseEl = document.getElementById('case');
  if (!caseEl) return;

  var CASES = [
    { title: 'Automotive', img: 'case-auto', ch: 'Google Ads · SEO',
      brief: 'Turn a small test budget into sales quickly — without relying on paid traffic forever.',
      m: [['$350K', 'Profit, as reported*'], ['$6K', 'Total ad spend'], ['Top 3', 'Google rankings, 2 categories']],
      copy: 'Full-funnel Google Ads paired with SEO. Revenue inside the first week; organic held top-3 across two verticals.',
      flag: 'Unresolved claim: the source figure is profit, not revenue, so no return-on-ad-spend ratio is shown until the underlying numbers are confirmed.',
      ad: 'Test-drive the new line this weekend.', lp: 'Book a private test drive', cta: 'Choose a time' },
    { title: 'Financial services', img: 'case-fin', ch: 'Facebook Ads',
      brief: 'Reach people ready for high-value financial advice, not casual browsers.',
      m: [['$2M', 'Business written in one month'], ['$150K', 'Commissions earned'], ['30 days', 'Campaign length']],
      copy: 'Facebook Ads for high-ticket financial services. Prospect audiences and direct-response creative, one calendar month.',
      ad: 'Plan the next twenty years in one call.', lp: 'Get your retirement roadmap', cta: 'Book a review' },
    { title: 'Immigration law', img: 'case-imm', ch: 'Facebook Ads · Lead generation',
      brief: 'Leads cost too much, and too many weren’t ready to go ahead.',
      m: [['$100K', 'Revenue'], ['$4K', 'Total ad spend'], ['70%', 'Lower cost per lead']],
      copy: 'Funnel restructure and audience refinement for an immigration firm — a steady flow of case-ready prospects.',
      ad: 'Your move, handled by specialists.', lp: 'Check your eligibility', cta: 'Start assessment' },
    { title: 'Real estate', img: 'case-re', ch: 'Facebook Ads',
      brief: 'Find serious buyers for a new development without a big media budget.',
      m: [['8', 'Sales closed'], ['$3K', 'Total ad spend'], ['$375', 'Ad cost per closed sale']],
      copy: 'Hyperlocal targeting and purchase-intent creative for new-development buyers.',
      ad: 'Preview launch: garden-terrace homes.', lp: 'Register for the preview', cta: 'Reserve a viewing' }
  ];
  var $ = function (id) { return document.getElementById(id); };
  var img = $('cv-img'), adImg = $('cv-ad-img');
  var ad = caseEl.querySelector('.cv-ad'), lp = caseEl.querySelector('.cv-lp');
  var facts = caseEl.querySelector('.case-facts'), metrics = $('case-metrics');
  var buttons = [].slice.call(caseEl.querySelectorAll('.cs'));
  var active = -1, tl = null;

  function fill(i) {   // swap every piece of content at once
    var c = CASES[i], src = 'proto-assets/' + c.img + '.webp';
    caseEl.dataset.layout = String(i);
    img.src = src; adImg.src = src;
    $('case-h').textContent = c.title;
    $('cv-ad-h').textContent = c.ad; $('cv-lp-h').textContent = c.lp; $('cv-lp-cta').textContent = c.cta + ' →';
    $('case-ch').textContent = c.ch;
    metrics.innerHTML = c.m.map(function (m) { return '<div class="metric"><b>' + m[0] + '</b><i></i><span class="mono">' + m[1] + '</span></div>'; }).join('');
    $('case-copy').textContent = c.copy; $('case-brief').textContent = c.brief;
    var flag = $('case-flag');
    flag.hidden = !c.flag; flag.textContent = c.flag || '';
  }

  /* Continuity: the previous composition never disappears before the next is ready.
     1) preload the next photo, 2) freeze a copy of the current composition on top,
     3) build the new one underneath, 4) wipe the copy away while the new mock-ups land. */
  var visual = $('case-visual'), ghost = null, seq = 0;
  var LAYOUT_VARS = ['--px', '--py', '--pw', '--ph', '--pos', '--ax', '--ay', '--aw', '--ar', '--apos', '--lx', '--ly', '--lw', '--lr'];
  function preload(src, done) {
    var im = new Image(), called = false;
    function go() { if (!called) { called = true; done(); } }
    im.onload = im.onerror = go; im.src = src;
    if (im.decode) im.decode().then(go, go);
    setTimeout(go, 1500);   // never wait forever on a slow network
  }
  function dropGhost() { if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost); ghost = null; }
  function freeze() {
    var g = visual.cloneNode(true), cs = getComputedStyle(caseEl);
    g.classList.add('ghost'); g.removeAttribute('id');
    [].forEach.call(g.querySelectorAll('[id]'), function (n) { n.removeAttribute('id'); });
    LAYOUT_VARS.forEach(function (v) { g.style.setProperty(v, cs.getPropertyValue(v)); });   // keep the OLD layout
    g.style.top = visual.offsetTop + 'px'; g.style.height = visual.offsetHeight + 'px';
    g.style.left = visual.offsetLeft + 'px'; g.style.width = visual.offsetWidth + 'px';
    caseEl.appendChild(g);
    return g;
  }
  function select(i) {
    if (i === active) return;
    var first = active < 0;
    active = i;
    buttons.forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === i)); });
    if (reduced || first) { if (tl) tl.kill(); dropGhost(); fill(i); return; }
    var token = ++seq;
    preload('proto-assets/' + CASES[i].img + '.webp', function () {
      if (token !== seq) return;              // a newer choice superseded this one
      if (tl) { tl.progress(1).kill(); } dropGhost();   // finish any running switch first
      ghost = freeze();
      fill(i);                                 // figures swap in place — never empty, never counted
      tl = gsap.timeline({ onComplete: dropGhost })
        .fromTo(ghost, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 100%)', duration: 0.75, ease: 'power3.inOut' }, 0)
        .fromTo(img, { scale: 1.1 }, { scale: 1, duration: 1.2, ease: 'power2.out' }, 0)
        .fromTo(ad, { x: -80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'power4.out' }, 0.28)
        .fromTo(lp, { x: 80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, ease: 'expo.out' }, 0.36)
        .fromTo(facts, { opacity: 0.45 }, { opacity: 1, duration: 0.35 }, 0)
        .fromTo(metrics.querySelectorAll('.metric i'), { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'elastic.out(1, 0.5)', stagger: 0.07 }, 0.15);
    });
  }
  buttons.forEach(function (b, i) { b.addEventListener('click', function () { select(i); }); });
  select(0);
})();
