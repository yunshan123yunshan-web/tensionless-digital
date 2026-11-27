#!/usr/bin/env node
/* Tells IndexNow (Bing, Copilot, Yandex and others) which pages changed.
   Run AFTER a deploy is live:  npm run indexnow             (every URL in the live sitemap)
                                npm run indexnow -- /services/seo/   (only these paths)
   Ported from pier-immigration/scripts/indexnow.mjs. The key file /<KEY>.txt ships with the site. */

const KEY = 'be22952b77555160cbd7fd431bbf2617';
const HOST = process.env.INDEXNOW_HOST || 'tensionlessdigital.com';
if (!/^[a-z0-9.-]+$/i.test(HOST)) throw new Error('INDEXNOW_HOST must be a hostname.');
const ORIGIN = `https://${HOST}`;
const KEY_LOCATION = `${ORIGIN}/${KEY}.txt`;

async function fetchText(url) {
  const res = await fetch(url).catch((err) => {
    throw new Error(`Could not reach ${url} (${err.cause?.code || err.message}). Is the site deployed on this domain?`);
  });
  if (!res.ok) throw new Error(`${url} returned HTTP ${res.status}`);
  return res.text();
}

// Same-host page URLs only, no queries or fragments, de-duplicated.
function toUrlList(paths) {
  return [...new Set(paths.map((path) => {
    const url = new URL(path, ORIGIN);
    if (url.origin !== ORIGIN || url.search || url.hash) throw new Error(`Not a same-host page URL: ${path}`);
    return url.href;
  }))];
}

async function main() {
  if ((await fetchText(KEY_LOCATION)).trim() !== KEY) throw new Error('The live IndexNow key file does not match KEY.');
  const args = process.argv.slice(2);
  const paths = args.length ? args
    : [...(await fetchText(`${ORIGIN}/sitemap.xml`)).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!paths.length) throw new Error('No URLs to submit (empty sitemap?).');
  const urlList = toUrlList(paths);

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
  });
  if (res.status === 200 || res.status === 202) {
    console.log(`IndexNow accepted ${urlList.length} URL(s) (HTTP ${res.status}). Acceptance does not guarantee indexing.`);
    return;
  }
  const body = await res.text().catch(() => '(empty)');
  throw new Error(`IndexNow failed (HTTP ${res.status}): ${body}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
