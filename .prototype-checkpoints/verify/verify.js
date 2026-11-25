/* Prototype regression suite (not part of the site).
   Usage: node verify.js <screenshot-dir>   (server on 127.0.0.1:5173; uses global puppeteer + Chrome)
   Checks per viewport: counter vs visible case (fwd, reverse, mid-wipe, flicks, reload, re-entry),
   finished-case layout (collisions, clipping, HUD), thread clearance during release, line ends on
   "tension", nav→Work and Skip→Contact arrivals; then breakpoint round trips and reduced motion. */
const puppeteer = require(require('child_process').execSync('npm root -g').toString().trim() + '/puppeteer');
const fs = require('fs');
const URL = 'http://127.0.0.1:5173/prototype-wire.html', OUT = process.argv[2] || '/tmp/td-verify';
fs.mkdirSync(OUT, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
const issues = []; let checks = 0;
const flag = (tag, msg) => issues.push(tag + ': ' + msg);

const HELP = () => {
  window.__reel = () => ScrollTrigger.getAll().find(s => s.pin && s.trigger.id === 'work');
  window.__goT = t => { const st = __reel(); TD.lenis.scrollTo(st.start + (st.end - st.start) * t / st.animation.duration(), { immediate: true, force: true }); };
  window.__state = () => {
    const ms = [...document.querySelectorAll('.moment')]; let vis = -1;
    ms.forEach((m, i) => { const c = getComputedStyle(m); const l = parseFloat((c.clipPath.match(/inset\(([^)]*)\)/) || [, '0 0 0 0'])[1].split(' ')[3] || 0);
      if (c.visibility === 'visible' && +c.opacity > 0.5 && l < 50) vis = i; });
    return { hud: +document.getElementById('reel-i').textContent, vis: vis + 1 };
  };
  window.__layout = (idx) => {
    const out = [], m = [...document.querySelectorAll('.moment')][idx === undefined ? __state().vis - 1 : idx]; if (!m) return ['no case'];
    const vis = el => { let e = el; while (e && e !== m) { const c = getComputedStyle(e); if (c.visibility === 'hidden' || +c.opacity < 0.5) return false; e = e.parentElement; } return getComputedStyle(el).display !== 'none'; };
    const els = [...m.querySelectorAll('.m-k, .m-statement, .m-label, .m-copy, .m-lead, .m-sub, .m-flag, .m-figure')].filter(vis);
    const hud = document.querySelector('.cases.is-reel') ? document.querySelector('.reel-hud').getBoundingClientRect() : { left: 0, right: 0, top: -9, bottom: -9, height: 0 }, R = els.map(e => [e, e.getBoundingClientRect()]);
    R.forEach(([e, r], i) => {
      if (r.bottom > innerHeight + 1 || r.right > innerWidth + 1 || r.left < -1 || r.top < -1) out.push('out-of-view ' + e.className);
      if (!(r.right < hud.left || r.left > hud.right || r.bottom < hud.top || r.top > hud.bottom)) out.push('hits HUD ' + e.className);
      R.slice(i + 1).forEach(([f, s]) => { if (e.contains(f) || f.contains(e)) return; if (r.left < s.right - 1 && s.left < r.right - 1 && r.top < s.bottom - 1 && s.top < r.bottom - 1) out.push('overlap ' + e.className + ' x ' + f.className); });
    });
    if (document.documentElement.scrollWidth > innerWidth) out.push('horizontal overflow');
    if (hud.height > 30 || hud.right > innerWidth || hud.left < 0) out.push('HUD wraps or overflows');
    return out;
  };
  window.__threadHits = () => {
    const path = document.getElementById('thread-path'), sr = path.ownerSVGElement.getBoundingClientRect(), len = path.getTotalLength(), hits = new Set(), rects = [];
    document.querySelectorAll('.contact-kicker, .contact-grid > p, .cf-field, .call-form .btn, .contact-mail, .contact-foot > *, .proc-stages h3, .proc-stages li > p').forEach(e => rects.push([e.className || e.tagName, e.getBoundingClientRect(), 0]));
    document.querySelectorAll('.contact h2, .proc-h').forEach(h => { const rg = document.createRange(); rg.selectNodeContents(h); [...rg.getClientRects()].forEach(r => rects.push(['heading', r, 0.2])); });
    for (let s = 0; s <= len; s += 4) {
      const p = path.getPointAtLength(s), x = sr.left + p.x, y = sr.top + p.y;
      if (y < 0 || y > innerHeight) continue;
      rects.forEach(([n, r, k]) => { const h = r.height; if (x > r.left && x < r.right && y > r.top + h * k && y < r.bottom - h * (k ? 0.3 : 0)) hits.add(n); });
    }
    return [...hits];
  };
  window.__onWord = () => { const bb = document.getElementById('thread-path').getBoundingClientRect(), te = document.getElementById('tense').getBoundingClientRect();
    return Math.abs(bb.left - te.left) < 6 && Math.abs(bb.right - te.right) < 6 && bb.top > te.top + te.height * 0.6 && bb.bottom < te.bottom + 14; };
};

