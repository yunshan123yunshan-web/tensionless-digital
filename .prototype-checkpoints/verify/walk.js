// Usage: node walk.js <outdir>   whole-page walk: a frame every ~0.85 screen (desktop + phone), plus the call dialog
const puppeteer = require(require('child_process').execSync('npm root -g').toString().trim() + '/puppeteer');
const wait = ms => new Promise(r => setTimeout(r, ms)); const OUT = process.argv[2]; require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  for (const [n, w, h] of [['d', 1440, 900], ['m', 390, 844]]) {
    const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await p.setViewport({ width: w, height: h });
    await p.goto('http://127.0.0.1:5173/prototype-wire.html?t=' + Date.now(), { waitUntil: 'networkidle0' }); await wait(1200);
    // open the blind the way a visitor would (press the tab)
    await p.click('#tab'); await wait(2500);
    const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    let i = 0;
    for (let y = await p.evaluate(() => scrollY); y <= max + 1; y += h * 0.85) {
      await p.evaluate(y => TD.lenis ? TD.lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y), Math.min(y, max)); await wait(1300);
      await p.screenshot({ path: `${OUT}/${n}-${String(i++).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 62 });
      if (y >= max) break;
    }
    await p.evaluate(() => document.querySelector('[data-call]').click()); await wait(900);
    await p.screenshot({ path: `${OUT}/${n}-dialog.jpg`, type: 'jpeg', quality: 70 });
    console.log(n, 'frames', i, 'max', max, 'errors', errs);
    await p.close();
  }
  await b.close();
})();
