# GEO Audit Report: Tensionless Digital

**Audit Date:** 2026-08-20
**Site:** index.html (static single-page site; production target `https://tensionlessdigital.com`)
**Business Type:** Agency/Services (digital marketing agency)
**Pages Analyzed:** 6 (index.html, 404.html, privacy.html, terms.html, thank-you.html; sitemap.xml lists only `/`)
**Method:** Direct source analysis (site not yet live/crawlable) — index.html, styles.css, robots.txt, sitemap.xml read directly rather than fetched over HTTP.

---

## Executive Summary

**Overall GEO Score: 54/100 (Poor)**

The site has an unusually strong schema foundation for a single-page agency site — FAQPage, ProfessionalService, and BreadcrumbList JSON-LD are all present and well-formed — which most competitors in this space skip entirely. But it is undermined by three structural gaps: no `llms.txt`, a sitemap that only lists the homepage (all case studies, FAQ, and testimonials are un-linkable fragments, not indexable content), and zero third-party brand-authority signals (`"sameAs": []`, no About/team page, unverifiable testimonial attribution). An AI system encountering this site today can technically parse it, but has almost nothing to verify who Tensionless Digital is beyond what the page itself claims.

### Score Breakdown

| Category | Score | Weight | Weighted Score |
|---|---|---|---|
| AI Citability | 62/100 | 25% | 15.5 |
| Brand Authority | 15/100 | 20% | 3.0 |
| Content E-E-A-T | 45/100 | 20% | 9.0 |
| Technical GEO | 65/100 | 15% | 9.75 |
| Schema & Structured Data | 78/100 | 10% | 7.8 |
| Platform Optimization | 20/100 | 10% | 2.0 |
| **Overall GEO Score** | | | **~54/100 (Poor)** |

---

## Critical Issues (Fix Immediately)

None found. Robots.txt allows all crawlers (`User-agent: * / Allow: /`), the domain isn't noindexed, and there's real indexable HTML content (not JS-only rendering) — a `<noscript>` fallback isn't even needed since content is server-delivered markup, animation is progressive enhancement only.

## High Priority Issues

1. **No `llms.txt` file.** GEO best practice as of 2026 — a plain-text file at `/llms.txt` giving AI crawlers a structured summary of the site (who you are, key pages, services). Currently absent. *Fix: add `/llms.txt` at the project root.*
2. **`sameAs: []` in ProfessionalService schema (index.html:27).** This is the single biggest brand-authority gap. An empty `sameAs` array tells AI systems there is no verifiable external identity — no LinkedIn, no Google Business Profile, no Crunchbase, nothing to cross-reference "Tensionless Digital" against. *Fix: populate with real social/business profile URLs.*
3. **Sitemap.xml lists only the homepage.** Case studies, FAQ, and testimonials all live as `#fragment` anchors inside one page with no dedicated URLs, so nothing but `/` is indexable/citable as a discrete unit. The BreadcrumbList schema even references `/#services`, `/#case-study`, `/#contact` as if they were separate pages, but sitemap.xml doesn't list them and they aren't independently fetchable resources. *Fix: either add real anchor entries to sitemap.xml or, better, consider dedicated pages/URLs for case studies (see Content E-E-A-T below).*
4. **No About/team page or named individuals anywhere on the site.** No founder name, no team bios, no credentials, no photos. For E-E-A-T, AI models weight "who is behind this claim" heavily, especially for finance-adjacent claims (this site profiles a "Financial Services" client with $2M/month figures) — YMYL-adjacent content with zero named human authority behind it.
5. **Testimonials use unverifiable initials-only attribution** (`A. Chen`, `M. Torres`, `J. Patel` — first initial + surname, generic role/industry, no company name, no link, no photo). This is a known open item from prior sessions (per CLAUDE.md) but is now also a GEO trust problem: AI systems cannot verify these are real, which suppresses citation confidence for the case-study numbers next to them.

## Medium Priority Issues

1. **Case study claims are unusually specific and high-value ($350K profit, $2M production, 58× ROAS) but have zero external verification** — no client name, no case study PDF/report, no linked source. Great citability *if true and verifiable*, but as-is an AI system has to treat these as unverified marketing claims, not citable facts.
2. **FAQ schema (index.html:30-61) is strong but only exists as JSON-LD — the visible `<details>` FAQ markup (index.html:487-514) matches it well, which is good, but there's no dedicated `/faq` URL,** so an AI citing "According to tensionlessdigital.com/faq..." has nowhere to point.
3. **No blog, guides, or any long-form educational content.** Zero content demonstrating methodology, expertise, or original data beyond the marketing page itself. AI Overviews and Perplexity strongly favor sites with explainer/how-to content over pure landing pages when answering "how does X work" queries.
4. **Privacy/terms pages explicitly marked as drafts** (per CLAUDE.md) — if crawled by an AI system before final review, could surface inaccurate legal claims.
5. **No Organization-level `logo` property in the ProfessionalService schema**, and no `Person` entities for any team member — both are cheap, high-signal additions.

## Low Priority Issues

1. Open Graph/Twitter meta present and correct, but no `article:` or `og:locale` tags (minor, low impact for this business type).
2. No `AggregateRating` or `Review` schema despite having testimonial content — could pair with fixing the attribution problem above.
3. `areaServed: "US"` in schema is a reasonable default but worth confirming it's accurate — narrows AI's understanding of who can be served.
4. No dedicated `/about` URL even referenced in navigation.

---

## Category Deep Dives

### AI Citability (62/100)

