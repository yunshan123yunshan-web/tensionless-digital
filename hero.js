
// ─── CANVAS SETUP ───────────────────────────────────────────────
const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');
let W, H, cx, cy;
let bgGradCache = null;
let textZones = [];

// Preload logo SVG; SVG is dark mark on light bg — we'll use CSS filter invert via offscreen
const logoImg = new Image();
logoImg.src = 'logo.svg';
let logoReady = false;
let logoCanvas = null; // offscreen canvas: white mark on black bg
logoImg.onload = () => {
  const W2 = logoImg.naturalWidth  || 1104;
  const H2 = logoImg.naturalHeight || 624;
  const oc  = document.createElement('canvas');
  oc.width  = W2; oc.height = H2;
  const oc2 = oc.getContext('2d');
  // Draw-time inversion avoids pixel reads, which fail from file:// URLs.
  oc2.filter = 'invert(1)';
  oc2.drawImage(logoImg, 0, 0);
  oc2.filter = 'none';
  logoCanvas = oc;
  logoReady  = true;
};

const DPR = Math.min(window.devicePixelRatio || 1, 2);
function resize() {
  const cssW = canvas.offsetWidth  || window.innerWidth;
  const cssH = canvas.offsetHeight || window.innerHeight;
  W = canvas.width  = cssW * DPR;
  H = canvas.height = cssH * DPR;
  canvas.style.width  = cssW + 'px';
  canvas.style.height = cssH + 'px';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(DPR, DPR);
  // Store CSS dimensions for scroll/position calculations
  W = cssW; H = cssH;
  cx = W / 2; cy = H / 2;
  heroWrap   = document.getElementById('hero-pin');
  heroTotalH = heroWrap.offsetHeight - window.innerHeight;
  bgGradCache = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W,H)*0.8);
  bgGradCache.addColorStop(0, 'rgba(12,12,14,1)');
  bgGradCache.addColorStop(1, 'rgba(0,0,0,1)');
  updateTextZones();
  initShards();
}
let _resizeTimer;
window.addEventListener('resize', () => { clearTimeout(_resizeTimer); _resizeTimer = setTimeout(resize, 150); });

// ─── CONFIG ──────────────────────────────────────────────────────
const CONFIG = {
  ACT: {
    EXPLOSION:    { start: 0.00, end: 0.18 },
    CONVERGE:     { start: 0.18, end: 0.38 },
    FLASH:        { start: 0.38, end: 0.45 },
    DISSOLVE:     { start: 0.45, end: 0.55 },
    TEXT_EY:      { start: 0.38, end: 0.48 },
    TEXT_L1:      { start: 0.42, end: 0.52 },
    TEXT_L2:      { start: 0.52, end: 0.62 },
    TEXT_L3:      { start: 0.60, end: 0.70 },
    TEXT_CTA:     { start: 0.70, end: 0.85 },
  },
  SHARD_COUNT: 280,
  LOGO_SCALE: 0.28,
  TEXT_ZONE_PAD_DEFAULT: [26, 18],
  TEXT_ZONE_PAD_HEADLINE: [42, 28],
  INERTIA: 0.12,
  LAYER_THRESHOLDS: [0.18, 0.58],
  LAYER_SCALE: [0.56, 1, 1.45],
  LAYER_ALPHA: [0.34, 0.56, 0.72],
  LAYER_DRIFT: [0.46, 0.86, 1.18],
  PALETTE: [
    'rgba(110,115,120,',
    'rgba(168,173,180,',
    'rgba(200,204,210,',
    'rgba(226,229,233,',
    'rgba(255,255,255,',
  ],
  FPS_THRESHOLD: 30,
  FPS_BAD_FRAMES: 3,
  FPS_SAMPLE_WINDOW: 5,
};
const fpsMon = { times: [], badFrames: 0, degraded: false };
function checkPerf() {
  const now = performance.now();
  fpsMon.times.push(now);
  while (fpsMon.times.length > CONFIG.FPS_SAMPLE_WINDOW) fpsMon.times.shift();
  if (fpsMon.times.length < 2) return;
  const elapsed = fpsMon.times.at(-1) - fpsMon.times[0];
  const avgFps = ((fpsMon.times.length - 1) / elapsed) * 1000;
  if (avgFps < CONFIG.FPS_THRESHOLD) {
    fpsMon.badFrames++;
    if (fpsMon.badFrames >= CONFIG.FPS_BAD_FRAMES && !fpsMon.degraded) {
      fpsMon.degraded = true;
    }
  } else {
    fpsMon.badFrames = 0;
  }
}

