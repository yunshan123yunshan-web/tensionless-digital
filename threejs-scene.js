(function() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof THREE === 'undefined') return;
  // Skip ambient particles on mid/low-tier devices
  if (document.documentElement.getAttribute('data-lod') !== 'high') return;

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050508, 0.0016);
  var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 300;

  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  var container = document.createElement('div');
  container.id = 'three-atmosphere';
  container.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;opacity:0;will-change:opacity';
  document.body.prepend(container);
  container.appendChild(renderer.domElement);

  // 400 particles — chrome/steel disc with warm accents
  var count = 400;
  var pos = new Float32Array(count * 3);
  var col = new Float32Array(count * 3);
  var sizes = new Float32Array(count);
  var phases = new Float32Array(count);

  for (var i = 0; i < count; i++) {
    var r = 60 + Math.random() * 200;
    var theta = Math.random() * Math.PI * 2;
    var yRange = 0.35;
    pos[i*3]   = Math.cos(theta) * r;
    pos[i*3+1] = (Math.random() - 0.5) * r * yRange * 2;
    pos[i*3+2] = Math.sin(theta) * r;

    // Steel range with warm accent mix
    var warm = Math.random() < 0.12 ? 1 : 0;
    var base = 0.5 + Math.random() * 0.5;
    col[i*3]   = warm ? base + 0.15 : base;
    col[i*3+1] = warm ? base - 0.05 : base;
    col[i*3+2] = warm ? base - 0.1  : base;

    sizes[i]  = 0.8 + Math.random() * 2.8;
    phases[i] = Math.random() * Math.PI * 2;
  }

  var geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(col, 3));

  var mat = new THREE.PointsMaterial({
    size: 2.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  var points = new THREE.Points(geom, mat);
  scene.add(points);

  // Mouse parallax + velocity
  var mouseX = 0, mouseY = 0, camX = 0, camY = 0;
  var mouseVel = 0, lastMX = 0, lastMY = 0;
  document.addEventListener('mousemove', function(e) {
    mouseX = (e.clientX / window.innerWidth) * 16 - 8;
    mouseY = -(e.clientY / window.innerHeight) * 16 + 8;
    var dx = e.clientX - lastMX, dy = e.clientY - lastMY;
    mouseVel = Math.sqrt(dx * dx + dy * dy);
    lastMX = e.clientX;
    lastMY = e.clientY;
  });

  // Scroll-driven Z oscillation
  var scrollProg = 0;

  if (typeof ScrollTrigger !== 'undefined') {
    var st1 = ScrollTrigger.create({
      trigger: '#services', start: 'top bottom-=200',
      onEnter: function() { gsap.to(container, { opacity: 0.2, duration: 0.8, ease: 'power2.out' }); },
      onLeave: function() { gsap.to(container, { opacity: 0, duration: 0.6, ease: 'power2.out' }); },
      onEnterBack: function() { gsap.to(container, { opacity: 0.2, duration: 0.6, ease: 'power2.out' }); },
      onLeaveBack: function() { gsap.to(container, { opacity: 0, duration: 0.8, ease: 'power2.out' }); },
    });
    ScrollTrigger.create({
      trigger: '#contact', start: 'top bottom-=200',
      onEnter: function() { gsap.to(container, { opacity: 0, duration: 0.6, ease: 'power2.out' }); },
      onLeaveBack: function() { gsap.to(container, { opacity: 0.2, duration: 0.6, ease: 'power2.out' }); },
    });

    // Track scroll progress through content sections for Z oscillation
    var progTriggers = ['#services', '#case-study', '#process-imm'];
    progTriggers.forEach(function(sel) {
      ScrollTrigger.create({
        trigger: sel, start: 'top bottom', end: 'bottom top',
        onUpdate: function(self) { scrollProg = self.progress; },
      });
    });
  }

  // Animate loop
  function anim() {
    requestAnimationFrame(anim);

    // Mouse velocity glow — particles brighten on fast movement
    mouseVel *= 0.88;
    var velBoost = Math.min(mouseVel / 15, 1) * 0.2;
    mat.opacity = 0.4 + velBoost;

    points.rotation.y += 0.0003;

    camX += (mouseX - camX) * 0.05;
    camY += (mouseY - camY) * 0.05;
    camera.position.x = camX;
    camera.position.y = camY;

    // Gentle Z oscillation from scroll progress
    camera.position.z = 300 + Math.sin(scrollProg * Math.PI * 2) * 15;

    // Twinkle: one random particle per frame
    var idx = Math.floor(Math.random() * count);
    var phase = phases[idx];
    var twinkle = 0.6 + Math.sin(performance.now() * 0.003 + phase) * 0.4;
    // Update individual particle opacity via color intensity
    var arr = geom.attributes.color.array;
    var base = 0.5 + phases[idx] * 0.5;
    arr[idx*3]   = base * twinkle;
    arr[idx*3+1] = base * twinkle;
    arr[idx*3+2] = base * twinkle;
    geom.attributes.color.needsUpdate = true;

    renderer.render(scene, camera);
  }
  anim();

  window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
