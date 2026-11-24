from pathlib import Path
from PIL import Image, ImageChops
import shutil
import json

BASE = Path(__file__).resolve().parent.parent
PROJECT = BASE.parent
SOURCE = BASE / 'source'
UPLOAD = BASE / 'upload'
PREVIEWS = BASE / 'previews'
for folder in (UPLOAD, PREVIEWS, SOURCE / 'fonts'):
    folder.mkdir(parents=True, exist_ok=True)

# Retain the supplied mark's geometry. Remove its photographed grey wall and
# shadow through a luminance mask; no new mark is drawn or generated.
original = SOURCE / 'original-logo.jpg'
if not original.exists():
    shutil.copy2(PROJECT / 'Tensionless digital logo.jpg', original)
photo = Image.open(original).convert('RGB')
grey = photo.convert('L')
mask = grey.point(lambda p: max(0, min(255, round((100 - p) * 255 / 45))))
regions = {'mark': (570, 165, 870, 525), 'lockup': (475, 175, 1000, 650)}
for name, bounds in regions.items():
    alpha = mask.crop(bounds)
    alpha = alpha.crop(alpha.getbbox())
    for color_name, color in [('light', '#e9edf2'), ('dark', '#050507')]:
        logo = Image.new('RGBA', alpha.size, color)
        logo.putalpha(alpha)
        logo.save(SOURCE / f'logo-{name}-{color_name}.png')

for font in ['inter-400.woff2', 'inter-500.woff2', 'inter-600.woff2', 'cg-300i.woff2']:
    if (PROJECT / 'fonts' / font).exists():
        shutil.copy2(PROJECT / 'fonts' / font, SOURCE / 'fonts' / font)

assets = [
    {'id': 'profile-dark', 'file': '01-profile-ig-facebook.png', 'width': 1080, 'height': 1080, 'label': 'Profile photo · recommended', 'use': 'Use this same image for Instagram and Facebook. Centre it in the circular crop.'},
    {'id': 'profile-light', 'file': '01-profile-light-alternative.png', 'width': 1080, 'height': 1080, 'label': 'Profile photo · light alternative', 'use': 'Optional light-background version. Pick one profile image and use it consistently on both pages.'},
    {'id': 'facebook-cover', 'file': '02-facebook-cover.png', 'width': 1640, 'height': 720, 'label': 'Facebook Page cover', 'use': 'Upload as the Facebook Page cover. Keep the image centred and check both desktop and mobile previews before saving.'},
    {'id': 'post-intro', 'file': '03-post-introduction.png', 'width': 1080, 'height': 1350, 'label': 'Post 1 · introduction', 'use': 'Publish on both pages first; pin it if that option is available.'},
    {'id': 'post-services', 'file': '04-post-services.png', 'width': 1080, 'height': 1350, 'label': 'Post 2 · services', 'use': 'Publish next with the services caption.'},
    {'id': 'post-checklist', 'file': '05-post-landing-page-check.png', 'width': 1080, 'height': 1350, 'label': 'Post 3 · useful advice', 'use': 'Publish with the three-point landing-page checklist caption.'},
]
(SOURCE / 'assets.json').write_text(json.dumps(assets, indent=2) + '\n')