// ─── EASING ─────────────────────────────────────────────────────
const easeInOut  = t => t < .5 ? 2*t*t : -1+(4-2*t)*t;
const easeOut    = t => 1 - Math.pow(1-t, 3);
const easeIn     = t => t * t * t;
const clamp      = (v,a,b) => Math.max(a, Math.min(b, v));
const lerp       = (a,b,t) => a + (b-a)*t;
const map        = (v,a,b,c,d) => c + (v-a)/(b-a) * (d-c);

function updateTextZones() {
  const zoneEls = [ey, document.querySelector('.hero-h1'), hf].filter(Boolean);
  textZones = zoneEls.map((el, index) => {
    const r = el.getBoundingClientRect();
    const padX = index === 1 ? 42 : 26;
    const padY = index === 1 ? 28 : 18;
    return {
      left: r.left - padX,
      right: r.right + padX,
      top: r.top - padY,
      bottom: r.bottom + padY
    };
  });
}

function avoidTextZones(x, y, strength) {
  let nx = x, ny = y, alpha = 1;
  if (strength <= 0) return { x: nx, y: ny, alpha };

  textZones.forEach(zone => {
    if (nx < zone.left || nx > zone.right || ny < zone.top || ny > zone.bottom) return;
    const leftDist = Math.abs(nx - zone.left);
    const rightDist = Math.abs(zone.right - nx);
    const topDist = Math.abs(ny - zone.top);
    const bottomDist = Math.abs(zone.bottom - ny);
    const minDist = Math.min(leftDist, rightDist, topDist, bottomDist);
    const push = 18 + 34 * strength;

    if (minDist === leftDist) nx = zone.left - push;
    else if (minDist === rightDist) nx = zone.right + push;
    else if (minDist === topDist) ny = zone.top - push;
    else ny = zone.bottom + push;

    alpha *= lerp(1, .38, strength);
  });

  return { x: nx, y: ny, alpha };
}

// ─── LOGO GEOMETRY (approximated from screenshot) ───────────────
// The logo mark is a hexagonal/angular checkmark-shield shape
// Points are in normalised [-1, 1] space, scaled at render time
const LOGO_PATHS = [
  // Outer shield/hex outline — 8 points
  [ [-0.18,-0.85],[-0.62,-0.38],[-0.72, 0.1],[-0.38, 0.72],
    [ 0.38, 0.72],[ 0.72, 0.1],[ 0.62,-0.38],[ 0.18,-0.85] ],
  // Inner angular checkmark — left stroke
  [ [-0.52, 0.08],[-0.18, 0.5],[ 0.08, 0.28] ],
  // Inner angular checkmark — right stroke  
  [ [ 0.08, 0.28],[ 0.52,-0.38],[ 0.48,-0.55] ],
  // Duplicate inner offset (3D depth illusion of logo)
  [ [-0.38, 0.08],[-0.08, 0.45],[ 0.18, 0.22],[ 0.52,-0.45] ],
];

// ─── SHARDS ─────────────────────────────────────────────────────
const SHARD_COUNT = CONFIG.SHARD_COUNT;
let shards = [];

// Colour palette: steel → silver → white
const PALETTE = CONFIG.PALETTE;

