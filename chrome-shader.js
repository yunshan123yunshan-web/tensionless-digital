/**
 * Chrome Shader — WebGL liquid-chrome hero background + shared text scramble util
 *
 * Two exports:
 *   window.tdScramble(el, opts) — progressive character-scramble reveal (port of
 *     React Bits DecryptedText). Returns a controller with .start()/.stop() so a
 *     GSAP timeline can trigger it at exact positions.
 *   window.tdChrome.init() — raw-WebGL domain-warped fbm noise producing iridescent
 *     chrome bands. No-op (returns null) on reduced-motion, lod-low/lod-medium,
 *     or when WebGL is unavailable, leaving the CSS .chrome gradient as the fallback.
 *
 * Loaded first, before hero.js, so both exports exist when the hero boots.
 */

(function () {
  'use strict';

  /* ── shared scramble util ──────────────────────────────────────── */
  var CHARS = '!<>-_\\/[]{}—=+*^?#$%&@;:,.';

  function scramble(el, opts) {
    opts = opts || {};
    var finalText = opts.final;
    if (!finalText && el.getAttribute && el.getAttribute('data-final')) {
      finalText = el.getAttribute('data-final');
    }
    if (finalText === undefined || finalText === null) finalText = el.textContent || '';
    finalText = String(finalText);

    var duration = opts.duration || 850;
    var len = finalText.length;
    var raf = null;
    var start = null;
    var running = false;

    function tick(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / duration);
      var e = 1 - Math.pow(1 - t, 2); // easeOutQuad — resolves left-to-right
      var resolved = Math.floor(e * len);
      var out = '';
      for (var i = 0; i < len; i++) {
        var ch = finalText[i];
        if (i <= resolved) {
          out += ch; // locked characters
        } else {
          // near the boundary, hint the target char occasionally so it reads in
          out += (Math.random() < 0.12 && i - resolved <= 6)
            ? ch
            : CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }
      el.textContent = out;
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        el.textContent = finalText;
        running = false;
        if (opts.onComplete) opts.onComplete();
      }
    }

    return {
      start: function () {
        if (running) return;
        running = true;
        start = null;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(tick);
      },
      stop: function () {
        cancelAnimationFrame(raf);
        running = false;
        el.textContent = finalText;
      },
      isRunning: function () { return running; }
    };
  }

  window.tdScramble = scramble;

  /* ── WebGL chrome shader ───────────────────────────────────────── */
  var VERT = [
    'attribute vec2 a_pos;',
    'void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'uniform vec2 u_res;',
    'uniform float u_time;',
    'uniform vec2 u_mouse;',
    'uniform float u_fracture;',
    'uniform float u_intensity;',
    'uniform float u_velocity;',
    '',
    'float hash(vec2 p) {',
    '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);',
    '}',
    '',
    'float noise(vec2 p) {',
    '  vec2 i = floor(p);',
    '  vec2 f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(',
    '    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),',
    '    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),',
    '    u.y',
    '  );',
    '}',
    '',
    'float fbm(vec2 p) {',
    '  float v = 0.0;',
    '  float a = 0.5;',
    '  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);',
    '  for (int i = 0; i < 5; i++) {',
    '    v += a * noise(p);',
    '    p = rot * p * 2.02 + 3.0;',
    '    a *= 0.5;',
    '  }',
    '  return v;',
    '}',
    '',
    'void main() {',
    '  vec2 uv = gl_FragCoord.xy / u_res.xy;',
    '  float aspect = u_res.x / max(u_res.y, 1.0);',
    '  vec2 p = vec2(uv.x * aspect, uv.y);',
    '  float t = u_time * 0.045;',
    '',
    '  // mouse parallax drift',
    '  vec2 m = (u_mouse - 0.5) * 0.85;',
    '  p += m;',
    '',
    '  // domain-warped fbm — the liquid chrome core',
    '  float q = fbm(p * 2.6 + t * 0.7);',
    '  vec2 r = vec2(',
    '    fbm(p * 2.6 + q + vec2(1.7, 9.2) + t),',
    '    fbm(p * 2.6 + q + vec2(8.3, 2.8) - t)',
    '  );',
    '  float f = fbm(p * 3.1 + 3.6 * r + t * 0.4);',
    '',
    '  // fracture: high-frequency detail, ramps with scroll and cursor speed',
    '  float frac = u_fracture + u_velocity;',
    '  f += frac * (fbm(p * 7.0 + q * 3.5 + t * 1.4) - 0.5) * 1.1;',
    '',
    '  // banding for the iridescent sweep',
    '  float band = f * 2.4 + sin(p.y * 5.0 + t * 1.6 + q * 2.0) * 0.35;',
    '',
    '  // palette — dark steel body, chrome highlights, localized glints',
    '  vec3 base = mix(vec3(0.014, 0.014, 0.019), vec3(0.055, 0.058, 0.066), smoothstep(0.2, 0.85, f));',
    '  vec3 col = base;',
    '  // chrome sheen',
    '  col = mix(col, vec3(0.72, 0.74, 0.78), smoothstep(0.68, 0.98, f) * 0.55);',
    '  // soft horizontal chrome sweep',
    '  float sweep = 0.5 + 0.5 * sin(p.y * 1.4 + t * 0.7);',
    '  col += vec3(0.55, 0.58, 0.62) * pow(sweep, 6.0) * 0.10;',
    '  // blue glint — only at true band peaks',
    '  col = mix(col, vec3(0.52, 0.64, 0.97), smoothstep(1.45, 2.15, band) * 0.5);',
    '  // teal glint — breathing mid-range',
    '  float tealGain = 0.5 + 0.5 * sin(t * 1.6 + p.y * 5.0 + q * 3.0);',
    '  col = mix(col, vec3(0.36, 0.84, 0.79), smoothstep(0.55, 0.82, f) * tealGain * 0.62);',
    '',
    '  col *= u_intensity;',
    '',
    '  // vignette',
    '  float vig = smoothstep(1.25, 0.42, length(uv - 0.5));',
    '  col *= vig;',
    '',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      // Silent degradation — leave the CSS gradient fallback.
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  window.tdChrome = {
    status: 'idle',
    init: function () {
      var docEl = document.documentElement;
      var cv = document.getElementById('chrome-shader');
      if (!cv) { window.tdChrome.status = 'disabled:no-canvas'; return null; }
      if (docEl.classList.contains('rm')) { window.tdChrome.status = 'disabled:reduced-motion'; return null; }
      if (docEl.classList.contains('lod-low')) { window.tdChrome.status = 'disabled:lod-low'; return null; }
      if (docEl.classList.contains('lod-medium')) { window.tdChrome.status = 'disabled:lod-medium'; return null; }

      var gl = cv.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true })
        || cv.getContext('experimental-webgl');
      if (!gl) { window.tdChrome.status = 'disabled:no-webgl'; return null; }

      var vs = compile(gl, gl.VERTEX_SHADER, VERT);
      var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
      if (!vs || !fs) { window.tdChrome.status = 'disabled:shader-compile'; return null; }

      var prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { window.tdChrome.status = 'disabled:link'; return null; }
      gl.useProgram(prog);
      window.tdChrome.status = 'running';

      // Fullscreen triangle — covers the viewport without a quad buffer.
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, 'a_pos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      var uRes = gl.getUniformLocation(prog, 'u_res');
      var uTime = gl.getUniformLocation(prog, 'u_time');
      var uMouse = gl.getUniformLocation(prog, 'u_mouse');
      var uFrac = gl.getUniformLocation(prog, 'u_fracture');
      var uInt = gl.getUniformLocation(prog, 'u_intensity');
      var uVel = gl.getUniformLocation(prog, 'u_velocity');

      var mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, px: 0.5, py: 0.5 };
      var fracture = 0;
      var intensity = 0.15;
      var velocity = 0;
      var running = false;
      var rafId = null;

      function resize() {
        var w = cv.clientWidth || window.innerWidth;
        var h = cv.clientHeight || window.innerHeight;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        cv.width = Math.max(1, Math.round(w * dpr));
        cv.height = Math.max(1, Math.round(h * dpr));
        gl.viewport(0, 0, cv.width, cv.height);
      }
      resize();
      window.addEventListener('resize', resize);

      window.addEventListener('mousemove', function (e) {
        mouse.tx = e.clientX / window.innerWidth;
        mouse.ty = e.clientY / window.innerHeight;
      }, { passive: true });

      function frame(now) {
        if (!running) return;
        mouse.x += (mouse.tx - mouse.x) * 0.05;
        mouse.y += (mouse.ty - mouse.y) * 0.05;
        var dx = mouse.x - mouse.px;
        var dy = mouse.y - mouse.py;
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        var speed = Math.min(Math.sqrt(dx * dx + dy * dy) * 14, 1);
        velocity += (speed - velocity) * 0.15;
        gl.uniform2f(uRes, cv.width, cv.height);
        gl.uniform1f(uTime, now * 0.001);
        gl.uniform2f(uMouse, mouse.x, mouse.y);
        gl.uniform1f(uFrac, fracture);
        gl.uniform1f(uInt, intensity);
        gl.uniform1f(uVel, velocity);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        rafId = requestAnimationFrame(frame);
      }
      function start() { if (!running) { running = true; rafId = requestAnimationFrame(frame); } }
      function stop() { running = false; cancelAnimationFrame(rafId); }

      // Pause rendering when the hero leaves the viewport (battery/CPU).
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) start(); else stop();
          });
        });
        io.observe(cv);
      } else {
        start();
      }

      return {
        setIntensity: function (v) { intensity = v; },
        setFracture: function (v) { fracture = v; },
        dispose: function () {
          stop();
          if (io) io.disconnect();
          window.removeEventListener('resize', resize);
        }
      };
    }
  };
})();