(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', protocolTimeout: 120000 });
  const errs = [];
  for (const [w, h] of [[1440, 900], [1280, 720], [390, 844], [390, 700], [375, 667]]) {
    const tag = w + 'x' + h, mob = w < 900;
    const p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: mob, hasTouch: mob });
    p.on('pageerror', e => errs.push(tag + ' ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(tag + ' ' + m.text()));
    await p.goto(URL, { waitUntil: 'networkidle0' }); await p.evaluate(HELP); await wait(800);
    let goT, sync, L;
    const stacked = async () => {   // phones: stacked cases, no pin; text always present
      checks++; const st = await p.evaluate(() => ({ reel: !!document.querySelector('.cases.is-reel'), pins: ScrollTrigger.getAll().filter(s => s.pin && s.trigger.id === 'work').length }));
      if (st.reel || st.pins) flag(tag, 'phone should not pin the cases ' + JSON.stringify(st));
      const n = await p.evaluate(() => document.querySelectorAll('.moment').length);
      for (let k = 0; k < n; k++) {
        await p.evaluate(k => { const m = document.querySelectorAll('.moment')[k]; TD.lenis.scrollTo(m.querySelector('.m-head').getBoundingClientRect().top + scrollY - innerHeight * 0.35, { immediate: true, force: true }); }, k); await wait(900);
        checks++; const r = await p.evaluate(k => { const m = document.querySelectorAll('.moment')[k];
          const hidden = [...m.querySelectorAll('.m-k, .m-statement, .m-detail')].filter(e => getComputedStyle(e).visibility === 'hidden' || +getComputedStyle(e).opacity < 0.99).length;
          return { hidden, lay: [...__layout(k)].filter(x => !/out-of-view/.test(x)) }; }, k);
        if (r.hidden) flag(tag + ' case ' + (k + 1), r.hidden + ' text blocks hidden'); r.lay.forEach(x => flag(tag + ' case ' + (k + 1), x));
        await p.screenshot({ path: `${OUT}/${tag}-stack-case${k + 1}.png` });
      }
      // no frame in Work without case text on screen
      const span = await p.evaluate(() => { const w = document.getElementById('work'), r = w.getBoundingClientRect(); return [r.top + scrollY, r.top + scrollY + w.offsetHeight - innerHeight]; });
      let empty = 0;
      for (let y = span[0]; y <= span[1]; y += Math.round(h * 0.25)) {
        await p.evaluate(y => TD.lenis.scrollTo(y, { immediate: true, force: true }), y); await wait(250);
        if (!(await p.evaluate(() => [...document.querySelectorAll('.moment .m-k, .moment .m-statement, .moment .m-copy, .moment .m-lead')].some(e => { const r = e.getBoundingClientRect(); return r.bottom > 40 && r.top < innerHeight - 40; })))) empty++;
      }
      checks++; if (empty) flag(tag, empty + ' scroll positions in Work show no case text');
      // the 8: numeral-shaped while its picture is low on screen, fully open once it reaches the top
      const eight = async f => { await p.evaluate(f => { const md = document.querySelector('[data-comp=type] .m-media'); TD.lenis.scrollTo(md.getBoundingClientRect().top + scrollY - innerHeight * f, { immediate: true, force: true }); }, f); await wait(1200);
        return p.evaluate(() => document.querySelector('[data-comp=type] .m-media').style.clipPath); };
      const low = await eight(0.6), high = await eight(-0.02); checks++;
      if (!/eightclip/.test(low) || high !== 'none') flag(tag, `8 does not open on scroll (low: ${low}, top: ${high})`);
      await eight(0.3); await p.screenshot({ path: `${OUT}/${tag}-stack-eight-mid.png` });
    };
    if (mob) await stacked(); else {
    goT = async (t, ms = 900) => { await p.evaluate(t => __goT(t), t); await wait(ms); };
    sync = async why => { checks++; const s = await p.evaluate(() => __state()); if (s.hud !== s.vis) flag(tag, `counter ${s.hud} vs visible ${s.vis} (${why})`); };
    L = await p.evaluate(() => { const tl = __reel().animation, ch = tl.getChildren(false, true, false);
      const wipes = ch.filter(c => c.vars.clipPath === 'inset(0% 0% 0% 0%)' && c.targets()[0].classList.contains('moment')).map(c => c.startTime() + c.duration() / 2);
      return { dur: tl.duration(), wipes, holds: wipes.map(w => w - 0.4).concat(tl.duration() - 0.05) }; });
    const pts = [0.05, ...L.holds, ...L.wipes, ...L.wipes.map(x => x - 0.25), ...L.wipes.map(x => x + 0.3)].sort((a, c) => a - c);
    for (const t of pts) { await goT(t, 700); await sync('fwd ' + t.toFixed(2)); }
    for (const t of [...pts].reverse()) { await goT(t, 700); await sync('rev ' + t.toFixed(2)); }
    for (const [k, t] of L.holds.entries()) {
      await goT(t, 1100); checks++;
      (await p.evaluate(() => __layout())).forEach(x => flag(tag + ' case ' + (k + 1), x));
      await p.screenshot({ path: `${OUT}/${tag}-case${k + 1}-done.png` });
    }
    for (const [k, t] of L.wipes.entries()) {
      await goT(t - 0.6, 800); await goT(t, 1000); await p.screenshot({ path: `${OUT}/${tag}-wipe${k + 1}-fwd.png` });
      await goT(t + 0.6, 800); await goT(t, 1000); await p.screenshot({ path: `${OUT}/${tag}-wipe${k + 1}-rev.png` }); await sync('mid-wipe rev');
    }
    await goT(0.05);
    for (const dir of [1, 1, 1, -1, -1, 1]) {   // fast flicks
      try { for (let i = 0; i < 6; i++) { await p.mouse.wheel({ deltaY: dir * 900 }); await wait(16); } }
      catch (e) { await p.evaluate(d => TD.lenis.scrollTo(scrollY + d * 5400), dir); }   // wheel input can time out in headless; fall back to a long programmatic flick
      await wait(1600); await sync('flick ' + dir);
    }
    await goT(L.wipes[1] + 0.3); await p.reload({ waitUntil: 'networkidle0' }); await p.evaluate(HELP); await wait(1500); await sync('reload mid');
    await p.evaluate(() => TD.lenis.scrollTo('#contact', { immediate: true, force: true })); await wait(900);
    await goT(L.holds[L.holds.length - 1], 1000); await sync('re-enter from below'); await goT(0.05); await sync('re-enter top');
    }
    const cr = await p.evaluate(() => { const st = ScrollTrigger.getAll().find(s => s.trigger && s.trigger.id === 'contact' && !s.pin); return [st.start, st.end]; });
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      await p.evaluate(y => TD.lenis.scrollTo(y, { immediate: true, force: true }), cr[0] + (cr[1] - cr[0]) * f); await wait(f === 1 ? 2200 : 1100);
      checks++; const hits = await p.evaluate(() => __threadHits()); if (hits.length) flag(tag + ' release ' + f, 'line crosses ' + hits.join(', '));
      await p.screenshot({ path: `${OUT}/${tag}-release-${f}.png` });
    }
    await p.evaluate(() => TD.lenis.scrollTo(ScrollTrigger.maxScroll(window), { immediate: true, force: true })); await wait(2600);
    checks++; if (!(await p.evaluate(() => __onWord()))) flag(tag, 'line does not finish beneath tension at page end');
    checks++; if (!(await p.evaluate(async () => { const a = document.getElementById('thread-path').getAttribute('d'); await new Promise(r => setTimeout(r, 600)); return a === document.getElementById('thread-path').getAttribute('d'); }))) flag(tag, 'underline not still');
    await p.screenshot({ path: `${OUT}/${tag}-contact-end.png` });
    if (!mob) {
    await p.evaluate(() => TD.lenis.scrollTo(0, { immediate: true, force: true })); await wait(800);
    await p.evaluate(() => document.querySelector('.nav-links a[href="#work"]').click()); await wait(3200);
    const wk = await p.evaluate(() => { const s = __state(), m = document.querySelectorAll('.moment')[s.vis - 1];
      return { s, words: m ? [...m.querySelectorAll('.m-k, .m-statement')].every(e => +getComputedStyle(e).opacity > 0.95) : false }; });
    checks++; if (wk.s.hud !== wk.s.vis || !wk.words) flag(tag, 'nav to Work not composed ' + JSON.stringify(wk));
    await goT(L.wipes[1] - 0.2, 900); await p.evaluate(() => document.querySelector('.reel-skip').click()); await wait(3800);
    checks++; if (!(await p.evaluate(() => __onWord()))) flag(tag, 'skip to contact: line not resolved on arrival');
    }
    await p.close();
  }
  // breakpoint round trips: counter sync + the line still ends on the word
  for (const seq of [[[1440, 900], [390, 700]], [[390, 700], [1280, 720]], [[1280, 720], [375, 667], [1440, 900], [390, 844]]]) {
    const p = await b.newPage(); p.on('pageerror', e => errs.push('resize ' + e.message));
    await p.setViewport({ width: seq[0][0], height: seq[0][1] }); await p.goto(URL, { waitUntil: 'networkidle0' }); await p.evaluate(HELP); await wait(700);
    for (const [w, h] of seq.slice(1)) { await p.setViewport({ width: w, height: h }); await wait(1500); }
    const tag = 'resize ' + seq.map(v => v.join('x')).join('>');
    const finalW = seq[seq.length - 1][0];
    if (finalW < 900) { checks++; const st = await p.evaluate(() => ({ reel: !!document.querySelector('.cases.is-reel'), hidden: [...document.querySelectorAll('.moment .m-detail')].filter(e => +getComputedStyle(e).opacity < 0.99).length })); if (st.reel || st.hidden) flag(tag, 'phone not stacked after resize ' + JSON.stringify(st)); }
    else for (const f of [0.95, 0.5, 0.05]) { await p.evaluate(f => { const st = __reel(); TD.lenis.scrollTo(st.start + (st.end - st.start) * f, { immediate: true, force: true }); }, f); await wait(900);
      checks++; const s = await p.evaluate(() => __state()); if (s.hud !== s.vis) flag(tag, `counter ${s.hud} vs visible ${s.vis} at ${f}`); }
    await p.evaluate(() => TD.lenis.scrollTo(ScrollTrigger.maxScroll(window), { immediate: true, force: true })); await wait(2600);
    checks++; if (!(await p.evaluate(() => __onWord()))) flag(tag, 'line does not finish beneath tension');
    await p.close();
  }
  // reduced motion
  for (const [w, h] of [[1440, 900], [390, 700], [375, 667]]) {
    const r = await b.newPage(); await r.setViewport({ width: w, height: h }); await r.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    r.on('pageerror', e => errs.push('reduced ' + e.message));
    await r.goto(URL, { waitUntil: 'networkidle0' }); await wait(600);
    const s = await r.evaluate(() => ({ pins: ScrollTrigger.getAll().filter(s => s.pin).length,
      hidden: [...document.querySelectorAll('.moment .m-k, .moment .m-statement, .moment .m-detail')].filter(e => getComputedStyle(e).visibility === 'hidden' || +getComputedStyle(e).opacity < 1).length,
      overflow: document.documentElement.scrollWidth > innerWidth }));
    checks++; if (s.pins || s.hidden || s.overflow) flag('reduced ' + w, JSON.stringify(s));
    for (const sel of ['[data-comp=wide]', '[data-comp=type]', '#process', '#contact']) { await r.evaluate(q => document.querySelector(q).scrollIntoView(), sel); await wait(300); await r.screenshot({ path: `${OUT}/reduced-${w}-${sel.replace(/\W/g, '')}.png` }); }
    await r.close();
  }
  // the call form: empty submit flags + focuses the field; a valid one gives feedback
  {
    const f = await b.newPage(); await f.setViewport({ width: 1440, height: 900 }); f.on('pageerror', e => errs.push('form ' + e.message));
    await f.goto(URL, { waitUntil: 'networkidle0' }); await wait(500);
    await f.evaluate(() => TD.openCall()); await wait(300);   // the form lives in the call popup (v28+)
    const r1 = await f.evaluate(() => { document.querySelector('#call-form .btn').click(); return { invalid: document.querySelector('[name=name]').getAttribute('aria-invalid'), focused: document.activeElement.name, msg: document.getElementById('cf-status').textContent }; });
    checks++; if (r1.invalid !== 'true' || r1.focused !== 'name' || !r1.msg) flag('form', 'empty submit not flagged ' + JSON.stringify(r1));
    const r2 = await f.evaluate(() => { const e = document.querySelector('#call-form').elements; e.name.value = 'Test'; e.email.value = 'not-an-email'; document.querySelector('#call-form .btn').click(); return { focused: document.activeElement.name, invalid: e.email.getAttribute('aria-invalid') }; });
    checks++; if (r2.focused !== 'email' || r2.invalid !== 'true') flag('form', 'bad email not flagged ' + JSON.stringify(r2));
    const r3 = await f.evaluate(() => { const e = document.querySelector('#call-form').elements; e.email.value = 'test@example.com'; document.querySelector('#call-form .btn').click(); const st = document.getElementById('cf-status'); return new Promise(res => { const t0 = Date.now(), tick = () => (st.textContent !== 'Sending...' || Date.now() - t0 > 4000) ? res(st.textContent) : setTimeout(tick, 50); tick(); }); });   // sending is async (Netlify Forms, v32)
    checks++; if (!/email app|request is in/.test(r3)) flag('form', 'valid submit gave no feedback: ' + r3);
    await f.evaluate(() => document.getElementById('contact').scrollIntoView()); await wait(400); await f.screenshot({ path: `${OUT}/form-1440.png` });
    await f.close();
  }
  // copy rule: no em dashes in rendered text
  const c = await b.newPage(); await c.goto(URL, { waitUntil: 'networkidle0' });
  checks++; const d = await c.evaluate(() => (document.body.innerText + document.title).split('—').length - 1); if (d) flag('copy', d + ' em dashes in rendered text');
  console.log(`\n${checks - issues.length}/${checks} checks clean`); issues.forEach(i => console.log('ISSUE', i));
  console.log('console errors:', errs.length ? errs : 'none');
  await b.close();
})();
