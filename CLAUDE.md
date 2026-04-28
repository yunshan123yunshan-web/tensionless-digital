# Tensionless Digital Handoff

## Current Project State

This is a static single-page site in `index.html` with the brand asset in `logo.svg`.

There is no git repository in this folder right now. Treat the working directory as the source of truth and avoid destructive file operations.

Local server currently used during this handoff:

```bash
python3 -m http.server 5173 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:5173/index.html
```

At the time of handoff, a Python SimpleHTTP server was already listening on `127.0.0.1:5173`.

## User Preferences / Constraints

- Keep testimonial placeholders for now. The user explicitly said to execute improvements that do not need input and keep placeholders.
- Do not remove the animated hero. The hero animation is core to the page.
- The shard/particle animation should fill the full screen, not just one side.
- The header should appear when the headline begins, around the moment `We turn attention into revenue` starts showing.
- The full hero composition should fit inside the first frame/viewport when the headline is visible.
- The eyebrow text `Digital Marketing Agency · 120+ Campaigns Delivered` must not be blocked by the header.
- Use GSAP for animation work. GSAP skills were installed locally from `github.com/greensock/gsap-skills`.
- For visual edits, verify in browser screenshots. The in-app/browser view matters more than theoretical CSS correctness.

## Important Files

- `index.html`: main page. Large single-file HTML/CSS/JS document.
- `logo.svg`: brand logo. Background/white rects were removed; current usage applies `filter: invert(1)` in nav/footer.
- `hero-scroll.html`: older/small reference file, not the active page.
- `fonts/`: local font assets.

## What Was Recently Changed

### Hero

- Restored and preserved the canvas-driven shard animation.
- Shards now animate while idle, so users who pause before scrolling still see motion.
- Final shard state dissolves into a full-screen constellation instead of ending in a strange logo-shaped residue.
- Added text protection zones so particles avoid the headline/eyebrow/CTA area during the text reveal.
- Added layered shard depth: different shard scales, alpha, and drift speeds.
- Mobile no longer turns the hero into a dead static block. On small touch devices it uses the final hero composition without the long pinned scroll, while keeping live particles.

### Header

- Header starts hidden.
- Header appears as the headline begins, currently triggered around hero progress `p >= 0.565`.
- Header reveal uses GSAP `fromTo` on logo/nav links/CTA with transform + opacity only.
- Header is fully visible by the time the first headline line is visible.

### Sections

Generic reveal behavior was replaced with section-specific GSAP/ScrollTrigger timelines:

- Proof bar: staggered proof items + count-up stats.
- Services: intro text followed by service cards.
- Results: intro, result cards, metric emphasis, then tags.
- Testimonials: heading, featured testimonial, stats, then testimonial cards.
- Process: intro, then process steps.
- CTA: split left/right reveal.
- Footer: subtle staggered reveal.

### Styling / UX

- Added responsive rules.
- Added reduced-motion handling.
- Added focus-visible styles and skip link.
- Bumped contrast token `--steel` to `#848b91`.
- Added selection styling, typography polish, improved hover states, service card top-line hover, CTA texture, and hero/proof seam fade.
- Replaced `Est. 2023` hero eyebrow with `120+ Campaigns Delivered`.
- Nav CTA is `Book a Free Call`.
- Results cards use before/after framing.

## Verification Already Run

Browser smoke test with Puppeteer against localhost passed:

- `window.gsap === true`
- `window.ScrollTrigger === true`
- No page errors.
- No console warnings/errors.
- Canvas display is active on desktop.
- Idle canvas hashes changed over time, confirming particles move without scroll.
- Header becomes visible when headline starts.
- Eyebrow clears the fixed header.
- Final hero text and CTA fit within a 1440x900 viewport.
- Mobile 390x844 keeps canvas active and hero content fits.

Recent screenshot paths from the verification run:

```text
/tmp/td-aesthetic-hero.png
/tmp/td-aesthetic-hero-final.png
/tmp/td-aesthetic-services.png
/tmp/td-aesthetic-results.png
/tmp/td-aesthetic-testimonials.png
/tmp/td-aesthetic-cta.png
/tmp/td-aesthetic-mobile.png
```

These are temporary files, but useful if they still exist in the current session.

## Useful Test Commands

Syntax check the inline scripts:

```bash
node --check /dev/stdin < <(sed -n '/<script>$/,/<\\/script>/p' index.html | sed '/<script>/d;/<\\/script>/d')
```

Check server:

```bash
curl -I http://127.0.0.1:5173/index.html
lsof -nP -iTCP:5173 -sTCP:LISTEN
```

Check logo for obvious background shapes:

```bash
rg -n '<rect|background|fill="#fff|fill="white|fill:#fff|fill:white' logo.svg index.html
```

## Known Open Items

- Testimonials still contain `[ Client Name ]` placeholders by user request.
- CTAs still use `mailto:` links. A calendar embed/link was recommended but not implemented because it needs user choice/provider.
- The page is still a large single-file `index.html`; future cleanup could split CSS/JS once visuals stabilize.
- Continue testing both desktop and mobile screenshots after animation edits. Small timing changes can make the fixed header appear too early/late.

## Aesthetic Direction

Keep the current direction restrained, dark, editorial, and high-end:

- Black/chrome/steel palette.
- Large serif display typography.
- Angular particles/shards as the signature visual motif.
- Minimal UI chrome.
- No generic SaaS cards, gradient blobs, decorative marketing fluff, or over-rounded components.

Use GSAP timelines and ScrollTrigger for animation. Prefer `opacity`, `autoAlpha`, `x`, `y`, `scale`, and `stagger`. Avoid animating layout-heavy properties like `width`, `height`, `top`, `left`, margins, or padding.