html = '''<!doctype html>
<!-- Design basis: supplied Tensionless Digital logo, existing Inter/Cormorant
fonts and black/steel palette. No client results, testimonials or live handles
are assumed. Editorial typography is the imagery; these are organic launch
graphics, not photographs or screenshots of client work. -->
<html lang="en"><head><meta charset="utf-8"><title>Tensionless Digital — social artwork</title>
<style>
@font-face{font-family:Inter;src:url('fonts/inter-400.woff2');font-weight:400}
@font-face{font-family:Inter;src:url('fonts/inter-500.woff2');font-weight:500}
@font-face{font-family:Inter;src:url('fonts/inter-600.woff2');font-weight:600}
@font-face{font-family:Cormorant;src:url('fonts/cg-300i.woff2');font-weight:300;font-style:italic}
:root{--ink:#050507;--paper:#f0f2f4;--text:#e9edf2;--steel:#b8c4d0;--dim:#7d8794;--rule:#4c545e;--blue:#8fb0ff}
*{box-sizing:border-box;margin:0;padding:0}body{margin:0;background:var(--ink);font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased}
.artboard{display:none;position:relative;overflow:hidden;color:var(--text);background:var(--ink)}
.artboard.active{display:block}.avatar{width:1080px;height:1080px}.avatar img{position:absolute;height:670px;width:auto;top:205px;left:50%;transform:translateX(-50%)}
.avatar.light{background:var(--paper)}
.brand{display:flex;gap:22px;align-items:center}.brand img{width:54px;height:70px;object-fit:contain}
.brand-name{font-size:23px;line-height:1.3;font-weight:600;letter-spacing:3px}.brand-name span{display:block;font-size:16px;font-weight:400;letter-spacing:5px;margin-top:2px}
.cover{width:1640px;height:720px;text-align:center}
.cover .brand{position:absolute;top:119px;left:0;width:100%;justify-content:center;gap:16px}
.cover .brand img{height:54px;width:42px}.cover .brand-name{font-size:23px;text-align:left}.cover .brand-name span{font-size:15px}
.cover h1{position:absolute;left:250px;top:223px;width:1140px;font-size:91px;font-weight:500;letter-spacing:-5px;line-height:1.0}
.serif{font-family:Cormorant,Georgia,serif;font-weight:300;font-style:italic;letter-spacing:-2px}
.cover h1 .serif{display:block;font-size:118px;line-height:1.0;margin-top:8px;color:var(--steel)}
.cover .services{position:absolute;top:493px;left:290px;width:1060px;border-top:1px solid var(--rule);padding-top:28px;display:flex;justify-content:center;gap:29px;align-items:center;font-size:22px;letter-spacing:0.2px}
.cover .services i{font-style:normal;color:var(--dim)}
.post{width:1080px;height:1350px;padding:76px 78px 70px}
.post .brand{position:relative;z-index:2}.post .brand img{width:48px;height:63px}
.post .brand-name{font-size:21px;letter-spacing:2.7px}.post .brand-name span{font-size:14px;letter-spacing:4.5px}
.eyebrow{font-size:18px;letter-spacing:3.5px;font-weight:500;text-transform:uppercase;line-height:1.5}
.footer{position:absolute;bottom:70px;left:78px;right:78px;border-top:1px solid var(--rule);padding-top:25px;display:flex;justify-content:space-between;align-items:center;font-size:21px;line-height:1.4}
.footer .arrow{font-size:35px;font-weight:400;line-height:1}
.intro .eyebrow{margin-top:108px;color:var(--steel)}
.intro h1{font-size:102px;line-height:1.02;letter-spacing:-5px;font-weight:500;margin-top:27px}
.intro h1 .serif{display:block;font-size:121px;line-height:.95;color:var(--steel);margin-top:15px;letter-spacing:-3.5px}
.intro .description{font-size:29px;line-height:1.5;max-width:710px;margin-top:52px;color:var(--steel)}
.intro .journey{display:flex;justify-content:space-between;align-items:center;font-size:23px;margin-top:78px;border-top:1px solid var(--rule);padding-top:32px}
.intro .journey b{font-size:25px;font-weight:400;color:var(--dim)}
.services-post{background:var(--paper);color:var(--ink)}
.services-post .eyebrow{margin-top:91px;color:var(--rule)}
.services-post h1{font-size:111px;line-height:1.00;letter-spacing:-6px;font-weight:500;margin-top:24px}
.services-post h1 .serif{display:block;font-size:151px;line-height:.91;margin-top:0;letter-spacing:-4px}
.service-list{margin-top:61px;border-top:1px solid var(--ink)}
.service-row{display:flex;align-items:center;gap:22px;padding:23px 0;border-bottom:1px solid #b8c4d0;font-size:31px;line-height:1.3}
.service-row .number{font-size:17px;color:var(--rule);width:35px;flex:none}
.services-post .footer{border-color:var(--ink)}
.checklist{background:var(--steel);color:var(--ink)}
.checklist .eyebrow{margin-top:91px;color:var(--rule)}
.checklist h1{font-size:94px;line-height:1.01;letter-spacing:-4.8px;font-weight:500;margin-top:28px}
.checklist h1 .serif{display:block;font-size:130px;line-height:.95;letter-spacing:-3px;margin-top:7px}
.check-list{margin-top:53px;border-top:1px solid var(--ink)}
.check-row{display:flex;align-items:center;gap:22px;font-size:26px;line-height:1.35;padding:25px 0;border-bottom:1px solid #7d8794}
.check-row .number{font-size:17px;color:var(--rule);width:35px;flex:none}
.checklist .footer{border-color:var(--ink)}
</style></head><body>
<section class="artboard avatar" id="profile-dark" aria-label="Dark profile image"><img src="logo-mark-light.png" alt="Tensionless Digital brand mark"></section>
<section class="artboard avatar light" id="profile-light" aria-label="Light profile image"><img src="logo-mark-dark.png" alt="Tensionless Digital brand mark"></section>
<section class="artboard cover" id="facebook-cover">
 <div class="brand"><img src="logo-mark-light.png" alt=""><div class="brand-name">TENSIONLESS<span>DIGITAL</span></div></div>
 <h1 data-critical>Marketing,<span class="serif">without the tension.</span></h1>
 <div class="services" data-critical><span>Landing pages</span><i>/</i><span>Google &amp; Facebook Ads</span><i>/</i><span>SEO</span></div>
</section>
<section class="artboard post intro" id="post-intro">
 <div class="brand"><img src="logo-mark-light.png" alt=""><div class="brand-name">TENSIONLESS<span>DIGITAL</span></div></div>
 <div class="eyebrow">Meet your connected funnel.</div>
 <h1 data-critical>Your ads,<br>website &amp; SEO.<span class="serif">Working<br>together.</span></h1>
 <p class="description" data-critical>One connected strategy.<br>From first click to enquiry.</p>
 <div class="journey" data-critical><span>The ad</span><b>→</b><span>The page</span><b>→</b><span>The enquiry</span></div>
 <div class="footer" data-critical><span>Let’s talk about your business.</span><span class="arrow">↗</span></div>
</section>
<section class="artboard post services-post" id="post-services">
 <div class="brand"><img src="logo-mark-dark.png" alt=""><div class="brand-name">TENSIONLESS<span>DIGITAL</span></div></div>
 <div class="eyebrow">What we do.</div>
 <h1 data-critical>From first<br>click to<span class="serif">enquiry.</span></h1>
 <div class="service-list" data-critical>
  <div class="service-row"><span class="number">01</span><span>Landing page design &amp; development</span></div>
  <div class="service-row"><span class="number">02</span><span>Google &amp; Facebook Ads</span></div>
  <div class="service-row"><span class="number">03</span><span>SEO &amp; lead generation</span></div>
  <div class="service-row"><span class="number">04</span><span>Ongoing campaign optimisation</span></div>
 </div>
 <div class="footer" data-critical><span>Tell us what you want to improve.</span><span class="arrow">↗</span></div>
</section>
<section class="artboard post checklist" id="post-checklist">
 <div class="brand"><img src="logo-mark-dark.png" alt=""><div class="brand-name">TENSIONLESS<span>DIGITAL</span></div></div>
 <div class="eyebrow">A useful first check.</div>
 <h1 data-critical>Does your<br>landing page<br>match<span class="serif">your ad?</span></h1>
 <div class="check-list" data-critical>
  <div class="check-row"><span class="number">01</span><span>The same offer, from ad to page.</span></div>
  <div class="check-row"><span class="number">02</span><span>A clear next step for the visitor.</span></div>
  <div class="check-row"><span class="number">03</span><span>An enquiry form that works on mobile.</span></div>
 </div>
 <div class="footer" data-critical><span>Save this for your next campaign.</span><span class="arrow">↗</span></div>
</section>
<script>
const selected = document.getElementById(new URLSearchParams(location.search).get('asset') || 'post-intro');
selected.classList.add('active');
document.documentElement.style.width = selected.offsetWidth + 'px';
document.documentElement.style.height = selected.offsetHeight + 'px';
document.body.style.width = selected.offsetWidth + 'px';
document.body.style.height = selected.offsetHeight + 'px';
</script></body></html>'''
(SOURCE / 'artboards.html').write_text(html)