function randPalette() {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

// Generate a shard: small angular polygon (3-5 sides)
function makeShard(id) {
  const sides = 3 + Math.floor(Math.random() * 3); // 3-5
  const layerRoll = Math.random();
  const layer = layerRoll < CONFIG.LAYER_THRESHOLDS[0] ? 2 : layerRoll < CONFIG.LAYER_THRESHOLDS[1] ? 1 : 0;
  const layerScale = CONFIG.LAYER_SCALE[layer];
  const layerAlpha = CONFIG.LAYER_ALPHA[layer];
  const layerDrift = CONFIG.LAYER_DRIFT[layer];
  // Mix of small shards and larger hero shards for visual variety
  const isBig = Math.random() < 0.18;
  const r = (isBig ? (12 + Math.random() * 22) : (3 + Math.random() * 12)) * layerScale;
  const angle0 = Math.random() * Math.PI * 2;
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = angle0 + (i / sides) * Math.PI * 2 + (Math.random() - .5) * .8;
    const ri = r * (0.5 + Math.random() * 0.5);
    pts.push([Math.cos(a)*ri, Math.sin(a)*ri]);
  }

  // Where does this shard "belong" on the logo?
  // Pick a random point along a logo path
  const path = LOGO_PATHS[Math.floor(Math.random() * LOGO_PATHS.length)];
  const seg  = Math.floor(Math.random() * (path.length - 1));
  const t2   = Math.random();
  const logoScale = Math.min(W, H) * CONFIG.LOGO_SCALE;
  const lx = lerp(path[seg][0], path[seg+1 >= path.length ? 0 : seg+1][0], t2) * logoScale + cx;
  const ly = lerp(path[seg][1], path[seg+1 >= path.length ? 0 : seg+1][1], t2) * logoScale + cy;

  // Explosion start: shards fly dramatically off-screen
  const angle  = Math.random() * Math.PI * 2;
  const dist   = 0.6 + Math.random() * 1.1;
  const ex = cx + Math.cos(angle) * W * dist;
  const ey = cy + Math.sin(angle) * H * dist;

  // Drift position: slow random float for idle state
  const dx = cx + (Math.random() - .5) * W * 1.6;
  const dy = cy + (Math.random() - .5) * H * 1.6;

  // Final dissolve field: even screen coverage, not a logo-shaped residue
  const fxSeed = (id * 0.61803398875) % 1;
  const fySeed = (id * 0.75487766625) % 1;
  const fx = clamp((0.04 + fxSeed * 0.92) * W + (Math.random() - 0.5) * 34, 12, W - 12);
  const fy = clamp((0.06 + fySeed * 0.88) * H + (Math.random() - 0.5) * 30, 12, H - 12);

  return {
    id, pts,
    layer,
    layerAlpha,
    layerDrift,
    // positions
    lx, ly,           // logo resting position
    ex, ey,           // explosion position
    dx, dy,           // drift/scatter position
    fx, fy,           // final full-screen field position
    // current render position
    x: dx, y: dy,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - .5) * .04,
    floatPhase: Math.random() * Math.PI * 2,
    floatSpeed: 0.28 + Math.random() * 0.46,
    floatAmp: (4 + Math.random() * 14) * layerDrift,
    twinkleSpeed: 0.55 + Math.random() * 0.85,
    wobble: 0.04 + Math.random() * 0.12,
    colour: randPalette(),
    baseAlpha: (0.5 + Math.random() * 0.5) * layerAlpha,
    // flash metadata
    flashT: 0,
  };
}

function initShards() {
  shards = [];
  for (let i = 0; i < SHARD_COUNT; i++) shards.push(makeShard(i));
  shards.sort((a, b) => a.layer - b.layer);
}

// ─── SCROLL TIMELINE ────────────────────────────────────────────
// Total pin: 350vh → progress 0..1
// Act 1  0.00–0.18  Shards explode outward from centre
// Act 2  0.18–0.38  Shards pulled inward, converging toward logo shape
// Act 3  0.38–0.45  Logo fully assembled, white flash
// Act 4  0.45–0.55  Logo dissolves, eyebrow + L1 appear
// Act 5  0.55–0.62  L2 (attention) appears, particles orbit it
// Act 6  0.62–0.70  L3 appears, particles settle
// Act 7  0.70–0.85  CTA row fades in, residual drift

// Cached layout values — updated in resize(), avoids forced reflow per frame
let heroWrap = null;
let heroTotalH = 0;
let heroStaticProgress = null;
let scrollDirty = true;
window.addEventListener('scroll', () => { scrollDirty = true; }, { passive: true });

function getProgress() {
  if (heroStaticProgress !== null) return heroStaticProgress;
  if (heroTotalH <= 0) return 1;
  return clamp(window.scrollY / heroTotalH, 0, 1);
}

