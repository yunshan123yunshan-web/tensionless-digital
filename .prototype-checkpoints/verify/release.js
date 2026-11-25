// Usage: node release.js <outdir>   frames of the process→contact release (the arrow to "tension")
const puppeteer = require(require('child_process').execSync('npm root -g').toString().trim() + '/puppeteer');
const wait = ms => new Promise(r => setTimeout(r, ms)); const OUT = process.argv[2]; require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  for (const [n, w, h] of [['d', 1440, 900], ['m', 390, 844]]) {
    const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.setViewport({ width: w, height: h });
    await p.goto('http://127.0.0.1:5173/prototype-wire.html?t=' + Date.now(), { waitUntil: 'networkidle0' }); await wait(1000);
    const to = async y => p.evaluate(y => { if (window.TD && TD.lenis) TD.lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y); }, y);
    const st = await p.evaluate(() => { const s = ScrollTrigger.getAll().filter(s => s.trigger && s.trigger.id === 'contact' && s.vars.scrub).pop(); return [s.start, s.end]; });
    for (let i = 0; i <= 8; i++) { await to(st[0] + (st[1] - st[0]) * (i / 8) - (i === 0 ? 60 : 0)); await wait(1400); await p.screenshot({ path: `${OUT}/${n}-r${i}.jpg`, type: 'jpeg', quality: 70 }); }
    console.log(n, 'errors', errs);
    await p.close();
  }
  await b.close();
})();
