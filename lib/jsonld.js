// Builds a page's JSON-LD graph: the org, the website, this page, and its breadcrumbs.
export function buildGraph(org, site, { url, title, description, breadcrumbs = [], extra = [] }) {
  const pageUrl = new URL(url, site.origin).href;
  const graph = [
    org,
    { '@type': 'WebSite', '@id': `${site.origin}/#website`, url: `${site.origin}/`, name: org.name,
      inLanguage: site.locale, publisher: { '@id': org['@id'] } },
    { '@type': 'WebPage', '@id': `${pageUrl}#webpage`, url: pageUrl, name: title, description,
      inLanguage: site.locale, isPartOf: { '@id': `${site.origin}/#website` }, about: { '@id': org['@id'] } },
    ...extra,
  ];
  if (breadcrumbs.length) {
    graph.push({ '@type': 'BreadcrumbList', '@id': `${pageUrl}#breadcrumbs`,
      itemListElement: breadcrumbs.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name,
        item: new URL(b.url, site.origin).href })) });
  }
  // "<" escaped so page content can never close the script tag early.
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replace(/</g, '\\u003c');
}
