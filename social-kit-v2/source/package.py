from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageChops
import json
import zipfile
import hashlib
import re

BASE = Path(__file__).resolve().parent.parent
PROJECT = BASE.parent
PREVIEWS = BASE / 'previews'
PREVIEWS.mkdir(exist_ok=True)
assets = json.loads((BASE / 'source/assets.json').read_text())
font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 21)
small = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 17)
canvas = Image.new('RGB', (1500, 1440), '#dfe3e7')
d = ImageDraw.Draw(canvas)
d.text((55, 30), 'TENSIONLESS DIGITAL  /  REVISED SOCIAL CAMPAIGN', font=font, fill='#050507')

for i, filename in enumerate(['01-profile-ig-facebook.png', '01-profile-light-alternative.png']):
    im = Image.open(BASE / 'upload' / filename).convert('RGB').resize((190, 190), Image.Resampling.LANCZOS)
    circle = Image.new('L', (190, 190))
    ImageDraw.Draw(circle).ellipse((0, 0, 189, 189), fill=255)
    canvas.paste(im, (55 + i * 240, 100), circle)
    d.text((55 + i * 240, 313), ['PROFILE / DARK', 'PROFILE / LIGHT'][i], font=small, fill='#050507')

cover = Image.open(BASE / 'upload/02-facebook-cover.png').convert('RGB')
canvas.paste(cover.resize((880, 386), Image.Resampling.LANCZOS), (565, 85))
d.text((565, 488), 'FACEBOOK COVER / MASTER', font=small, fill='#050507')
for i, asset in enumerate(assets[3:]):
    im = Image.open(BASE / 'upload' / asset['file']).convert('RGB').resize((430, 538), Image.Resampling.LANCZOS)
    x = 55 + i * 480
    canvas.paste(im, (x, 565))
    d.text((x, 1124), asset['label'].upper(), font=small, fill='#050507')

desktop = cover.crop((0, 48, 1640, 672)).resize((670, 255), Image.Resampling.LANCZOS)
mobile = cover.crop((180, 0, 1460, 720)).resize((455, 256), Image.Resampling.LANCZOS)
canvas.paste(desktop, (55, 1170))
canvas.paste(mobile, (785, 1170))
d.text((55, 1149), 'COVER / DESKTOP CROP SIMULATION', font=small, fill='#050507')
d.text((785, 1149), 'COVER / MOBILE CROP SIMULATION', font=small, fill='#050507')
canvas.save(PREVIEWS / 'starter-set-preview.jpg', quality=95)
desktop.save(PREVIEWS / 'facebook-cover-desktop-preview.jpg', quality=95)
mobile.save(PREVIEWS / 'facebook-cover-mobile-preview.jpg', quality=95)

for asset, source_name in zip(assets[:2], ['logo-mark-light.png', 'logo-mark-dark.png']):
    logo = Image.open(BASE / 'source' / source_name).convert('RGBA')
    height = 650
    width = round(logo.width * height / logo.height)
    alpha = logo.getchannel('A').resize((width, height), Image.Resampling.LANCZOS)
    mark = Image.new('L', (1080, 1080))
    mark.paste(alpha, ((1080 - width) // 2, (1080 - height) // 2))
    circle = Image.new('L', (1080, 1080))
    ImageDraw.Draw(circle).ellipse((0, 0, 1079, 1079), fill=255)
    if ImageChops.multiply(mark, ImageChops.invert(circle)).getbbox():
        raise ValueError('Circular crop clips visible profile content: ' + asset['file'])

canonical = (PROJECT / 'SOCIAL-PROFILES.md').read_text()
post_text = canonical.split('## Three introductory post drafts\n\n', 1)[1].split('\n\n## Pending decisions', 1)[0]
sections = re.split(r'\n\n### \d+\. ', post_text)[1:]
assert len(sections) == 3
alt = [
    'Tensionless Digital introduction graphic on black. Three chrome strips join into one sculptural ribbon. Headline: Your ads. Your website. One direction.',
    'Tensionless Digital graphic on black. Three silver sculptural frames are connected by one pale-blue light path. Headline: From attention to action. Supporting text: Landing pages, paid ads and SEO.',
    'Tensionless Digital educational graphic on off-white. A chrome and glass magnifying lens examines the point where several thin paths meet. Headline: Before you boost, check the page. Supporting checks: same offer, clear next step, working form.'
]
output = ['# Tensionless Digital — revised post captions', 'Exported from the canonical SOCIAL-PROFILES.md on 24 November 2026. These posts have not been published. The visuals are generated conceptual CGI; they do not depict actual client campaigns.']
for i, (section, asset, alt_text) in enumerate(zip(sections, assets[3:], alt), 1):
    title = section.split('\n', 1)[0]
    caption = section.split('Caption:\n\n', 1)[1].strip()
    output += [f'## {i}. {title}', f"Image: `upload/{asset['file']}`", '### Caption', caption, '### Suggested alt text', alt_text]
(BASE / 'POST-CAPTIONS.md').write_text('\n\n'.join(output) + '\n')

manifest = []
for asset in assets:
    p = BASE / 'upload' / asset['file']
    im = Image.open(p)
    assert im.size == (asset['width'], asset['height']), (p, im.size)
    assert im.format == 'PNG' and p.stat().st_size > 1000
    manifest.append({'file': str(p.relative_to(BASE)), 'dimensions': list(im.size), 'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()})
report = json.loads((PREVIEWS / 'verification.json').read_text())
assert len(report['checks']) == 6 and not report['pageErrors']
assert all(c['dimensionsOkay'] and c['fontsLoaded'] and c['imagesOkay'] and not c['clippedText'] and not c['collisions'] and not c['safeZoneFailures'] for c in report['checks'])
(BASE / 'MANIFEST.json').write_text(json.dumps({'assetCount': len(manifest), 'assets': manifest}, indent=2) + '\n')
archive = PROJECT / 'Tensionless-Digital-Social-Starter-v2.zip'
files = sorted(p for p in BASE.rglob('*') if p.is_file() and '.DS_Store' not in p.parts and '__pycache__' not in p.parts)
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for p in files:
        z.write(p, p.relative_to(PROJECT))
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert sum('/upload/' in n for n in z.namelist()) == 6
    assert sum('/generated/' in n for n in z.namelist()) == 4
    assert 'social-kit-v2/POST-CAPTIONS.md' in z.namelist()
    assert 'social-kit-v2/START-HERE.md' in z.namelist()
    assert 'social-kit-v2/source/prompts.jsonl' in z.namelist()
print(json.dumps({'archive': archive.name, 'archiveBytes': archive.stat().st_size, 'packageFiles': len(files), 'uploadImages': len(manifest), 'generatedBackgrounds': 4, 'captions': len(sections), 'checks': 'passed'}, indent=2))
