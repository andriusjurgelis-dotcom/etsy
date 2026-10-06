'use strict';
/* ===== Animated lakeside resort scene (canvas) ===== */
const Scene = (() => {
  const W = 400, H = 680, TAU = Math.PI * 2;
  const SPOTS = {
    lighthouse: { x: 340, y: 322 }, boat: { x: 168, y: 340 }, cabin: { x: 80, y: 424 }, pier: { x: 286, y: 432 },
    diner: { x: 112, y: 528 }, spa: { x: 304, y: 534 }, campfire: { x: 196, y: 574 }, garden: { x: 318, y: 626 }
  };
  let cv, ctx, dpr = 1, sc = 1, ox = 0, oy = 0, cw = 0, ch = 0;
  let built = {}, popT = {}, selected = null, stars = 0, tapCb = null, timeOverride = null;
  let t = 0, last = 0;
  const parts = [], clouds = [], birds = [], flies = [];
  const treesL = [], treesR = [];
  let jump = null, nextJump = 4;

  const SKY = [
    [0, '#1a2358', '#2a3a82', '#46589a', 1], [5, '#1e2a64', '#34468e', '#5668a6', 0.95],
    [6.5, '#5a6aa8', '#f59a82', '#ffd8a0', 0.45], [8, '#4aa8ee', '#8fd0fa', '#dcf3ff', 0],
    [16.5, '#42a0ea', '#88ccf8', '#d4efff', 0], [18.5, '#6a72bc', '#ff9a7a', '#ffd48a', 0.35],
    [20, '#2e3478', '#8a52868', '#e8946e', 0.7], [21.5, '#1a2358', '#2a3a82', '#46589a', 1], [24, '#1a2358', '#2a3a82', '#46589a', 1]
  ];
  SKY[6][2] = '#8a5286';

  function hex(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function mixc(a, b, k) { const x = hex(a), y = hex(b); return 'rgb(' + Math.round(x[0] + (y[0] - x[0]) * k) + ',' + Math.round(x[1] + (y[1] - x[1]) * k) + ',' + Math.round(x[2] + (y[2] - x[2]) * k) + ')'; }
  function toHex(r) { return '#' + [0, 1, 2].map(i => Math.round(r[i]).toString(16).padStart(2, '0')).join(''); }
  function skyAt(h) {
    let i = 0; while (i < SKY.length - 2 && h > SKY[i + 1][0]) i++;
    const a = SKY[i], b = SKY[i + 1], k = Math.max(0, Math.min(1, (h - a[0]) / (b[0] - a[0])));
    const out = [];
    for (let j = 1; j <= 3; j++) { const x = hex(a[j]), y = hex(b[j]); out.push(toHex([x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k])); }
    out.push(a[4] + (b[4] - a[4]) * k);
    return out;
  }
  function hourNow() { if (timeOverride != null) return timeOverride; const d = new Date(); return d.getHours() + d.getMinutes() / 60; }

  function rr(c, x, y, w, h, r) { Art.rr(c, x, y, w, h, r); }
  const lg = Art.lg, fs = Art.fs;

  /* ---------- structures (origin = base centre) ---------- */
  function shadowE(c, w) { c.beginPath(); c.ellipse(0, 2, w, w * 0.2, 0, 0, TAU); c.fillStyle = 'rgba(20,30,10,.3)'; c.fill(); }
  function glowWin(c, x, y, w, h, n) {
    rr(c, x, y, w, h, 2); fs(c, lg(c, 0, y, 0, y + h, n > 0.3 ? [[0, '#fff2a8'], [1, '#ffc24a']] : [[0, '#c8ecff'], [1, '#7fb8dc']]), 'rgba(60,35,20,.9)', 1.8);
    c.strokeStyle = 'rgba(60,35,20,.8)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h / 2); c.stroke();
  }
  const S = {
    cabin(c, n) {
      shadowE(c, 54);
      rr(c, -36, -42, 72, 44, 3); fs(c, lg(c, 0, -42, 0, 2, [[0, '#d9a05d'], [1, '#a9692f']]));
      c.strokeStyle = 'rgba(70,35,10,.5)'; c.lineWidth = 1.6; for (const y of [-31, -20, -9]) { c.beginPath(); c.moveTo(-35, y); c.lineTo(35, y); c.stroke(); }
      for (const y of [-37, -26, -15, -4]) for (const x of [-36, 36]) { c.beginPath(); c.ellipse(x, y, 3.4, 5, 0, 0, TAU); fs(c, '#e8bd84', 'rgba(70,35,10,.7)', 1.2); }
      c.beginPath(); c.moveTo(-48, -38); c.lineTo(0, -82); c.lineTo(48, -38); c.closePath(); fs(c, lg(c, 0, -82, 0, -38, [[0, '#ef6a62'], [1, '#b8322f']]), 'rgba(80,20,20,.9)', 2.4);
      c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-30, -45); c.lineTo(-2, -73); c.stroke();
      c.strokeStyle = 'rgba(80,20,20,.35)'; c.lineWidth = 1.3; for (const k of [0.25, 0.5, 0.75]) { c.beginPath(); c.moveTo(-48 * (1 - k) - 0, -38 - 44 * k); c.lineTo(48 * (1 - k), -38 - 44 * k); c.stroke(); }
      rr(c, 18, -80, 11, 22, 2); fs(c, lg(c, 18, 0, 29, 0, [[0, '#b4b4bc'], [1, '#85858f']]));
      rr(c, 16, -84, 15, 5, 2); fs(c, '#6e6e78');
      rr(c, -8, -28, 16, 30, 7); fs(c, lg(c, 0, -28, 0, 2, [[0, '#7a4a25'], [1, '#52301a']])); c.beginPath(); c.arc(4, -12, 1.6, 0, TAU); c.fillStyle = '#ffd25c'; c.fill();
      glowWin(c, -30, -30, 15, 15, n); glowWin(c, 15, -30, 15, 15, n);
      rr(c, -14, 2, 28, 5, 2); fs(c, '#a8683a', 'rgba(70,40,20,.8)', 1.4);
    },
    campfire(c, n, tm) {
      shadowE(c, 46);
      // tent
      c.beginPath(); c.moveTo(-58, 0); c.lineTo(-34, -46); c.lineTo(-8, 0); c.closePath(); fs(c, lg(c, -58, -46, -8, 0, [[0, '#4cc7bd'], [1, '#2a8f98']]), 'rgba(15,60,70,.9)', 2.2);
      c.beginPath(); c.moveTo(-42, 0); c.lineTo(-34, -28); c.lineTo(-24, 0); c.closePath(); fs(c, '#1d4c58', false);
      c.beginPath(); c.moveTo(-34, -46); c.lineTo(-34, -52); c.strokeStyle = '#6b3f1f'; c.lineWidth = 2; c.stroke();
      c.beginPath(); c.moveTo(-34, -52); c.lineTo(-24, -49); c.lineTo(-34, -46); c.closePath(); fs(c, '#ff6a6a', false);
      // stones
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; c.beginPath(); c.ellipse(Math.cos(a) * 24 + 22, Math.sin(a) * 8 - 2, 6, 4.6, 0, 0, TAU); fs(c, lg(c, 0, -6, 0, 4, [[0, '#c9c9d2'], [1, '#7c7c88']]), 'rgba(40,40,50,.8)', 1.4); }
      // logs
      c.save(); c.translate(22, -4);
      for (const a of [-0.45, 0.45]) { c.save(); c.rotate(a); rr(c, -20, -4, 40, 8, 4); fs(c, lg(c, 0, -4, 0, 4, [[0, '#b9763a'], [1, '#6d3f1d']]), 'rgba(50,25,10,.9)', 1.6); c.restore(); }
      c.restore();
      // flames
      const fl = (s, col1, col2, k) => { c.save(); c.translate(22, -6); c.scale(s * (1 + Math.sin(tm * 11 + k) * 0.06), s * (1 + Math.sin(tm * 9 + k * 2) * 0.1)); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-16, -6, -10, -26, -2 + Math.sin(tm * 7 + k) * 3, -38); c.bezierCurveTo(8, -22, 16, -8, 0, 0); fs(c, lg(c, 0, -38, 0, 0, [[0, col1], [1, col2]]), false); c.restore(); };
      fl(1, '#ff9a2a', '#e8341c', 0); fl(0.7, '#ffd25c', '#ff8a1c', 2); fl(0.4, '#fff7c0', '#ffd25c', 4);
    },
    pier(c, n, tm) {
      c.save();
      for (const x of [-58, -30, 0, 30, 58]) { rr(c, x - 3, -2, 6, 22, 1.5); fs(c, '#6d3f1d', 'rgba(40,20,5,.8)', 1.2); }
      rr(c, -68, -12, 136, 16, 3); fs(c, lg(c, 0, -12, 0, 4, [[0, '#d9a05d'], [1, '#a9692f']]), 'rgba(70,35,10,.9)', 2);
      c.strokeStyle = 'rgba(70,35,10,.55)'; c.lineWidth = 1.5; for (let x = -52; x < 66; x += 17) { c.beginPath(); c.moveTo(x, -12); c.lineTo(x, 4); c.stroke(); }
      // lantern post
      rr(c, 56, -50, 4, 38, 1.5); fs(c, '#6d3f1d', false); rr(c, 51, -62, 14, 14, 3); fs(c, n > 0.3 ? '#fff0a0' : '#dff0ff', 'rgba(60,35,20,.9)', 1.6);
      c.beginPath(); c.moveTo(48, -62); c.lineTo(58, -70); c.lineTo(68, -62); c.closePath(); fs(c, '#b8322f', false);
      // bucket + rod
      rr(c, -52, -24, 12, 12, 3); fs(c, '#4a8ed8', 'rgba(20,50,100,.9)', 1.5);
      c.beginPath(); c.moveTo(-30, -12); c.lineTo(-6, -52); c.strokeStyle = '#6b3f1f'; c.lineWidth = 2.4; c.stroke();
      c.beginPath(); c.moveTo(-6, -52); c.quadraticCurveTo(0, -30, -2 + Math.sin(tm * 2) * 2, -8); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1; c.stroke();
      c.restore();
    },
    garden(c, n, tm) {
      shadowE(c, 56);
      rr(c, -56, -18, 112, 20, 6); fs(c, lg(c, 0, -18, 0, 2, [[0, '#8a5a35'], [1, '#5e3a20']]), 'rgba(40,20,5,.8)', 2);
      const cols = ['#ff6a8a', '#ffd25c', '#b58cff', '#ff9a4a', '#ffffff', '#7fd0ff'];
      for (let i = 0; i < 11; i++) {
        const x = -50 + i * 10, h = 26 + (i * 7) % 14, sw = Math.sin(tm * 1.6 + i) * 2.2;
        c.strokeStyle = '#3e8c35'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, -14); c.quadraticCurveTo(x + sw * 0.5, -14 - h * 0.5, x + sw, -14 - h); c.stroke();
        Art.leaf(c, x, -16, 10, -0.5 - (i % 2) * 2, '#58b048');
        Art.petals(c, x + sw, -14 - h, 6, 6.5, 3.2, '#ffffff', cols[i % 6], tm * 0.2 + i); c.beginPath(); c.arc(x + sw, -14 - h, 2.6, 0, TAU); fs(c, '#ffe98a', 'rgba(130,70,0,.6)', 0.9);
      }
      // fence
      for (let x = -60; x <= 60; x += 10) { c.beginPath(); c.moveTo(x - 3, 8); c.lineTo(x - 3, -4); c.lineTo(x, -8); c.lineTo(x + 3, -4); c.lineTo(x + 3, 8); c.closePath(); fs(c, '#fff6e4', 'rgba(110,70,30,.7)', 1.2); }
      rr(c, -62, -1, 124, 3, 1); fs(c, '#f1e0bd', 'rgba(110,70,30,.6)', 1);
    },
    diner(c, n, tm) {
      shadowE(c, 56);
      rr(c, -42, -48, 84, 50, 3); fs(c, lg(c, 0, -48, 0, 2, [[0, '#fff2d6'], [1, '#f0d5a0']]), 'rgba(110,70,30,.85)', 2.2);
      rr(c, -46, -62, 92, 16, 3); fs(c, lg(c, 0, -62, 0, -46, [[0, '#4ccbc0'], [1, '#2a8f98']]), 'rgba(15,60,70,.9)', 2.2);
      c.fillStyle = '#fff'; c.font = '800 12px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('DINER', 0, -54);
      // awning
      for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(-44 + i * 11, -44); c.lineTo(-33 + i * 11, -44); c.lineTo(-33 + i * 11, -34); c.arc(-38.5 + i * 11, -34, 5.5, 0, Math.PI); c.closePath(); fs(c, i % 2 ? '#fff' : '#e8605a', 'rgba(110,30,30,.8)', 1.4); }
      glowWin(c, -34, -28, 26, 20, n);
      rr(c, 8, -30, 18, 32, 3); fs(c, lg(c, 0, -30, 0, 2, [[0, '#7fd0ff'], [1, '#4a9ed8']]), 'rgba(60,35,20,.9)', 1.8);
      c.beginPath(); c.arc(22, -12, 1.5, 0, TAU); c.fillStyle = '#ffd25c'; c.fill();
      // table + umbrella
      rr(c, 48, -14, 3, 16, 1); fs(c, '#6d3f1d', false); c.beginPath(); c.ellipse(49.5, -14, 12, 3, 0, 0, TAU); fs(c, '#fff', 'rgba(110,70,30,.8)', 1.4);
      c.beginPath(); c.moveTo(36, -34); c.quadraticCurveTo(50, -54, 64, -34); c.closePath(); fs(c, '#ffb347', 'rgba(110,60,0,.9)', 1.8); rr(c, 49, -34, 2, 22, 1); fs(c, '#8a5a35', false);
      if (n > 0.25) { c.fillStyle = '#ff6ac0'; c.font = '700 8px system-ui'; c.fillText('OPEN', -22, -10); }
    },
    boat(c, n, tm) {
      c.save(); c.rotate(Math.sin(tm * 1.3) * 0.05);
      c.beginPath(); c.moveTo(-30, -10); c.quadraticCurveTo(-24, 8, 0, 9); c.quadraticCurveTo(24, 8, 30, -10); c.closePath(); fs(c, lg(c, 0, -10, 0, 9, [[0, '#ef6a62'], [1, '#b8322f']]), 'rgba(80,20,20,.9)', 2.2);
      c.beginPath(); c.moveTo(-28, -6); c.quadraticCurveTo(0, 0, 28, -6); c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
      c.beginPath(); c.ellipse(0, -10, 30, 5, 0, 0, TAU); fs(c, '#a8683a', 'rgba(60,30,10,.9)', 1.8);
      c.beginPath(); c.moveTo(-14, -14); c.lineTo(22, 6); c.strokeStyle = '#8a5a35'; c.lineWidth = 2.4; c.stroke(); c.beginPath(); c.ellipse(24, 7, 3.4, 6, 0.5, 0, TAU); fs(c, '#d9a05d', 'rgba(60,30,10,.9)', 1.2);
      rr(c, 6, -26, 7, 11, 2); fs(c, n > 0.3 ? '#fff0a0' : '#ffe9a6', 'rgba(60,35,20,.9)', 1.4);
      c.restore();
    },
    spa(c, n, tm) {
      shadowE(c, 50);
      rr(c, -52, -6, 104, 10, 3); fs(c, lg(c, 0, -6, 0, 4, [[0, '#d9a05d'], [1, '#a9692f']]), 'rgba(70,35,10,.85)', 1.8);
      c.beginPath(); c.moveTo(-36, -8); c.lineTo(-32, -34); c.quadraticCurveTo(0, -26, 32, -34); c.lineTo(36, -8); c.quadraticCurveTo(0, 2, -36, -8); fs(c, lg(c, -36, 0, 36, 0, [[0, '#a8683a'], [0.5, '#d99a58'], [1, '#8f5528']]), 'rgba(60,30,10,.9)', 2.2);
      c.strokeStyle = 'rgba(60,30,10,.4)'; c.lineWidth = 1.4; for (let x = -24; x <= 24; x += 12) { c.beginPath(); c.moveTo(x, -28); c.lineTo(x * 1.08, -4); c.stroke(); }
      c.beginPath(); c.ellipse(0, -34, 33, 8.5, 0, 0, TAU); fs(c, '#a8683a', 'rgba(60,30,10,.9)', 2);
      c.beginPath(); c.ellipse(0, -34, 28, 6, 0, 0, TAU); fs(c, lg(c, 0, -40, 0, -28, [[0, '#9fe6ff'], [1, '#3ab0e0']]), false);
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.2; for (const k of [0, 1, 2]) { c.beginPath(); c.ellipse(-12 + k * 12, -34, 4 + Math.sin(tm * 2 + k) * 1.5, 1.4, 0, 0, TAU); c.stroke(); }
      // towel rack
      rr(c, 38, -38, 3, 34, 1); fs(c, '#6d3f1d', false); rr(c, 33, -40, 13, 14, 2); fs(c, '#fff', 'rgba(110,70,30,.7)', 1.2); c.fillStyle = '#4ccbc0'; c.fillRect(33.5, -36, 12, 3); c.fillRect(33.5, -30, 12, 3);
    },
    lighthouse(c, n, tm) {
      c.beginPath(); c.moveTo(-34, 4); c.quadraticCurveTo(-30, -14, -14, -16); c.lineTo(16, -16); c.quadraticCurveTo(32, -12, 36, 4); c.quadraticCurveTo(0, 12, -34, 4); fs(c, lg(c, 0, -16, 0, 10, [[0, '#a8a8b4'], [1, '#6a6a78']]), 'rgba(40,40,55,.9)', 2.2);
      c.save(); c.beginPath(); c.moveTo(-14, -14); c.lineTo(-9, -78); c.lineTo(9, -78); c.lineTo(14, -14); c.closePath(); c.clip();
      c.fillStyle = '#fff'; c.fillRect(-20, -80, 40, 70);
      c.fillStyle = '#e8605a'; for (const y of [-72, -52, -32]) c.fillRect(-20, y, 40, 10);
      c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(2, -80, 20, 70); c.restore();
      c.beginPath(); c.moveTo(-14, -14); c.lineTo(-9, -78); c.lineTo(9, -78); c.lineTo(14, -14); c.closePath(); c.strokeStyle = 'rgba(60,30,30,.9)'; c.lineWidth = 2.2; c.stroke();
      rr(c, -8, -30, 6, 8, 2); fs(c, '#3a4a6a', false);
      rr(c, -13, -82, 26, 4, 1.5); fs(c, '#4a4a58', 'rgba(20,20,30,.9)', 1.4);
      rr(c, -8, -94, 16, 13, 2); fs(c, n > 0.3 ? '#fff6b0' : '#d8f0ff', 'rgba(60,60,80,.9)', 1.6);
      c.beginPath(); c.moveTo(-11, -94); c.lineTo(0, -104); c.lineTo(11, -94); c.closePath(); fs(c, '#e8605a', 'rgba(80,20,20,.9)', 1.8);
    }
  };

  function drawTree(c, x, y, s, sway) {
    c.save(); c.translate(x, y); c.scale(s, s);
    rr(c, -3, -10, 6, 12, 1); fs(c, '#6d3f1d', false);
    c.rotate(sway);
    for (let i = 0; i < 4; i++) {
      const w = 26 - i * 4.5, yy = -8 - i * 15;
      c.beginPath(); c.moveTo(-w, yy); c.lineTo(0, yy - 26); c.lineTo(w, yy); c.closePath();
      fs(c, lg(c, -w, 0, w, 0, [[0, '#2f8a4a'], [0.55, '#46b05a'], [1, '#237a40']]), 'rgba(10,50,25,.85)', 1.6);
    }
    c.restore();
  }

  /* ---------- scene setup ---------- */
  function init(canvas) {
    cv = canvas; ctx = cv.getContext('2d');
    for (let i = 0; i < 6; i++) clouds.push({ x: Math.random() * W, y: 30 + Math.random() * 110, s: 0.6 + Math.random() * 0.9, v: 3 + Math.random() * 5 });
    for (let i = 0; i < 3; i++) birds.push({ x: Math.random() * W, y: 60 + Math.random() * 80, v: 14 + Math.random() * 10, p: Math.random() * 6 });
    for (let i = 0; i < 18; i++) flies.push({ x: Math.random() * W, y: 360 + Math.random() * 280, p: Math.random() * 9, s: 0.4 + Math.random() });
    for (let i = 0; i < 9; i++) treesL.push({ x: -10 + i * 20 + Math.random() * 8, y: 296 + Math.random() * 10, s: 0.4 + Math.random() * 0.3, p: Math.random() * 6 });
    cv.addEventListener('pointerdown', onTap);
    resize();
  }
  function resize() {
    if (!cv) return;
    const r = cv.parentElement.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = Math.max(1, r.width); ch = Math.max(1, r.height);
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
    sc = Math.max(cw / W, ch / H * 0.0 + cw / W); // fit by width
    if (H * sc < ch) sc = ch / H;
    ox = (cw - W * sc) / 2; oy = Math.min(0, (ch - H * sc) * 0.65);
    bgCv = fgCv = null;
  }
  function onTap(e) {
    const r = cv.getBoundingClientRect();
    const x = ((e.clientX - r.left) - ox) / sc, y = ((e.clientY - r.top) - oy) / sc;
    let best = null, bd = 1e9;
    for (const id in SPOTS) { const s = SPOTS[id]; const d = Math.hypot(x - s.x, y - (s.y - 34)); if (d < 44 && d < bd) { bd = d; best = id; } }
    if (tapCb) tapCb(best);
  }
  function spawnPuff(x, y, n, col, spread) {
    for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - 0.5) * (spread || 60), vy: -20 - Math.random() * 60, g: 90, life: 0.8 + Math.random() * 0.6, age: 0, r: 3 + Math.random() * 5, col: col || '#f3e6c8', type: 'dust' });
  }
  function build(id) {
    popT[id] = t; const s = SPOTS[id];
    spawnPuff(s.x, s.y - 4, 26, '#f3e6c8', 140);
    for (let i = 0; i < 16; i++) parts.push({ x: s.x, y: s.y - 30, vx: (Math.random() - 0.5) * 200, vy: -80 - Math.random() * 120, g: 260, life: 1 + Math.random() * 0.6, age: 0, r: 3 + Math.random() * 3, col: ['#ffd25c', '#ff7f9f', '#7fd0ff', '#9cf08a'][i % 4], type: 'star' });
  }

  /* ---------- frame ---------- */
  function render(now) {
    if (!cv || cw === 0) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; t += dt;
    const c = ctx; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const hour = hourNow(); const sky = skyAt(hour); const n = sky[3];
    // background (full canvas)
    c.fillStyle = lg(c, 0, 0, 0, oy + 300 * sc, [[0, sky[0]], [0.55, sky[1]], [1, sky[2]]]); c.fillRect(0, 0, cw, ch);
    c.save(); c.translate(ox, oy); c.scale(sc, sc);
    drawSky(c, hour, n, dt);
    drawLand(c, n, dt);
    c.restore();
    // ambient darkness
    if (n > 0.02) {
      c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = mixc('#ffffff', '#6672b8', n); c.fillRect(0, 0, cw, ch); c.restore();
      c.save(); c.translate(ox, oy); c.scale(sc, sc); c.globalCompositeOperation = 'lighter'; drawGlows(c, n); c.restore();
    }
    c.save(); c.translate(ox, oy); c.scale(sc, sc); drawParticles(c, dt, n); drawPlots(c, n); c.restore();
  }

  function drawSky(c, hour, n, dt) {
    // stars
    if (n > 0.3) { c.fillStyle = '#fff'; for (let i = 0; i < 50; i++) { const x = (i * 97.3) % W, y = (i * 53.7) % 210; c.globalAlpha = (n - 0.3) * (0.5 + 0.5 * Math.sin(t * 2 + i)); c.fillRect(x, y, 1.6, 1.6); } c.globalAlpha = 1; }
    // sun / moon
    const dayK = (hour - 6) / 14; // 6..20
    if (dayK > -0.05 && dayK < 1.05) {
      const a = Math.PI * (1 - Math.max(0, Math.min(1, dayK))), sx = 200 - Math.cos(a) * -170, sy = 250 - Math.sin(a) * 200;
      const warm = 1 - Math.sin(Math.max(0, Math.min(1, dayK)) * Math.PI);
      const g = c.createRadialGradient(sx, sy, 6, sx, sy, 70); g.addColorStop(0, 'rgba(255,240,170,.8)'); g.addColorStop(1, 'rgba(255,240,170,0)'); c.fillStyle = g; c.fillRect(sx - 70, sy - 70, 140, 140);
      c.beginPath(); c.arc(sx, sy, 22, 0, TAU); c.fillStyle = mixc('#fff6b8', '#ff9a4a', warm); c.fill();
    } else {
      const k = hour >= 20 ? (hour - 20) / 10 : (hour + 4) / 10, a = Math.PI * (1 - Math.max(0, Math.min(1, k))), mx = 200 + Math.cos(a) * -170, my = 250 - Math.sin(a) * 190;
      const g = c.createRadialGradient(mx, my, 6, mx, my, 56); g.addColorStop(0, 'rgba(210,225,255,.6)'); g.addColorStop(1, 'rgba(210,225,255,0)'); c.fillStyle = g; c.fillRect(mx - 56, my - 56, 112, 112);
      c.beginPath(); c.arc(mx, my, 17, 0, TAU); c.fillStyle = '#f4f6ff'; c.fill(); c.beginPath(); c.arc(mx + 6, my - 3, 15, 0, TAU); c.fillStyle = mixc('#2a3a82', '#46589a', 0.5); c.globalAlpha = 0.0; c.fill(); c.globalAlpha = 1;
      c.fillStyle = 'rgba(180,190,220,.5)'; for (const [dx, dy, r] of [[-5, -4, 3], [4, 4, 2.4], [-3, 6, 1.8]]) { c.beginPath(); c.arc(mx + dx, my + dy, r, 0, TAU); c.fill(); }
    }
    // clouds
    for (const cl of clouds) {
      cl.x += cl.v * dt; if (cl.x > W + 70) cl.x = -70;
      c.save(); c.translate(cl.x, cl.y); c.scale(cl.s, cl.s); c.fillStyle = n > 0.5 ? 'rgba(190,200,235,.55)' : 'rgba(255,255,255,.88)';
      for (const [x, y, r] of [[-22, 4, 14], [-6, -4, 18], [14, 0, 16], [30, 6, 11], [0, 8, 14]]) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
      c.restore();
    }
    // birds
    if (n < 0.6) for (const b of birds) {
      b.x += b.v * dt; if (b.x > W + 20) { b.x = -20; b.y = 60 + Math.random() * 90; }
      const fl = Math.sin(t * 8 + b.p) * 4; c.strokeStyle = 'rgba(40,50,70,.8)'; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(b.x - 7, b.y - fl); c.quadraticCurveTo(b.x - 3, b.y - 3, b.x, b.y); c.quadraticCurveTo(b.x + 3, b.y - 3, b.x + 7, b.y - fl); c.stroke();
    }
  }

  /* static layers are cached to offscreen canvases (rebuilt on resize) – big FPS win on low-end devices */
  let bgCv = null, fgCv = null;
  function paintBack(c) {
    const mt = (col1, col2, pts) => { c.beginPath(); c.moveTo(0, 290); for (let i = 0; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.lineTo(W, 290); c.closePath(); c.fillStyle = lg(c, 0, 150, 0, 290, [[0, col1], [1, col2]]); c.fill(); };
    mt('#8fa6c8', '#b9cbe0', [0, 250, 40, 205, 90, 170, 130, 215, 170, 190, 230, 150, 290, 205, 340, 180, 400, 220]);
    c.fillStyle = 'rgba(255,255,255,.85)'; for (const [x, y] of [[90, 170], [230, 150], [340, 180]]) { c.beginPath(); c.moveTo(x, y); c.lineTo(x - 14, y + 20); c.lineTo(x - 5, y + 16); c.lineTo(x, y + 24); c.lineTo(x + 6, y + 15); c.lineTo(x + 14, y + 20); c.closePath(); c.fill(); }
    mt('#5f8f7c', '#8cb8a0', [0, 262, 50, 228, 110, 246, 170, 220, 240, 250, 300, 226, 360, 248, 400, 232]);
    for (let x = -4; x < W + 8; x += 11) drawTree(c, x, 292, 0.52, 0);
    c.beginPath(); c.rect(0, 280, W, 180); c.fillStyle = lg(c, 0, 280, 0, 460, [[0, '#6fc6e8'], [0.5, '#3fa3d8'], [1, '#2a82c0']]); c.fill();
  }
  function paintFront(c) {
    c.beginPath(); c.moveTo(0, 384); c.bezierCurveTo(70, 372, 150, 398, 232, 408); c.bezierCurveTo(250, 452, 340, 462, W, 448); c.lineTo(W, H); c.lineTo(0, H); c.closePath();
    c.fillStyle = lg(c, 0, 380, 0, H, [[0, '#8fd45a'], [0.4, '#6cc152'], [1, '#4aa046']]); c.fill();
    c.strokeStyle = 'rgba(255,255,230,.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 384); c.bezierCurveTo(70, 372, 150, 398, 232, 408); c.bezierCurveTo(250, 452, 340, 462, W, 448); c.stroke();
    c.beginPath(); c.moveTo(60, 470); c.bezierCurveTo(140, 470, 130, 520, 200, 540); c.bezierCurveTo(260, 556, 290, 580, 330, 600); c.lineTo(350, 590); c.bezierCurveTo(300, 556, 280, 520, 210, 502); c.bezierCurveTo(160, 488, 150, 456, 70, 452); c.closePath(); c.fillStyle = 'rgba(240,215,160,.55)'; c.fill();
    for (let i = 0; i < 40; i++) { const x = (i * 83.7) % W, y = 470 + (i * 47.3) % 200; c.strokeStyle = 'rgba(40,110,40,.4)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 2, y - 5); c.moveTo(x, y); c.lineTo(x + 2, y - 5); c.stroke(); }
  }
  function buildCache() {
    const mk = (fn) => { const o = document.createElement('canvas'); o.width = Math.ceil(W * sc * dpr); o.height = Math.ceil(H * sc * dpr); const x = o.getContext('2d'); x.scale(sc * dpr, sc * dpr); fn(x); return o; };
    bgCv = mk(paintBack); fgCv = mk(paintFront);
  }

  function drawLand(c, n, dt) {
    if (!bgCv) buildCache();
    c.drawImage(bgCv, 0, 0, W, H);
    // animated lake surface
    const lakeTop = 280;
    c.save(); c.beginPath(); c.rect(0, lakeTop, W, 180); c.clip();
    for (let i = 0; i < 16; i++) {
      const y = lakeTop + 8 + i * 9.5, amp = 3 + i * 0.35; c.beginPath();
      for (let x = 0; x <= W; x += 16) { const yy = y + Math.sin(x * 0.045 + t * (1 + i * 0.05) + i) * amp * 0.5; if (x === 0) c.moveTo(x, yy); else c.lineTo(x, yy); }
      c.strokeStyle = 'rgba(255,255,255,' + (0.14 + (i % 3) * 0.05) + ')'; c.lineWidth = 1.4; c.stroke();
    }
    if (n < 0.5) { c.fillStyle = 'rgba(255,255,230,.5)'; for (let i = 0; i < 18; i++) { const x = 130 + ((i * 37) % 140), y = lakeTop + 10 + ((i * 23) % 120); c.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(t * 2 + i)); c.fillRect(x, y, 6 + (i % 3) * 3, 1.6); } c.globalAlpha = 1; }
    c.restore();
    // jumping fish
    nextJump -= dt; if (nextJump < 0 && !jump) { jump = { x: 90 + Math.random() * 200, y: 380 + Math.random() * 40, t: 0 }; }
    if (jump) { jump.t += dt; const k = jump.t / 0.9; if (k >= 1) { jump = null; nextJump = 4 + Math.random() * 6; } else { const px = jump.x + k * 40, py = jump.y - Math.sin(k * Math.PI) * 36; c.save(); c.translate(px, py); c.rotate((k - 0.5) * 2.6); c.scale(0.4, 0.4); c.beginPath(); c.ellipse(0, 0, 18, 8, 0, 0, TAU); c.fillStyle = '#ffb347'; c.fill(); c.beginPath(); c.moveTo(16, 0); c.lineTo(28, -8); c.lineTo(28, 8); c.fill(); c.restore(); if (k < 0.08 || k > 0.92) spawnRing(jump.x + k * 40, jump.y); } }
    drawSpot(c, 'lighthouse', n); drawSpot(c, 'boat', n);
    c.drawImage(fgCv, 0, 0, W, H);
    for (const [x, y, s] of [[-6, 470, 1.15], [18, 560, 1.3], [392, 500, 1.2], [376, 590, 1.35], [14, 650, 1.1], [400, 664, 1.1]]) drawTree(c, x, y, s, Math.sin(t * 0.9 + x) * 0.015);
    for (const id of ['pier', 'cabin', 'diner', 'spa', 'campfire', 'garden']) drawSpot(c, id, n);
  }

  function drawSpot(c, id, n) {
    const sp = SPOTS[id]; const isB = built[id];
    c.save(); c.translate(sp.x, sp.y);
    if (!isB) { c.globalAlpha = 0.2; }
    else if (popT[id] != null && t - popT[id] < 0.9) {
      const k = (t - popT[id]) / 0.9, e = k < 1 ? 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2) : 1;
      c.scale(0.6 + e * 0.4, e); c.globalAlpha = Math.min(1, k * 3);
    }
    if (id === 'boat') { const bob = Math.sin(t * 1.3) * 1.6; c.translate(0, bob); }
    S[id](c, n, t);
    c.restore();
    if (id === 'boat' && isB) { c.save(); c.translate(sp.x, sp.y + 10); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(0, 0, 38 + Math.sin(t * 1.3) * 2, 5, 0, 0, TAU); c.stroke(); c.restore(); }
  }

  function drawPlots(c, n) {
    for (const b of BUILDS) {
      const id = b.id, sp = SPOTS[id]; if (built[id]) continue;
      const afford = stars >= b.cost, cx = sp.x, cy = sp.y - 34 + Math.sin(t * 2.2 + sp.x) * 3;
      const sel = selected === id;
      // dashed plot
      c.save(); c.translate(sp.x, sp.y); c.strokeStyle = afford ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.55)'; c.setLineDash([6, 5]); c.lineDashOffset = -t * 12; c.lineWidth = 2;
      c.beginPath(); c.ellipse(0, 0, 44, 11, 0, 0, TAU); c.stroke(); c.setLineDash([]); c.restore();
      // bubble
      const r = sel ? 21 : 18;
      if (afford) { const g = c.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 2.1); g.addColorStop(0, 'rgba(255,240,140,' + (0.55 + 0.25 * Math.sin(t * 4)) + ')'); g.addColorStop(1, 'rgba(255,240,140,0)'); c.fillStyle = g; c.fillRect(cx - r * 2.2, cy - r * 2.2, r * 4.4, r * 4.4); }
      c.beginPath(); c.arc(cx, cy, r, 0, TAU); fs(c, lg(c, 0, cy - r, 0, cy + r, afford ? [[0, '#fff6c0'], [1, '#ffc93c']] : [[0, '#ffffff'], [1, '#d5dde6']]), afford ? '#d98a10' : 'rgba(90,110,130,.8)', 2.4);
      c.drawImage(starIcon(), cx - 9, cy - 15, 13, 13);
      c.fillStyle = afford ? '#7a4a00' : '#5b6578'; c.font = '800 11px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(b.cost), cx + 1, cy + 8);
      c.beginPath(); c.moveTo(cx - 5, cy + r - 1); c.lineTo(cx, cy + r + 6); c.lineTo(cx + 5, cy + r - 1); c.fillStyle = afford ? '#ffc93c' : '#d5dde6'; c.fill();
    }
    // selected marker on built spots
    if (selected && built[selected]) { const sp = SPOTS[selected]; c.save(); c.translate(sp.x, sp.y - 90 + Math.sin(t * 4) * 3); c.beginPath(); c.moveTo(-8, 0); c.lineTo(0, 10); c.lineTo(8, 0); c.closePath(); fs(c, '#ffd25c', '#a86a00', 2); c.restore(); }
  }
  let _star = null;
  function starIcon() { if (!_star) _star = Art.icon('star', 26); return _star; }

  function drawGlows(c, n) {
    const glow = (x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, col.replace('A', a * n)); g.addColorStop(1, col.replace('A', 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
    if (built.cabin) { glow(SPOTS.cabin.x - 22, SPOTS.cabin.y - 22, 34, 'rgba(255,200,90,A)', 0.8); glow(SPOTS.cabin.x + 22, SPOTS.cabin.y - 22, 34, 'rgba(255,200,90,A)', 0.8); }
    if (built.diner) { glow(SPOTS.diner.x - 20, SPOTS.diner.y - 18, 40, 'rgba(255,200,90,A)', 0.8); glow(SPOTS.diner.x, SPOTS.diner.y - 54, 50, 'rgba(255,90,200,A)', 0.4); }
    if (built.campfire) glow(SPOTS.campfire.x + 22, SPOTS.campfire.y - 14, 90 + Math.sin(t * 9) * 5, 'rgba(255,150,50,A)', 1);
    if (built.pier) glow(SPOTS.pier.x + 58, SPOTS.pier.y - 58, 46, 'rgba(255,220,110,A)', 0.9);
    if (built.lighthouse) {
      const sp = SPOTS.lighthouse; glow(sp.x, sp.y - 100, 40, 'rgba(255,240,150,A)', 1);
      const a = t * 0.9; c.save(); c.translate(sp.x, sp.y - 99); for (let k = 0; k < 2; k++) { const aa = a + k * Math.PI; const dirx = Math.cos(aa), vis = Math.abs(dirx); c.beginPath(); c.moveTo(0, 0); c.lineTo(dirx * 260, -26 * vis - 8); c.lineTo(dirx * 260, 26 * vis + 8); c.closePath(); const g = c.createLinearGradient(0, 0, dirx * 260, 0); g.addColorStop(0, 'rgba(255,250,190,' + 0.5 * n * vis + ')'); g.addColorStop(1, 'rgba(255,250,190,0)'); c.fillStyle = g; c.fill(); } c.restore();
    }
    if (built.spa) glow(SPOTS.spa.x, SPOTS.spa.y - 34, 40, 'rgba(120,220,255,A)', 0.4);
  }

  function spawnRing(x, y) { parts.push({ x, y, vx: 0, vy: 0, g: 0, life: 1, age: 0, r: 2, col: '#fff', type: 'ring' }); }

  function drawParticles(c, dt, n) {
    // ambient emitters
    if (built.cabin && Math.random() < dt * 5) parts.push({ x: SPOTS.cabin.x + 23, y: SPOTS.cabin.y - 86, vx: 6 + Math.random() * 6, vy: -16 - Math.random() * 8, g: -1, life: 2.4, age: 0, r: 3, col: n > 0.5 ? '#aab4d0' : '#eef1f6', type: 'smoke' });
    if (built.campfire && Math.random() < dt * 14) parts.push({ x: SPOTS.campfire.x + 22 + (Math.random() - 0.5) * 8, y: SPOTS.campfire.y - 28, vx: (Math.random() - 0.5) * 20, vy: -40 - Math.random() * 40, g: -10, life: 1 + Math.random(), age: 0, r: 1.4, col: '#ffb040', type: 'spark' });
    if (built.spa && Math.random() < dt * 4) parts.push({ x: SPOTS.spa.x + (Math.random() - 0.5) * 40, y: SPOTS.spa.y - 38, vx: (Math.random() - 0.5) * 6, vy: -14 - Math.random() * 10, g: -1, life: 2, age: 0, r: 4, col: '#ffffff', type: 'smoke' });
    if (built.diner && Math.random() < dt * 1.5) parts.push({ x: SPOTS.diner.x + 50, y: SPOTS.diner.y - 36, vx: 0, vy: -12, g: -1, life: 1.8, age: 0, r: 2.6, col: '#fff', type: 'smoke' });
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.age += dt; if (p.age >= p.life) { parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; const k = p.age / p.life;
      if (p.type === 'smoke') { c.globalAlpha = 0.5 * (1 - k); c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, p.r + k * 10, 0, TAU); c.fill(); }
      else if (p.type === 'spark') { c.globalAlpha = 1 - k; c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); }
      else if (p.type === 'dust') { c.globalAlpha = 0.8 * (1 - k); c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, p.r * (1 + k), 0, TAU); c.fill(); }
      else if (p.type === 'star') { c.globalAlpha = 1 - k * k; Art.star(c, p.x, p.y, p.r * 1.6, p.r * 0.7, p.col, k * 6); }
      else if (p.type === 'ring') { c.globalAlpha = 0.6 * (1 - k); c.strokeStyle = '#fff'; c.lineWidth = 1.4; c.beginPath(); c.ellipse(p.x, p.y, 3 + k * 16, 1 + k * 5, 0, 0, TAU); c.stroke(); }
      c.globalAlpha = 1;
    }
    // fireflies at night / butterflies by day
    for (const f of flies) {
      f.p += dt * f.s; const x = f.x + Math.sin(f.p * 1.3) * 24, y = f.y + Math.cos(f.p * 0.9) * 16;
      if (n > 0.4) { const a = (0.4 + 0.6 * Math.abs(Math.sin(f.p * 2))) * n; c.fillStyle = 'rgba(220,255,120,' + a + ')'; c.beginPath(); c.arc(x, y, 1.8, 0, TAU); c.fill(); c.fillStyle = 'rgba(220,255,120,' + a * 0.25 + ')'; c.beginPath(); c.arc(x, y, 5, 0, TAU); c.fill(); }
      else if (built.garden && f.s > 0.9) { const w = Math.abs(Math.sin(t * 14 + f.p)) * 4; c.fillStyle = ['#ff8ac0', '#ffd25c', '#8ad0ff'][Math.floor(f.p) % 3]; c.beginPath(); c.ellipse(x - 2, y, w + 1, 3, 0, 0, TAU); c.ellipse(x + 2, y, w + 1, 3, 0, 0, TAU); c.fill(); }
    }
  }

  return {
    init, resize, render, build, SPOTS,
    setBuilt(b) { built = Object.assign({}, b); },
    setStars(s) { stars = s; },
    select(id) { selected = id; },
    onTap(cb) { tapCb = cb; },
    cycleTime() { const h = hourNow(); timeOverride = h < 8 ? 12 : h < 17 ? 19.2 : h < 21 ? 23 : 7; return timeOverride; },
    clearTime() { timeOverride = null; },
    isNight() { return skyAt(hourNow())[3] > 0.5; }
  };
})();
