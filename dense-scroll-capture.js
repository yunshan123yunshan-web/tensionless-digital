const { chromium } = require('playwright');
const fs = require('fs');

const VIEWPORT = { width: 1440, height: 900 };
const URL = process.argv[2] || 'http://127.0.0.1:5173/index.html';
const OUTDIR = '/tmp/td-dense-audit';

(async () => {
  fs.mkdirSync(OUTDIR, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });

  const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  console.log(`Page scrollHeight: ${maxScroll + VIEWPORT.height}px, max scroll: ${maxScroll}px`);

  const STEP = 400; // px per capture — dense enough to catch transitions
  let i = 0;
  for (let y = 0; y <= maxScroll; y += STEP) {
    await page.evaluate(sy => { window.scrollTo(0, sy); window.ScrollTrigger && window.ScrollTrigger.update(); }, y);
    await page.waitForTimeout(350);
    const fname = `${String(i).padStart(3, '0')}_y${y}.png`;
    await page.screenshot({ path: `${OUTDIR}/${fname}` });
    i++;
  }
  // final frame at absolute bottom
  await page.evaluate(() => { window.scrollTo(0, document.documentElement.scrollHeight); window.ScrollTrigger && window.ScrollTrigger.update(); });
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUTDIR}/${String(i).padStart(3, '0')}_bottom.png` });

  console.log(`Captured ${i + 1} screenshots to ${OUTDIR}`);
  console.log(`Console errors: ${errors.length}`);
  errors.forEach(e => console.log('  ' + e));

  await browser.close();
})();
