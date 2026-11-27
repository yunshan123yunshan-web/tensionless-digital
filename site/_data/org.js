// The business entity as JSON-LD, referenced by @id from every page's graph.
// Facts come from entity.js; this file only shapes them for schema.org.
// OnlineBusiness (an Organization subtype), not ProfessionalService: that is a
// LocalBusiness subtype and implies a premises customers visit.
import site from './site.json' with { type: 'json' };
import entity from './entity.js';

export default {
  '@type': 'OnlineBusiness',
  '@id': `${site.origin}/#org`,
  name: entity.brandName,
  legalName: entity.legalName,
  identifier: { '@type': 'PropertyValue', propertyID: 'UEN', value: entity.uen },
  foundingDate: entity.foundingDate,
  // Embedded with an @id so any page (e.g. an article's author) can reference it.
  founder: {
    '@type': 'Person',
    '@id': `${site.origin}/#${entity.owner.id}`,
    name: entity.owner.name,
    jobTitle: entity.owner.jobTitle,
    worksFor: { '@id': `${site.origin}/#org` },
    ...(entity.owner.sameAs.length ? { sameAs: entity.owner.sameAs } : {}),
  },
  url: `${site.origin}/`,
  logo: `${site.origin}${site.logo}`,
  image: `${site.origin}${site.ogImage}`,
  email: entity.email,
  description: 'Digital marketing agency based in Singapore. Google Ads, Facebook Ads, SEO and landing pages, planned and run as one campaign.',
  address: { '@type': 'PostalAddress', addressCountry: entity.addressCountry },
  areaServed: [{ '@type': 'Country', name: 'Singapore' }, { '@type': 'Place', name: 'Worldwide' }],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    email: entity.email,
    areaServed: ['SG', 'Worldwide'],
    availableLanguage: 'English',
  },
  knowsAbout: ['Google Ads', 'Facebook Ads', 'Search engine optimisation', 'Landing page design', 'Lead generation'],
  sameAs: entity.sameAs,
};