Strengths: the case-study stat blocks (`$350K Profit on $6K Spend`, `58× ROAS`) are exactly the kind of compact, numeric, quotable claims AI Overviews and Perplexity like to extract. The FAQ answers are also well-formed — direct question, direct 1-3 sentence answer, no fluff.

Weaknesses: all of this content lives inside a single densely-animated one-page scroll experience with no anchor-addressable URLs indexed in the sitemap. Citability isn't just "is the sentence quotable" — it's "can the AI point a user to a specific, fetchable source for it," and right now every quotable fact resolves to the same URL (`/`), which weakens per-claim attribution.

### Brand Authority (15/100)

This is the weakest category by far. `sameAs: []`, no About page, no named humans, no external profiles referenced anywhere in the codebase. Per project memory, there's also no analytics/tracking configured, meaning even first-party signals of traffic/engagement don't exist yet. An AI system asked "who is Tensionless Digital" today has only the site's own unverified claims to go on — no independent corroboration exists anywhere in the crawlable graph.

### Content E-E-A-T (45/100)

Trustworthiness signals (schema, clear service description, FAQ, privacy/terms pages even in draft) are present. Experience/Expertise signals are largely absent: no named practitioners, no methodology write-up, no case study detail beyond headline stats, no dates on the case studies (can't assess recency), and testimonials that read as plausible but unverifiable. The "Discover → Strategy → Design → Build → Launch" process section (index.html:457-477) is a good expertise signal structurally but is thin on actual explanatory content — five one-word labels, not a real methodology description.

### Technical GEO (65/100)

robots.txt is clean and permissive (no AI-crawler-specific blocks — good, since many sites accidentally block GPTBot/ClaudeBot/PerplexityBot via overzealous rules, and this one doesn't). Content is real server-delivered HTML, not JS-only rendering, so crawlers that don't execute JS still get full text. Canonical URL and OG/Twitter tags are correctly set. Missing: `llms.txt`, and the site is not yet deployed/verifiable live (can't confirm actual response codes, TTFB, or Core Web Vitals against a real deployment — this audit is source-only).

### Schema & Structured Data (78/100)

The strongest category. Three well-formed JSON-LD blocks: `ProfessionalService`, `FAQPage` (5 Q&As, matches visible content), and `BreadcrumbList`. This is genuinely above-average for a small agency site. Gaps: empty `sameAs`, no `logo`, no `Person`/team schema, no `AggregateRating`, and the `BreadcrumbList` references fragment URLs not listed in sitemap.xml, which is a minor internal inconsistency.

### Platform Optimization (20/100)

No presence signals detected anywhere in the codebase or content for LinkedIn, Google Business Profile, YouTube, Reddit, or any other platform AI models draw entity-recognition and citation signals from. This directly compounds the Brand Authority gap — there's no external footprint for AI Overviews, Perplexity, or ChatGPT web search to cross-reference against the on-site claims.

---

## Quick Wins (Implement This Week)

1. **Populate `sameAs` in the ProfessionalService schema** (index.html:27) with real LinkedIn/Google Business Profile URLs once they exist — single highest-leverage fix in this audit.
2. **Add a `/llms.txt` file** summarizing services, key pages, and contact info in plain text for AI crawlers.
3. **Add real entries to sitemap.xml** for the anchor sections already referenced in BreadcrumbList schema (`#services`, `#case-study`, `#contact`) so the sitemap and schema agree.
4. **Resolve the testimonial attribution question** (already flagged as an open item) — get real names/companies/logos from clients, or clearly reframe as illustrative composites if real attribution isn't available. Either resolves the trust gap; the current unverifiable-but-specific middle ground is the worst option for GEO.
5. **Add one named founder/team bio** with a real photo and credentials — even a single paragraph on an About section would meaningfully lift E-E-A-T.

## 30-Day Action Plan

### Week 1: Trust foundation
- [ ] Populate schema `sameAs` with verified external profiles
- [ ] Add `/llms.txt`
- [ ] Resolve testimonial attribution (real names or clear composite framing)

### Week 2: Structural addressability
- [ ] Expand sitemap.xml to include anchor sections or convert key sections (case studies, FAQ) into dedicated crawlable pages
- [ ] Add `logo` and at least one `Person` entity to schema

### Week 3: Expertise signal
- [ ] Add an About/team section with named founder(s), credentials, and a short methodology write-up (expand the 5-word process labels into real explanations)
- [ ] Add dates to case studies for recency signal

### Week 4: Platform footprint
- [ ] Stand up/verify LinkedIn company page and Google Business Profile, link both from footer and schema
- [ ] Finalize privacy.html/terms.html out of draft status once legal review is done (currently blocks confident indexing of legal claims)

---

## Appendix: Files Analyzed

| File | Role | GEO Issues |
|---|---|---|
| index.html | Main page, all content + 3 JSON-LD blocks | sitemap mismatch, empty sameAs, no Person schema |
| robots.txt | Crawler access | None — clean, permissive |
| sitemap.xml | URL index | Only lists homepage; missing anchor/section entries |
| privacy.html / terms.html | Legal pages | Marked draft, not final |
| 404.html / thank-you.html | Utility pages | Not analyzed for GEO (not citable content) |
| llms.txt | AI crawler guide | **Missing entirely** |

**Note:** This audit was performed against local source files, not a live deployed site (no production URL was reachable). Technical checks that require a live server (actual HTTP response codes, TTFB, Core Web Vitals, live robots.txt enforcement) should be re-verified once the site is deployed to `tensionlessdigital.com`.