// ─── TEXT ANIMATION ─────────────────────────────────────────────
const ey  = document.getElementById('ey');
const l1  = document.getElementById('l1');
const l2  = document.getElementById('l2');
const l3  = document.getElementById('l3');
const hf  = document.getElementById('hf');
const sh  = document.getElementById('scroll-hint');
const heroFootLinks = hf ? hf.querySelectorAll('a') : [];
const heroNav = document.getElementById('nav');
const heroNavLinks = heroNav ? heroNav.querySelectorAll('a') : [];
const heroNavItems = heroNav
  ? [heroNav.querySelector('.nav-logo'), ...heroNav.querySelectorAll('.nav-links li'), heroNav.querySelector('.nav-cta')].filter(Boolean)
  : [];
const heroSetters = new WeakMap();
let heroNavShown = null;

function setEl(el, opacity, ty) {
  if (!el) return;
  const nextOpacity = clamp(opacity, 0, 1);
  if (window.gsap && typeof gsap.quickSetter === 'function') {
    let setters = heroSetters.get(el);
    if (!setters) {
      setters = {
        opacity: gsap.quickSetter(el, 'opacity'),
        y: gsap.quickSetter(el, 'y', 'px')
      };
      heroSetters.set(el, setters);
    }
    setters.opacity(nextOpacity);
    setters.y(ty);
    el.style.visibility = nextOpacity > 0.001 ? 'inherit' : 'hidden';
    return;
  }
  el.style.opacity = nextOpacity;
  el.style.transform = `translateY(${ty}px)`;
  el.style.visibility = nextOpacity > 0.001 ? 'inherit' : 'hidden';
}

function setHeroFootActive(active) {
  hf.classList.toggle('active', active);
  hf.setAttribute('aria-hidden', active ? 'false' : 'true');
  heroFootLinks.forEach(link => {
    link.tabIndex = active ? 0 : -1;
  });
}

function setHeroNavComplete(complete) {
  if (!heroNav) return;
  if (complete === heroNavShown) return;
  heroNavShown = complete;

  heroNav.classList.toggle('hero-complete', complete);
  heroNav.setAttribute('aria-hidden', complete ? 'false' : 'true');
  heroNavLinks.forEach(link => {
    link.tabIndex = complete ? 0 : -1;
  });

  if (!window.gsap || !heroNavItems.length) return;

  gsap.killTweensOf(heroNavItems);
  if (complete) {
    gsap.fromTo(heroNavItems,
      { autoAlpha: 0, y: -10 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.34,
        stagger: 0.025,
        ease: 'power3.out',
        overwrite: 'auto'
      }
    );
  } else {
    gsap.set(heroNavItems, { clearProps: 'transform,opacity,visibility' });
  }
}
setHeroNavComplete(false);

// ─── RENDER ─────────────────────────────────────────────────────
let lastP = -1;
let rafId = null;
let needsRender = true;

