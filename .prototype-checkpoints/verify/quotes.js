// Usage: node quotes.js <outdir>   washing-line testimonials: controls, drag, tap, wrap, stable front card, reduced motion
const puppeteer = require(require('child_process').execSync('npm root -g').toString().trim() + '/puppeteer');
const wait = ms => new Promise(r => setTimeout(r, ms)); const OUT = process.argv[2] || '/tmp/q'; require('fs').mkdirSync(OUT, { recursive: true });
const res = []; const ok = (n, c, info) => res.push((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' ' + JSON.stringify(info)));
(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  for (const [n, w, h, red] of [['d', 1440, 900], ['m', 390, 844], ['r', 1440, 900, true]]) {
    const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    if (red) await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await p.setViewport({ width: w, height: h }); await p.goto('http://127.0.0.1:5173/prototype-wire.html?t=' + Date.now(), { waitUntil: 'networkidle0' }); await wait(800);
    await p.evaluate(() => { const y = document.getElementById('q-stage').getBoundingClientRect().top + scrollY - 120; if (window.TD && TD.lenis) TD.lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y); });
    await wait(1200);
    const T = red ? 150 : 2000;
    const st = () => p.evaluate(() => { const on = document.querySelector('.q-card.on'), cs = getComputedStyle(on), m = new DOMMatrix(cs.transform);
      return { count: document.getElementById('q-i').textContent, total: document.getElementById('q-n').textContent, on: on.id, op: +cs.opacity, y: +m.f.toFixed(1), rot: +(Math.atan2(m.b, m.a) * 180 / Math.PI).toFixed(2), overflow: document.documentElement.scrollWidth > innerWidth }; });
    let s = await st(); ok(n + ' starts on 01/07, upright, no page overflow', s.count === '01' && s.total === '07' && s.on === 'q-1' && Math.abs(s.rot) < 0.5 && s.op > 0.99 && !s.overflow, s);
    await p.screenshot({ path: `${OUT}/${n}-rest.jpg`, type: 'jpeg', quality: 70 });
    await p.click('#q-next'); await wait(T); s = await st(); ok(n + ' next → 02', s.count === '02' && Math.abs(s.rot) < 0.5, s);
    await p.focus('#q-stage'); await p.keyboard.press('ArrowLeft'); await wait(T); s = await st(); ok(n + ' ArrowLeft → 01', s.count === '01', s);
    await p.click('#q-prev'); await wait(T); s = await st(); ok(n + ' prev wraps → 07', s.count === '07' && s.on === 'q-7', s);
    const box = await p.evaluate(() => { const r = document.getElementById('q-stage').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 12; i++) { await p.mouse.move(cx - i * (w < 700 ? 22 : 30), cy + 2); await wait(16); }
    await p.mouse.up(); await wait(T + 200); s = await st(); ok(n + ' drag left → exactly one card (01)', s.count === '01' && Math.abs(s.rot) < 0.5, s);
    const side = await p.evaluate(() => { const c = [...document.querySelectorAll('.q-card')].find(c => !c.classList.contains('on') && +getComputedStyle(c).opacity > 0.9 && c.getBoundingClientRect().left > innerWidth / 2); if (!c) return null; const r = c.getBoundingClientRect(); return { x: Math.min(innerWidth - 8, r.left + 30), y: r.top + r.height / 2, id: c.id }; });
    if (side) { await p.mouse.click(side.x, side.y); await wait(T + 200); s = await st(); ok(n + ' tap side card → front', s.on === side.id, { side, s }); } else ok(n + ' side card tappable', false, null);
    if (!red && w > 700) {   // pull the wire: the card being read must not move
      const before = await st();
      await p.mouse.move(cx - 260, box.y + 40); await p.mouse.down();
      let maxDy = 0, maxRot = 0;
      for (let i = 1; i <= 10; i++) { await p.mouse.move(cx - 260, box.y + 40 + i * 18); await wait(20); const t = await st(); maxDy = Math.max(maxDy, Math.abs(t.y - before.y)); maxRot = Math.max(maxRot, Math.abs(t.rot)); }
      await p.screenshot({ path: `${OUT}/${n}-pull.jpg`, type: 'jpeg', quality: 70 }); await p.mouse.up();
      for (let i = 0; i < 8; i++) { await wait(60); const t = await st(); maxDy = Math.max(maxDy, Math.abs(t.y - before.y)); maxRot = Math.max(maxRot, Math.abs(t.rot)); }
      ok(n + ' front card holds still while the wire is pulled and twangs (<2px, <1.5deg)', maxDy < 2 && maxRot < 1.5, { maxDy, maxRot });
      await wait(3500); s = await st(); ok(n + ' settles upright after twang', Math.abs(s.rot) < 0.5, s);
    }
    ok(n + ' no console errors', errs.length === 0, errs);
    await p.close();
  }
  console.log(res.join('\n')); console.log(res.filter(r => r.startsWith('PASS')).length + '/' + res.length + ' passed'); await b.close();
})();
