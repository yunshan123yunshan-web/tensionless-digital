#!/usr/bin/env node
/* Checks the built site in _site/ for the SEO basics every page must have.
   Usage: npm run check   (after npm run build). Exits 1 on any failure. */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';

const OUT = resolve(process.argv[2] || '_site');
const ORIGIN = 'https://tensionlessdigital.com';
// Standalone legacy pages copied as-is; they keep their own head tags for now.
const LEGACY = new Set(['404.html', 'privacy.html', 'terms.html', 'thank-you.html']);
const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot',
  'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot'];
const failures = [];
const fail = (where, msg) => failures.push(`${where}: ${msg}`);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const attr = (html, re) => (html.match(re) || [])[1];
const meta = (html, key, kind = 'name') =>
  attr(html, new RegExp(`<meta ${kind}="${key}" content="([^"]*)"`));

// A page's public URL from its output path: about/index.html -> /about/
function urlFor(file) {
  const rel = relative(OUT, file).split('\\').join('/');
  return ORIGIN + '/' + rel.replace(/(^|\/)index\.html$/, '$1');
}

function checkHead(file, html) {
  const where = relative(OUT, file);
  const title = attr(html, /<title>([^<]+)<\/title>/);
  const desc = meta(html, 'description');
  const canonical = attr(html, /<link rel="canonical" href="([^"]+)"/);
  if (!title) fail(where, 'missing <title>');
  if (!desc) fail(where, 'missing meta description');
  else if (desc.length < 50 || desc.length > 165) fail(where, `description length ${desc.length} (want 50-165)`);
  if (canonical !== urlFor(file)) fail(where, `canonical ${canonical} != ${urlFor(file)}`);
  if (meta(html, 'og:url', 'property') !== canonical) fail(where, 'og:url does not match canonical');
  for (const k of ['og:title', 'og:description', 'og:image']) {
    if (!meta(html, k, 'property')) fail(where, `missing ${k}`);
  }
  for (const k of ['twitter:title', 'twitter:description', 'twitter:image']) {
    if (!meta(html, k)) fail(where, `missing ${k}`);
  }
  if (!/<html lang="en-SG"/.test(html)) fail(where, 'html lang is not en-SG');
  return { title, noindex: /<meta name="robots" content="[^"]*noindex/.test(html) };
}

function checkJsonLd(where, html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  return blocks.flatMap(([, body]) => {
    try { const d = JSON.parse(body); return d['@graph'] || [d]; }
    catch (e) { fail(where, `invalid JSON-LD: ${e.message}`); return []; }
  });
}

function checkLocalRefs(file, html) {
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|#|data:)/.test(ref)) continue;
    // Relative refs break once the same markup is reused one folder down (/services/x/).
    if (!ref.startsWith('/')) fail(relative(OUT, file), `relative reference ${ref} (use a root-relative /path)`);
    const path = ref.split(/[?#]/)[0];
    const target = path.startsWith('/') ? join(OUT, path) : join(dirname(file), path);
    const resolved = path.endsWith('/') ? join(target, 'index.html') : target;
    if (!existsSync(resolved)) fail(relative(OUT, file), `broken local reference ${ref}`);
  }
}

// Service explanations must be in the initial HTML, not injected by proto-scene.js.
function checkServiceCopy(html) {
  const blocks = [...html.matchAll(/<div data-svc="(\w+)">([\s\S]*?)<\/div>/g)];
  const keys = blocks.map(([, k]) => k).join(',');
  if (keys !== 'lp,search,ad,seo') fail('index.html', `service copy blocks are "${keys}" (want lp,search,ad,seo)`);
  for (const [, k, body] of blocks) {
    for (const part of ['svc-p', 'svc-get', 'svc-fix']) {
      if (!new RegExp(`class="${part}">[^<]{10,}<`).test(body)) fail('index.html', `service ${k} has no ${part} text`);
    }
  }
  if (!/<p id="ex-p">[^<]{10,}<\/p>/.test(html)) fail('index.html', 'service panel #ex-p is empty before JS runs');
}

const SERVICE_PAGES = ['google-ads', 'meta-ads', 'landing-pages', 'seo'];

// Each service page: one H1, visible FAQ matching its FAQPage schema, a Service node,
// a working no-JS enquiry form, and no em dashes (copy rule).
function checkServicePage(where, html, nodes) {
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) fail(where, 'needs exactly one <h1>');
  if (html.includes('—')) fail(where, 'contains an em dash');
  if (!nodes.some((n) => n['@type'] === 'Service' && n.provider?.['@id'])) fail(where, 'no Service JSON-LD with a provider');
  const faq = nodes.find((n) => n['@type'] === 'FAQPage');
  const shown = (html.match(/<details class="faq-item"/g) || []).length;
  if (!faq || shown < 4) fail(where, `needs a FAQPage and at least 4 visible questions (found ${shown})`);
  else if (faq.mainEntity.length !== shown) fail(where, `FAQPage has ${faq.mainEntity.length} questions, page shows ${shown}`);
  if (!/<form[^>]+name="call"[^>]+action="\/thank-you\.html"[^>]+data-netlify="true"/.test(html)) fail(where, 'no Netlify call form posting to /thank-you.html');
  if (!nodes.some((n) => n['@type'] === 'BreadcrumbList')) fail(where, 'no BreadcrumbList');
}

