// Builds the site from site/ into _site/. Root files listed below are copied
// as-is; everything else at the root (old index.html, prototypes, audits) is
// left out of the build.
import site from './site/_data/site.json' with { type: 'json' };
import org from './site/_data/org.js';
import { buildGraph } from './lib/jsonld.js';

const PASSTHROUGH = [
  'proto-core.js', 'proto-scene.js', 'proto-scene.css', 'proto-cases.js', 'proto-cases.css',
  'proto-squish.js', 'proto-quotes.js', 'proto-quotes.css', 'proto-assets', 'sub-page.css', 'fonts/archivo-var.woff2', 'fonts/archivo-wide-var.woff2', 'fonts/cormorant-italic.woff2', 'fonts/jetbrains-mono-var.woff2',
  'logo.svg', 'logo.webp', 'favicon.svg', 'og-image.png', 'robots.txt', 'llms.txt',
  '404.html', 'terms.html', 'thank-you.html',
  'be22952b77555160cbd7fd431bbf2617.txt', // IndexNow key (scripts/indexnow.mjs)
];

export default function (eleventyConfig) {
  PASSTHROUGH.forEach((path) => eleventyConfig.addPassthroughCopy({ [path]: path }));
  eleventyConfig.addFilter('absUrl', (path, origin) => new URL(path, origin).href);
  eleventyConfig.addFilter('jsonLdFor', (url, title, description, breadcrumbs, extra) =>
    buildGraph(org, site, { url, title, description, breadcrumbs: breadcrumbs || [], extra: extra || [] }));
  eleventyConfig.addFilter('isoDate', (date) => new Date(date).toISOString().slice(0, 10));
  eleventyConfig.addFilter('readableDate', (date) =>
    new Date(date).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }));
}

export const config = {
  dir: { input: 'site', includes: '_includes', data: '_data', output: '_site' },
  htmlTemplateEngine: 'njk',
  markdownTemplateEngine: 'njk',
};
