// Usage: node shots.js <outdir>   section screenshots for review (hero, services, release route, contact)
const puppeteer = require(require('child_process').execSync('npm root -g').toString().trim() + '/puppeteer');
const wait = ms => new Promise(r => setTimeout(r, ms)); const OUT = process.argv[2]; require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  for (const [n, w, h] of [['d', 1440, 900], ['m', 390, 844]]) {
    const p = await b.newPage(); await p.setViewport({ width: w, height: h });
    await p.goto('http://127.0.0.1:5173/prototype-wire.html?t=' + Date.now(), { waitUntil: 'networkidle0' }); await wait(1000);
    const shot = async name => { await wait(1300); await p.screenshot({ path: `${OUT}/${n}-${name}.jpg`, type: 'jpeg', quality: 72 }); };
    const to = async y => p.evaluate(y => { if (window.TD && TD.lenis) TD.lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y); }, y);
    const top = sel => p.evaluate(s => document.querySelector(s).getBoundingClientRect().top + scrollY, sel);
    await shot('hero');
    await to(await top('#services')); await shot('services');
    if (n === 'm') { await to(await top('#services') + h * 0.85); await shot('services2'); }
    await to(await top('#quotes')); await shot('quotes');
    const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const pb = await p.evaluate(() => { const r = document.getElementById('process').getBoundingClientRect(); return r.bottom + scrollY; });
    const a = pb - h, z = max;
    for (let i = 0; i <= 6; i++) { await to(a + (z - a) * i / 6); await shot('release' + i); }
    await p.close();
  }
  await b.close();
})();
