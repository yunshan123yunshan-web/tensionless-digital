// The single source of truth for who Tensionless Digital is. Schema (org.js), the
// footer, privacy.html and llms.txt must all agree with this file; check-build.mjs
// fails the build if the UEN drifts. Pattern from pier-immigration/src/config/entity.ts.
// Source: ACRA business profile, supplied by the owner 2026-11-26.

// Profile URLs: leave blank ('') to omit them from schema sameAs.
const PROFILES = {
  facebook: 'https://www.facebook.com/tensionlessdigital', // live, verified 2026-11-25 (SOCIAL-PROFILES.md)
  instagram: '',
  linkedIn: '',
  clutch: '',
};

// The sole proprietor, and the byline on /insights/ articles. Owner confirmed
// 2026-11-26. Personal profile URLs: blank to omit from the Person's sameAs.
const OWNER = {
  id: 'chia', // schema @id fragment: /#chia
  name: 'Chia',
  jobTitle: 'Founder',
  profiles: { linkedIn: '' },
};

export default {
  owner: { ...OWNER, sameAs: Object.values(OWNER.profiles).filter(Boolean) },
  brandName: 'Tensionless Digital',
  // A sole proprietorship's legal name is its registered business name.
  legalName: 'Tensionless Digital',
  uen: '53504688W',
  entityType: 'Sole proprietorship',
  foundingDate: '2025-05-28', // ACRA registration date
  email: 'hello@tensionlessdigital.com',
  addressCountry: 'SG', // online-only: no street address, by design
  profiles: PROFILES,
  sameAs: Object.values(PROFILES).filter(Boolean),
};