function render() {
  const p = getProgress();
  const time = performance.now() * 0.001;
  scrollDirty = false;
  needsRender = true;
  checkPerf();

  // Clear
  ctx.clearRect(0, 0, W, H);

  // ── Act 1: explosion (0 → 0.18) ──────────────────────────────
  const explodeT = clamp(map(p, 0, 0.18, 0, 1), 0, 1);
  // ── Act 2: converge to logo (0.18 → 0.38) ────────────────────
  const convergeT = clamp(map(p, 0.18, 0.38, 0, 1), 0, 1);
  // ── Act 3: flash (0.38 → 0.45) ───────────────────────────────
  const flashT = clamp(map(p, 0.38, 0.45, 0, 1), 0, 1);
  // ── Act 4: dissolve + text starts (0.45 → 0.55) ──────────────
  const dissolveT = clamp(map(p, 0.45, 0.55, 0, 1), 0, 1);
  // ── Act 4b: eyebrow + L1 (0.38 → 0.48) ──────────────────────
  const eyT  = clamp(map(p, 0.38, 0.48, 0, 1), 0, 1);
  const l1T  = clamp(map(p, 0.42, 0.52, 0, 1), 0, 1);
  // ── Act 5: L2 attention (0.52 → 0.62) ───────────────────────
  const l2T  = clamp(map(p, 0.52, 0.62, 0, 1), 0, 1);
  // ── Act 6: L3 (0.60 → 0.70) ──────────────────────────────────
  const l3T  = clamp(map(p, 0.60, 0.70, 0, 1), 0, 1);
  // ── Act 7: CTA (0.70 → 0.85) ─────────────────────────────────
  const ctaT = clamp(map(p, 0.70, 0.85, 0, 1), 0, 1);

  // Text elements
  setEl(ey, easeOut(eyT), lerp(12, 0, easeOut(eyT)));
  setEl(l1, easeOut(l1T), lerp(16, 0, easeOut(l1T)));
  setEl(l2, easeOut(l2T), lerp(16, 0, easeOut(l2T)));
  setEl(l3, easeOut(l3T), lerp(16, 0, easeOut(l3T)));
  setEl(hf, easeOut(ctaT), lerp(14, 0, easeOut(ctaT)));
  setHeroFootActive(ctaT > 0.1);
  setHeroNavComplete(p >= 0.38);
  sh.classList.toggle('hidden', p > 0.05);

  // Background — cached gradient (rebuilt in resize)
  ctx.fillStyle = bgGradCache || '#090909';
  ctx.fillRect(0, 0, W, H);

  // ── Draw shards ──────────────────────────────────────────────
  const logoScale = Math.min(W, H) * CONFIG.LOGO_SCALE;

  shards.forEach((s, i) => {
    // Compute target position based on timeline
    let tx, ty, alpha, scale = 1;

    if (p <= 0.18) {
      // Phase 1: idle drift → explosion
      const et = easeIn(explodeT);
      tx = lerp(s.dx, s.ex, et);
      ty = lerp(s.dy, s.ey, et);
      alpha = s.baseAlpha * lerp(0.4, 1.0, et);
      scale = lerp(0.8, 1.2, et);
    } else if (p <= 0.38) {
      // Phase 2: explosion → logo position
      const ct = easeInOut(convergeT);
      tx = lerp(s.ex, s.lx, ct);
      ty = lerp(s.ey, s.ly, ct);
      alpha = s.baseAlpha * lerp(1.0, 0.9, ct);
      scale = lerp(1.2, 0.85, ct);
    } else if (p <= 0.45) {
      // Phase 3: assembled logo + flash
      tx = s.lx;
      ty = s.ly;
      const fl = flashT < 0.5 ? flashT * 2 : (1 - flashT) * 2;
      alpha = s.baseAlpha * lerp(0.9, 2.5, fl);
      scale = lerp(0.85, 1.0 + fl * 0.3, fl);
    } else {
      // Phase 4+: dissolve into an even, full-screen constellation
      const dt = easeInOut(dissolveT);
      tx = lerp(s.lx, s.fx, dt);
      ty = lerp(s.ly, s.fy, dt);
      alpha = s.baseAlpha * lerp(0.9, 0.32, dt);
      scale = lerp(1.0, 0.62, dt);

      // Orbit effect around "attention" text area during l2T
      if (l2T > 0 && l2T < 1) {
        const orbitStrength = Math.sin(l2T * Math.PI) * 0.16;
        const textY = H * 0.62; // approx where "attention" sits
        const textX = W * 0.22;
        const odx = tx - textX;
        const ody = ty - textY;
        const distSq = odx*odx + ody*ody;
        const orbitThresh = W * 0.35;
        if (distSq < orbitThresh * orbitThresh) {
          const dist = Math.sqrt(distSq);
          const pull = orbitStrength * (1 - dist / orbitThresh);
          tx -= odx * pull * 0.15;
          ty -= ody * pull * 0.15;
          alpha = Math.min(alpha * (1 + pull * 2), 1.0);
        }
      }
    }

    // Keep the field alive even when scroll progress is paused.
    const motionFactor =
      p <= 0.18 ? 1 :
      p <= 0.42 ? lerp(0.9, 0.22, convergeT) :
      p <= 0.52 ? 0.16 :
      lerp(0.55, 1.25, dissolveT);
    const phase = time * s.floatSpeed + s.floatPhase;
    tx += (Math.sin(phase) * s.floatAmp + Math.sin(phase * 0.53) * s.floatAmp * 0.35) * motionFactor;
    ty += (Math.cos(phase * 0.87) * s.floatAmp * 0.72 + Math.sin(phase * 0.41) * s.floatAmp * 0.28) * motionFactor;
    alpha = Math.min(alpha * (1 + Math.sin(time * s.twinkleSpeed + s.floatPhase) * 0.08 * motionFactor), 1);

    if (!fpsMon.degraded) {
      const safe = avoidTextZones(tx, ty, clamp(map(p, 0.55, 0.76, 0, 1), 0, 1) * (s.layer === 2 ? 1 : .72));
      tx = safe.x;
      ty = safe.y;
      alpha *= safe.alpha;
    }

    // Update position with light inertia for smoothness
    s.x = lerp(s.x, tx, 0.12);
    s.y = lerp(s.y, ty, 0.12);
    s.rot += s.rotSpeed * (1 - convergeT * 0.8);

    if (alpha <= 0.01) return;

    // Draw shard
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot + Math.sin(time * s.floatSpeed + s.floatPhase) * s.wobble * motionFactor);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.moveTo(s.pts[0][0], s.pts[0][1]);
    for (let j = 1; j < s.pts.length; j++) ctx.lineTo(s.pts[j][0], s.pts[j][1]);
    ctx.closePath();

    // Fill
    ctx.fillStyle = s.colour + Math.min(alpha * 0.85, 1) + ')';
    ctx.fill();

    // Edge highlight — thin bright stroke on top edge
    ctx.strokeStyle = 'rgba(255,255,255,' + Math.min(alpha * 0.6, 0.9) + ')';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.restore();
  });

  // ── Flash overlay ─────────────────────────────────────────────
  if (flashT > 0 && flashT < 1) {
    const fl = flashT < 0.5 ? easeIn(flashT * 2) : easeOut((1 - flashT) * 2);
    const flashAlpha = fl * 0.55;
    const flashGrad = ctx.createRadialGradient(cx, cy*0.85, 0, cx, cy*0.85, Math.min(W,H)*0.4);
    flashGrad.addColorStop(0, `rgba(255,255,255,${flashAlpha})`);
    flashGrad.addColorStop(0.4, `rgba(220,224,230,${flashAlpha * 0.5})`);
    flashGrad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = flashGrad;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Logo converging (assembling phase 2→3 → dissolve) ──────────
  if (convergeT > 0.2 && dissolveT < 0.65 && logoReady && logoCanvas) {
    const lt  = clamp(map(convergeT, 0.2, 1.0, 0, 1), 0, 1);
    const da  = dissolveT > 0.03 ? 1 - easeInOut(clamp(map(dissolveT, 0.03, 0.65, 0, 1), 0, 1)) : 1;
    // Fade in as shards converge, fade out as text reveals
    const logoAlpha = easeOut(lt) * da;
    if (logoAlpha > 0.01) {
      const lSize = Math.min(W, H) * 0.38;
      ctx.save();
      ctx.globalAlpha = logoAlpha;
      // 'screen': inverted logo (white mark on black) — black vanishes, mark glows on dark canvas
      ctx.globalCompositeOperation = 'screen';
      const imgAspect = logoCanvas.width / logoCanvas.height;
      const drawH = lSize;
      const drawW = drawH * imgAspect;
      ctx.drawImage(logoCanvas, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
      ctx.restore();
    }
  } else if (!logoReady && convergeT > 0.2 && dissolveT < 0.65) {
    // Fallback outline if image not ready
    const lt = clamp(map(convergeT, 0.2, 1.0, 0, 1), 0, 1);
    const da = dissolveT > 0.03 ? 1 - easeInOut(clamp(map(dissolveT, 0.03, 0.65, 0, 1), 0, 1)) : 1;
    const logoAlpha = easeOut(lt) * da * 0.3;
    if (logoAlpha > 0.01) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(logoScale, logoScale);
      ctx.strokeStyle = `rgba(226,229,233,${logoAlpha})`;
      ctx.lineWidth = 1.5 / logoScale;
      LOGO_PATHS.forEach(path => {
        ctx.beginPath();
        ctx.moveTo(path[0][0], path[0][1]);
        path.forEach(pt => ctx.lineTo(pt[0], pt[1]));
        if (path.length > 3) ctx.closePath();
        ctx.stroke();
      });
      ctx.restore();
    }
  }

  // ── Subtle scan-line texture ───────────────────────────────────
  if (p > 0.5) {
    const scanAlpha = clamp(map(p, 0.5, 0.65, 0, 0.025), 0, 0.025);
    ctx.fillStyle = `rgba(200,204,210,${scanAlpha})`;
    ctx.fillRect(0, 0, W, H);
  }

  lastP = p;
  rafId = requestAnimationFrame(render);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(rafId);
    rafId = null;
    return;
  }
  if (!rafId) {
    scrollDirty = true;
    rafId = requestAnimationFrame(render);
  }
});