// Articles: one H1, a visible byline, BlogPosting schema authored by the founder @id
// (the same Person the org graph embeds), ISO dates, no em dashes.
function checkArticle(where, html, nodes) {
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) fail(where, 'needs exactly one <h1>');
  if (html.includes('\u2014')) fail(where, 'contains an em dash');
  const post = nodes.find((n) => n['@type'] === 'BlogPosting');
  if (!post) return fail(where, 'no BlogPosting JSON-LD');
  const founder = nodes.find((n) => n.founder)?.founder?.['@id'];
  if (!founder || post.author?.['@id'] !== founder) fail(where, 'BlogPosting author is not the founder @id');
  for (const k of ['datePublished', 'dateModified']) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(post[k] || '')) fail(where, `BlogPosting ${k} is not an ISO date`);
  }
  if (!/class="byline[^"]*"[^>]*>[\s\S]*?Chia/.test(html)) fail(where, 'no visible byline');
  if (!/<time datetime="\d{4}-\d{2}-\d{2}"/.test(html)) fail(where, 'no visible <time> date');
}

// GA4 is driven by site.json ga4Id. Blank: no Google tag anywhere and privacy says
// there is no analytics. Set: every page and the thank-you page load /analytics.js,
// the CSP allows Google's domains, and privacy names Google Analytics.
function checkAnalytics(htmlFiles) {
  const site = JSON.parse(readFileSync(resolve('site/_data/site.json'), 'utf8'));
  const id = site.ga4Id || '';
  if (id && !/^G-[A-Z0-9]{4,}$/.test(id)) return fail('site.json', `ga4Id "${id}" is not a G-XXXX measurement ID`);
  const privacy = existsSync(join(OUT, 'privacy.html')) ? readFileSync(join(OUT, 'privacy.html'), 'utf8') : '';
  const thanks = existsSync(join(OUT, 'thank-you.html')) ? readFileSync(join(OUT, 'thank-you.html'), 'utf8') : '';
  const js = existsSync(join(OUT, 'analytics.js')) ? readFileSync(join(OUT, 'analytics.js'), 'utf8') : '';
  if (!js) fail('analytics.js', 'missing');
  if (!/<script src="\/analytics\.js[^"]*" defer data-lead><\/script>/.test(thanks)) fail('thank-you.html', 'does not load /analytics.js with data-lead');
  for (const f of htmlFiles) {
    const html = readFileSync(f, 'utf8');
    if (/googletagmanager\.com/.test(html)) fail(relative(OUT, f), 'loads Google tag directly (use /analytics.js)');
  }
  if (!id) {
    if (/googletagmanager/.test(js)) fail('analytics.js', 'loads Google tag while ga4Id is blank');
    if (/Google Analytics/.test(privacy)) fail('privacy.html', 'mentions Google Analytics while ga4Id is blank');
    return;
  }
  if (!js.includes(`'${id}'`)) fail('analytics.js', `does not contain ${id}`);
  for (const f of htmlFiles.filter((p) => !LEGACY.has(relative(OUT, p)))) {
    if (!readFileSync(f, 'utf8').includes('src="/analytics.js')) fail(relative(OUT, f), 'does not load /analytics.js');
  }
  if (!/Google Analytics/.test(privacy) || /does not use cookies, analytics/.test(privacy)) fail('privacy.html', 'wording does not match GA4 being on');
  const toml = readFileSync(resolve('netlify.toml'), 'utf8');
  for (const d of ['https://*.googletagmanager.com', 'https://*.google-analytics.com']) {
    if (!toml.includes(d)) fail('netlify.toml', `CSP does not allow ${d}`);
  }
}

function checkServiceLinks(html) {
  for (const slug of SERVICE_PAGES) {
    if (!html.includes(`href="/services/${slug}/"`)) fail('index.html', `no link to /services/${slug}/`);
  }
}

