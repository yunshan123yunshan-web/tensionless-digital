/* Prototype core: Lenis, the roller-blind hero and its wire, opt-in sound,
   and the contact topic pre-fill. Shared helpers are exposed on window.TD for
   proto-scene.js and proto-cases.js. Prototype only, the live site does not load this. */
(function () {
  'use strict';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || !window.gsap;
  var TD = window.TD = { reduced: reduced, lenis: null };
  TD.goTo = function (sel) { if (TD.lenis) TD.lenis.scrollTo(sel); else document.querySelector(sel).scrollIntoView(); };

  /* ── Sound: opt-in plucks. Position → brightness, strength → loudness. ── */
  var audio = null, soundOn = false, lastSound = 0, voices = 0;
  var soundBtn = document.getElementById('sound');
  soundBtn.addEventListener('click', function () {
    soundOn = !soundOn;
    if (soundOn && !audio) { try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { soundOn = false; } }
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    soundBtn.textContent = 'Sound: ' + (soundOn ? 'on' : 'off');
  });
  var PITCH = [146.8, 196, 220, 293.7];   // D3, G3, A3, D4
  function pluckSound(strength, brightness, pitchIdx) {
    var now = performance.now();
    if (!soundOn || !audio || voices >= 3 || now - lastSound < 100) return;
    lastSound = now; voices++;
    var t = audio.currentTime, o = audio.createOscillator(), g = audio.createGain(), f = audio.createBiquadFilter();
    var p = PITCH[pitchIdx || 0];
    o.type = 'triangle'; o.frequency.setValueAtTime(p * (1 + strength * 0.02), t); o.frequency.exponentialRampToValueAtTime(p, t + 0.12);
    f.type = 'lowpass'; f.frequency.value = 900 + brightness * 2400;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03 + strength * 0.15, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(f); f.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + 0.35);
    o.onended = function () { voices--; };
  }
  TD.pluckSound = pluckSound;

  /* ── Contact: topic pre-fill (the relaxing line lives in proto-cases.js) ── */
  var contact = document.getElementById('contact');
  var contactTopic = document.getElementById('contact-topic'), topicField = document.getElementById('cf-topic');
  TD.setTopic = function (topic) {
    topicField.value = topic;
    contactTopic.textContent = 'Topic: ' + topic + ' (from the service you picked)';
  };
  /* The call form is a Netlify Form (name="call" in the HTML, detected at deploy). It is sent in the
     background so the visitor stays on the page. If sending fails (not hosted on Netlify, offline),
     the visitor's email app opens with every field already written in, so no enquiry is lost. */
  var MAILTO = 'hello@tensionlessdigital.com';
  var form = document.getElementById('call-form'), status = document.getElementById('cf-status');
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var say = function (msg, isErr) { status.textContent = msg; status.classList.toggle('err', !!isErr); };
  var check = function () {   // first problem wins; the field is marked and focused
    var f = form.elements, problems = [
      [f.name, f.name.value.trim().length > 0, 'Please add your name.'],
      [f.email, EMAIL.test(f.email.value.trim()), 'Please add an email address we can reply to.']
    ];
    for (var k = 0; k < problems.length; k++) {
      problems[k][0].setAttribute('aria-invalid', problems[k][1] ? 'false' : 'true');
      if (!problems[k][1]) { problems[k][0].focus(); say(problems[k][2], true); return false; }
    }
    return true;
  };
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!check()) return;
    var f = form.elements, data = { name: f.name.value.trim(), email: f.email.value.trim(), website: f.website.value.trim(), message: f.message.value.trim(), topic: f.topic.value };
    var btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    say('Sending...');
    fetch(form.getAttribute('action') || '/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString() })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        var topic = f.topic.value;
        form.reset(); f.topic.value = topic;
        if (window.tdTrack) window.tdTrack('generate_lead', { form_topic: topic || 'general', form_location: location.pathname });
        say('Thanks, ' + data.name + '. Your request is in, and we will reply within one working day.');
      })
      .catch(function () { openMail(data); })
      .then(function () { btn.disabled = false; });
  });
  function openMail(data) {   // fallback: the visitor's email app, pre-filled
    var lines = ['Name: ' + data.name, 'Email: ' + data.email];
    if (data.website) lines.push('Website: ' + data.website);
    if (data.topic) lines.push('Topic: ' + data.topic);
    lines.push('', data.message || 'I would like a free 30-minute call about my funnel.');
    var body = lines.join('\n');
    location.href = 'mailto:' + MAILTO + '?subject=' + encodeURIComponent('Request a free call' + (data.topic ? ': ' + data.topic : '')) + '&body=' + encodeURIComponent(body);
    say('We could not send this from the page, so your email app should open with it already written. Just press send. If nothing opened, write to ' + MAILTO + '.');
  }
  [].forEach.call(form.querySelectorAll('input, textarea'), function (el) {
    el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') { el.setAttribute('aria-invalid', 'false'); say(''); } });
  });
  /* ── the call popup: every "Request a free call" (and the service "Ask about" link) opens it ── */
  var dialog = document.getElementById('call-dialog');
  TD.openCall = function () {
    if (!dialog.open) { dialog.showModal(); if (TD.lenis) TD.lenis.stop(); }
    form.elements.name.focus();
  };
  dialog.addEventListener('close', function () { if (TD.lenis) TD.lenis.start(); say(''); });
  document.getElementById('call-close').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });   // click on the backdrop
  [].forEach.call(document.querySelectorAll('[data-call]'), function (el) {
    // capture phase, so the smooth-scroll handler on #contact links never runs for these
    el.addEventListener('click', function (e) { e.preventDefault(); e.stopImmediatePropagation(); TD.openCall(); }, true);
  });
  document.getElementById('roll-back').addEventListener('click', function () {
    if (TD.lenis) TD.lenis.scrollTo(0, { duration: 1.8 }); else scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });
  [].forEach.call(document.querySelectorAll('.btn'), function (b) {   // CTA arrows loop out and back on hover (CSS)
    var t = b.textContent;
    if (/→$/.test(t)) b.innerHTML = t.slice(0, -1) + '<span class="arr" aria-hidden="true">→</span>';
  });

  /* ── The wire: 1-D mass-spring string, fixed 1/120 s timestep ───────── */
  var canvas = document.getElementById('wire'), ctx = canvas.getContext('2d');
  var N = 96, SUB = 10, TENSION = 0.45, DAMP = 0.996, FIXED = 1 / 120;
  var d = new Float32Array(N), v = new Float32Array(N), shape = new Float32Array(N);
  for (var i = 0; i < N; i++) shape[i] = Math.sin(Math.PI * i / (N - 1));
  var W = 0, H = 0, DPR = 1, REST = 0, ROLLED = 16, MAXPULL = 150, ARM = 110, HYST = 18;
  var Wire = { y: 0, bias: 0 };   // y: resting line (px); bias: scroll-driven bow (px)
  var hero = document.getElementById('hero');
  var darkZones = [].slice.call(document.querySelectorAll('[data-wire="dark"]'));
  var released = false, grab = null;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var mobile = W <= 760;   // same breakpoint as the CSS (max-width: 760px)
    REST = H * (mobile ? 0.86 : 0.80);   // matches --rest-gap (20% desktop, 14% phones)
    MAXPULL = mobile ? 80 : 150; ARM = mobile ? 62 : 110; HYST = mobile ? 12 : 18;
    if (!released) Wire.y = REST;
  }
  resize();

  function wireY(k) { return Wire.y + Wire.bias * shape[k] + d[k]; }
  function idxAt(x) { return Math.max(1, Math.min(N - 2, Math.round(x / W * (N - 1)))); }
  function wireYAt(x) {
    var f = Math.max(0, Math.min(N - 1, x / W * (N - 1))), k = Math.floor(f), t = f - k;
    return k >= N - 1 ? wireY(N - 1) : wireY(k) * (1 - t) + wireY(k + 1) * t;
  }
  function impulse(k, amount, spread) {
    for (var j = 1; j < N - 1; j++) { var z = (j - k) / spread; v[j] += amount * Math.exp(-z * z); }
  }
  var asleep = false;
  function wake() { asleep = false; }
  function stepFixed(load) {
    for (var s = 0; s < SUB; s++) {
      for (var j = 1; j < N - 1; j++) v[j] = (v[j] + TENSION * (d[j - 1] + d[j + 1] - 2 * d[j]) + load * shape[j]) * DAMP;
      for (j = 1; j < N - 1; j++) d[j] += v[j];
    }
  }
  function wireIsDark() {   // dark ink over light or blue surfaces, light ink over near-black ones
    if (!released && hero.getBoundingClientRect().bottom > Wire.y) return true;
    for (var z = 0; z < darkZones.length; z++) {
      var el = darkZones[z], r = el.getBoundingClientRect();
      if (r.top < Wire.y && r.bottom > Wire.y) return true;
    }
    return false;
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    var energy = 0;
    for (var j = 0; j < N; j++) energy += Math.abs(v[j]);
    ctx.lineWidth = released ? 1 : 1.5;
    ctx.strokeStyle = wireIsDark() ? '#050507' : 'rgba(233,237,242,.55)';
    ctx.shadowColor = 'rgba(143,176,255,.9)';
    ctx.shadowBlur = Math.min(22, energy * 0.4);
    ctx.beginPath();
    var dx = W / (N - 1);
    ctx.moveTo(0, wireY(0));
    for (j = 1; j < N - 1; j++) ctx.quadraticCurveTo(j * dx, wireY(j), (j + 0.5) * dx, (wireY(j) + wireY(j + 1)) / 2);
    ctx.lineTo(W, wireY(N - 1));
    ctx.stroke();
  }

  /* blind's bottom edge = the wire */
  var blind = document.getElementById('blind'), copy = document.getElementById('hero-copy'), h1 = document.getElementById('hero-h1');
  var tab = document.getElementById('tab');
  function drawBlind() {
    var dx = W / (N - 1), pts = ['0px 0px', W + 'px 0px'];
    for (var k = N - 1; k >= 0; k -= 2) pts.push((k * dx).toFixed(1) + 'px ' + wireY(k).toFixed(1) + 'px');
    pts.push('0px ' + wireY(0).toFixed(1) + 'px');
    blind.style.clipPath = 'polygon(' + pts.join(',') + ')';
    var mid = N >> 1, disp = d[grab ? grab.k : mid] + Wire.bias;
    // the hero headline is driven by the wire itself while you pull, nowhere else
    var s = Math.max(-0.2, Math.min(1, disp / MAXPULL)), range = W < 760 ? 8 : 16;
    h1.style.fontStretch = (100 + s * range).toFixed(2) + '%';
    copy.style.transform = 'translate3d(0,' + ((Wire.y - REST) + disp * 0.3).toFixed(1) + 'px,0)';
    tab.style.top = wireY(mid).toFixed(1) + 'px';
  }

  if (reduced) {
    // Same idea, no motion: the tab is a plain "enter" button; the blind simply isn't animated.
    draw(); drawBlind();
    addEventListener('resize', function () { resize(); draw(); drawBlind(); });
    // a visitor who scrolls instead of pressing Enter must not carry the fixed wire across every section
    addEventListener('scroll', function () {
      canvas.style.visibility = hero.getBoundingClientRect().bottom < innerHeight * 0.5 ? 'hidden' : '';
      draw();
    }, { passive: true });
    tab.textContent = 'Enter ↓';
    tab.addEventListener('click', function () {
      released = true; Wire.y = ROLLED; draw();   // the wire rolls up with the blind, it doesn't stay across the page
      hero.classList.add('open'); blind.style.display = 'none'; tab.style.display = 'none'; document.getElementById('under').scrollIntoView();
    });
    return;
  }

  /* ── Grab / pull / release ─────────────────────────────────────────── */
  var armed = false, launching = false, px = -1, py = -1, lastPluck = 0;
  function canPlay() { return !released && !launching && (window.scrollY || 0) < 4; }
  function setArmed(a) {
    if (a === armed) return;
    armed = a;
    tab.classList.toggle('armed', a);
    tab.textContent = a ? 'Release to open ↑' : 'Pull to open ↓';
  }
  function startGrab(x, y, el, id) {
    if (!canPlay()) return false;
    grab = { k: idxAt(x), x: x, y0: y, y: y };
    if (el && el.setPointerCapture) el.setPointerCapture(id);
    wake(); return true;
  }
  function holdGrab() {   // the grabbed point follows the hand directly, with tanh resistance
    var dist = grab.y - REST;
    var pull = dist >= 0 ? MAXPULL * Math.tanh(dist / MAXPULL) : -20 * Math.tanh(-dist / 20);
    for (var j = 0; j < N; j++) { d[j] = pull * (j <= grab.k ? j / grab.k : (N - 1 - j) / (N - 1 - grab.k)); v[j] = 0; }
    d[0] = d[N - 1] = 0;
    if (!armed && pull > ARM) setArmed(true);
    else if (armed && pull < ARM - HYST) setArmed(false);
  }
  function endGrab(cancel) {
    var wasArmed = armed && !cancel;
    var strength = Math.min(1, Math.max(0, d[grab.k] / MAXPULL));
    grab = null; setArmed(false); document.body.style.cursor = '';
    pluckSound(strength, 0.4, 0);
    if (wasArmed) launch();
  }
  function rollUp() {
    released = true; wake(); hero.classList.add('open');
    tab.style.opacity = 0; tab.tabIndex = -1;
    gsap.to(Wire, { y: ROLLED, duration: 0.65, ease: 'expo.out', overwrite: true });
  }
  function rollDown() {
    released = false; wake(); hero.classList.remove('open');
    tab.style.opacity = 1; tab.tabIndex = 0;
    gsap.to(Wire, { y: REST, duration: 0.5, ease: 'power3.out', overwrite: true });
  }
  // The release IS the arrival: the introduction is already underneath the blind.
  function launch() {
    launching = true; rollUp();
    if (TD.lenis) TD.lenis.scrollTo(heroST.end + 1, { immediate: true, force: true });
    else scrollTo(0, heroST.end + 1);
    requestAnimationFrame(function () { launching = false; });
  }

  tab.addEventListener('pointerdown', function (e) {
    if (startGrab(e.clientX, e.clientY, tab, e.pointerId)) { e.preventDefault(); document.body.style.cursor = 'grabbing'; }
  });
  tab.addEventListener('click', function () {   // keyboard (Enter/Space) and plain taps: same result, no drag needed
    if (tab.dataset.dragged === '1') { tab.dataset.dragged = ''; return; }
    if (canPlay()) { pluckSound(0.7, 0.4, 0); launch(); }
  });
  addEventListener('pointerdown', function (e) {   // mouse may also grab the wire itself, anywhere along it
    if (grab || e.pointerType !== 'mouse' || e.target === tab) return;
    if (Math.abs(e.clientY - wireYAt(e.clientX)) <= 28 && startGrab(e.clientX, e.clientY)) { e.preventDefault(); document.body.style.cursor = 'grabbing'; }
  });
  addEventListener('pointermove', function (e) {
    var x = e.clientX, y = e.clientY;
    if (grab) {
      grab.x = x; grab.y = y; grab.k = idxAt(x);
      if (Math.abs(y - grab.y0) > 6) tab.dataset.dragged = '1';
    } else if (e.pointerType === 'mouse') {
      var calm = contact.getBoundingClientRect().top < H * 0.6;
      if (px >= 0 && !calm) {                     // a genuine crossing plucks it, small, capped, with a cooldown
        var wy = wireYAt(x), now = performance.now();
        if ((py - wy) * (y - wy) < 0 && now - lastPluck > 120) {
          lastPluck = now;
          var vy = Math.max(-40, Math.min(40, y - py));
          impulse(idxAt(x), Math.max(-2.6, Math.min(2.6, vy * 0.06)), 3.5); wake();
          pluckSound(Math.abs(vy) / 40, x / W, 2);
        }
      }
      document.body.style.cursor = canPlay() && Math.abs(y - wireYAt(x)) <= 28 ? 'grab' : '';
    }
    px = x; py = y;
  });
  addEventListener('pointerup', function () { if (grab) endGrab(false); });
  addEventListener('pointercancel', function () { if (grab) endGrab(true); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && grab) endGrab(true); });

  /* ── Lenis (the only smoothing layer) + scroll-driven version of the same gesture ── */
  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis) {
    TD.lenis = new Lenis({ lerp: 0.09 });
    TD.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { TD.lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); TD.lenis.scrollTo(a.getAttribute('href')); });
    });
  }
  var SNAP = 0.7;   // short pin: 50vh of scroll, most of it spent building the pull
  var heroST = ScrollTrigger.create({
    trigger: '#hero', start: 'top top', end: '+=50%', pin: true,
    onUpdate: function (self) {
      if (launching || grab) return;
      var p = self.progress;
      if (p < SNAP) {
        if (released) rollDown();
        var q = p / SNAP;
        Wire.bias = MAXPULL * 0.9 * q * q; wake();
      } else if (!released) {
        for (var j = 0; j < N; j++) d[j] += Wire.bias * shape[j];   // hand the bow to the physics
        Wire.bias = 0;
        pluckSound(0.8, 0.3, 0);
        rollUp();
      }
    }
  });

  var resizeTimer = null;
  addEventListener('resize', function () {
    resize(); d.fill(0); v.fill(0); wake();
    if (released) Wire.y = ROLLED;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { ScrollTrigger.refresh(); }, 150);
  });

  /* ── Per-frame: fixed-step physics, gentle scroll sag, render only when something changed ── */
  var acc = 0, lastScroll = -1;
  gsap.ticker.add(function (time, deltaMs) {
    var vel = TD.lenis ? Math.max(-60, Math.min(60, TD.lenis.velocity || 0)) : 0;
    var calm = contact.getBoundingClientRect().top < H * 0.6;
    var load = released && !calm ? vel * 0.00006 : 0;   // ≈ 2–9 px of sag, never more
    var sy = window.scrollY, moved = sy !== lastScroll;
    lastScroll = sy;
    if (grab) holdGrab();
    else if (!asleep || load) {
      acc = Math.min(acc + deltaMs / 1000, 0.1);
      while (acc >= FIXED) { stepFixed(load); acc -= FIXED; }
      var e = 0, m = 0;
      for (var j = 0; j < N; j++) { e += Math.abs(v[j]); m = Math.max(m, Math.abs(d[j])); }
      if (e < 0.02 && m < 0.05 && !load && !gsap.isTweening(Wire)) { d.fill(0); v.fill(0); asleep = true; }
    } else if (!moved && !gsap.isTweening(Wire)) return;   // idle: nothing to redraw
    if (hero.getBoundingClientRect().bottom > 0) drawBlind();
    draw();
  });
})();
