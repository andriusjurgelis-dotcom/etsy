'use strict';
/* ===== Core game: state, merge board, producers, orders, input ===== */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const rand = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rand(a, b + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const idxOf = (r, c) => r * COLS + c, rowOf = (i) => Math.floor(i / COLS), colOf = (i) => i % COLS;
const dkey = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
const easeOut = (k) => 1 - Math.pow(1 - k, 3);

/* ---------- state ---------- */
let S = null;
function newState() {
  const board = new Array(COLS * ROWS).fill(null);
  const set = (r, c, o) => { board[idxOf(r, c)] = o; };
  set(1, 1, { k: 'gen', c: 'wood', l: 1 }); set(1, 5, { k: 'gen', c: 'flower', l: 1 }); set(2, 3, { k: 'gen', c: 'food', l: 1 });
  set(3, 1, { k: 'it', c: 'wood', l: 1 }); set(3, 2, { k: 'it', c: 'wood', l: 1 });
  set(4, 4, { k: 'it', c: 'flower', l: 1 }); set(4, 5, { k: 'it', c: 'flower', l: 1 }); set(3, 4, { k: 'it', c: 'food', l: 1 });
  set(4, 2, { k: 'bn', c: 'coin', l: 1 }); set(5, 3, { k: 'bn', c: 'chest', l: 1 });
  const lock = new Array(COLS * ROWS).fill(false);
  for (let c = 0; c < COLS; c++) lock[idxOf(7, c)] = true;
  for (const c of [0, 1, 5, 6]) lock[idxOf(6, c)] = true;
  return {
    v: 1, coins: 150, gems: 6, energy: 60, energyT: Date.now(), xp: 0, lvl: 1, stars: 0,
    board, lock, inv: [null, null, null, null], invOpen: 2, wands: 1, orders: [], builds: {}, tut: 0,
    daily: { streak: 0, last: '' }, wheel: { day: '', ad: 0 }, q: { day: '', prog: { merge: 0, spawn: 0, order: 0 }, claimed: {} },
    boatT: 0, adDay: { day: '', chest: 0, energy: 0 }, stats: { merges: 0, orders: 0, top: 0 },
    crystal: false, orderN: 0, unlockCount: 0, playSec: 0, lang: LANG, sound: true, music: true, happy: false
  };
}
function loadState() {
  let s = null;
  try { const raw = CG.load(); if (raw) s = JSON.parse(raw); } catch (e) { s = null; }
  const d = newState();
  if (s && s.board && s.board.length === COLS * ROWS) { S = Object.assign(d, s); S.q = Object.assign(d.q, s.q); S.daily = Object.assign(d.daily, s.daily); S.wheel = Object.assign(d.wheel, s.wheel); S.adDay = Object.assign(d.adDay, s.adDay); S.stats = Object.assign(d.stats, s.stats); }
  else S = d;
  if (S.lang) LANG = S.lang;
  tickEnergy();
}
let saveTimer = 0;
function save(now) {
  if (now) { clearTimeout(saveTimer); doSave(); return; }
  if (saveTimer) return;
  saveTimer = setTimeout(() => { saveTimer = 0; doSave(); }, 600);
}
function doSave() { try { CG.save(JSON.stringify(S)); } catch (e) { console.warn('save failed', e); } }

/* ---------- economy helpers ---------- */
const maxEnergy = () => 60 + (S.builds.cabin ? 20 : 0);
const regenMs = () => (S.builds.campfire ? 12000 : 20000);
function tickEnergy() {
  const n = Date.now(), mx = maxEnergy();
  if (S.energy >= mx) { S.energyT = n; return; }
  const ms = regenMs();
  if (n - S.energyT >= ms) { const k = Math.floor((n - S.energyT) / ms); S.energy = Math.min(mx, S.energy + k); S.energyT += k * ms; if (S.energy >= mx) S.energyT = n; }
}
const xpNeed = (l) => 30 + 22 * l;
const SELL = [0, 2, 5, 12, 28, 60, 130, 300];
function sellValue(it) { return it.k === 'it' ? SELL[it.l] : 0; }
const unlockCost = () => 60 + S.unlockCount * 40;
function availChains() { const a = ['wood', 'flower', 'food']; if (S.builds.pier) a.push('fish'); if (S.crystal) a.push('crystal'); return a; }
function orderSlots() { return 3 + (S.builds.lighthouse ? 1 : 0); }
function resortPct() { return (Object.keys(S.builds).length / BUILDS.length) * 100; }

/* ---------- board geometry ---------- */
const B = { cv: null, c: null, dpr: 1, w: 0, h: 0, cs: 40, bx: 0, by: 0 };
const anims = new Map();
let selected = -1, drag = null, down = null, wandMode = false, hint = [], lastInput = 0, hintReady = true;
let combo = 0, lastMergeAt = 0, inputLocked = false;
const BOARD_PAD = 9;

function initBoard(canvas) {
  B.cv = canvas; B.c = canvas.getContext('2d');
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onCancel);
  layoutBoard();
}
function layoutBoard() {
  const r = B.cv.parentElement.getBoundingClientRect();
  B.dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(10, r.width - 8), h = Math.max(10, r.height - 4);
  B.w = w; B.h = h; B.cv.width = Math.round(w * B.dpr); B.cv.height = Math.round(h * B.dpr);
  B.cv.style.width = w + 'px'; B.cv.style.height = h + 'px';
  B.cs = Math.floor(Math.min((w - BOARD_PAD * 2) / COLS, (h - BOARD_PAD * 2) / ROWS));
  B.bx = Math.floor((w - B.cs * COLS) / 2); B.by = Math.floor((h - B.cs * ROWS) / 2);
}
const cellRect = (i) => ({ x: B.bx + colOf(i) * B.cs, y: B.by + rowOf(i) * B.cs, s: B.cs });
function cellAtLocal(x, y) {
  const c = Math.floor((x - B.bx) / B.cs), r = Math.floor((y - B.by) / B.cs);
  return (c < 0 || c >= COLS || r < 0 || r >= ROWS) ? -1 : idxOf(r, c);
}
function cellFx(i) { const r = cellRect(i), br = B.cv.getBoundingClientRect(); return FX.pt(br.left + r.x + r.s / 2, br.top + r.y + r.s / 2); }
function localPt(e) { const br = B.cv.getBoundingClientRect(); return { x: e.clientX - br.left, y: e.clientY - br.top }; }