function checkHome(html, nodes) {
  checkServiceCopy(html);
  checkServiceLinks(html);
  // Online-only, no street address: OnlineBusiness, not a LocalBusiness subtype.
  const org = nodes.find((n) => [].concat(n['@type']).includes('OnlineBusiness'));
  if (!org) return fail('index.html', 'no OnlineBusiness JSON-LD');
  if (org.address?.addressCountry !== 'SG') fail('index.html', 'org address is not SG');
  const areas = [].concat(org.areaServed || []);
  if (!JSON.stringify(areas).includes('Singapore')) fail('index.html', 'areaServed missing Singapore');
  if (areas.some((a) => typeof a === 'string')) fail('index.html', 'areaServed has a bare string (use a Place)');
  if (!org.contactPoint?.email) fail('index.html', 'org has no contactPoint email');
  if (!org.logo) fail('index.html', 'org has no logo');
  if (!org.legalName) fail('index.html', 'org has no legalName');
  // The owner is the author entity that article bylines will reference by @id.
  const founder = [].concat(org.founder || [])[0];
  if (founder?.['@type'] !== 'Person' || !founder.name || !/#[a-z]+$/.test(founder['@id'] || '')) {
    fail('index.html', 'org has no founder Person with an @id');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(org.foundingDate || '')) fail('index.html', 'org has no ISO foundingDate');
  const uen = org.identifier?.propertyID === 'UEN' ? org.identifier.value : '';
  if (!/^[0-9A-Z]{9,10}$/.test(uen)) return fail('index.html', 'org has no UEN identifier');
  // The UEN is a trust fact: it must read the same everywhere it is published.
  if (!html.includes(`UEN ${uen}`)) fail('index.html', `footer does not show UEN ${uen}`);
  for (const name of ['privacy.html', 'llms.txt']) {
    const p = join(OUT, name);
    if (!existsSync(p) || !readFileSync(p, 'utf8').includes(uen)) fail(name, `does not state UEN ${uen}`);
  }
  for (const p of ['/privacy', '/terms']) {
    if (!new RegExp(`href="${p}(\\.html)?"`).test(html)) fail('index.html', `no link to ${p}`);
  }
  if (!/<form[^>]+name="call"[^>]+data-netlify="true"/.test(html)) fail('index.html', 'Netlify call form missing');
  if (/Prototype v\d+|not the live site/.test(html)) fail('index.html', 'prototype labels still on homepage');
}

function checkSitemap(pages) {
  const path = join(OUT, 'sitemap.xml');
  if (!existsSync(path)) return fail('sitemap.xml', 'missing');
  const locs = [...readFileSync(path, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (new Set(locs).size !== locs.length) fail('sitemap.xml', 'duplicate URLs');
  const indexable = pages.filter((p) => !p.noindex).map((p) => p.url);
  for (const url of indexable) if (!locs.includes(url)) fail('sitemap.xml', `missing ${url}`);
  for (const loc of locs) if (!indexable.includes(loc)) fail('sitemap.xml', `lists non-page or noindex URL ${loc}`);
  const robots = existsSync(join(OUT, 'robots.txt')) ? readFileSync(join(OUT, 'robots.txt'), 'utf8') : '';
  if (!robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`)) fail('robots.txt', 'no Sitemap line');
  // AI search and answer crawlers are named explicitly, not left to the wildcard.
  for (const bot of AI_BOTS) {
    if (!new RegExp(`User-agent: ${bot}\\nAllow: /`).test(robots)) fail('robots.txt', `no explicit Allow for ${bot}`);
  }
  if (/Disallow: \/\s*$/m.test(robots)) fail('robots.txt', 'blocks the whole site');
}

// Netlify config: every security header present under /*, and the www redirect kept.
function checkNetlifyConfig() {
  const path = resolve('netlify.toml');
  if (!existsSync(path)) return fail('netlify.toml', 'missing');
  const toml = readFileSync(path, 'utf8');
  const site = toml.split(/^\[\[headers\]\]/m).find((block) => /for = "\/\*"/.test(block)) || '';
  for (const h of ['Strict-Transport-Security', 'X-Content-Type-Options', 'X-Frame-Options',
    'Referrer-Policy', 'Permissions-Policy', 'Content-Security-Policy']) {
    if (!new RegExp(`^\\s+${h} = "[^"]+"$`, 'm').test(site)) fail('netlify.toml', `/* headers missing ${h}`);
  }
  if (!/from = "https:\/\/www\.tensionlessdigital\.com\/\*"/.test(toml)) fail('netlify.toml', 'www redirect missing');
}

// The IndexNow key in the script must be served, unchanged, at /<key>.txt.
function checkIndexNow() {
  const script = resolve('scripts/indexnow.mjs');
  if (!existsSync(script)) return fail('scripts/indexnow.mjs', 'missing');
  const key = attr(readFileSync(script, 'utf8'), /const KEY = '([0-9a-f]{32})'/);
  if (!key) return fail('scripts/indexnow.mjs', 'no 32-hex KEY');
  const file = join(OUT, `${key}.txt`);
  if (!existsSync(file) || readFileSync(file, 'utf8').trim() !== key) fail(`${key}.txt`, 'key file missing or wrong');
}

// Every link in llms.txt must reach a real page and, if it has one, a real #id on it.
function checkLlms() {
  const path = join(OUT, 'llms.txt');
  if (!existsSync(path)) return fail('llms.txt', 'missing');
  const text = readFileSync(path, 'utf8');
  if (text.includes('—')) fail('llms.txt', 'contains an em dash');
  for (const [, href] of text.matchAll(/\]\((https?:[^)]+)\)/g)) {
    const u = new URL(href);
    if (u.origin !== ORIGIN) continue;
    const file = join(OUT, u.pathname.endsWith('/') ? `${u.pathname}index.html` : u.pathname);
    if (!existsSync(file)) { fail('llms.txt', `link to missing page ${href}`); continue; }
    const id = u.hash.slice(1);
    if (id && !readFileSync(file, 'utf8').includes(`id="${id}"`)) fail('llms.txt', `link to missing anchor ${href}`);
  }
}

