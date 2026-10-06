'use strict';
/* ===== Full-screen effects layer: particles, floating text, flying icons, confetti ===== */
const FX = (() => {
  const TAU = Math.PI * 2;
  let cv, c, dpr = 1, w = 0, h = 0, root;
  const list = [];

  function init(canvas, rootEl) { cv = canvas; c = cv.getContext('2d'); root = rootEl; resize(); }
  function resize() {
    const r = root.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
  }
  /* client -> fx coordinates */
  function pt(clientX, clientY) { const r = root.getBoundingClientRect(); return { x: clientX - r.left, y: clientY - r.top }; }
  function elCenter(el) { const r = el.getBoundingClientRect(), g = root.getBoundingClientRect(); return { x: r.left - g.left + r.width / 2, y: r.top - g.top + r.height / 2 }; }

  function add(o) { o.age = 0; list.push(o); return o; }

  function ring(x, y, col, maxR, dur) { add({ type: 'ring', x, y, col: col || '#fff', maxR: maxR || 60, life: dur || 0.5 }); }
  function flash(x, y, r, col) { add({ type: 'flash', x, y, r: r || 70, col: col || '255,240,170', life: 0.35 }); }
  function sparks(x, y, col, n, speed) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = (speed || 160) * (0.4 + Math.random() * 0.8);
      add({ type: 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 260, r: 2 + Math.random() * 3, col: Array.isArray(col) ? col[i % col.length] : col, life: 0.55 + Math.random() * 0.4 });
    }
  }
  function stars(x, y, n, speed) {
    const cols = ['#fff3a0', '#ffd25c', '#ffffff', '#ffb6d0', '#a8e8ff'];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = (speed || 200) * (0.4 + Math.random() * 0.8);
      add({ type: 'star', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, g: 220, r: 5 + Math.random() * 5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10, col: cols[i % cols.length], life: 0.8 + Math.random() * 0.6 });
    }
  }
  function confetti(x, y, n, spreadX) {
    const cols = ['#ff5a7a', '#ffd25c', '#5ad0ff', '#7ae068', '#b58cff', '#ff9a4a'];
    for (let i = 0; i < n; i++) add({ type: 'conf', x: x + (Math.random() - 0.5) * (spreadX || 40), y, vx: (Math.random() - 0.5) * 360, vy: -260 - Math.random() * 360, g: 520, w: 5 + Math.random() * 5, h: 3 + Math.random() * 4, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 18, col: cols[i % cols.length], life: 1.6 + Math.random() * 0.8 });
  }
  function text(x, y, str, col, size, dur) { add({ type: 'text', x, y, str, col: col || '#fff', size: size || 22, life: dur || 1.1 }); }
  /* flying icon (canvas element) from a to b with arc, then callback */
  function fly(icon, a, b, opt) {
    opt = opt || {};
    add({ type: 'fly', icon, ax: a.x, ay: a.y, bx: b.x, by: b.y, size: opt.size || 34, delay: opt.delay || 0, life: opt.dur || 0.7, arc: opt.arc == null ? -70 : opt.arc, done: opt.done, trail: opt.trail !== false });
  }
  function shakeAmount() { return shake; }
  let shake = 0;
  function shakeBoard(a) { shake = Math.max(shake, a); }

  function frame(dt) {
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    shake = Math.max(0, shake - dt * 30);
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      if (p.type === 'fly' && p.delay > 0) { p.delay -= dt; continue; }
      p.age += dt;
      const k = Math.min(1, p.age / p.life);
      if (p.age >= p.life) {
        list.splice(i, 1);
        if (p.type === 'fly' && p.done) { try { p.done(); } catch (e) { console.error(e); } }
        continue;
      }
      switch (p.type) {
        case 'dot': p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; c.globalAlpha = 1 - k; c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, p.r * (1 - k * 0.5), 0, TAU); c.fill(); break;
        case 'star': p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.rot += p.vr * dt; c.globalAlpha = 1 - k * k; c.save(); c.translate(p.x, p.y); c.rotate(p.rot); starPath(p.r, p.r * 0.45); c.fillStyle = p.col; c.fill(); c.strokeStyle = 'rgba(160,100,0,.55)'; c.lineWidth = 1; c.stroke(); c.restore(); break;
        case 'conf': p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= 0.99; p.rot += p.vr * dt; c.globalAlpha = k > 0.75 ? (1 - k) * 4 : 1; c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.scale(1, Math.cos(p.rot * 2)); c.fillStyle = p.col; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore(); break;
        case 'ring': { const r = p.maxR * easeOut(k); c.globalAlpha = 1 - k; c.strokeStyle = p.col; c.lineWidth = 6 * (1 - k) + 1; c.beginPath(); c.arc(p.x, p.y, r, 0, TAU); c.stroke(); break; }
        case 'flash': { const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); g.addColorStop(0, 'rgba(' + p.col + ',' + (0.9 * (1 - k)) + ')'); g.addColorStop(1, 'rgba(' + p.col + ',0)'); c.globalAlpha = 1; c.fillStyle = g; c.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); break; }
        case 'text': {
          const yy = p.y - 46 * easeOut(k); c.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3; const s = p.size * (k < 0.15 ? 0.6 + k / 0.15 * 0.55 : 1.15 - Math.min(0.15, (k - 0.15) * 0.5));
          c.font = '900 ' + s + 'px "Trebuchet MS",system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = 'rgba(60,30,10,.85)'; c.strokeText(p.str, p.x, yy); c.fillStyle = p.col; c.fillText(p.str, p.x, yy); break;
        }
        case 'fly': {
          const e = easeInOut(k), x = p.ax + (p.bx - p.ax) * e, y = p.ay + (p.by - p.ay) * e + p.arc * Math.sin(Math.PI * e);
          const sz = p.size * (1 + 0.25 * Math.sin(Math.PI * k)) * (k > 0.85 ? 1 - (k - 0.85) * 3 : 1);
          if (p.trail && k > 0.02) { c.globalAlpha = 0.35; c.drawImage(p.icon, x - sz * 0.5 - (p.bx - p.ax) * 0.02, y - sz * 0.5 - (p.by - p.ay) * 0.02, sz, sz); }
          c.globalAlpha = 1; c.drawImage(p.icon, x - sz / 2, y - sz / 2, sz, sz); break;
        }
      }
      c.globalAlpha = 1;
    }
  }
  function starPath(R, r) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rad = i % 2 ? r : R; c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } c.closePath(); }
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  const easeInOut = (k) => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

  return { init, resize, pt, elCenter, ring, flash, sparks, stars, confetti, text, fly, frame, shakeBoard, shakeAmount };
})();