/* ---------- item logic ---------- */
const same = (a, b) => a && b && a.k === b.k && a.c === b.c && a.l === b.l;
function canMerge(a, b) { return same(a, b) && ((a.k === 'it' && a.l < MAXLV) || (a.k === 'gen' && a.l < GEN_MAX)); }
function draggable(i) { return !!S.board[i] && !S.lock[i]; }
function emptyCells() { const o = []; for (let i = 0; i < S.board.length; i++) if (!S.board[i] && !S.lock[i]) o.push(i); return o; }
function nearestEmpty(from, exclude) {
  let best = -1, bd = 1e9;
  const fr = from == null ? ROWS / 2 : rowOf(from), fc = from == null ? COLS / 2 : colOf(from);
  for (let i = 0; i < S.board.length; i++) {
    if (S.board[i] || S.lock[i] || (exclude && exclude.has(i))) continue;
    const d = Math.abs(rowOf(i) - fr) * 1.01 + Math.abs(colOf(i) - fc) + Math.random() * 0.2;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
function countItem(c, l) {
  let n = 0;
  for (const it of S.board) if (it && it.k === 'it' && it.c === c && it.l === l) n++;
  for (const it of S.inv) if (it && it.k === 'it' && it.c === c && it.l === l) n++;
  return n;
}

/* weighted spawn tables by producer level */
const SPAWN = { 1: [[1, 78], [2, 22]], 2: [[1, 48], [2, 36], [3, 16]], 3: [[1, 28], [2, 34], [3, 26], [4, 12]] };
function weighted(tbl) { let t = 0; for (const e of tbl) t += e[1]; let r = Math.random() * t; for (const e of tbl) { r -= e[1]; if (r <= 0) return e[0]; } return tbl[0][0]; }
function rollSpawn(g) {
  if (Math.random() < 0.05) return { k: 'bn', c: 'coin', l: 1 };
  if (Math.random() < 0.012) return { k: 'bn', c: 'energy', l: 1 };
  let l = weighted(SPAWN[g.l]);
  if (g.c === 'flower' && S.builds.garden && Math.random() < 0.15) l = Math.min(MAXLV, l + 1);
  return { k: 'it', c: g.c, l };
}
function rollLoot(n, minL, maxL) {
  const out = [], ch = availChains();
  for (let i = 0; i < n; i++) {
    if (Math.random() < 0.15) { out.push(pick([{ k: 'bn', c: 'coin', l: 2 }, { k: 'bn', c: 'energy', l: 1 }, { k: 'bn', c: 'gem', l: 1 }])); continue; }
    out.push({ k: 'it', c: pick(ch), l: ri(minL, maxL) });
  }
  return out;
}

/* ---------- animation helpers ---------- */
function setAnim(i, o) { o.t0 = performance.now() + (o.delay || 0); anims.set(i, o); }
function animState(i, now) {
  const a = anims.get(i); const r = { sc: 1, dx: 0, dy: 0, a: 1, hide: false };
  if (!a) return r;
  const k = (now - a.t0) / a.dur;
  if (k < 0) { r.hide = true; return r; }
  if (k >= 1) { anims.delete(i); return r; }
  if (a.kind === 'pop') r.sc = k < 0.35 ? 0.75 + (k / 0.35) * 0.55 : 1.3 - 0.3 * easeOut((k - 0.35) / 0.65);
  else if (a.kind === 'spawn') { const e = easeOut(k); const cr = cellRect(i); r.dx = (a.fx - (cr.x + cr.s / 2)) * (1 - e); r.dy = (a.fy - (cr.y + cr.s / 2)) * (1 - e) - Math.sin(Math.PI * e) * cr.s * 0.5; r.sc = 0.4 + 0.6 * e + 0.12 * Math.sin(Math.PI * e); }
  else if (a.kind === 'shake') r.dx = Math.sin(k * 36) * 5 * (1 - k);
  else if (a.kind === 'slide') { const e = 1 - easeOut(k); r.dx = a.dx * e; r.dy = a.dy * e; }
  else if (a.kind === 'bounce') r.sc = 1 + 0.16 * Math.sin(k * Math.PI) * (1 - k);
  return r;
}

/* ---------- rendering ---------- */
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
let hoverCell = -1;
function drawBoard(now) {
  const c = B.c; c.setTransform(B.dpr, 0, 0, B.dpr, 0, 0); c.clearRect(0, 0, B.w, B.h);
  const sh = FX.shakeAmount(); c.save(); if (sh > 0.1) c.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
  const cs = B.cs, fx = B.bx - 8, fy = B.by - 8, fw = cs * COLS + 16, fh = cs * ROWS + 16;
  // frame
  roundRect(c, fx, fy + 4, fw, fh, 18); c.fillStyle = 'rgba(40,20,5,.35)'; c.fill();
  roundRect(c, fx, fy, fw, fh, 18); c.fillStyle = Art.lg(c, 0, fy, 0, fy + fh, [[0, '#d9a05d'], [0.5, '#b97a3f'], [1, '#8f5528']]); c.fill();
  c.lineWidth = 3; c.strokeStyle = '#5e3a20'; c.stroke();
  roundRect(c, fx + 3, fy + 3, fw - 6, fh - 6, 15); c.strokeStyle = 'rgba(255,230,180,.55)'; c.lineWidth = 1.5; c.stroke();
  roundRect(c, fx + 6, fy + 6, fw - 12, fh - 12, 12); c.fillStyle = '#5a7a3c'; c.fill();
  // tiles
  for (let i = 0; i < S.board.length; i++) {
    const r = cellRect(i), r0 = rowOf(i), c0 = colOf(i), pad = 1.5;
    if (S.lock[i]) { drawFog(c, r, i, now); continue; }
    roundRect(c, r.x + pad, r.y + pad, r.s - pad * 2, r.s - pad * 2, 7);
    c.fillStyle = ((r0 + c0) & 1) ? '#f3ecc6' : '#e4dba6'; c.fill();
    c.strokeStyle = 'rgba(120,100,40,.25)'; c.lineWidth = 1; c.stroke();
    roundRect(c, r.x + pad + 1, r.y + pad + 1, r.s - pad * 2 - 2, r.s * 0.3, 6); c.fillStyle = 'rgba(255,255,255,.28)'; c.fill();
  }
  // drag target highlight
  if (drag && hoverCell >= 0 && hoverCell !== drag.idx && !S.lock[hoverCell]) {
    const r = cellRect(hoverCell), tgt = S.board[hoverCell], ok = tgt && canMerge(tgt, drag.it);
    roundRect(c, r.x + 1, r.y + 1, r.s - 2, r.s - 2, 8); c.fillStyle = ok ? 'rgba(120,255,140,.45)' : 'rgba(255,255,255,.28)'; c.fill();
    if (ok) { c.strokeStyle = '#3ad66a'; c.lineWidth = 3; c.stroke(); }
  }
  // selected
  if (selected >= 0 && !drag && S.board[selected]) { const r = cellRect(selected); roundRect(c, r.x + 1, r.y + 1, r.s - 2, r.s - 2, 8); c.strokeStyle = '#ffcf3a'; c.lineWidth = 3; c.setLineDash([]); c.stroke(); }
  // items
  for (let i = 0; i < S.board.length; i++) {
    const it = S.board[i]; if (!it || (drag && drag.idx === i)) continue;
    const st = animState(i, now); if (st.hide) continue;
    const r = cellRect(i); let sc = st.sc;
    const cx = r.x + r.s / 2 + st.dx, cy = r.y + r.s / 2 + st.dy;
    let size = r.s * 0.96;
    if (it.k === 'gen') sc *= 1 + 0.025 * Math.sin(now * 0.003 + i);
    if (hint.indexOf(i) >= 0) { const p = 0.5 + 0.5 * Math.sin(now * 0.009); sc *= 1 + 0.1 * p; roundRect(c, r.x + 2, r.y + 2, r.s - 4, r.s - 4, 8); c.fillStyle = 'rgba(255,255,140,' + (0.25 + 0.3 * p) + ')'; c.fill(); }
    if (it.k === 'it' && it.l === MAXLV) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(cx, cy, 2, cx, cy, r.s * 0.7); g.addColorStop(0, 'rgba(255,230,140,' + (0.35 + 0.2 * Math.sin(now * 0.005)) + ')'); g.addColorStop(1, 'rgba(255,230,140,0)'); c.fillStyle = g; c.fillRect(r.x - 6, r.y - 6, r.s + 12, r.s + 12); c.restore(); }
    const px = Math.round(size * B.dpr), spr = Art.sprite(it, px), d = size * sc;
    c.globalAlpha = st.a; c.drawImage(spr, cx - d / 2, cy - d / 2 - r.s * 0.02, d, d); c.globalAlpha = 1;
    if (it.k === 'gen') { // level pips
      for (let p = 0; p < it.l; p++) { c.beginPath(); c.arc(r.x + r.s / 2 + (p - (it.l - 1) / 2) * 7, r.y + r.s - 5, 2.6, 0, Math.PI * 2); c.fillStyle = '#ffd25c'; c.fill(); c.strokeStyle = '#7a4a00'; c.lineWidth = 1; c.stroke(); }
    }
    if (hint.length === 1 && hint[0] === i) { c.fillStyle = '#fff'; c.font = '900 11px sans-serif'; c.textAlign = 'center'; c.fillText('TAP', cx, r.y + 9); }
  }
  if (S.energy < 1) { /* nothing */ }
  // dragged item
  if (drag) {
    const size = B.cs * 1.12, px = Math.round(size * B.dpr), spr = Art.sprite(drag.it, px);
    c.globalAlpha = 0.28; c.fillStyle = '#000'; c.beginPath(); c.ellipse(drag.x, drag.y + size * 0.42, size * 0.3, size * 0.09, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    c.save(); c.translate(drag.x, drag.y - size * 0.18); c.rotate(Math.sin(now * 0.012) * 0.05); c.drawImage(spr, -size / 2, -size / 2, size, size); c.restore();
  }
  c.restore();
}
function drawFog(c, r, i, now) {
  const pad = 1.5;
  roundRect(c, r.x + pad, r.y + pad, r.s - pad * 2, r.s - pad * 2, 7);
  c.fillStyle = Art.lg(c, 0, r.y, 0, r.y + r.s, [[0, '#8fa3b0'], [1, '#6b7d8c']]); c.fill();
  c.save(); roundRect(c, r.x + pad, r.y + pad, r.s - pad * 2, r.s - pad * 2, 7); c.clip();
  c.fillStyle = 'rgba(255,255,255,.35)';
  for (const [dx, dy, rad] of [[0.25, 0.3, 0.26], [0.65, 0.25, 0.3], [0.5, 0.6, 0.3], [0.2, 0.75, 0.22], [0.8, 0.7, 0.24]]) { c.beginPath(); c.arc(r.x + r.s * dx + Math.sin(now * 0.0008 + i + dx * 5) * 2, r.y + r.s * dy, r.s * rad, 0, Math.PI * 2); c.fill(); }
  c.restore();
  const s = r.s * 0.3, cx = r.x + r.s / 2, cy = r.y + r.s * 0.4;
  c.fillStyle = '#ffd25c'; roundRect(c, cx - s * 0.6, cy - s * 0.1, s * 1.2, s * 0.9, 3); c.fill(); c.strokeStyle = '#7a4a00'; c.lineWidth = 1.5; c.stroke();
  c.beginPath(); c.arc(cx, cy - s * 0.1, s * 0.4, Math.PI, 0); c.lineWidth = 2.2; c.stroke();
  if (r.s > 30) { c.fillStyle = '#fff'; c.font = '900 ' + Math.max(9, r.s * 0.2) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(40,50,60,.8)'; const t = String(unlockCost()); c.strokeText(t, cx, r.y + r.s * 0.82); c.fillText(t, cx, r.y + r.s * 0.82); }
}

/* ---------- input ---------- */
function markInput() { lastInput = performance.now(); if (hint.length) hint = []; }
function onDown(e) {
  Sfx.init(); markInput();
  if (inputLocked) return;
  e.preventDefault();
  const p = localPt(e), i = cellAtLocal(p.x, p.y);
  down = { idx: i, x: e.clientX, y: e.clientY, id: e.pointerId, moved: false };
  try { B.cv.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
  if (i >= 0 && draggable(i) && !wandMode) { /* wait for movement */ }
}
function onMove(e) {
  if (!down || e.pointerId !== down.id) return;
  const p = localPt(e);
  if (!drag) {
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 7 && down.idx >= 0 && draggable(down.idx) && !wandMode) {
      drag = { idx: down.idx, it: S.board[down.idx], x: p.x, y: p.y }; selected = down.idx; down.moved = true; Sfx.click(); UI.info(selected);
    } else return;
  }
  drag.x = p.x; drag.y = p.y; markInput();
  hoverCell = cellAtLocal(p.x, p.y);
  const el = document.elementFromPoint(e.clientX, e.clientY), tgt = el && el.closest ? el.closest('[data-drop]') : null;
  $$('[data-drop].hot').forEach((n) => { if (n !== tgt) n.classList.remove('hot'); });
  if (tgt && !tgt.classList.contains('lockd')) tgt.classList.add('hot');
}
function onUp(e) {
  if (!down || e.pointerId !== down.id) return;
  const d = down; down = null; markInput();
  try { B.cv.releasePointerCapture(e.pointerId); } catch (er) { /* ignore */ }
  $$('[data-drop].hot').forEach((n) => n.classList.remove('hot'));
  if (drag) {
    const dr = drag; drag = null; hoverCell = -1;
    const p = localPt(e), br = B.cv.getBoundingClientRect();
    const inside = e.clientX >= br.left && e.clientX <= br.right && e.clientY >= br.top && e.clientY <= br.bottom;
    const cell = inside ? cellAtLocal(p.x, p.y) : -1;
    if (cell >= 0) dropOnCell(dr.idx, cell);
    else {
      const el = document.elementFromPoint(e.clientX, e.clientY), t = el && el.closest ? el.closest('[data-drop]') : null;
      if (t && t.dataset.drop === 'bin') sellAt(dr.idx);
      else if (t && t.dataset.drop === 'slot') storeToSlot(dr.idx, +t.dataset.i);
      else { setAnim(dr.idx, { kind: 'bounce', dur: 300 }); }
    }
    return;
  }
  if (d.idx >= 0) tapCell(d.idx);
  else if (wandMode) { setWand(false); }
}
function onCancel() { down = null; if (drag) { setAnim(drag.idx, { kind: 'bounce', dur: 300 }); drag = null; hoverCell = -1; } $$('[data-drop].hot').forEach((n) => n.classList.remove('hot')); }

function dropOnCell(src, dst) {
  if (S.lock[dst]) { setAnim(src, { kind: 'shake', dur: 350 }); Sfx.error(); return; }
  if (src === dst) { selected = src; UI.info(src); setAnim(src, { kind: 'bounce', dur: 300 }); return; }
  const a = S.board[src], b = S.board[dst];
  if (!b) { S.board[dst] = a; S.board[src] = null; selected = dst; setAnim(dst, { kind: 'bounce', dur: 260 }); Sfx.pop(); UI.info(dst); save(); return; }
  if (canMerge(a, b)) { doMerge(src, dst); return; }
  // swap
  const rs = cellRect(src), rd = cellRect(dst);
  S.board[dst] = a; S.board[src] = b; selected = dst;
  setAnim(dst, { kind: 'slide', dx: 0, dy: 0, dur: 1 }); setAnim(src, { kind: 'slide', dx: rd.x - rs.x, dy: rd.y - rs.y, dur: 260 });
  Sfx.pop(); UI.info(dst); save();
}

function tapCell(i) {
  const it = S.board[i];
  if (S.lock[i]) { UI.confirmUnlock(i); return; }
  if (wandMode) { useWand(i); return; }
  if (!it) { selected = -1; UI.info(-1); return; }
  selected = i; UI.info(i);
  if (it.k === 'gen') { spawnFrom(i); return; }
  if (it.k === 'bn') {
    if (it.c === 'chest') { openChest(i); return; }
    collectBonus(i); return;
  }
  setAnim(i, { kind: 'bounce', dur: 300 }); Sfx.click();
  // reveal partners
  const partners = []; for (let j = 0; j < S.board.length; j++) if (j !== i && canMerge(S.board[j], it)) partners.push(j);
  if (partners.length) { hint = [i, partners[0]]; setTimeout(() => { hint = []; }, 1600); }
  UI.tutEvent('select');
}

/* ---------- producers ---------- */
function spawnFrom(gi) {
  const g = S.board[gi];
  if (S.energy < 1) { setAnim(gi, { kind: 'shake', dur: 350 }); Sfx.error(); UI.outOfEnergy(); return; }
  const dst = nearestEmpty(gi);
  if (dst < 0) { setAnim(gi, { kind: 'shake', dur: 350 }); Sfx.error(); UI.toast(T('board_full'), true); return; }
  const wasFull = S.energy >= maxEnergy();
  S.energy -= 1; if (wasFull) S.energyT = Date.now();
  const it = rollSpawn(g), from = cellRect(gi);
  S.board[dst] = it;
  setAnim(dst, { kind: 'spawn', dur: 420, fx: from.x + from.s / 2, fy: from.y + from.s / 2 });
  setAnim(gi, { kind: 'bounce', dur: 260 });
  Sfx.spawn(); S.q.prog.spawn++;
  const p = cellFx(gi); FX.sparks(p.x, p.y, Art.GLOW[g.c], 6, 90);
  UI.tutEvent('spawn'); UI.refreshOrders(); UI.refreshQuestDot(); save();
}
function collectBonus(i) {
  const it = S.board[i], p = cellFx(i); S.board[i] = null;
  const V = { coin: [0, 15, 60, 200], gem: [0, 1, 5], energy: [0, 5, 15] };
  const amt = V[it.c][it.l];
  if (it.c === 'coin') { Sfx.coin(); UI.grant({ coins: amt }, p); }
  else if (it.c === 'gem') { Sfx.gem(); UI.grant({ gems: amt }, p); }
  else { Sfx.energy(); UI.grant({ energy: amt }, p); }
  FX.stars(p.x, p.y, 6, 120); selected = -1; UI.info(-1); save();
}
function openChest(i) {
  const need = 3, free = emptyCells().length + 1;
  if (free < need) { UI.toast(T('no_space'), true); setAnim(i, { kind: 'shake', dur: 350 }); Sfx.error(); return; }
  const p = cellFx(i); S.board[i] = null; selected = -1; UI.info(-1);
  Sfx.chest(); FX.flash(p.x, p.y, 90); FX.stars(p.x, p.y, 10, 180); FX.ring(p.x, p.y, '#ffe27a', 70);
  giveItems(rollLoot(3, 1, 3 + (S.lvl > 4 ? 1 : 0)), i, p);
  UI.toast(T('items_chest'));
}
/* place items on the board (nearest free cells), overflow -> storage -> coins */
function giveItems(list, originIdx, originFx) {
  const used = new Set(); let delay = 0;
  const ofx = originFx || (function () { const r = B.cv.getBoundingClientRect(); return FX.pt(r.left + r.width / 2, r.top + 40); })();
  const br = B.cv.getBoundingClientRect(), g = FX.pt(br.left, br.top);
  const fromLocal = { x: ofx.x - g.x, y: ofx.y - g.y };
  for (const it of list) {
    const idx = nearestEmpty(originIdx == null ? null : originIdx, used);
    if (idx >= 0) {
      used.add(idx); S.board[idx] = it;
      setAnim(idx, { kind: 'spawn', dur: 480, delay, fx: fromLocal.x, fy: fromLocal.y });
      const d = delay; setTimeout(() => Sfx.pop(), d);
    } else {
      const si = S.inv.findIndex((v, n) => !v && n < S.invOpen);
      if (si >= 0) { S.inv[si] = it; UI.refreshSlots(); }
      else { const v = Math.max(5, sellValue(it) || 10); UI.grant({ coins: v }, ofx); }
    }
    delay += 90;
  }
  UI.refreshOrders(); save();
}

/* ---------- merging ---------- */
function haptic(ms) { try { if (S.sound && navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* unsupported */ } }
function luckyChance() { return 0.05 + (S.builds.spa ? 0.10 : 0); }
function doMerge(src, dst) {
  const a = S.board[src], isGen = a.k === 'gen', nl = a.l + 1, now = performance.now();
  S.board[src] = null; S.board[dst] = { k: a.k, c: a.c, l: nl };
  setAnim(dst, { kind: 'pop', dur: 420 }); selected = dst;
  const p = cellFx(dst), col = Art.GLOW[a.c] || '#ffd25c';
  combo = (now - lastMergeAt < 2600) ? combo + 1 : 1; lastMergeAt = now;
  FX.ring(p.x, p.y, '#fff', 40 + nl * 8, 0.45); FX.sparks(p.x, p.y, [col, '#fff', '#ffe27a'], 8 + nl * 3, 150 + nl * 12);
  FX.flash(p.x, p.y, 50 + nl * 12);
  if (nl >= 4) FX.stars(p.x, p.y, nl * 2, 200);
  if (isGen) { Sfx.merge(5, combo); UI.toast(T('gen_up')); FX.stars(p.x, p.y, 12, 220); }
  else if (nl === MAXLV) { Sfx.big(); FX.confetti(p.x, p.y, 60, 60); FX.shakeBoard(10); FX.text(p.x, p.y - 20, T('mega'), '#ffe27a', 28, 1.6); }
  else Sfx.merge(nl, combo);
  if (nl >= 5 && nl < MAXLV) FX.shakeBoard(4 + nl);
  haptic(nl >= 5 ? 28 : 10);
  if (combo >= 3) { const bonus = combo * 2; FX.text(p.x, p.y - 36, T('combo') + ' x' + combo, '#ff9a4a', 22, 1.2); UI.grant({ coins: bonus }, p); }
  if (!isGen && Math.random() < luckyChance()) {
    const li = nearestEmpty(dst);
    if (li >= 0) { const b = pick([{ k: 'bn', c: 'coin', l: 1 }, { k: 'bn', c: 'energy', l: 1 }, { k: 'bn', c: 'gem', l: 1 }, { k: 'it', c: a.c, l: Math.max(1, nl - 1) }]); S.board[li] = b; const r = cellRect(dst); setAnim(li, { kind: 'spawn', dur: 520, delay: 250, fx: r.x + r.s / 2, fy: r.y + r.s / 2 }); FX.text(p.x, p.y + 20, T('lucky'), '#7aff9a', 20, 1.2); }
  }
  S.stats.merges++; S.q.prog.merge++;
  if (!isGen && nl > S.stats.top) { S.stats.top = nl; }
  if (!isGen && nl === MAXLV && !S.happy) { S.happy = true; CG.happytime(); }
  addXP(isGen ? 8 : nl + 1);
  UI.info(dst); UI.tutEvent('merge'); UI.refreshOrders(); UI.refreshQuestDot(); save();
}
function addXP(n) {
  S.xp += n; let up = 0;
  while (S.xp >= xpNeed(S.lvl)) { S.xp -= xpNeed(S.lvl); S.lvl++; up = S.lvl; }
  UI.refreshHud();
  if (up) setTimeout(() => UI.levelUp(up), 650);
}

/* ---------- wand / sort / sell / storage / unlock ---------- */
function setWand(on) {
  wandMode = on; $('#btn-wand').classList.toggle('on', on);
  if (on) UI.toast(T('wand_pick'));
}
function useWand(i) {
  const it = S.board[i];
  setWand(false);
  if (!it || !((it.k === 'it' && it.l < MAXLV) || (it.k === 'gen' && it.l < GEN_MAX))) { Sfx.error(); setAnim(i, { kind: 'shake', dur: 350 }); return; }
  S.wands--; it.l++; setAnim(i, { kind: 'pop', dur: 450 });
  const p = cellFx(i); FX.stars(p.x, p.y, 14, 220); FX.ring(p.x, p.y, '#b58cff', 70, 0.6); FX.flash(p.x, p.y, 90, '220,180,255'); Sfx.merge(it.l, 2);
  UI.refreshWand(); UI.info(i); UI.refreshOrders(); save();
}
function sellAt(i) {
  const it = S.board[i];
  if (!it || it.k === 'gen' || it.k === 'bn') { setAnim(i, { kind: 'shake', dur: 350 }); Sfx.error(); return; }
  if (it.l >= 5) { UI.confirmSell(i); return; }
  doSell(i);
}
function doSell(i) {
  const it = S.board[i]; if (!it) return;
  const v = sellValue(it), p = cellFx(i); S.board[i] = null; selected = -1; Sfx.sell();
  UI.grant({ coins: v }, p); FX.text(p.x, p.y - 10, '+' + v, '#ffd25c', 20, 0.9); UI.info(-1); UI.refreshOrders(); save();
}
function storeToSlot(i, n) {
  if (n >= S.invOpen) { setAnim(i, { kind: 'bounce', dur: 300 }); UI.unlockSlot(n); return; }
  const a = S.board[i], b = S.inv[n];
  if (a.k === 'gen' && false) return;
  S.inv[n] = a; S.board[i] = b || null; if (b) setAnim(i, { kind: 'pop', dur: 300 });
  Sfx.pop(); selected = -1; UI.info(-1); UI.refreshSlots(); UI.refreshOrders(); save();
}
function slotToBoard(n) {
  const it = S.inv[n]; if (!it) return;
  const dst = nearestEmpty(null); if (dst < 0) { UI.toast(T('board_full'), true); Sfx.error(); return; }
  const el = $('#slots').children[n], g = FX.elCenter(el), br = B.cv.getBoundingClientRect(), o = FX.pt(br.left, br.top);
  S.board[dst] = it; S.inv[n] = null;
  setAnim(dst, { kind: 'spawn', dur: 420, fx: g.x - o.x, fy: g.y - o.y }); Sfx.pop(); UI.refreshSlots(); UI.refreshOrders(); save();
}
function unlockCell(i) {
  const cost = unlockCost();
  if (S.coins < cost) { UI.toast(T('not_enough_coins'), true); Sfx.error(); return false; }
  S.coins -= cost; S.unlockCount++; S.lock[i] = false;
  const p = cellFx(i); FX.sparks(p.x, p.y, ['#fff', '#cfe6f2'], 16, 160); FX.ring(p.x, p.y, '#fff', 60, 0.5); Sfx.coin();
  setAnim(i, { kind: 'pop', dur: 300 }); UI.refreshHud(); save(); return true;
}
const CH_ORDER = { wood: 0, flower: 1, food: 2, fish: 3, crystal: 4 };
function sortBoard() {
  const cells = []; for (let i = 0; i < S.board.length; i++) if (!S.lock[i]) cells.push(i);
  const items = cells.map((i) => ({ it: S.board[i], from: i })).filter((o) => o.it);
  const rank = (it) => (it.k === 'gen' ? 0 : it.k === 'it' ? 1 : 2);
  items.sort((a, b) => rank(a.it) - rank(b.it) || (CH_ORDER[a.it.c] || 0) - (CH_ORDER[b.it.c] || 0) || b.it.l - a.it.l);
  const old = cells.map((i) => S.board[i]);
  cells.forEach((i) => { S.board[i] = null; });
  items.forEach((o, n) => {
    const to = cells[n]; S.board[to] = o.it;
    const rf = cellRect(o.from), rt = cellRect(to);
    if (o.from !== to) setAnim(to, { kind: 'slide', dx: rf.x - rt.x, dy: rf.y - rt.y, dur: 420 });
  });
  selected = -1; UI.info(-1); Sfx.whoosh(); UI.toast(T('sorted')); save();
}

/* ---------- hint ---------- */
function computeHint() {
  const seen = {};
  for (let i = 0; i < S.board.length; i++) {
    const it = S.board[i]; if (!it || S.lock[i] || !(it.k === 'it' || it.k === 'gen')) continue;
    const key = it.k + it.c + it.l;
    if (seen[key] != null && canMerge(S.board[seen[key]], it)) return [seen[key], i];
    if (seen[key] == null) seen[key] = i;
  }
  if (S.energy > 0) { for (let i = 0; i < S.board.length; i++) if (S.board[i] && S.board[i].k === 'gen') return [i]; }
  return [];
}
function updateHint(now) {
  if (inputLocked || drag || hint.length || UI.tutActive()) return;
  if (now - lastInput > 7000) { hint = computeHint(); if (!hint.length) lastInput = now; }
}