// Legal pages: copy rule (no em dashes) and the privacy page must name the form processor.
function checkLegal() {
  for (const name of ['privacy.html', 'terms.html', 'thank-you.html']) {
    const p = join(OUT, name);
    if (!existsSync(p)) { fail(name, 'missing'); continue; }
    const html = readFileSync(p, 'utf8');
    if (html.includes('—')) fail(name, 'contains an em dash');
    if (name === 'privacy.html' && !/Netlify/.test(html)) fail(name, 'does not name Netlify as the form processor');
    if (name === 'privacy.html' && /not stored on any server/.test(html)) fail(name, 'still claims submissions are not stored');
  }
}

function main() {
  if (!existsSync(join(OUT, 'index.html'))) {
    console.error(`FAIL: ${OUT}/index.html not found (run npm run build first)`);
    process.exit(1);
  }
  const files = walk(OUT);
  const html = files.filter((f) => f.endsWith('.html'));
  for (const f of files) if (/prototype-|\.njk$/.test(f)) fail(relative(OUT, f), 'source/prototype file leaked into output');
  const pages = html.filter((f) => !LEGACY.has(relative(OUT, f))).map((file) => {
    const src = readFileSync(file, 'utf8');
    const head = checkHead(file, src);
    const nodes = checkJsonLd(relative(OUT, file), src);
    checkLocalRefs(file, src);
    if (relative(OUT, file) === 'index.html') checkHome(src, nodes);
    const slug = (relative(OUT, file).match(/^services\/([a-z-]+)\/index\.html$/) || [])[1];
    if (slug) checkServicePage(relative(OUT, file), src, nodes);
    if (/^insights\/[a-z0-9-]+\/index\.html$/.test(relative(OUT, file))) checkArticle(relative(OUT, file), src, nodes);
    return { url: urlFor(file), noindex: head.noindex };
  });
  for (const slug of SERVICE_PAGES) {
    if (!existsSync(join(OUT, 'services', slug, 'index.html'))) fail(`services/${slug}/`, 'page missing');
  }
  const articles = (existsSync(join(OUT, 'insights')) ? walk(join(OUT, 'insights')) : []).filter((f) => /insights\/[a-z0-9-]+\/index\.html$/.test(f));
  if (articles.length < 2) fail('insights/', `expected at least 2 articles, found ${articles.length}`);
  const hub = existsSync(join(OUT, 'insights', 'index.html')) ? readFileSync(join(OUT, 'insights', 'index.html'), 'utf8') : '';
  for (const a of articles) {
    const href = '/' + relative(OUT, a).replace(/index\.html$/, '');
    if (!hub.includes(`href="${href}"`)) fail('insights/index.html', `does not link to ${href}`);
  }
  checkAnalytics(html);
  checkSitemap(pages);
  checkLlms();
  checkLegal();
  checkIndexNow();
  checkNetlifyConfig();

  if (failures.length) {
    console.error(failures.map((f) => `FAIL ${f}`).join('\n'));
    console.error(`\n${failures.length} failure(s) across ${pages.length} page(s)`);
    process.exit(1);
  }
  console.log(`OK: ${pages.length} page(s) checked, sitemap and robots consistent`);
  if (/X-Robots-Tag = "noindex"/.test(readFileSync(resolve('netlify.toml'), 'utf8'))) {
    console.warn('WARNING: netlify.toml sends X-Robots-Tag: noindex on every page (pre-launch). Remove it at launch or nothing will be indexed.');
  }
}

main();