// ─── INIT ────────────────────────────────────────────────────────
// Defer until layout is complete so canvas has real dimensions
const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function init() {
  const prefersStaticMobileHero =
    window.innerWidth < 768 && window.matchMedia('(pointer: coarse)').matches;

  if (prefersStaticMobileHero) {
    // Use the final hero composition on small touch devices without the long pinned scroll.
    const pinWrap = document.querySelector('.hero-pin-wrap');
    if (pinWrap) pinWrap.style.height = '100vh';
    const sticky = document.querySelector('.hero-sticky');
    if (sticky) sticky.style.position = 'relative';
    heroStaticProgress = 0.96;
    document.getElementById('scroll-hint')?.classList.add('hidden');
    resize();
    render();
    return;
  }
  if (REDUCE_MOTION) {
    // Skip canvas entirely — CSS already handles static fallback
    ['ey','l1','l2','l3','hf'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.style.opacity = 1; el.style.transform = 'none'; }
    });
    const hfEl = document.getElementById('hf');
    if (hfEl) setHeroFootActive(true);
    setHeroNavComplete(true);
    document.getElementById('scroll-hint')?.classList.add('hidden');
    return;
  }
  resize();
  render();
}
if (document.readyState === 'complete') {
  init();
} else {
  window.addEventListener('load', init);
}

