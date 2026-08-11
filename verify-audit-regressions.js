/**
 * Consolidated Playwright regression check for the 2026-08 audit fixes
 * (this project has no unit test runner — static HTML/CSS/JS site, verification
 * is browser-state based per CLAUDE.md).
 *
 * Covers, in order:
 *   1. Scene-0 gating — .testi-s1 and .proc-step[0] render at opacity:0 from
 *      page load (no scroll), so empty panels never double-expose behind the
 *      section that precedes them.
 *   2. Process→CTA paint order — .cta-sec is z-index:1, .imm-pin-wrap is
 *      z-index:2, so Process content paints ABOVE the CTA during their crossfade
 *      (regression: both were z-index:2, DOM order put CTA on top).
 *   3. Header clearance — every section's substantive text clears the fixed nav
 *      (nav bottom ~74px; threshold 84px). Giant background numerals excluded.
 *
 * Run: node verify-audit-regressions.js   (requires local server on :5173)
 */
const { chromium } = require('playwright');

const NAV_CLEAR = 84;
const URL = 'http://127.0.0.1:5173/index.html';

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });

  // ── 1. Scene-0 gating at page load ───────────────────────────
  const gate = await page.evaluate(() => {
    const s1 = document.querySelector('.testi-s1');
    const step0 = document.querySelectorAll('.proc-step')[0];
    return {
      testiS1Opacity: s1 ? +getComputedStyle(s1).opacity : null,
      procStep0Opacity: step0 ? +getComputedStyle(step0).opacity : null,
    };
  });
  const gatePass = gate.testiS1Opacity === 0 && gate.procStep0Opacity === 0;
  console.log(`1. Scene-0 gating: s1=${gate.testiS1Opacity} step0=${gate.procStep0Opacity} ${gatePass ? 'PASS' : 'FAIL'}`);

  // ── 2. Process→CTA paint order at the crossfade window ──────
  const statics = await page.evaluate(() => {
    const cta = document.querySelector('.cta-sec');
    const wrap = document.querySelector('#process-imm');
    return {
      ctaZ: cta ? getComputedStyle(cta).zIndex : null,
      wrapZ: wrap ? getComputedStyle(wrap).zIndex : null,
    };
  });
  const pin = await page.evaluate(() => {
    const st = window.ScrollTrigger.getAll().find(s => s.trigger && s.trigger.id === 'process-imm' && s.pin);
    return st ? st.start : null;
  });
  let violations = 0;
  if (pin !== null) {
    await page.evaluate((sy) => { window.scrollTo(0, sy); window.ScrollTrigger.update(); }, pin - 900);
    await page.waitForTimeout(800);
    for (let i = 0; i < 40; i++) {
      await page.mouse.wheel(0, 28);
      await page.waitForTimeout(300);
      const hit = await page.evaluate(() => {
        const sel = ['.proc-step[data-step="4"]', '.proc-step[data-step="5"]', '.proc-step[data-step="3"]'];
        let probe = null;
        for (const q of sel) {
          const el = document.querySelector(q);
          if (!el) continue;
          if (getComputedStyle(el).visibility === 'hidden') continue;
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          if (cy > 0 && cy < 900) { probe = { el, cx, cy }; break; }
        }
        const cta = document.querySelector('.cta-sec');
        const rc = cta.getBoundingClientRect();
        if (!probe || rc.top >= 900 || rc.top < -400) return null;
        const top = document.elementFromPoint(probe.cx, probe.cy);
        const stepOp = probe.el ? +getComputedStyle(probe.el).opacity : 0;
        if (stepOp <= 0.1) return null;
        return { inProc: top ? !!top.closest('#process-imm') : false, inCta: top ? !!top.closest('#contact') : false };
      });
      if (hit && !hit.inProc && hit.inCta) violations++;
    }
  }
  const paintPass = statics.ctaZ === '1' && statics.wrapZ === '2' && violations === 0;
  console.log(`2. Process→CTA paint order: ctaZ=${statics.ctaZ} wrapZ=${statics.wrapZ} violations=${violations} ${paintPass ? 'PASS' : 'FAIL'}`);

  // ── 3. Header clearance for every section ───────────────────
  const targets = [
    { id: 'services', pinned: false },
    { id: 'data-break', pinned: false },
    { id: 'case-study', pinned: true },
    { id: 'testimonials-imm', pinned: true },
    { id: 'process-imm', pinned: true },
    { id: 'contact', pinned: false },
  ];
  const clearResults = [];
  for (const t of targets) {
    await page.evaluate(() => { window.scrollTo(0, 0); window.ScrollTrigger.update(); });
    await page.waitForTimeout(300);
    const startY = await page.evaluate(({ id, pinned }) => {
      const st = window.ScrollTrigger.getAll();
      if (pinned) {
        const pin = st.find(s => s.trigger && s.trigger.id === id && s.pin);
        if (pin && typeof pin.start === 'number') return pin.start;
      }
      const el = document.getElementById(id);
      return el ? el.getBoundingClientRect().top + window.scrollY : null;
    }, t);
    await page.evaluate((sy) => { window.scrollTo(0, sy); window.ScrollTrigger.update(); }, startY);
    await page.waitForTimeout(1100);
    const offenders = await page.evaluate((id) => {
      const el = document.getElementById(id);
      const bad = [];
      el.querySelectorAll('h1,h2,h3,h4,p,span,small,label,a,button').forEach(e => {
        const cs = getComputedStyle(e);
        if (cs.visibility === 'hidden' || cs.display === 'none') return;
        if (+cs.opacity < 0.05) return;
        if (parseFloat(cs.fontSize) > 100) return;
        const r = e.getBoundingClientRect();
        if (r.width < 3 || r.height < 3) return;
        if (r.bottom <= 0 || r.top >= 900) return;
        if (r.top < 84) bad.push(String(e.className).slice(0, 30) + '@' + Math.round(r.top) + 'px');
      });
      return bad;
    }, t.id);
    clearResults.push(offenders.length === 0);
    if (offenders.length) offenders.forEach(o => console.log(`    ⚠ ${t.id}: ${o}`));
    console.log(`3. Header clearance [${t.id}]: ${offenders.length === 0 ? 'PASS' : 'FAIL'}`);
  }

  const allPass = gatePass && paintPass && clearResults.every(Boolean);
  console.log(`\nOVERALL: ${allPass ? 'PASS' : 'FAIL'}`);
  await browser.close();
  process.exit(allPass ? 0 : 1);
})();
