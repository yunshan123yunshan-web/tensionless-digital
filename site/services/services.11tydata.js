// Computed head data for /services/ pages. Service pages are paginated from
// _data/services.js (alias `svc`); the /services/ hub sets its own front matter.
import site from '../_data/site.json' with { type: 'json' };
import org from '../_data/org.js';

const HUB = { name: 'Services', url: '/services/' };

function serviceNode(svc, url) {
  return {
    '@type': 'Service', '@id': `${url}#service`, url, name: svc.name, serviceType: svc.name,
    description: svc.description, provider: { '@id': org['@id'] }, areaServed: org.areaServed,
  };
}

function faqNode(svc, url) {
  return {
    '@type': 'FAQPage', '@id': `${url}#faq`,
    mainEntity: svc.faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
}

export default {
  eleventyComputed: {
    title: (d) => (d.svc ? d.svc.title : d.title),
    description: (d) => (d.svc ? d.svc.description : d.description),
    breadcrumbs: (d) => [{ name: 'Home', url: '/' }, HUB, ...(d.svc ? [{ name: d.svc.name, url: d.page.url }] : [])],
    schema: (d) => {
      if (!d.svc) return d.schema || [];
      const url = new URL(d.page.url, site.origin).href;
      return [serviceNode(d.svc, url), faqNode(d.svc, url)];
    },
  },
};