// ─── REMNANT PARTICLE SYSTEM ─────────────────────────────────────
// Carries hero shard energy into the Services section via a fixed overlay canvas.
(function() {
  if (REDUCE_MOTION) return;
  const prefersStaticMobile =
    window.innerWidth < 768 && window.matchMedia('(pointer: coarse)').matches;
  if (prefersStaticMobile) return;

  const REMNANT_CANVAS = document.getElementById('remnant-canvas');
  const REMNANT_CTX = REMNANT_CANVAS ? REMNANT_CANVAS.getContext('2d') : null;
  if (!REMNANT_CANVAS || !REMNANT_CTX) return;

  let remShards = [];
  let remRaf = null;
  let remActive = false;
  let remKilled = false;

  function remResize() {
    REMNANT_CANVAS.width = window.innerWidth;
    REMNANT_CANVAS.height = window.innerHeight;
  }
  window.addEventListener('resize', remResize);

  function initRemnant() {
    if (remActive || remKilled || !shards || !shards.length) return;
    // Pick a subset from mid/deep layers
    const candidates = shards.filter(s => s.layer >= 1 && s.baseAlpha > 0.4);
    const pick = candidates.slice(0, 12);
    if (pick.length < 3) { remKilled = true; return; }

    remResize();
    remShards = pick.map(s => ({
      pts: s.pts,
      colour: s.colour,
      x: s.x || s.fx,
      y: s.y || s.fy,
      rot: s.rot || 0,
      rotSpeed: (Math.random() - 0.5) * 0.03,
      floatPhase: Math.random() * Math.PI * 2,
      floatSpeed: 0.15 + Math.random() * 0.35,
      floatAmp: 2 + Math.random() * 8,
      twinkleSpeed: 0.4 + Math.random() * 0.6,
      baseAlpha: 0.2 + Math.random() * 0.25,
    }));

    remActive = true;
    remRaf = requestAnimationFrame(remRender);

    // Opacity curve across services scroll: fade in → hold → fade out
    ScrollTrigger.create({
      trigger: '#services',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: self => {
        if (!remActive || !REMNANT_CANVAS) return;
        const p = self.progress; // 0→1 across services section
        let opacity;
        if (p < 0.15) {
          // Fade in: 0 → 0.3
          opacity = 0.3 * (p / 0.15);
        } else if (p < 0.4) {
          // Hold at 0.3
          opacity = 0.3;
        } else {
          // Fade out: 0.3 → 0
          opacity = 0.3 * Math.max(0, 1 - (p - 0.4) / 0.6);
        }
        REMNANT_CANVAS.style.opacity = opacity;
        if (p >= 1) killRemnant();
      },
      onEnter: () => { /* remActive already set */ },
    });
  }

  function remRender() {
    if (!remActive || !REMNANT_CTX) return;
    const W = REMNANT_CANVAS.width;
    const H = REMNANT_CANVAS.height;
    const time = performance.now() * 0.001;

    REMNANT_CTX.clearRect(0, 0, W, H);

    for (const s of remShards) {
      const phase = time * s.floatSpeed + s.floatPhase;
      const tx = s.x + Math.sin(phase) * s.floatAmp + Math.sin(phase * 0.53) * s.floatAmp * 0.35;
      const ty = s.y + Math.cos(phase * 0.87) * s.floatAmp * 0.72 + Math.sin(phase * 0.41) * s.floatAmp * 0.28;
      const alpha = s.baseAlpha * (1 + Math.sin(time * s.twinkleSpeed + s.floatPhase) * 0.15);
      if (alpha <= 0.01) continue;

      s.rot += s.rotSpeed;

      const ctx = REMNANT_CTX;
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(s.rot);
      ctx.beginPath();
      ctx.moveTo(s.pts[0][0], s.pts[0][1]);
      for (let j = 1; j < s.pts.length; j++) ctx.lineTo(s.pts[j][0], s.pts[j][1]);
      ctx.closePath();
      ctx.fillStyle = s.colour + Math.min(alpha * 0.85, 1) + ')';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,' + Math.min(alpha * 0.4, 0.7) + ')';
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.restore();
    }

    remRaf = requestAnimationFrame(remRender);
  }

  function killRemnant() {
    remActive = false;
    remKilled = true;
    if (remRaf) { cancelAnimationFrame(remRaf); remRaf = null; }
    if (REMNANT_CTX) REMNANT_CTX.clearRect(0, 0, REMNANT_CANVAS.width, REMNANT_CANVAS.height);
    if (REMNANT_CANVAS) REMNANT_CANVAS.style.opacity = '0';
  }

  // Expose for other sections to trigger ripples
  window.addRemnantBurst = function(cx, cy) {
    if (!shards || !shards.length) return;
    // If killed, briefly revive for the CTA finale
    if (remKilled || !remActive) {
      if (REMNANT_CTX) REMNANT_CTX.clearRect(0, 0, REMNANT_CANVAS.width, REMNANT_CANVAS.height);
      remShards = [];
      remKilled = false;
      remActive = true;
      remResize();
      if (!remRaf) remRaf = requestAnimationFrame(remRender);
    }
    // Cancel any pending kill fade-out
    if (REMNANT_CANVAS) REMNANT_CANVAS.style.opacity = Math.max(parseFloat(REMNANT_CANVAS.style.opacity) || 0, 0.15);
    for (let i = 0; i < 8; i++) {
      const src = shards[Math.floor(Math.random() * shards.length)];
      if (!src) continue;
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 120;
      remShards.push({
        pts: src.pts,
        colour: src.colour,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.04,
        floatPhase: Math.random() * Math.PI * 2,
        floatSpeed: 0.3 + Math.random() * 0.5,
        floatAmp: 1 + Math.random() * 4,
        twinkleSpeed: 0.3 + Math.random() * 0.5,
        baseAlpha: 0.3 + Math.random() * 0.2,
        // Ripple shards decay faster
        _ripple: true,
      });
    }
  };

  // Trigger: when services section is about to enter viewport
  if (window.ScrollTrigger) {
    ScrollTrigger.create({
      trigger: '#services',
      start: 'top bottom',
      once: true,
      onEnter: initRemnant,
    });
  }
})();

