/* Touchable inflatable: press → dent (where you touch) → release → recover.
   A tiny WebGL pass over the existing render: the surface under the pointer is
   pinched in with a darker dimple and a bright rim, the body flattens slightly,
   and on release a damped spring overshoots once (a brief bulge) and settles.
   Renders only while something is moving. Optional toy: ignoring it loses nothing.
   Depends on proto-core.js (window.TD). */
(function () {
  'use strict';
  var TD = window.TD || { reduced: true };
  if (TD.reduced) return;
  var art = document.querySelector('.art-infl'), card = art && art.querySelector('.card'), img = card && card.querySelector('img');
  if (!img) return;
  var canvas = document.createElement('canvas');
  var gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true });
  if (!gl) return;   // the plain image stays

  var VS = 'attribute vec2 a;varying vec2 v;void main(){v=vec2(a.x*.5+.5,.5-a.y*.5);gl_Position=vec4(a,0.,1.);}';
  var FS = [
    'precision mediump float;uniform sampler2D t;uniform vec2 p;uniform float s;uniform float r;varying vec2 v;',
    'void main(){',
    '  vec2 c=vec2(.5);',
    '  vec2 uv=c+(v-c)*vec2(1.+.05*s,1.-.04*s);',            // body: a little wider and flatter under pressure
    '  vec2 d=uv-p;float d2=dot(d,d);float f=exp(-d2/(r*r));',
    '  uv=p+d*(1.+.6*s*f);',                                    // local dent (s<0 → brief bulge on recovery)
    '  vec4 col=texture2D(t,uv);',
    '  float ring=exp(-pow(sqrt(d2)-r*.9,2.)/(r*r*.08));',
    '  float ps=max(s,0.);',
    '  col.rgb*=1.-.3*ps*f;',                                   // dimple shading
    '  col.rgb+=.12*ps*ring*col.a;',                            // stretched-vinyl rim highlight
    '  gl_FragColor=col;',
    '}'].join('\n');
  function sh(type, src) { var o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; }
  var prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = { p: gl.getUniformLocation(prog, 'p'), s: gl.getUniformLocation(prog, 's'), r: gl.getUniformLocation(prog, 'r') };
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  var alpha = null;   // low-res alpha map: presses on the transparent corners don't count
  function setup() {
    var tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var c2 = document.createElement('canvas'); c2.width = c2.height = 64;
    var x2 = c2.getContext('2d'); x2.drawImage(img, 0, 0, 64, 64);
    try { alpha = x2.getImageData(0, 0, 64, 64).data; } catch (e) { alpha = null; }
    canvas.className = 'squish';
    card.appendChild(canvas); card.classList.add('squishy');
    size(); render();
    new ResizeObserver(function () { size(); render(); }).observe(card);
  }
  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(card.offsetWidth * dpr)); canvas.height = Math.max(1, Math.round(card.offsetHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  var P = { x: .5, y: .5 }, s = 0, vel = 0, pressing = false, held = 0, running = false, last = 0;
  function render() {
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.p, P.x, P.y); gl.uniform1f(U.s, s); gl.uniform1f(U.r, .2);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    card.style.setProperty('--press', Math.max(0, s).toFixed(3));
  }
  function loop(t) {
    var dt = Math.min(0.033, (t - (last || t)) / 1000); last = t;
    if (pressing) {
      held += dt;
      var target = Math.min(1, .55 + held * 1.4);   // a longer press goes deeper
      vel = 0; s += (target - s) * Math.min(1, dt * 14);
    } else {
      var a = -260 * s - 9 * vel;                    // damped spring: one visible overshoot, then rest
      vel += a * dt; s += vel * dt;
    }
    render();
    if (!pressing && Math.abs(s) < .002 && Math.abs(vel) < .01) { s = 0; vel = 0; render(); running = false; last = 0; return; }
    requestAnimationFrame(loop);
  }
  function start() { if (!running) { running = true; last = 0; requestAnimationFrame(loop); } }

  function toUV(e) {   // undo the card's rotation/scale so the dent lands under the finger
    var r = card.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var rot = (window.gsap ? gsap.getProperty(art, 'rotation') : 0) * Math.PI / 180;
    var sx = window.gsap ? gsap.getProperty(art, 'scaleX') : 1, sy = window.gsap ? gsap.getProperty(art, 'scaleY') : 1;
    var dx = e.clientX - cx, dy = e.clientY - cy;
    var x = dx * Math.cos(rot) + dy * Math.sin(rot), y = -dx * Math.sin(rot) + dy * Math.cos(rot);
    return { x: .5 + x / (card.offsetWidth * sx), y: .5 + y / (card.offsetHeight * sy) };
  }
  function solid(uv) {
    if (!alpha) return true;
    var ix = Math.floor(uv.x * 64), iy = Math.floor(uv.y * 64);
    if (ix < 0 || iy < 0 || ix > 63 || iy > 63) return false;
    return alpha[(iy * 64 + ix) * 4 + 3] > 40;
  }
  card.addEventListener('pointerdown', function (e) {
    var uv = toUV(e);
    if (!solid(uv)) return;
    e.preventDefault();
    P = uv; pressing = true; held = 0;
    card.setPointerCapture(e.pointerId); card.classList.add('pressing');
    document.getElementById('services').classList.add('squeezed');   // hides the "press" hint for good
    start();
  });
  card.addEventListener('pointermove', function (e) {
    if (!pressing) return;
    var uv = toUV(e); P.x += (uv.x - P.x) * .5; P.y += (uv.y - P.y) * .5;
  });
  function release() {
    if (!pressing) return;
    pressing = false; card.classList.remove('pressing');
    vel = -s * 3;   // kick back out
    if (TD.pluckSound) TD.pluckSound(Math.min(1, s), P.x, 1);
    start();
  }
  card.addEventListener('pointerup', release);
  card.addEventListener('pointercancel', release);

  if (img.complete && img.naturalWidth) setup(); else img.addEventListener('load', setup, { once: true });
})();
