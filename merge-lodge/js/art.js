'use strict';
/* ===== Procedural vector art for items, producers, guests (100x100 design space) ===== */
const Art = (() => {
  const TAU = Math.PI * 2;
  const OUT = 'rgba(70,40,25,.9)';

  /* ---------- helpers ---------- */
  function rr(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function lg(c, x0, y0, x1, y1, stops) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    for (let i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    return g;
  }
  function rg(c, x, y, r0, r1, stops) {
    const g = c.createRadialGradient(x, y, r0, x, y, r1);
    for (let i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    return g;
  }
  function fs(c, fill, stroke, lw) {
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke !== false) { c.strokeStyle = stroke || OUT; c.lineWidth = lw || 2.4; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
  }
  function ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); }
  function poly(c, pts) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); }
  function shadow(c, w) { ell(c, 50, 89, w || 29, 6); c.fillStyle = 'rgba(30,20,10,.26)'; c.fill(); }
  function shine(c, x, y, rx, ry, rot, a) { ell(c, x, y, rx, ry, rot); c.fillStyle = 'rgba(255,255,255,' + (a || 0.55) + ')'; c.fill(); }
  function line(c, x0, y0, x1, y1, col, lw) { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.stroke(); }
  function leaf(c, x, y, len, ang, col) {
    c.save(); c.translate(x, y); c.rotate(ang);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.5, -len * 0.45, len, 0); c.quadraticCurveTo(len * 0.5, len * 0.45, 0, 0);
    fs(c, lg(c, 0, -len * 0.4, len, len * 0.4, [[0, lighten(col, 35)], [1, col]]), 'rgba(30,70,30,.8)', 1.8);
    c.restore();
  }
  function lighten(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (n >> 16) + amt), g = Math.min(255, ((n >> 8) & 255) + amt), b = Math.min(255, (n & 255) + amt);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  function star(c, x, y, R, r, col, rot) {
    c.beginPath();
    for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5 - Math.PI / 2, rad = i % 2 ? r : R; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
    c.closePath(); fs(c, col, 'rgba(120,70,0,.8)', 1.6);
  }
  function woodGrain(c, x, y, w, h, n) {
    c.strokeStyle = 'rgba(90,50,20,.35)'; c.lineWidth = 1.2;
    for (let i = 1; i <= n; i++) { c.beginPath(); c.moveTo(x + 2, y + (h * i) / (n + 1)); c.bezierCurveTo(x + w * 0.3, y + (h * i) / (n + 1) - 2, x + w * 0.6, y + (h * i) / (n + 1) + 2, x + w - 2, y + (h * i) / (n + 1)); c.stroke(); }
  }
  const WOODC = [[0, '#e8b774'], [1, '#b9763a']];

  /* ---------- TIMBER ---------- */
  function w1(c) {
    shadow(c, 26);
    line(c, 24, 76, 74, 26, '#6b3f1f', 11); line(c, 24, 76, 74, 26, '#a8683a', 7); line(c, 22, 78, 40, 60, '#8a5128', 2);
    line(c, 50, 52, 76, 58, '#6b3f1f', 8); line(c, 50, 52, 76, 58, '#a8683a', 4.5);
    line(c, 40, 62, 24, 50, '#6b3f1f', 7); line(c, 40, 62, 24, 50, '#a8683a', 4);
    leaf(c, 74, 28, 20, -0.9, '#5cb34a'); leaf(c, 74, 28, 18, 0.1, '#79cc5a'); leaf(c, 76, 58, 16, 0.5, '#5cb34a'); leaf(c, 24, 50, 14, -2.4, '#6cc152');
  }
  function w2(c) {
    shadow(c, 32);
    rr(c, 18, 40, 62, 38, 8); fs(c, lg(c, 0, 40, 0, 78, [[0, '#b97a43'], [0.6, '#8f5528'], [1, '#6d3f1d']]));
    c.strokeStyle = 'rgba(60,30,10,.4)'; c.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(26 + i * 14, 44); c.quadraticCurveTo(30 + i * 14, 58, 26 + i * 14, 74); c.stroke(); }
    ell(c, 80, 59, 10, 19); fs(c, rg(c, 80, 59, 1, 19, [[0, '#f6d9a0'], [1, '#d9a45e']]));
    ell(c, 80, 59, 6.5, 12.5); c.strokeStyle = 'rgba(140,85,35,.7)'; c.lineWidth = 1.4; c.stroke();
    ell(c, 80, 59, 2.8, 5.5); c.stroke();
    shine(c, 40, 47, 14, 3, -0.05, 0.3);
    leaf(c, 24, 42, 14, -2.4, '#6cc152');
  }
  function w3(c) {
    shadow(c, 32);
    const plank = (x, y, a, col) => { c.save(); c.translate(x, y); c.rotate(a); rr(c, -30, -8, 60, 16, 3); fs(c, lg(c, 0, -8, 0, 8, col)); woodGrain(c, -30, -8, 60, 16, 2); c.fillStyle = '#7d7d86'; for (const nx of [-24, 24]) { c.beginPath(); c.arc(nx, 0, 1.8, 0, TAU); c.fill(); } c.restore(); };
    plank(50, 72, 0, [[0, '#dca86a'], [1, '#b87a40']]);
    plank(50, 56, -0.05, [[0, '#e8b774'], [1, '#c58a4b']]);
    plank(52, 40, 0.07, [[0, '#f0c387'], [1, '#c98f50']]);
  }
  function w4(c) {
    shadow(c, 34);
    const beam = (x, y, w, col) => { rr(c, x, y, w, 15, 3); fs(c, lg(c, 0, y, 0, y + 15, col)); woodGrain(c, x, y, w, 15, 1); ell(c, x + w, y + 7.5, 4, 7.5); fs(c, '#f0cd92', 'rgba(110,60,20,.7)', 1.6); };
    beam(16, 70, 58, [[0, '#c98a4b'], [1, '#9a5d2c']]);
    beam(22, 55, 58, [[0, '#d99a58'], [1, '#aa6c36']]);
    beam(14, 40, 58, [[0, '#e8b070'], [1, '#b87b3f']]);
    c.strokeStyle = '#c7c9d1'; c.lineWidth = 4; c.lineCap = 'round'; line(c, 20, 38, 78, 44, '#9aa0ad', 5); line(c, 20, 38, 78, 44, '#d9dce4', 2.5);
    c.fillStyle = '#d6a64a'; rr(c, 44, 36, 14, 12, 3); fs(c, '#e8c15f', 'rgba(110,70,10,.8)', 1.6);
  }
  function w5(c) {
    shadow(c, 31);
    rr(c, 18, 28, 64, 58, 5); fs(c, lg(c, 0, 28, 0, 86, [[0, '#d9a05d'], [1, '#a9692f']]));
    c.strokeStyle = 'rgba(80,45,15,.55)'; c.lineWidth = 2;
    for (const y of [43, 58, 72]) { c.beginPath(); c.moveTo(19, y); c.lineTo(81, y); c.stroke(); }
    rr(c, 18, 28, 64, 10, 3); fs(c, '#c98a4b'); rr(c, 18, 78, 64, 8, 3); fs(c, '#c98a4b');
    rr(c, 20, 38, 10, 40, 2); fs(c, '#b97b40', 'rgba(80,45,15,.6)', 1.5); rr(c, 70, 38, 10, 40, 2); fs(c, '#b97b40', 'rgba(80,45,15,.6)', 1.5);
    line(c, 30, 40, 70, 76, '#8a5226', 6); line(c, 30, 40, 70, 76, '#c58a4b', 3.5);
    line(c, 70, 40, 30, 76, '#8a5226', 6); line(c, 70, 40, 30, 76, '#c58a4b', 3.5);
    c.fillStyle = '#8b8e98'; for (const [x, y] of [[24, 33], [76, 33], [24, 82], [76, 82]]) { c.beginPath(); c.arc(x, y, 2, 0, TAU); c.fill(); }
    shine(c, 36, 33, 12, 2.5, 0, 0.35);
  }
  function w6(c) {
    shadow(c, 22);
    rr(c, 46, 62, 8, 24, 2); fs(c, '#8a5a2c');
    ell(c, 50, 86, 12, 3.5); fs(c, '#7a4e24', false);
    poly(c, [26, 36, 74, 36, 74, 70, 26, 70]); fs(c, lg(c, 26, 0, 74, 0, [[0, '#7fc4d6'], [0.5, '#5fa9bf'], [1, '#4a8ea8']]));
    c.strokeStyle = 'rgba(30,70,90,.35)'; c.lineWidth = 1.2; for (const x of [38, 50, 62]) { c.beginPath(); c.moveTo(x, 37); c.lineTo(x, 69); c.stroke(); }
    poly(c, [20, 38, 50, 12, 80, 38]); fs(c, lg(c, 0, 12, 0, 38, [[0, '#e8605a'], [1, '#c23e3c']]));
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(34, 26); c.lineTo(66, 26); c.stroke();
    ell(c, 50, 52, 8, 8.5); fs(c, '#2c2018', 'rgba(50,30,15,.9)', 1.6);
    rr(c, 40, 66, 20, 4, 2); fs(c, '#a8683a', 'rgba(70,40,20,.8)', 1.4);
    c.beginPath(); c.arc(50, 8, 3, 0, TAU); fs(c, '#ffd25c', 'rgba(120,70,0,.8)', 1.4);
  }
  function w7(c) {
    shadow(c, 38);
    rr(c, 62, 14, 11, 26, 2); fs(c, lg(c, 62, 0, 73, 0, [[0, '#a5a5ad'], [1, '#7c7c86']]));
    rr(c, 14, 44, 72, 42, 4); fs(c, lg(c, 0, 44, 0, 86, [[0, '#d9a05d'], [1, '#a9692f']]));
    c.strokeStyle = 'rgba(70,35,10,.5)'; c.lineWidth = 1.8; for (const y of [54, 64, 74]) { c.beginPath(); c.moveTo(15, y); c.lineTo(85, y); c.stroke(); }
    for (const y of [49, 59, 69, 79]) { ell(c, 14, y, 3.2, 4.4); fs(c, '#e3b678', 'rgba(70,35,10,.7)', 1.2); ell(c, 86, y, 3.2, 4.4); fs(c, '#e3b678', 'rgba(70,35,10,.7)', 1.2); }
    poly(c, [6, 48, 50, 10, 94, 48]); fs(c, lg(c, 0, 10, 0, 48, [[0, '#e8605a'], [1, '#b8322f']]));
    c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(24, 40); c.lineTo(50, 18); c.stroke();
    rr(c, 40, 58, 20, 28, 9); fs(c, lg(c, 0, 58, 0, 86, [[0, '#7a4a25'], [1, '#52301a']]));
    ell(c, 56, 74, 1.8, 1.8); fs(c, '#ffd25c', false);
    rr(c, 18, 56, 15, 15, 2); fs(c, lg(c, 0, 56, 0, 71, [[0, '#ffe9a6'], [1, '#ffc65a']])); line(c, 25.5, 56, 25.5, 71, OUT, 1.4); line(c, 18, 63.5, 33, 63.5, OUT, 1.4);
    rr(c, 67, 56, 15, 15, 2); fs(c, lg(c, 0, 56, 0, 71, [[0, '#ffe9a6'], [1, '#ffc65a']])); line(c, 74.5, 56, 74.5, 71, OUT, 1.4); line(c, 67, 63.5, 82, 63.5, OUT, 1.4);
    ell(c, 50, 36, 5, 5); fs(c, '#ffe9a6');
  }

  /* ---------- FLOWERS ---------- */
  function mound(c) { c.beginPath(); c.moveTo(14, 86); c.quadraticCurveTo(50, 56, 86, 86); c.closePath(); fs(c, lg(c, 0, 62, 0, 86, [[0, '#8a5a35'], [1, '#5e3a20']])); shine(c, 40, 72, 10, 2.5, -0.3, 0.2); }
  function f1(c) {
    shadow(c, 30); mound(c);
    for (const [x, y, a] of [[36, 73, 0.4], [52, 69, -0.3], [64, 76, 0.8]]) { c.save(); c.translate(x, y); c.rotate(a); ell(c, 0, 0, 6, 3.6); fs(c, lg(c, -6, 0, 6, 0, [[0, '#f3e1b0'], [1, '#c9a96a']]), 'rgba(110,80,30,.8)', 1.5); shine(c, -1.5, -1, 2.5, 1, 0, 0.7); c.restore(); }
  }
  function f2(c) {
    shadow(c, 28); mound(c);
    c.strokeStyle = '#4c9a3c'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(50, 70); c.quadraticCurveTo(50, 56, 52, 46); c.stroke();
    leaf(c, 51, 52, 26, -0.4 - 0.5, '#6cc152'); leaf(c, 51, 56, 24, Math.PI + 0.4 + 0.1, '#58b048');
  }
  function f3(c) {
    shadow(c, 26);
    c.strokeStyle = '#3e8c35'; c.lineWidth = 5; c.beginPath(); c.moveTo(50, 86); c.quadraticCurveTo(46, 66, 50, 44); c.stroke();
    leaf(c, 49, 76, 22, -0.7, '#58b048'); leaf(c, 49, 68, 20, Math.PI + 0.7, '#6cc152');
    ell(c, 50, 34, 11, 15); fs(c, lg(c, 38, 20, 62, 48, [[0, '#ffa6c1'], [1, '#e2578a']]));
    c.beginPath(); c.moveTo(50, 20); c.quadraticCurveTo(44, 34, 50, 49); c.strokeStyle = 'rgba(150,40,80,.5)'; c.lineWidth = 1.6; c.stroke();
    leaf(c, 50, 46, 11, Math.PI * 0.85, '#58b048'); leaf(c, 50, 46, 11, Math.PI * 0.15, '#58b048');
    shine(c, 45, 28, 3, 6, 0.2, 0.55);
  }
  function petals(c, x, y, n, len, wid, col1, col2, rot) {
    for (let i = 0; i < n; i++) {
      c.save(); c.translate(x, y); c.rotate(rot + (i * TAU) / n);
      ell(c, 0, -len * 0.75, wid, len * 0.85); fs(c, lg(c, 0, -len * 1.5, 0, 0, [[0, col1], [1, col2]]), 'rgba(110,60,70,.6)', 1.3);
      c.restore();
    }
  }
  function f4(c) {
    shadow(c, 26);
    c.strokeStyle = '#3e8c35'; c.lineWidth = 4.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(50, 88); c.quadraticCurveTo(54, 66, 50, 44); c.stroke();
    leaf(c, 51, 80, 22, -0.9, '#58b048'); leaf(c, 51, 70, 18, Math.PI + 0.9, '#6cc152');
    petals(c, 50, 36, 11, 20, 4.6, '#ffffff', '#e4ecf5', 0.1);
    ell(c, 50, 36, 8.5, 8.5); fs(c, rg(c, 48, 34, 1, 9, [[0, '#ffe98a'], [1, '#f2a91c']]), 'rgba(140,80,0,.8)', 1.5);
    shine(c, 47, 33, 2.5, 1.6, -0.4, 0.8);
  }
  function tulip(c, x, y, s, col1, col2) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.strokeStyle = '#3e8c35'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 50); c.quadraticCurveTo(2, 20, 0, 0); c.stroke();
    leaf(c, 0, 44, 24, -1.15, '#58b048');
    c.beginPath(); c.moveTo(-14, -26); c.quadraticCurveTo(-18, 2, 0, 5); c.quadraticCurveTo(18, 2, 14, -26); c.lineTo(7, -17); c.lineTo(0, -29); c.lineTo(-7, -17); c.closePath();
    fs(c, lg(c, -14, -29, 14, 6, [[0, col1], [1, col2]]), 'rgba(110,30,50,.7)', 1.8);
    c.beginPath(); c.moveTo(0, -29); c.quadraticCurveTo(-3, -10, 0, 5); c.strokeStyle = 'rgba(110,30,50,.4)'; c.lineWidth = 1.4; c.stroke();
    shine(c, -8, -12, 2.6, 7, 0.1, 0.5);
    c.restore();
  }
  function f5(c) { shadow(c, 30); tulip(c, 34, 44, 0.8, '#ffb347', '#f27a1a'); tulip(c, 66, 46, 0.8, '#ff7f9f', '#d63a6a'); tulip(c, 50, 40, 1, '#ff6a6a', '#c9262e'); }
  function f6(c) {
    shadow(c, 26);
    c.save(); c.translate(50, 46); c.rotate(0);
    for (const [x, y, col] of [[-20, 4, '#ffb347'], [20, 4, '#b58cff'], [0, -4, '#ff6a8a']]) { c.strokeStyle = '#3e8c35'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(x * 0.4, 28); c.lineTo(x, y); c.stroke(); }
    c.restore();
    petals(c, 30, 46, 8, 11, 4, '#ffd9a0', '#ffb347', 0.2); ell(c, 30, 46, 4.2, 4.2); fs(c, '#fff2b0', 'rgba(120,70,0,.6)', 1.2);
    petals(c, 70, 46, 8, 11, 4, '#e0ccff', '#b58cff', 0.5); ell(c, 70, 46, 4.2, 4.2); fs(c, '#fff2b0', 'rgba(80,40,120,.6)', 1.2);
    petals(c, 50, 38, 9, 14, 5, '#ffc0d0', '#ff6a8a', 0); ell(c, 50, 38, 5, 5); fs(c, '#ffe98a', 'rgba(130,40,60,.6)', 1.2);
    leaf(c, 50, 52, 20, Math.PI + 0.2, '#58b048'); leaf(c, 50, 52, 20, -0.2, '#58b048');
    poly(c, [32, 54, 68, 54, 58, 86, 42, 86]); fs(c, lg(c, 32, 0, 68, 0, [[0, '#fff8ea'], [1, '#efd9b0']]));
    poly(c, [38, 60, 62, 60, 59, 66, 41, 66]); fs(c, '#e0527a', 'rgba(110,30,50,.7)', 1.2);
    ell(c, 50, 66, 7, 3.4); fs(c, '#ff7ea0', 'rgba(110,30,50,.7)', 1.2);
  }
  function f7(c) {
    shadow(c, 34);
    c.beginPath(); c.arc(50, 50, 10, 0, 0); // noop to keep context clean
    for (const [x, y, s, a, b] of [[28, 38, 0.5, '#ffb347', '#f27a1a'], [72, 38, 0.5, '#ff7f9f', '#d63a6a'], [50, 28, 0.62, '#ff6a6a', '#c9262e']]) tulip(c, x, y + 8, s, a, b);
    petals(c, 36, 46, 8, 9, 3.6, '#ffffff', '#e4ecf5', 0); ell(c, 36, 46, 3.6, 3.6); fs(c, '#ffd25c', 'rgba(120,70,0,.6)', 1);
    petals(c, 64, 46, 8, 9, 3.6, '#e0ccff', '#b58cff', 0.3); ell(c, 64, 46, 3.6, 3.6); fs(c, '#ffd25c', 'rgba(80,40,120,.6)', 1);
    leaf(c, 50, 54, 22, Math.PI + 0.1, '#58b048'); leaf(c, 50, 54, 22, -0.1, '#58b048');
    c.beginPath(); c.moveTo(16, 56); c.quadraticCurveTo(50, 62, 84, 56); c.lineTo(76, 84); c.quadraticCurveTo(50, 92, 24, 84); c.closePath();
    fs(c, lg(c, 0, 56, 0, 90, [[0, '#e8b774'], [1, '#a8683a']]));
    c.strokeStyle = 'rgba(100,55,20,.5)'; c.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(20 + i * 2, 62 + i * 6); c.quadraticCurveTo(50, 68 + i * 6, 80 - i * 2, 62 + i * 6); c.stroke(); }
    for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(24 + i * 10.5, 58); c.lineTo(28 + i * 8.7, 86); c.stroke(); }
    c.beginPath(); c.moveTo(18, 56); c.bezierCurveTo(18, 22, 82, 22, 82, 56); c.strokeStyle = '#8a5226'; c.lineWidth = 3.5; c.stroke();
    c.beginPath(); c.moveTo(18, 56); c.bezierCurveTo(18, 22, 82, 22, 82, 56); c.strokeStyle = '#d99a58'; c.lineWidth = 1.6; c.stroke();
    ell(c, 50, 70, 5, 3); fs(c, '#ff6a8a', 'rgba(110,30,50,.7)', 1);
  }

  /* ---------- TREATS ---------- */
  function strawberry(c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.beginPath(); c.moveTo(0, -18); c.bezierCurveTo(22, -20, 26, 8, 0, 26); c.bezierCurveTo(-26, 8, -22, -20, 0, -18); c.closePath();
    fs(c, rg(c, -6, -6, 2, 30, [[0, '#ff6a6a'], [1, '#c4202c']]), 'rgba(110,15,25,.9)', 2.2 / s);
    c.fillStyle = 'rgba(255,230,140,.95)';
    for (const [sx, sy] of [[-9, -5], [0, -9], [9, -5], [-5, 3], [5, 3], [0, 11], [-10, 9], [10, 9]]) { ell(c, sx, sy, 1.5, 2.2); c.fill(); }
    leaf(c, 0, -18, 14, Math.PI * 1.15, '#58b048'); leaf(c, 0, -18, 14, Math.PI * 1.85, '#58b048'); leaf(c, 0, -18, 12, -Math.PI / 2, '#6cc152');
    shine(c, -11, -8, 3, 6, 0.4, 0.5);
    c.restore();
  }
  function t1(c) { shadow(c, 26); strawberry(c, 50, 56, 1.35); }
  function jar(c, x, y, w, h, col1, col2) {
    rr(c, x, y, w, h, 9); fs(c, lg(c, x, 0, x + w, 0, [[0, 'rgba(230,245,255,.9)'], [0.5, 'rgba(255,255,255,.7)'], [1, 'rgba(200,225,240,.9)']]), 'rgba(80,110,130,.9)', 2.2);
    rr(c, x + 3, y + 10, w - 6, h - 13, 6); fs(c, lg(c, 0, y, 0, y + h, [[0, col1], [1, col2]]), false);
  }
  function t2(c) {
    shadow(c, 26); jar(c, 26, 38, 48, 48, '#ff5a6a', '#a8102c');
    rr(c, 28, 28, 44, 12, 4); fs(c, lg(c, 0, 28, 0, 40, [[0, '#ffe08a'], [1, '#e0a83a']]));
    c.strokeStyle = 'rgba(120,70,10,.6)'; c.lineWidth = 1.3; for (let x = 34; x < 70; x += 6) { c.beginPath(); c.moveTo(x, 29); c.lineTo(x, 39); c.stroke(); }
    rr(c, 32, 50, 36, 22, 4); fs(c, '#fff8e6', 'rgba(110,70,30,.7)', 1.4); strawberry(c, 50, 61, 0.42);
    shine(c, 33, 56, 3, 12, 0, 0.55);
  }
  function t3(c) {
    shadow(c, 27);
    c.beginPath(); c.moveTo(24, 52); c.lineTo(31, 86); c.lineTo(69, 86); c.lineTo(76, 52); c.closePath(); fs(c, lg(c, 0, 52, 0, 86, [[0, '#ffd37a'], [1, '#e0a24a']]));
    c.strokeStyle = 'rgba(150,90,20,.45)'; c.lineWidth = 1.6; for (const x of [34, 42, 50, 58, 66]) { c.beginPath(); c.moveTo(24 + (x - 24) * 0.9 + 1, 56); c.lineTo(x, 85); c.stroke(); }
    c.beginPath(); c.moveTo(18, 52); c.bezierCurveTo(8, 22, 38, 16, 50, 18); c.bezierCurveTo(62, 16, 92, 22, 82, 52); c.quadraticCurveTo(50, 60, 18, 52); fs(c, lg(c, 0, 16, 0, 56, [[0, '#d9a066'], [1, '#a8682c']]));
    c.fillStyle = '#5b5fd1'; for (const [x, y] of [[32, 38], [46, 30], [62, 36], [72, 46], [40, 46], [54, 44]]) { ell(c, x, y, 3, 3); c.fill(); }
    shine(c, 36, 28, 9, 3, -0.4, 0.45);
  }
  function t4(c) {
    shadow(c, 32);
    ell(c, 50, 72, 38, 12); fs(c, lg(c, 0, 62, 0, 84, [[0, '#ffffff'], [1, '#d5dde6']]), 'rgba(90,110,130,.8)', 2);
    ell(c, 50, 72, 29, 8); c.strokeStyle = 'rgba(120,140,160,.5)'; c.lineWidth = 1.2; c.stroke();
    c.beginPath(); c.moveTo(22, 70); c.lineTo(50, 30); c.lineTo(78, 70); c.quadraticCurveTo(50, 80, 22, 70); fs(c, lg(c, 0, 30, 0, 78, [[0, '#e9b172'], [1, '#c58640']]));
    c.beginPath(); c.moveTo(28, 66); c.lineTo(50, 36); c.lineTo(72, 66); c.quadraticCurveTo(50, 74, 28, 66); fs(c, lg(c, 0, 36, 0, 70, [[0, '#d9304e'], [1, '#8f1030']]), false);
    c.fillStyle = 'rgba(255,255,255,.35)'; for (const [x, y] of [[44, 54], [54, 60], [50, 46], [60, 52]]) { ell(c, x, y, 2.2, 1.6); c.fill(); }
    c.beginPath(); c.moveTo(24, 69); c.lineTo(50, 31); c.lineTo(76, 69); c.strokeStyle = 'rgba(255,240,200,.7)'; c.lineWidth = 2; c.stroke();
    shine(c, 41, 56, 2, 8, 0.5, 0.5);
  }
  function t5(c) {
    shadow(c, 34);
    ell(c, 50, 66, 40, 20); fs(c, lg(c, 0, 48, 0, 86, [[0, '#f5f7fa'], [1, '#c9d2dc']]), 'rgba(90,110,130,.8)', 2);
    c.beginPath(); c.ellipse(50, 60, 33, 16, 0, 0, TAU); fs(c, lg(c, 0, 46, 0, 76, [[0, '#e8b774'], [1, '#c58640']]));
    c.beginPath(); c.ellipse(50, 58, 26, 11.5, 0, 0, TAU); fs(c, rg(c, 44, 54, 2, 28, [[0, '#d83a58'], [1, '#8f1030']]), 'rgba(110,20,30,.6)', 1.4);
    c.save(); c.beginPath(); c.ellipse(50, 58, 26, 11.5, 0, 0, TAU); c.clip();
    c.strokeStyle = '#f0c985'; c.lineWidth = 3.4; c.lineCap = 'round';
    for (let i = -3; i <= 3; i++) { line(c, 50 + i * 9 - 14, 40, 50 + i * 9 + 14, 78, '#e8b774', 3.4); line(c, 50 + i * 9 + 14, 40, 50 + i * 9 - 14, 78, '#d9a05e', 3.4); }
    c.restore();
    c.beginPath(); c.ellipse(50, 58, 26, 11.5, 0, 0, TAU); c.strokeStyle = '#b87a38'; c.lineWidth = 2.4; c.stroke();
    // steam
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2.6; c.lineCap = 'round';
    for (const x of [40, 52, 62]) { c.beginPath(); c.moveTo(x, 44); c.bezierCurveTo(x - 6, 36, x + 6, 30, x, 22); c.stroke(); }
  }
  function t6(c) {
    shadow(c, 32);
    ell(c, 50, 84, 36, 6); fs(c, '#f1f3f7', 'rgba(90,110,130,.7)', 1.8);
    rr(c, 20, 56, 60, 26, 8); fs(c, lg(c, 0, 56, 0, 82, [[0, '#d98a5a'], [1, '#a85a30']]));
    rr(c, 24, 40, 52, 22, 8); fs(c, lg(c, 0, 40, 0, 62, [[0, '#ffa0bc'], [1, '#e8628a']]));
    c.beginPath(); c.moveTo(24, 47); for (let x = 24; x <= 76; x += 8.7) c.quadraticCurveTo(x + 2.5, 58, x + 6, 47); c.lineTo(76, 36); c.lineTo(24, 36); c.closePath(); fs(c, '#fff4f8', 'rgba(150,70,100,.6)', 1.6);
    rr(c, 20, 52, 60, 6, 3); fs(c, '#fff4f8', 'rgba(150,70,100,.5)', 1.2);
    c.fillStyle = '#ffd25c'; for (const [x, y] of [[32, 70], [46, 72], [60, 69], [72, 72]]) { ell(c, x, y, 2.4, 1.6); c.fill(); }
    c.beginPath(); c.arc(50, 30, 8, 0, TAU); fs(c, rg(c, 47, 27, 1, 9, [[0, '#ff6a6a'], [1, '#b8102c']]), 'rgba(100,10,20,.9)', 1.8);
    shine(c, 47, 27, 2.2, 1.5, -0.5, 0.9);
    c.beginPath(); c.moveTo(50, 22); c.quadraticCurveTo(54, 12, 62, 12); c.strokeStyle = '#3e8c35'; c.lineWidth = 2.2; c.stroke();
    for (const x of [36, 64]) { rr(c, x - 1.5, 22, 3, 16, 1.5); fs(c, '#fff3b0', 'rgba(150,100,20,.7)', 1); ell(c, x, 20, 2.2, 3.4); fs(c, '#ffb43a', false); }
  }
  function t7(c) {
    shadow(c, 36);
    c.beginPath(); c.moveTo(18, 38); c.bezierCurveTo(18, 6, 82, 6, 82, 38); c.strokeStyle = '#8a5226'; c.lineWidth = 4; c.stroke();
    c.beginPath(); c.moveTo(18, 38); c.bezierCurveTo(18, 6, 82, 6, 82, 38); c.strokeStyle = '#d99a58'; c.lineWidth = 1.8; c.stroke();
    // goodies
    for (let i = 0; i < 4; i++) { rr(c, 26 + i * 12, 24 + (i % 2) * 3, 8, 28, 4); fs(c, i % 2 ? '#ffe3a0' : '#e0a24a', 'rgba(120,70,20,.7)', 1.4); }
    strawberry(c, 62, 34, 0.5); ell(c, 40, 34, 8, 8); fs(c, rg(c, 38, 32, 1, 9, [[0, '#ffd25c'], [1, '#e8941c']]), 'rgba(130,70,0,.8)', 1.4);
    // cloth
    c.beginPath(); c.moveTo(16, 44); c.quadraticCurveTo(50, 52, 84, 44); c.lineTo(88, 52); c.lineTo(12, 52); c.closePath(); fs(c, '#fff8f0', 'rgba(150,70,70,.6)', 1.4);
    c.save(); c.beginPath(); c.moveTo(16, 44); c.quadraticCurveTo(50, 52, 84, 44); c.lineTo(88, 52); c.lineTo(12, 52); c.closePath(); c.clip();
    c.fillStyle = 'rgba(224,60,80,.7)'; for (let x = 12; x < 90; x += 12) c.fillRect(x, 40, 6, 16); c.restore();
    c.beginPath(); c.moveTo(14, 50); c.quadraticCurveTo(50, 58, 86, 50); c.lineTo(78, 84); c.quadraticCurveTo(50, 92, 22, 84); c.closePath();
    fs(c, lg(c, 0, 50, 0, 90, [[0, '#e8b774'], [1, '#a8683a']]));
    c.strokeStyle = 'rgba(100,55,20,.5)'; c.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(18 + i * 2, 58 + i * 7); c.quadraticCurveTo(50, 64 + i * 7, 82 - i * 2, 58 + i * 7); c.stroke(); }
    for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(22 + i * 11.2, 54); c.lineTo(26 + i * 9.6, 86); c.stroke(); }
    rr(c, 44, 60, 12, 9, 2); fs(c, '#ffd25c', 'rgba(130,80,0,.8)', 1.3);
  }

  /* ---------- FISH ---------- */
  function fish(c, o) {
    c.save(); c.translate(o.x || 50, o.y || 52); c.scale(o.s || 1, o.s || 1);
    // tail
    c.beginPath(); c.moveTo(18, 0); c.quadraticCurveTo(30, -4, 36, -16); c.quadraticCurveTo(40, -2, 36, 0); c.quadraticCurveTo(40, 2, 36, 16); c.quadraticCurveTo(30, 4, 18, 0); fs(c, lg(c, 18, 0, 38, 0, [[0, o.fin], [1, o.fin2 || o.fin]]), o.line || 'rgba(20,50,80,.85)', 2);
    // dorsal & belly fins
    c.beginPath(); c.moveTo(-8, -14); c.quadraticCurveTo(4, -26, 16, -12); c.closePath(); fs(c, o.fin, o.line || 'rgba(20,50,80,.85)', 2);
    c.beginPath(); c.moveTo(0, 13); c.quadraticCurveTo(8, 22, 14, 11); c.closePath(); fs(c, o.fin, o.line || 'rgba(20,50,80,.85)', 2);
    // body
    c.beginPath(); c.moveTo(-34, 2); c.bezierCurveTo(-28, -18, 4, -20, 22, 0); c.bezierCurveTo(4, 20, -28, 18, -34, 2); c.closePath();
    fs(c, lg(c, 0, -18, 0, 18, [[0, o.top], [0.55, o.mid], [1, o.belly]]), o.line || 'rgba(20,50,80,.85)', 2.4);
    c.save(); c.clip();
    if (o.stripes) { c.fillStyle = o.stripes; for (const x of [-16, -6, 4]) { c.beginPath(); c.moveTo(x, -20); c.lineTo(x + 5, -20); c.lineTo(x + 2, 8); c.lineTo(x - 3, 8); c.fill(); } }
    if (o.dots) { c.fillStyle = o.dots; for (const [x, y] of [[-12, -7], [-4, -11], [4, -6], [-18, -2], [-8, -2], [2, -2], [8, -9]]) { c.beginPath(); c.arc(x, y, 1.6, 0, TAU); c.fill(); } }
    c.restore();
    // gill, eye
    c.beginPath(); c.arc(-18, 0, 9, -1.1, 1.1); c.strokeStyle = 'rgba(20,50,80,.35)'; c.lineWidth = 1.6; c.stroke();
    c.beginPath(); c.arc(-25, -3, 3.8, 0, TAU); fs(c, '#fff', 'rgba(20,30,50,.9)', 1.3); c.beginPath(); c.arc(-25.6, -3, 1.9, 0, TAU); c.fillStyle = '#111'; c.fill();
    shine(c, -8, -10, 12, 2.2, 0.05, 0.5);
    c.restore();
  }
  function fi1(c) { shadow(c, 24); fish(c, { s: 0.7, x: 50, y: 56, top: '#6d8fb0', mid: '#a8c4dc', belly: '#eef4f8', fin: '#9fb6cc' }); }
  function fi2(c) { shadow(c, 28); fish(c, { s: 0.88, x: 52, y: 54, top: '#3f8f4a', mid: '#8bc56a', belly: '#e8e8a4', fin: '#ff8a3a', stripes: 'rgba(30,80,40,.45)' }); }
  function fi3(c) { shadow(c, 30); fish(c, { s: 1.0, x: 54, y: 54, top: '#6a7f8f', mid: '#b9c8d2', belly: '#f8e9e4', fin: '#8a9eab', dots: 'rgba(40,40,50,.7)' }); }
  function fi4(c) { shadow(c, 32); fish(c, { s: 1.08, x: 54, y: 54, top: '#5c6f86', mid: '#f0846a', belly: '#ffc2a2', fin: '#e8665a', fin2: '#d4504a' }); }
  function fi5(c) {
    shadow(c, 34);
    ell(c, 50, 68, 40, 18); fs(c, lg(c, 0, 52, 0, 86, [[0, '#ffffff'], [1, '#cdd6e0']]), 'rgba(90,110,130,.8)', 2);
    ell(c, 50, 66, 30, 12); c.strokeStyle = 'rgba(120,140,160,.5)'; c.lineWidth = 1.2; c.stroke();
    c.save(); c.translate(0, 8); fish(c, { s: 0.78, x: 52, y: 50, top: '#c58640', mid: '#e8b070', belly: '#f6d9a0', fin: '#c58640', line: 'rgba(100,55,20,.85)' }); c.restore();
    c.strokeStyle = 'rgba(80,40,10,.5)'; c.lineWidth = 1.6; for (const x of [44, 52, 60]) { c.beginPath(); c.moveTo(x, 52); c.lineTo(x + 3, 64); c.stroke(); }
    c.beginPath(); c.arc(76, 62, 8, 0, TAU); fs(c, rg(c, 74, 60, 1, 9, [[0, '#fff3a0'], [1, '#f2c21c']]), 'rgba(140,100,0,.8)', 1.6); c.beginPath(); c.arc(76, 62, 3.4, 0, TAU); c.strokeStyle = 'rgba(140,100,0,.5)'; c.lineWidth = 1.1; c.stroke();
    leaf(c, 20, 62, 12, 3.6, '#58b048'); leaf(c, 22, 66, 10, 2.8, '#6cc152');
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2.4; c.lineCap = 'round'; for (const x of [40, 52, 62]) { c.beginPath(); c.moveTo(x, 40); c.bezierCurveTo(x - 5, 34, x + 5, 28, x, 20); c.stroke(); }
  }
  function fi6(c) {
    shadow(c, 34);
    const shell = (rot, col1, col2) => { c.save(); c.translate(50, 70); c.rotate(rot); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-38, -10, -34, -50, 0, -56); c.bezierCurveTo(34, -50, 38, -10, 0, 0); fs(c, lg(c, -30, -50, 30, 0, [[0, col1], [1, col2]]), 'rgba(120,60,90,.8)', 2.2); c.strokeStyle = 'rgba(150,80,110,.55)'; c.lineWidth = 1.6; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(0, -2); c.quadraticCurveTo(i * 9, -30, i * 11, -52); c.stroke(); } c.restore(); };
    ell(c, 50, 74, 32, 10); fs(c, lg(c, 0, 66, 0, 84, [[0, '#ffc7d8'], [1, '#e08aae']]), 'rgba(120,60,90,.8)', 2);
    ell(c, 50, 72, 26, 7.5); fs(c, '#a8386a', false);
    ell(c, 50, 68, 12, 12); fs(c, rg(c, 46, 64, 1, 13, [[0, '#ffffff'], [0.5, '#f4e8f6'], [1, '#c9a8d8']]), 'rgba(120,80,140,.7)', 1.6);
    shine(c, 46, 63, 3, 2, -0.5, 0.95);
    shell(-0.0, '#ffe2ee', '#f08cb4');
    c.fillStyle = '#fff'; for (const [x, y] of [[26, 38], [74, 34], [30, 74]]) { star(c, x, y, 3.4, 1.2, '#fff', 0); }
  }
  function fi7(c) {
    shadow(c, 34);
    ell(c, 50, 84, 28, 6); fs(c, lg(c, 0, 78, 0, 90, [[0, '#a8683a'], [1, '#6b3f1f']]), 'rgba(60,30,10,.8)', 1.8);
    rr(c, 38, 72, 24, 12, 3); fs(c, lg(c, 0, 72, 0, 84, [[0, '#8a5226'], [1, '#52301a']]), 'rgba(60,30,10,.8)', 1.6);
    c.save(); c.translate(0, -8); fish(c, { s: 1.12, x: 50, y: 52, top: '#e8a21c', mid: '#ffd95c', belly: '#fff3a8', fin: '#ffb42a', fin2: '#e88a1c', line: 'rgba(130,70,0,.9)' }); c.restore();
    star(c, 22, 24, 6, 2.4, '#fff3a8', 0.2); star(c, 80, 30, 5, 2, '#fff3a8', 0.5); star(c, 74, 10, 3.6, 1.5, '#fff', 0);
  }

  /* ---------- CRYSTALS ---------- */
  function gem(c, x, y, s, cols) { // cut gemstone
    c.save(); c.translate(x, y); c.scale(s, s);
    const top = [[-26, -8], [-14, -26], [14, -26], [26, -8]], bot = [0, 28];
    poly(c, [-26, -8, -14, -26, 14, -26, 26, -8, 0, 28]); fs(c, lg(c, -26, -26, 26, 28, [[0, cols[0]], [0.5, cols[1]], [1, cols[2]]]), cols[3], 2.4 / s);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.4 / s;
    c.beginPath(); c.moveTo(-26, -8); c.lineTo(26, -8); c.moveTo(-14, -26); c.lineTo(-7, -8); c.lineTo(0, 28); c.moveTo(14, -26); c.lineTo(7, -8); c.lineTo(0, 28); c.moveTo(-7, -8); c.lineTo(-14, -26); c.stroke();
    poly(c, [-14, -26, 14, -26, 7, -8, -7, -8]); c.fillStyle = 'rgba(255,255,255,.28)'; c.fill();
    poly(c, [-26, -8, -7, -8, 0, 28]); c.fillStyle = 'rgba(255,255,255,.12)'; c.fill();
    poly(c, [26, -8, 7, -8, 0, 28]); c.fillStyle = 'rgba(0,0,0,.14)'; c.fill();
    c.restore();
  }
  function cluster(c, cols, glow) {
    const prism = (x, y, w, h, tilt, k) => { c.save(); c.translate(x, y); c.rotate(tilt); c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w / 2, -h * 0.75); c.lineTo(0, -h); c.lineTo(w / 2, -h * 0.75); c.lineTo(w / 2, 0); c.closePath(); fs(c, lg(c, -w / 2, 0, w / 2, 0, [[0, cols[0]], [0.45, cols[1]], [1, cols[2]]]), cols[3], 2.2); c.beginPath(); c.moveTo(0, -h); c.lineTo(0, 0); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.3; c.stroke(); poly(c, [-w / 2, -h * 0.75, 0, -h, 0, 0, -w / 2, 0]); c.fillStyle = 'rgba(255,255,255,.2)'; c.fill(); c.restore(); };
    ell(c, 50, 84, 34, 10); fs(c, lg(c, 0, 74, 0, 92, [[0, '#8e8e98'], [1, '#5e5e68']]), 'rgba(40,40,50,.8)', 2);
    prism(32, 84, 15, 38, -0.35); prism(68, 84, 15, 36, 0.35); prism(50, 84, 20, 56, 0); prism(41, 85, 13, 30, -0.12); prism(60, 85, 13, 28, 0.15);
    star(c, 74, 22, 5, 2, '#fff', 0.2); star(c, 24, 36, 4, 1.6, '#fff', 0);
  }
  function c1(c) {
    shadow(c, 28);
    for (const [x, y, rx, ry, col, r] of [[34, 70, 17, 12, ['#b8b8c2', '#8a8a96'], -0.2], [62, 72, 19, 13, ['#a6a6b2', '#74747f'], 0.15], [48, 58, 14, 10, ['#c9c9d2', '#9a9aa6'], 0]]) {
      ell(c, x, y, rx, ry, r); fs(c, rg(c, x - 5, y - 5, 1, rx * 1.4, [[0, col[0]], [1, col[1]]]), 'rgba(40,40,52,.85)', 2.2);
      shine(c, x - 5, y - 4, rx * 0.4, ry * 0.25, r, 0.45);
    }
  }
  function c2(c) { shadow(c, 30); cluster(c, ['#eaf6ff', '#ffffff', '#b8d4ea', 'rgba(70,100,130,.85)']); }
  function c3(c) { shadow(c, 30); cluster(c, ['#b58cff', '#8b4fe0', '#5a2aa8', 'rgba(60,20,110,.9)']); }
  function c4(c) { shadow(c, 28); gem(c, 50, 52, 1.35, ['#ffd980', '#ff9f1c', '#c9640a', 'rgba(120,60,0,.9)']); }
  function c5(c) { shadow(c, 28); gem(c, 50, 52, 1.4, ['#7fd0ff', '#2a7fe8', '#14439e', 'rgba(10,40,110,.9)']); }
  function c6(c) { shadow(c, 28); gem(c, 50, 52, 1.5, ['#ff8a9c', '#e0183c', '#8a0a22', 'rgba(100,0,20,.9)']); star(c, 78, 20, 6, 2.4, '#fff', 0.2); star(c, 22, 30, 4, 1.6, '#fff', 0); }
  function c7(c) {
    shadow(c, 34);
    c.beginPath(); c.moveTo(18, 74); c.lineTo(12, 32); c.lineTo(32, 50); c.lineTo(50, 22); c.lineTo(68, 50); c.lineTo(88, 32); c.lineTo(82, 74); c.closePath();
    fs(c, lg(c, 0, 20, 0, 76, [[0, '#fff3a8'], [0.45, '#ffc93c'], [1, '#d98a10']]), 'rgba(120,70,0,.9)', 2.6);
    rr(c, 17, 70, 66, 14, 4); fs(c, lg(c, 0, 70, 0, 84, [[0, '#ffe27a'], [1, '#c9780c']]), 'rgba(120,70,0,.9)', 2.4);
    for (const [x, y, r, col] of [[12, 30, 4.4, '#ff5a7a'], [50, 20, 5.2, '#7fd0ff'], [88, 30, 4.4, '#ff5a7a']]) { c.beginPath(); c.arc(x, y, r, 0, TAU); fs(c, col, 'rgba(70,20,30,.8)', 1.4); }
    gem(c, 50, 55, 0.5, ['#ff8a9c', '#e0183c', '#8a0a22', 'rgba(100,0,20,.9)']);
    gem(c, 30, 76, 0.22, ['#7fd0ff', '#2a7fe8', '#14439e', 'rgba(10,40,110,.9)']); gem(c, 70, 76, 0.22, ['#7fe8a8', '#1cc06a', '#0a7040', 'rgba(0,70,30,.9)']); gem(c, 50, 77, 0.22, ['#d8b0ff', '#8b4fe0', '#5a2aa8', 'rgba(60,20,110,.9)']);
    shine(c, 28, 52, 3, 9, 0.5, 0.45);
    star(c, 82, 14, 5, 2, '#fff', 0.2);
  }

  /* ---------- BONUS items ---------- */
  function coinDraw(c, x, y, r) {
    c.beginPath(); c.arc(x, y, r, 0, TAU); fs(c, lg(c, x - r, y - r, x + r, y + r, [[0, '#fff3a0'], [0.5, '#ffc93c'], [1, '#d98a10']]), 'rgba(130,70,0,.9)', 2.2);
    c.beginPath(); c.arc(x, y, r * 0.72, 0, TAU); c.strokeStyle = 'rgba(160,90,0,.55)'; c.lineWidth = 1.6; c.stroke();
    star(c, x, y, r * 0.5, r * 0.22, '#fff0a0', 0);
  }
  function b_coin1(c) { shadow(c, 24); coinDraw(c, 50, 56, 24); shine(c, 40, 44, 6, 3, -0.6, 0.6); }
  function b_coin2(c) { shadow(c, 30); coinDraw(c, 36, 68, 18); coinDraw(c, 66, 66, 18); coinDraw(c, 50, 52, 22); shine(c, 42, 42, 5, 2.4, -0.6, 0.6); }
  function b_coin3(c) {
    shadow(c, 32);
    c.beginPath(); c.moveTo(34, 38); c.quadraticCurveTo(14, 54, 16, 74); c.quadraticCurveTo(18, 88, 50, 88); c.quadraticCurveTo(82, 88, 84, 74); c.quadraticCurveTo(86, 54, 66, 38); c.closePath();
    fs(c, lg(c, 0, 38, 0, 88, [[0, '#d9a45e'], [1, '#8f5a28']]));
    c.beginPath(); c.moveTo(34, 38); c.quadraticCurveTo(50, 46, 66, 38); c.lineTo(70, 28); c.quadraticCurveTo(50, 34, 30, 28); c.closePath(); fs(c, '#c98a4b');
    for (const [x, y] of [[40, 26], [52, 22], [62, 27], [46, 30]]) coinDraw(c, x, y, 8);
    rr(c, 36, 36, 28, 5, 2.5); fs(c, '#e8c15f', 'rgba(100,60,10,.8)', 1.3);
    coinDraw(c, 50, 64, 13);
  }
  function b_gem1(c) { shadow(c, 24); gem(c, 50, 54, 1.25, ['#9be4ff', '#3aa6ff', '#1560c8', 'rgba(10,50,120,.9)']); star(c, 76, 24, 5, 2, '#fff', 0.2); }
  function b_gem2(c) { shadow(c, 30); gem(c, 30, 66, 0.7, ['#9be4ff', '#3aa6ff', '#1560c8', 'rgba(10,50,120,.9)']); gem(c, 70, 66, 0.7, ['#d8b0ff', '#8b4fe0', '#5a2aa8', 'rgba(60,20,110,.9)']); gem(c, 50, 50, 1, ['#9be4ff', '#3aa6ff', '#1560c8', 'rgba(10,50,120,.9)']); star(c, 78, 20, 5, 2, '#fff', 0.2); }
  function boltDraw(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); poly(c, [4, -26, -14, 4, -2, 4, -8, 28, 14, -6, 2, -6]); fs(c, lg(c, 0, -26, 0, 28, [[0, '#fff7a8'], [1, '#ffb62a']]), 'rgba(120,70,0,.9)', 2.2 / s); c.restore(); }
  function b_energy1(c) { shadow(c, 26); c.beginPath(); c.arc(50, 52, 30, 0, TAU); fs(c, rg(c, 42, 42, 2, 34, [[0, '#9cf08a'], [1, '#2faa4a']]), 'rgba(15,80,30,.9)', 2.4); boltDraw(c, 50, 52, 1); shine(c, 38, 38, 8, 3.5, -0.7, 0.5); }
  function b_energy2(c) { shadow(c, 30); c.beginPath(); c.arc(50, 52, 34, 0, TAU); fs(c, rg(c, 40, 40, 2, 40, [[0, '#b0f6ff'], [1, '#1fa0d8']]), 'rgba(10,60,100,.9)', 2.4); boltDraw(c, 50, 52, 1.3); star(c, 78, 22, 5, 2, '#fff', 0.2); shine(c, 36, 36, 9, 4, -0.7, 0.5); }
  function b_chest(c) {
    shadow(c, 34);
    rr(c, 16, 46, 68, 40, 6); fs(c, lg(c, 0, 46, 0, 86, [[0, '#b9763a'], [1, '#7c4620']]));
    c.beginPath(); c.moveTo(16, 50); c.bezierCurveTo(16, 18, 84, 18, 84, 50); c.closePath(); fs(c, lg(c, 0, 24, 0, 50, [[0, '#d99a58'], [1, '#a8683a']]));
    c.strokeStyle = 'rgba(70,35,10,.45)'; c.lineWidth = 1.4; for (const x of [34, 66]) { c.beginPath(); c.moveTo(x, 50); c.lineTo(x, 85); c.stroke(); }
    rr(c, 14, 44, 72, 9, 3); fs(c, lg(c, 0, 44, 0, 53, [[0, '#ffe27a'], [1, '#d99a1c']]), 'rgba(110,60,0,.9)', 2);
    for (const x of [22, 78]) { rr(c, x - 5, 44, 10, 42, 3); fs(c, lg(c, 0, 44, 0, 86, [[0, '#ffe27a'], [1, '#d99a1c']]), 'rgba(110,60,0,.9)', 2); }
    rr(c, 43, 46, 14, 16, 4); fs(c, lg(c, 0, 46, 0, 62, [[0, '#fff0a0'], [1, '#e8a21c']]), 'rgba(110,60,0,.9)', 2); ell(c, 50, 54, 2.2, 3); fs(c, '#4a2a10', false);
    star(c, 80, 20, 5, 2, '#fff7a8', 0.2);
  }

  /* ---------- PRODUCERS ---------- */
  function plate(c, lvl, col) {
    // glowing base ring marks a tappable producer
    const ring = ['#c98a4b', '#d8dde6', '#ffd25c'][lvl - 1];
    ell(c, 50, 86, 40, 11); fs(c, lg(c, 0, 76, 0, 96, [[0, ring], [1, 'rgba(90,60,30,.9)']]), 'rgba(60,35,15,.85)', 2);
    ell(c, 50, 84, 33, 7.5); c.fillStyle = col || 'rgba(0,0,0,.18)'; c.fill();
  }
  function g_wood(c, lvl) {
    plate(c, lvl, 'rgba(90,60,20,.35)');
    ell(c, 50, 62, 27, 11); c.fillStyle = '#6d3f1d'; c.fill();
    rr(c, 23, 40, 54, 26, 4); fs(c, lg(c, 23, 0, 77, 0, [[0, '#8f5528'], [0.5, '#b9763a'], [1, '#7c4620']]));
    c.strokeStyle = 'rgba(60,30,10,.4)'; c.lineWidth = 1.6; for (const x of [32, 42, 55, 66]) { c.beginPath(); c.moveTo(x, 44); c.quadraticCurveTo(x + 2, 55, x, 64); c.stroke(); }
    ell(c, 50, 40, 27, 11); fs(c, rg(c, 46, 38, 2, 28, [[0, '#f6d9a0'], [1, '#d09a58']]));
    c.strokeStyle = 'rgba(140,85,35,.65)'; c.lineWidth = 1.5; for (const r of [4, 10, 16]) { ell(c, 50, 40, r * 1.6, r * 0.62); c.stroke(); }
    // axe
    c.save(); c.translate(66, 38); c.rotate(0.35); rr(c, -2.5, -26, 5, 38, 2); fs(c, '#a8683a', 'rgba(70,40,20,.9)', 1.6); c.beginPath(); c.moveTo(2, -26); c.quadraticCurveTo(18, -26, 15, -12); c.lineTo(2, -14); c.closePath(); fs(c, lg(c, 0, 0, 18, 0, [[0, '#d9dce4'], [1, '#8c92a0']]), 'rgba(40,40,60,.9)', 1.6); c.restore();
    leaf(c, 30, 38, 14, -2.5, '#6cc152'); leaf(c, 30, 38, 12, -3.6, '#58b048');
  }
  function g_flower(c, lvl) {
    plate(c, lvl, 'rgba(60,90,30,.35)');
    rr(c, 14, 54, 72, 28, 5); fs(c, lg(c, 0, 54, 0, 82, [[0, '#c98a4b'], [1, '#8f5528']]));
    woodGrain(c, 14, 54, 72, 28, 2);
    rr(c, 14, 50, 72, 10, 4); fs(c, '#d9a05d');
    c.beginPath(); c.moveTo(16, 52); c.quadraticCurveTo(50, 40, 84, 52); c.lineTo(84, 56); c.lineTo(16, 56); c.closePath(); fs(c, '#6d3f1d', false);
    for (const [x, y, col] of [[28, 38, '#ff7f9f'], [50, 30, '#ffd25c'], [72, 38, '#b58cff']]) {
      c.strokeStyle = '#3e8c35'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(x, 52); c.lineTo(x, y); c.stroke();
      petals(c, x, y, 6, 9, 4.2, '#fff', col, 0.2); ell(c, x, y, 3.4, 3.4); fs(c, '#ffe98a', 'rgba(130,70,0,.6)', 1);
    }
    leaf(c, 36, 52, 12, -0.5, '#58b048'); leaf(c, 64, 52, 12, Math.PI + 0.5, '#58b048');
  }
  function g_food(c, lvl) {
    plate(c, lvl, 'rgba(40,100,40,.35)');
    for (const [x, y, r] of [[30, 56, 20], [50, 44, 24], [70, 56, 20], [50, 64, 22]]) { c.beginPath(); c.arc(x, y, r, 0, TAU); fs(c, rg(c, x - r * 0.3, y - r * 0.3, 2, r * 1.2, [[0, '#6fcb55'], [1, '#2f8a36']]), 'rgba(15,70,25,.85)', 2); }
    for (const [x, y] of [[26, 50], [46, 36], [62, 52], [74, 62], [40, 66], [54, 62]]) { c.beginPath(); c.arc(x, y, 5.5, 0, TAU); fs(c, rg(c, x - 1.5, y - 1.5, 0.5, 6, [[0, '#ff7f9f'], [1, '#c01a4a']]), 'rgba(90,10,30,.85)', 1.4); shine(c, x - 1.5, y - 1.7, 1.4, 1, 0, 0.8); }
    shine(c, 38, 30, 12, 3, -0.5, 0.25);
  }
  function g_fish(c, lvl) {
    plate(c, lvl, 'rgba(40,80,120,.35)');
    c.beginPath(); c.moveTo(22, 40); c.lineTo(28, 82); c.lineTo(72, 82); c.lineTo(78, 40); c.closePath(); fs(c, lg(c, 22, 0, 78, 0, [[0, '#b9763a'], [0.5, '#d99a58'], [1, '#9a5d2c']]));
    ell(c, 50, 40, 28, 8); fs(c, '#6d3f1d'); ell(c, 50, 40, 25, 6); fs(c, lg(c, 0, 34, 0, 46, [[0, '#7fd0ff'], [1, '#2a88d0']]), false);
    for (const y of [52, 66]) { c.beginPath(); c.moveTo(24 + (y - 40) * 0.14, y); c.lineTo(76 - (y - 40) * 0.14, y); c.strokeStyle = '#7d7d86'; c.lineWidth = 4; c.stroke(); c.strokeStyle = '#c7c9d1'; c.lineWidth = 1.8; c.stroke(); }
    c.save(); c.translate(46, 36); c.rotate(-0.4); fish(c, { s: 0.4, x: 0, y: -4, top: '#e8a21c', mid: '#ffd95c', belly: '#fff3a8', fin: '#ffb42a', line: 'rgba(130,70,0,.9)' }); c.restore();
    line(c, 70, 40, 90, 8, '#6b3f1f', 3); line(c, 90, 8, 92, 28, 'rgba(60,60,70,.8)', 1.1);
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2; ell(c, 40, 38, 5, 1.6); c.stroke(); ell(c, 60, 40, 4, 1.3); c.stroke();
  }
  function g_crystal(c, lvl) {
    plate(c, lvl, 'rgba(60,50,90,.4)');
    c.save(); // gems poking from cart
    gem(c, 36, 40, 0.6, ['#b58cff', '#8b4fe0', '#5a2aa8', 'rgba(60,20,110,.9)']); gem(c, 62, 38, 0.62, ['#7fd0ff', '#2a7fe8', '#14439e', 'rgba(10,40,110,.9)']); gem(c, 50, 34, 0.55, ['#ff8a9c', '#e0183c', '#8a0a22', 'rgba(100,0,20,.9)']);
    c.restore();
    c.beginPath(); c.moveTo(16, 44); c.lineTo(22, 70); c.lineTo(78, 70); c.lineTo(84, 44); c.closePath(); fs(c, lg(c, 0, 44, 0, 70, [[0, '#8a93a8'], [1, '#4f5668']]), 'rgba(30,35,50,.9)', 2.2);
    rr(c, 14, 42, 72, 7, 3); fs(c, '#a9b2c6', 'rgba(30,35,50,.9)', 2);
    c.fillStyle = '#c7c9d1'; for (const x of [28, 50, 72]) { c.beginPath(); c.arc(x, 58, 2, 0, TAU); c.fill(); }
    for (const x of [30, 70]) { c.beginPath(); c.arc(x, 76, 8, 0, TAU); fs(c, lg(c, 0, 68, 0, 84, [[0, '#4a4a56'], [1, '#22222a']]), 'rgba(10,10,20,.9)', 1.8); c.beginPath(); c.arc(x, 76, 2.6, 0, TAU); c.fillStyle = '#9aa0ad'; c.fill(); }
    shine(c, 32, 50, 10, 2, -0.1, 0.3);
  }

  /* ---------- registry ---------- */
  const ITEMS = {
    wood: [w1, w2, w3, w4, w5, w6, w7], flower: [f1, f2, f3, f4, f5, f6, f7],
    food: [t1, t2, t3, t4, t5, t6, t7], fish: [fi1, fi2, fi3, fi4, fi5, fi6, fi7],
    crystal: [c1, c2, c3, c4, c5, c6, c7]
  };
  const GENS = { wood: g_wood, flower: g_flower, food: g_food, fish: g_fish, crystal: g_crystal };
  const BONUS = { coin: [b_coin1, b_coin2, b_coin3], gem: [b_gem1, b_gem2], energy: [b_energy1, b_energy2], chest: [b_chest, b_chest] };
  const GLOW = { wood: '#ffcf7a', flower: '#ff9fc0', food: '#ffb07a', fish: '#7fd0ff', crystal: '#c8a0ff' };

  function drawRaw(c, it) {
    if (it.k === 'it') {
      if (it.l >= 5) { // soft aura for high tiers
        c.save(); const g = rg(c, 50, 54, 4, 52, [[0, GLOW[it.c] + (it.l >= 7 ? 'cc' : '77')], [1, GLOW[it.c] + '00']]); c.fillStyle = g; c.fillRect(0, 0, 100, 100); c.restore();
      }
      ITEMS[it.c][it.l - 1](c);
    } else if (it.k === 'gen') { GENS[it.c](c, it.l); }
    else { BONUS[it.c][Math.min(it.l, BONUS[it.c].length) - 1](c); }
  }

  const cache = new Map();
  function sprite(it, px) {
    const key = it.k + it.c + it.l + '@' + px;
    let cv = cache.get(key);
    if (cv) return cv;
    cv = document.createElement('canvas'); cv.width = cv.height = px;
    const c = cv.getContext('2d'); c.scale(px / 100, px / 100);
    drawRaw(c, it);
    cache.set(key, cv);
    return cv;
  }
  /* canvas element for DOM use (orders, shop, storage) */
  function dom(it, px) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas'); cv.width = cv.height = Math.round(px * dpr);
    cv.style.width = cv.style.height = px + 'px';
    cv.getContext('2d').drawImage(sprite(it, cv.width), 0, 0);
    return cv;
  }

  /* ---------- guests (portrait faces) ---------- */
  function guest(seed, px) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas'); cv.width = cv.height = Math.round(px * dpr);
    cv.style.width = cv.style.height = px + 'px';
    const c = cv.getContext('2d'); c.scale(cv.width / 100, cv.width / 100);
    const rnd = (n) => { seed = (seed * 9301 + 49297) % 233280; return Math.floor((seed / 233280) * n); };
    const skins = ['#ffd9b8', '#f2bd94', '#d99a6c', '#a8683a', '#fbe3cf'];
    const hairs = ['#3b2415', '#8a4b1f', '#e0b04a', '#c9402a', '#2a2a33', '#d9d9e0'];
    const shirts = ['#e8605a', '#58a8e8', '#6cc152', '#b58cff', '#ffb347', '#4ccbc0'];
    const skin = skins[rnd(5)], hair = hairs[rnd(6)], shirt = shirts[rnd(6)], style = rnd(4), hat = rnd(3);
    c.beginPath(); c.arc(50, 50, 48, 0, TAU); c.fillStyle = lg(c, 0, 0, 0, 100, [[0, '#cfeaff'], [1, '#a8d8a0']]); c.fill();
    c.save(); c.beginPath(); c.arc(50, 50, 48, 0, TAU); c.clip();
    // shoulders
    c.beginPath(); c.ellipse(50, 100, 36, 24, 0, 0, TAU); fs(c, shirt, 'rgba(40,40,60,.7)', 2);
    rr(c, 44, 66, 12, 14, 3); fs(c, skin, 'rgba(100,60,40,.7)', 1.6);
    if (style === 1 || style === 3) { ell(c, 50, 46, 31, 33); fs(c, hair, 'rgba(30,20,10,.8)', 2); }
    ell(c, 50, 50, 24, 27); fs(c, lg(c, 30, 30, 70, 76, [[0, lighten(skin, 12)], [1, skin]]), 'rgba(100,60,40,.8)', 2);
    ell(c, 26.5, 52, 4, 6); fs(c, skin, 'rgba(100,60,40,.8)', 1.6); ell(c, 73.5, 52, 4, 6); fs(c, skin, 'rgba(100,60,40,.8)', 1.6);
    // hair front
    c.beginPath(); c.moveTo(25, 46); c.quadraticCurveTo(24, 20, 50, 20); c.quadraticCurveTo(76, 20, 75, 46); c.quadraticCurveTo(66, 32, 50, 34); c.quadraticCurveTo(34, 32, 25, 46); fs(c, hair, 'rgba(30,20,10,.8)', 2);
    if (style === 2) { ell(c, 50, 17, 8, 8); fs(c, hair, 'rgba(30,20,10,.8)', 2); }
    if (hat === 1) { c.beginPath(); c.moveTo(22, 34); c.quadraticCurveTo(50, 8, 78, 34); c.lineTo(86, 36); c.lineTo(14, 36); c.closePath(); fs(c, '#e8c15f', 'rgba(110,70,10,.8)', 2); rr(c, 30, 28, 40, 6, 3); fs(c, '#e0527a', false); }
    if (hat === 2) { c.beginPath(); c.moveTo(24, 36); c.quadraticCurveTo(50, 6, 76, 36); c.lineTo(84, 38); c.lineTo(66, 38); c.lineTo(34, 38); c.lineTo(16, 38); c.closePath(); fs(c, '#58a8e8', 'rgba(20,50,90,.8)', 2); }
    // face
    for (const x of [40, 60]) { ell(c, x, 52, 3.4, 4.2); fs(c, '#fff', 'rgba(40,30,30,.8)', 1.2); ell(c, x + 0.5, 52.5, 2, 2.6); c.fillStyle = '#2b1c14'; c.fill(); c.beginPath(); c.arc(x + 1.2, 51.4, 0.8, 0, TAU); c.fillStyle = '#fff'; c.fill(); }
    c.beginPath(); c.arc(50, 62, 8, 0.25, Math.PI - 0.25); c.strokeStyle = '#8a2a2a'; c.lineWidth = 2.2; c.lineCap = 'round'; c.stroke();
    ell(c, 33, 61, 4, 2.6); c.fillStyle = 'rgba(255,120,120,.35)'; c.fill(); ell(c, 67, 61, 4, 2.6); c.fill();
    c.restore();
    c.beginPath(); c.arc(50, 50, 47, 0, TAU); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 4; c.stroke();
    return cv;
  }

  /* mini icons */
  function icon(kind, px) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas'); cv.width = cv.height = Math.round(px * dpr);
    cv.style.width = cv.style.height = px + 'px';
    const c = cv.getContext('2d'); c.scale(cv.width / 100, cv.width / 100);
    if (kind === 'coin') coinDraw(c, 50, 50, 40);
    else if (kind === 'gem') gem(c, 50, 50, 1.45, ['#9be4ff', '#3aa6ff', '#1560c8', 'rgba(10,50,120,.9)']);
    else if (kind === 'energy') boltDraw(c, 50, 50, 2.1);
    else if (kind === 'star') star(c, 50, 52, 44, 19, lg(c, 0, 8, 0, 96, [[0, '#fff3a0'], [1, '#ffb62a']]), 0);
    else if (kind === 'chest') { c.scale(1.05, 1.05); c.translate(-2, -4); b_chest(c); }
    else if (kind === 'bigchest') { c.scale(1.05, 1.05); c.translate(-2, -4); b_chest(c); star(c, 20, 22, 8, 3, '#fff7a8', 0); }
    return cv;
  }

  return { sprite, dom, guest, icon, drawRaw, rr, lg, rg, fs, ell, poly, leaf, star, shine, line, petals, coinDraw, gem, lighten, TAU, GLOW };
})();