(SOURCE / 'brand-spec.md').write_text('''# Tensionless Digital — social production notes

Source: the owner-supplied Tensionless digital logo.jpg, project fonts and existing website/deck palette. No stock imagery or generative images are used. These are original typographic layouts extending the existing brand assets.

- Logo: source/logo-mark-light.png and source/logo-mark-dark.png retain the supplied mark geometry, extracted from its photographed background with a luminance mask. The full lockup is also preserved as light/dark transparent PNGs.
- Palette: #050507 black, #f0f2f4 off-white, #e9edf2 light text, #b8c4d0 steel, #7d8794 muted steel, #4c545e dark rules. All come from the existing project.
- Typography: bundled Inter 400/500/600 and Cormorant Garamond 300 italic from the project. No external font requests.
- Art direction: clear editorial typography, generous space, monochrome logo, functional rules. No invented metrics, reviews, client work, handles or contact destinations.
- Cover: 1640×720 master with primary type centred. This is a production canvas, not a claim that Facebook requires this exact size. Preview crops are simulations; check the actual Page upload preview.
- Feed: 1080×1350, 4:5, for use on both platforms. Keep the full image when posting. Any profile-grid crop is presentation-dependent.
- Profile: 1080×1080, with a centred mark that fits within a circular mask. Dark version recommended, light version optional.

Platform references checked 24 November 2026: Meta Help URLs https://www.facebook.com/help/125379114252045 and https://help.instagram.com/1631821640426723. Direct retrieval was restricted, so no exact current platform-required dimensions are asserted. The chosen canvases are practical upload sizes, with local crop checks.

Editable artwork: artboards.html. Rebuild logo/font assets with python3 build.py, then render with node render.cjs from this folder (requires the existing local Playwright and Google Chrome).
''')
print('Prepared supplied-logo variants, bundled fonts, six artboards and production notes.')
