// /insights/: articles are the .md files here (layout article.njk, tag `insight`);
// index.njk is the hub and sets its own layout and head data.
import site from '../_data/site.json' with { type: 'json' };
import org from '../_data/org.js';

const HUB = { name: 'Insights', url: '/insights/' };
const isArticle = (d) => d.page.inputPath.endsWith('.md');
const isoDate = (date) => new Date(date).toISOString().slice(0, 10);

function postNode(d) {
  const url = new URL(d.page.url, site.origin).href;
  return {
    '@type': 'BlogPosting', '@id': `${url}#article`, url, headline: d.h1, description: d.description,
    datePublished: isoDate(d.page.date), dateModified: isoDate(d.updated || d.page.date),
    inLanguage: site.locale, author: { '@id': org.founder['@id'] }, publisher: { '@id': org['@id'] },
    mainEntityOfPage: { '@id': `${url}#webpage` }, image: `${site.origin}${site.ogImage}`,
  };
}

export default {
  // Defaults for articles; the hub (index.njk) overrides permalink and layout.
  permalink: '/insights/{{ page.fileSlug }}/',
  layout: 'article.njk',
  tags: ['insight'],
  eleventyComputed: {
    ogType: (d) => (isArticle(d) ? 'article' : d.ogType),
    breadcrumbs: (d) => [{ name: 'Home', url: '/' }, HUB, ...(isArticle(d) ? [{ name: d.h1, url: d.page.url }] : [])],
    schema: (d) => (isArticle(d) ? [postNode(d)] : d.schema || []),
  },
};
