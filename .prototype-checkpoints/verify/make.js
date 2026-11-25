// Usage: node make.js <outdir>   services: chaos → press "Make it work together" → aligned board
const puppeteer = require(require('child_process').execSync('npm root -g').toString().trim() + '/puppeteer');
const wait = ms => new Promise(r => setTimeout(r, ms)); const OUT = process.argv[2]; require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  for (const [n, w, h] of [['d', 1440, 900], ['m', 390, 844]]) {
    const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.setViewport({ width: w, height: h });
    await p.goto('http://127.0.0.1:5173/prototype-wire.html?t=' + Date.now(), { waitUntil: 'networkidle0' }); await wait(800);
    await p.evaluate(() => { const y = document.getElementById('services').getBoundingClientRect().top + scrollY + (innerWidth < 700 ? 300 : 0); if (window.TD && TD.lenis) TD.lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y); });
    await wait(1200); await p.click('#make'); await wait(3500);
    const state = await p.evaluate(() => document.getElementById('services').dataset.state);
    await p.screenshot({ path: `${OUT}/${n}-order.jpg`, type: 'jpeg', quality: 72 });
    console.log(n, 'state after make:', state, 'errors:', errs.length ? errs : 'none');
    await p.close();
  }
  await b.close();
})();
