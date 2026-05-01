const { chromium } = require('playwright');

const EXPECTED = {
  ink: 'rgb(9, 9, 9)',
  inkSoft: 'rgb(20, 20, 20)',
  inkMid: 'rgb(30, 30, 30)',
  offWhite: 'rgb(240, 242, 244)',
};

const URL = process.argv[2] || 'http://127.0.0.1:5173/index.html';

async function getComputedBg(page, selector) {
  return page.$eval(selector, el => getComputedStyle(el).backgroundColor);
}

async function checkScenes(page, sectionId, sceneSelector, scrollFraction) {
  const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  const scrollY = Math.floor(maxScroll * scrollFraction);
  await page.evaluate(y => window.scrollTo(0, y), scrollY);
  await page.waitForTimeout(600);

  const opacities = await page.evaluate((sel) => {
    return Array.from(document.querySelectorAll(sel)).map(el => parseFloat(getComputedStyle(el).opacity));
  }, sceneSelector);

  const visible = opacities.filter(o => o > 0.05).length;
  const sceneData = opacities.map((o, i) => `S${i}:${o.toFixed(2)}`).join(', ');
  const pass = visible <= 1;
  const label = `${sectionId} at ${(scrollFraction * 100).toFixed(0)}% scroll`;
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${label}: ${sceneData}`);
  return { pass, opacities };
}

(async () => {
  console.log('\n=== Tensionless Digital — Playwright Visual Audit ===\n');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);

  // --- 1. Console errors ---
  console.log('--- 1. Console Errors ---');
  console.log(`  ${consoleErrors.length === 0 ? 'PASS: No console errors' : `FAIL: ${consoleErrors.length} errors`}\n`);

  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(`  Page height: ${pageHeight}px\n`);

  // --- 2. GSAP & ScrollTrigger ---
  console.log('--- 2. GSAP / ScrollTrigger ---');
  console.log(`  GSAP: ${await page.evaluate(() => typeof gsap !== 'undefined') ? 'YES' : 'NO'}`);
  console.log(`  ScrollTrigger: ${await page.evaluate(() => typeof ScrollTrigger !== 'undefined') ? 'YES' : 'NO'}\n`);

  // --- 3. Section backgrounds ---
  console.log('--- 3. Section Background Colors ---');
  const checks = [
    { id: '#services',     label: 'Services',      expected: EXPECTED.ink },
    { id: '#data-break',   label: 'Data Break',    expected: EXPECTED.ink },
    { id: '#results',      label: 'Results',       expected: EXPECTED.inkSoft },
    { id: '#testimonials', label: 'Testimonials',  expected: EXPECTED.inkMid },
    { id: '#process',      label: 'Process',       expected: EXPECTED.inkSoft },
    { id: '#contact',      label: 'CTA',           expected: EXPECTED.ink },
    { id: 'footer',        label: 'Footer',        expected: EXPECTED.ink },
  ];
  let pass = 0, fail = 0;
  for (const { id, label, expected } of checks) {
    if (await page.$(id)) {
      const bg = await getComputedBg(page, id);
      const ok = bg === expected;
      console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}: ${bg}${ok ? '' : ` (expected ${expected})`}`);
      ok ? pass++ : fail++;
    } else {
      console.log(`  SKIP  ${label}: selector not found`);
    }
  }
  console.log(`  Backgrounds: ${pass} pass, ${fail} fail\n`);

  // --- 4. Hero check ---
  console.log('--- 4. Hero at Scroll 0 ---');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  if (await page.$('canvas')) {
    const vis = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      const s = getComputedStyle(c);
      return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0;
    });
    console.log(`  Canvas visible: ${vis ? 'YES' : 'NO'}`);
  }

  // --- 5. Pinned scene overlap checks ---
  console.log('\n--- 5. Scene Overlap (at most 1 scene visible) ---');
  await checkScenes(page, 'Results', '.res-scene', 0.48);
  await checkScenes(page, 'Results', '.res-scene', 0.55);
  await checkScenes(page, 'Results', '.res-scene', 0.58);
  await checkScenes(page, 'Testimonials', '.testi-scene', 0.68);
  await checkScenes(page, 'Testimonials', '.testi-scene', 0.74);
  await checkScenes(page, 'Testimonials', '.testi-scene', 0.78);
  await checkScenes(page, 'Process', '.proc-step', 0.82);
  await checkScenes(page, 'Process', '.proc-step', 0.86);
  await checkScenes(page, 'Process', '.proc-step', 0.90);

  // --- 6. Spillover ---
  console.log('\n--- 6. Section Spillover ---');
  await checkScenes(page, 'Results end', '.res-scene', 0.60);
  await checkScenes(page, 'Testimonials end', '.testi-scene', 0.79);
  await checkScenes(page, 'Process end', '.proc-step', 0.90);

  // --- 7. Services reveals ---
  console.log('\n--- 7. Services Reveal ---');
  await page.evaluate(() => window.scrollTo(0, Math.floor(document.documentElement.scrollHeight * 0.35)));
  await page.waitForTimeout(600);
  const svcVisible = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#services .svc-card')).filter(el => {
      const s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.05;
    }).length;
  });
  console.log(`  Services cards visible: ${svcVisible}/5`);

  // --- 8. CTA/Footer ---
  console.log('\n--- 8. CTA / Footer ---');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(600);
  const ctaBg = await getComputedBg(page, '#contact');
  console.log(`  CTA background: ${ctaBg} ${ctaBg === EXPECTED.ink ? 'PASS' : 'FAIL'}`);
  const footerBg = await getComputedBg(page, 'footer');
  console.log(`  Footer background: ${footerBg} ${footerBg === EXPECTED.ink ? 'PASS' : 'FAIL'}`);

  // --- 9. Mobile ---
  console.log('\n--- 9. Mobile (390x844) ---');
  const mc = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mc.newPage();
  const merr = [];
  mp.on('pageerror', e => merr.push(e.message));
  await mp.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
  await mp.waitForTimeout(1500);
  const sections = ['hero-pin', 'services', 'data-break', 'results', 'testimonials', 'process', 'contact'];
  let found = 0, withFooter = 0;
  for (const s of sections) {
    const el = await mp.$(`#${s}`);
    if (el) {
      found++;
      if (await mp.evaluate(el => getComputedStyle(el).display !== 'none', el)) withFooter++;
    }
  }
  console.log(`  Sections visible on mobile: ${withFooter}/${sections.length}`);
  console.log(`  Mobile errors: ${merr.length === 0 ? '0 (PASS)' : merr.length}`);
  await mc.close();

  console.log('\n=== Audit Complete ===\n');
  await browser.close();
})();
