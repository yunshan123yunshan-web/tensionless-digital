/**
 * Three.js atmosphere — layered starfield.
 *
 * Three depth layers (far → near) of chrome/steel particles with a few
 * glint-a/glint-b tinted stars. Each layer rotates independently so the
 * mouse parallax reads as depth, not a flat drift. Keeps the proven
 * behaviors: scroll-driven Z-oscillation, per-star twinkle, and
 * fade-in/fade-out ScrollTriggers after the hero / before the CTA.
 *
 * No-op on reduced-motion or non-high LOD (data-lod). Degrades silently
 * if Three.js fails to load.
 */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof THREE === 'undefined') return;
  if (document.documentElement.getAttribute('data-lod') !== 'high') return;

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050508, 0.0008);
  var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1200);
  camera.position.z = 240;

  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  var container = document.createElement('div');
  container.id = 'three-atmosphere';
  container.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;opacity:0;will-change:opacity';
  document.body.prepend(container);
  container.appendChild(renderer.domElement);

  // Glint accents from the palette — normalized 0..1.
  var GLINT_A = [0.56, 0.69, 1.0]; // #8fb0ff
  var GLINT_B = [0.43, 0.90, 0.84]; // #6ee7d6

  // Layer defs: far (many, tiny, dim) → near (few, large, bright).
  var layerDefs = [
    { count: 520, size: 0.7,  z0: 20,  z1: 120, tint: 0.05, bright: 0.55, rot: 0.00010 },
    { count: 240, size: 1.4,  z0: 120, z1: 190, tint: 0.07, bright: 0.72, rot: 0.00016 },
    { count: 80,  size: 2.6,  z0: 190, z1: 242, tint: 0.10, bright: 0.88, rot: 0.00022 }
  ];

  var layers = layerDefs.map(function (def) {
    var pos = new Float32Array(def.count * 3);
    var col = new Float32Array(def.count * 3);
    var orig = new Float32Array(def.count * 3);
    var phase = new Float32Array(def.count);

    for (var i = 0; i < def.count; i++) {
      var z = def.z0 + Math.random() * (def.z1 - def.z0);
      var span = z * 1.6;
      var x = (Math.random() - 0.5) * span;
      var y = (Math.random() - 0.5) * span * 0.6;

      var roll = Math.random();
      var r, g, b;
      if (roll < def.tint) { r = GLINT_A[0]; g = GLINT_A[1]; b = GLINT_A[2]; }
      else if (roll < def.tint * 2) { r = GLINT_B[0]; g = GLINT_B[1]; b = GLINT_B[2]; }
      else {
        var base = 0.42 + Math.random() * def.bright;
        r = base; g = base; b = Math.min(1, base + Math.random() * 0.07);
      }

      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b;
      orig[i * 3] = r; orig[i * 3 + 1] = g; orig[i * 3 + 2] = b;
      phase[i] = Math.random() * Math.PI * 2;
    }

    var geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(col, 3));

    var mat = new THREE.PointsMaterial({
      size: def.size,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    var points = new THREE.Points(geom, mat);
    scene.add(points);
    return { obj: points, geom: geom, mat: mat, phase: phase, orig: orig, count: def.count };
  });

  // Mouse parallax — normalized -1..1; near layers rotate more.
  var mouseNX = 0, mouseNY = 0;
  document.addEventListener('mousemove', function (e) {
    mouseNX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseNY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // Scroll-driven Z oscillation + fade triggers.
  var scrollProg = 0;
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      trigger: '#services', start: 'top bottom-=200',
      onEnter: function () { gsap.to(container, { opacity: 0.2, duration: 0.8, ease: 'power2.out' }); },
      onLeave: function () { gsap.to(container, { opacity: 0, duration: 0.6, ease: 'power2.out' }); },
      onEnterBack: function () { gsap.to(container, { opacity: 0.2, duration: 0.6, ease: 'power2.out' }); },
      onLeaveBack: function () { gsap.to(container, { opacity: 0, duration: 0.8, ease: 'power2.out' }); }
    });
    ScrollTrigger.create({
      trigger: '#contact', start: 'top bottom-=200',
      onEnter: function () { gsap.to(container, { opacity: 0, duration: 0.6, ease: 'power2.out' }); },
      onLeaveBack: function () { gsap.to(container, { opacity: 0.2, duration: 0.6, ease: 'power2.out' }); }
    });

    ['#services', '#case-study', '#process-imm'].forEach(function (sel) {
      ScrollTrigger.create({
        trigger: sel, start: 'top bottom', end: 'bottom top',
        onUpdate: function (self) { scrollProg = self.progress; }
      });
    });
  }

  var t = 0;
  function anim() {
    requestAnimationFrame(anim);
    t += 1;

    // Layer rotation: slow drift + mouse parallax (near layers move more).
    layers.forEach(function (layer, li) {
      var factor = 1 + li * 0.6;
      layer.obj.rotation.y += layerDefs[li].rot;
      layer.obj.rotation.y += (mouseNX * 0.05 * factor - layer.obj.rotation.y * 0.2) * 0.04;
      layer.obj.rotation.x += (mouseNY * 0.03 * factor - layer.obj.rotation.x * 0.2) * 0.04;

      // Twinkle: a few stars per frame, restored from their base color.
      for (var k = 0; k < 2; k++) {
        var idx = Math.floor(Math.random() * layer.count);
        var tw = 0.55 + 0.45 * Math.sin(t * 0.09 + layer.phase[idx]);
        var arr = layer.geom.attributes.color.array;
        arr[idx * 3] = layer.orig[idx * 3] * tw;
        arr[idx * 3 + 1] = layer.orig[idx * 3 + 1] * tw;
        arr[idx * 3 + 2] = layer.orig[idx * 3 + 2] * tw;
      }
      layer.geom.attributes.color.needsUpdate = true;
    });

    camera.position.z = 240 + Math.sin(scrollProg * Math.PI * 2) * 16;
    renderer.render(scene, camera);
  }
  anim();

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
