'use strict';
/* ===== UI layer: HUD, orders, modals, rewards, shop, resort view, tutorial, ads flow ===== */
const VID = '<svg class="vid" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="4" fill="#fff" opacity=".95"/><path d="M10 9v6l5-3z" fill="#2a82d8"/></svg>';
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) { if (k === 'class') e.className = attrs[k]; else if (k === 'html') e.innerHTML = attrs[k]; else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); }
  for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
const ico = (k, px) => Art.icon(k, px || 22);

const UI = (() => {
  const disp = { coins: 0, gems: 0, energy: 0 };
  const flights = { coins: 0, gems: 0, energy: 0, stars: 0 };
  let modals = [], adPaused = false, view = 'merge', buildSel = null, wheelBusy = false, tutTimer = 0, tutMsgUntil = 0;
  const orderEls = new Map();
  let hudCache = {}, lastSec = 0;

  /* ---------- locking / gameplay state ---------- */
  function recalcLock() {
    inputLocked = modals.length > 0 || adPaused;
    if (inputLocked) CG.gameplayStop(); else if (!document.hidden) CG.gameplayStart();
  }
  function toast(msg, bad) {
    const t = h('div', { class: 'toast' + (bad ? ' bad' : '') }, msg); $('#toasts').append(t);
    setTimeout(() => t.remove(), 2300); while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
  }

  /* ---------- generic modal ---------- */
  function openModal(o) {
    const root = $('#modal-root');
    const panel = h('div', { class: 'panel' });
    if (o.title) panel.append(h('h2', null, o.title));
    const body = h('div', { class: 'body' }); panel.append(body);
    if (o.content) body.append(...[].concat(o.content));
    const ov = h('div', { class: 'overlay' + (o.sheet ? ' sheet' : '') }, panel);
    const m = { el: ov, body, onClose: o.onClose, closed: false, close() { if (m.closed) return; m.closed = true; ov.remove(); modals = modals.filter((x) => x !== m); if (m.onClose) m.onClose(); recalcLock(); } };
    if (o.dismiss !== false) { panel.prepend(h('button', { class: 'x', 'aria-label': 'Close', onclick: () => { Sfx.click(); m.close(); } }, '×')); ov.addEventListener('pointerdown', (e) => { if (e.target === ov) m.close(); }); }
    root.append(ov); modals.push(m); recalcLock(); Sfx.init();
    return m;
  }
  function closeAllModals() { modals.slice().forEach((m) => m.close()); }
  function btn(label, cls, fn, extra) { return h('button', { class: 'btn ' + (cls || ''), onclick: (e) => { Sfx.click(); fn(e); } }, ...[].concat(label), extra || null); }
  function adBtn(label, fn, cls) {
    const b = h('button', { class: 'btn blue ' + (cls || ''), onclick: () => { Sfx.click(); fn(); } }); b.innerHTML = VID + '<span></span>'; b.lastChild.textContent = label; return b;
  }

  /* ---------- currency / rewards ---------- */
  const HUD_EL = { coins: '#p-coins', gems: '#p-gems', energy: '#p-energy', stars: '.tab[data-tab="resort"]' };
  const ICON = { coins: 'coin', gems: 'gem', energy: 'energy', stars: 'star' };
  function centerOfScreen() { const r = $('#game').getBoundingClientRect(); return { x: r.width / 2, y: r.height * 0.45 }; }
  function grant(r, from) {
    from = from || centerOfScreen();
    for (const k of ['coins', 'gems', 'energy', 'stars']) {
      const amt = r[k]; if (!amt) continue;
      S[k] += amt;
      const n = Math.min(7, Math.max(1, Math.ceil(Math.log2(amt + 1)))), share = amt / n;
      const to = FX.elCenter($(HUD_EL[k]));
      for (let i = 0; i < n; i++) {
        flights[k]++;
        FX.fly(ico(ICON[k], 40), { x: from.x + rand(-10, 10), y: from.y + rand(-10, 10) }, to, { delay: i * 0.07, dur: 0.75, size: 30, done: () => { flights[k]--; if (disp[k] !== undefined) disp[k] = Math.min(S[k], disp[k] + share); const el = $(HUD_EL[k]); if (el) { el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); } if (k === 'coins') Sfx.coin(); refreshDots(); } });
      }
    }
    if (r.xp) addXP(r.xp);
    refreshHud(); refreshDots(); save();
  }
  function spend(k, n) {
    if (S[k] < n) { toast(T(k === 'gems' ? 'not_enough_gems' : k === 'coins' ? 'not_enough_coins' : 'not_enough_stars'), true); Sfx.error(); return false; }
    S[k] -= n; refreshHud(); return true;
  }

  /* ---------- HUD ---------- */
  function refreshHud() {
    for (const k of ['coins', 'gems', 'energy']) { if (disp[k] > S[k] || flights[k] === 0) disp[k] = S[k]; }
    const set = (id, v) => { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } };
    set('#v-coins', Math.round(disp.coins).toLocaleString()); set('#v-gems', Math.round(disp.gems));
    const mx = maxEnergy();
    set('#v-energy', Math.round(disp.energy) + '/' + mx);
    $('#en-bar').style.width = clamp(S.energy / mx * 100, 0, 100) + '%';
    let tm = '';
    if (S.energy < mx) { const left = Math.max(0, regenMs() - (Date.now() - S.energyT)); tm = '+1 ' + Math.ceil(left / 1000) + 's'; }
    set('#v-timer', tm);
    set('#lvl-n', S.lvl);
    $('#lvl-ring').style.setProperty('--p', (S.xp / xpNeed(S.lvl) * 100).toFixed(1) + '%');
    set('#v-stars', S.stars); set('#v-pct', Math.round(resortPct()) + '%');
  }
  function refreshWand() { $('#wand-n').textContent = S.wands; $('#wand-n').style.display = S.wands > 0 ? '' : 'none'; }

  /* ---------- info line ---------- */
  function info(i) {
    const el = $('#info'); el.textContent = '';
    const it = i >= 0 ? S.board[i] : null;
    if (!it) { el.textContent = T('merge_two'); return; }
    el.append(h('span', null, itemName(it)));
    if (it.k === 'it') {
      const p = h('span', { class: 'pips' }); for (let n = 1; n <= MAXLV; n++) p.append(h('i', { class: n <= it.l ? 'on' : '' })); el.append(p);
      el.append(h('span', null, it.l >= MAXLV ? T('max_level') : T('sell_for') + ' ' + sellValue(it)));
    } else if (it.k === 'gen') el.append(h('span', null, T('info_gen', { l: it.l }) + ' · ' + T('tap_to_spawn')));
    else el.append(h('span', null, it.c === 'chest' ? T('tapcoin') : T('tapcoin')));
  }

  /* ---------- storage slots ---------- */
  function refreshSlots() {
    const box = $('#slots'); box.textContent = '';
    for (let n = 0; n < S.inv.length; n++) {
      const open = n < S.invOpen, it = S.inv[n];
      const s = h('button', { class: 'slot' + (open ? '' : ' lockd'), 'data-drop': 'slot', 'data-i': n, 'aria-label': T('storage') });
      if (open && it) s.append(Art.dom(it, 38));
      s.addEventListener('click', () => { Sfx.init(); if (inputLocked) return; if (!open) unlockSlot(n); else if (S.inv[n]) slotToBoard(n); else { toast(T('storage')); Sfx.click(); } });
      box.append(s);
    }
  }
  function unlockSlot(n) {
    const cost = 8 + (n - 2) * 6;
    openModal({
      title: T('slot'), content: [h('div', { class: 'center big' }, T('slot_d')), btn([ico('gem', 24), ' ' + cost], 'blue full', () => { if (spend('gems', cost)) { S.invOpen = Math.max(S.invOpen, n + 1); refreshSlots(); Sfx.gem(); save(); modals[modals.length - 1].close(); } })]
    });
  }

  /* ---------- confirms ---------- */
  function confirmUnlock(i) {
    const cost = unlockCost(); const m = openModal({ title: T('unlock'), content: [h('div', { class: 'center big' }, T('unlock_q')), h('div', { class: 'center row', style: 'justify-content:center' }, ico('coin', 34), h('span', { class: 'big' }, cost)), h('div', { class: 'row' }, btn(T('no'), 'gray full', () => m.close()), btn(T('unlock'), 'gold full', () => { if (unlockCell(i)) m.close(); }))] });
  }
  function confirmSell(i) {
    const it = S.board[i]; const m = openModal({ title: T('sell'), content: [h('div', { class: 'center' }, Art.dom(it, 72)), h('div', { class: 'center big' }, T('confirm_sell')), h('div', { class: 'center muted' }, itemName(it) + ' · +' + sellValue(it)), h('div', { class: 'row' }, btn(T('no'), 'gray full', () => m.close()), btn(T('sell'), 'red full', () => { doSell(i); m.close(); }))] });
  }

  /* ---------- ads flow ---------- */
  function adDayCheck() { const d = dkey(); if (S.adDay.day !== d) S.adDay = { day: d, chest: 0, energy: 0 }; }
  async function adEnergy(afterClose) {
    adDayCheck(); if (S.adDay.energy >= 6) { toast(T('ad_limit'), true); return false; }
    const ok = await CG.rewarded(() => { S.adDay.energy++; grant({ energy: 30 }, centerOfScreen()); Sfx.energy(); toast(T('add_energy', { n: 30 })); });
    if (!ok) toast(T('ad_unavailable'), true);
    return ok;
  }
  async function adChest() {
    adDayCheck(); if (S.adDay.chest >= 5) { toast(T('ad_limit'), true); return; }
    const ok = await CG.rewarded(() => { S.adDay.chest++; claimChestReward(true); });
    if (!ok) toast(T('ad_unavailable'), true);
  }
  function claimChestReward(big) {
    closeAllModals(); switchTab('merge');
    setTimeout(() => { Sfx.chest(); giveItems(big ? rollLoot(5, 2, 4) : rollLoot(3, 1, 3), null, null); toast(T('items_chest')); }, 300);
  }
  function outOfEnergy() {
    const m = openModal({ title: T('out_energy_t'), content: [h('div', { class: 'center' }, ico('energy', 72)), h('div', { class: 'center big' }, T('out_energy_d')),
      CG.adsAvailable() ? adBtn(T('ad_energy'), async () => { const ok = await adEnergy(); if (ok) m.close(); }, 'full') : null,
      btn([ico('gem', 22), ' ' + T('energy_gems')], 'gold full', () => { if (spend('gems', 10)) { S.energy = Math.max(S.energy, maxEnergy()); disp.energy = S.energy; Sfx.energy(); refreshHud(); save(); m.close(); } }),
      btn(T('no_thanks'), 'gray full', () => m.close())] });
  }
  let adTimer = 0;
  function afterOrder() {
    if (!(S.lvl >= CONFIG.MIDGAME_MIN_LEVEL || S.playSec >= CONFIG.MIDGAME_MIN_SECONDS) || !CG.adsAvailable()) return;
    clearTimeout(adTimer);
    adTimer = setTimeout(() => { if (!inputLocked && !drag && !CG.busy) CG.midgame(); }, 1600);   // logical break: after an order is handed in
  }

  /* ---------- level up ---------- */
  function levelUp(lv) {
    if (S.lvlShown === lv) return; S.lvlShown = lv;
    const rew = { gems: 2 + Math.floor(lv / 5), energy: 15 }, lines = [];
    let gen = null;
    if (lv === 5 && !S.crystal) { S.crystal = true; gen = { k: 'gen', c: 'crystal', l: 1 }; lines.push(T('unlocked_new') + ' ' + NAMES[LANG].gen.crystal); }
    Sfx.levelup();
    const m = openModal({
      title: T('levelup'), dismiss: false, content: [
        h('div', { class: 'center', style: 'font-size:64px;font-weight:900;color:#e0501c;text-shadow:0 3px 0 #fff,0 5px 8px #0004' }, lv),
        h('div', { class: 'row wrap' }, h('span', { class: 'chip big' }, ico('gem', 30), '+' + rew.gems), h('span', { class: 'chip big' }, ico('energy', 30), '+' + rew.energy)),
        ...lines.map((l) => h('div', { class: 'center big' }, l)), gen ? h('div', { class: 'center' }, Art.dom(gen, 64)) : null,
        btn(T('claim'), 'gold full', () => { const c = centerOfScreen(); m.close(); grant(rew, c); if (gen) giveItems([gen], null, null); refreshDots(); })
      ]
    });
    setTimeout(() => { const r = $('#game').getBoundingClientRect(); FX.confetti(r.width / 2, r.height * 0.3, 70, 160); }, 120);
  }

  /* ---------- orders ---------- */
  function newOrder() {
    S.orderN++;
    const chains = availChains(), p = S.lvl, r = Math.random();
    const n = S.orderN <= 2 ? 1 : r < 0.5 ? 1 : r < 0.85 ? 2 : (p >= 3 ? 3 : 2);
    const maxL = Math.min(7, 2 + Math.floor((p + 1) / 2) + (Math.random() < 0.3 ? 1 : 0));
    let reqs = [], g = 0;
    while (reqs.length < n && g++ < 40) { const c = pick(chains), l = ri(Math.max(2, maxL - 2), maxL); if (!reqs.some((q) => q.c === c && q.l === l)) reqs.push({ c, l }); }
    if (S.orderN === 1) reqs = [{ c: 'wood', l: 2 }]; else if (S.orderN === 2) reqs = [{ c: 'flower', l: 2 }];
    let coins = Math.round(reqs.reduce((a, q) => a + SELL[q.l] * 1.6, 0) + 10); if (S.builds.diner) coins = Math.round(coins * 1.25);
    return {
      id: S.orderN, guest: { seed: ri(1, 9999), name: pick(GUEST_NAMES) }, reqs,
      rew: { coins, xp: reqs.reduce((a, q) => a + q.l * 2, 3), stars: Math.min(3, 1 + (reqs.length > 1 ? 1 : 0) + (reqs.some((q) => q.l >= 5) ? 1 : 0)), gems: S.orderN > 2 && Math.random() < 0.15 ? 1 : 0 }
    };
  }
  function fillOrders() { while (S.orders.length < orderSlots()) S.orders.push(newOrder()); }
  const reqOK = (q) => countItem(q.c, q.l) > 0;
  const orderReady = (o) => o.reqs.every(reqOK);
  function buildOrderEl(o) {
    const el = h('div', { class: 'order', 'data-id': o.id });
    el.append(h('div', { class: 'face' }, Art.guest(o.guest.seed, 36)));
    const reqs = h('div', { class: 'reqs' }); o.reqs.forEach((q) => reqs.append(h('div', { class: 'req' }, Art.dom({ k: 'it', c: q.c, l: q.l }, 26)))); el.append(reqs);
    const rew = h('div', { class: 'rew' });
    rew.append(h('span', null, ico('coin', 14), o.rew.coins), h('span', null, ico('star', 14), o.rew.stars));
    if (o.rew.gems) rew.append(h('span', null, ico('gem', 14), o.rew.gems));
    el.append(rew);
    el.addEventListener('click', () => { Sfx.init(); if (inputLocked) return; onOrderTap(o); });
    return el;
  }
  function refreshOrders() {
    fillOrders();
    const box = $('#orders'), ids = new Set(S.orders.map((o) => o.id));
    for (const [id, el] of orderEls) if (!ids.has(id) && !el.classList.contains('out')) { el.remove(); orderEls.delete(id); }
    S.orders.forEach((o, n) => {
      let el = orderEls.get(o.id); if (!el) { el = buildOrderEl(o); orderEls.set(o.id, el); }
      if (box.children[n] !== el) box.insertBefore(el, box.children[n] || null);
      const ready = orderReady(o); el.classList.toggle('ready', ready); el.setAttribute('data-ready', T('ready'));
      Array.from(el.querySelectorAll('.req')).forEach((r, k) => r.classList.toggle('ok', reqOK(o.reqs[k])));
    });
  }
  function onOrderTap(o) {
    if (orderReady(o)) { deliver(o); return; }
    Sfx.click(); const names = o.reqs.filter((q) => !reqOK(q)).map((q) => NAMES[LANG][q.c][q.l - 1]);
    toast(names.join(', ')); const idx = []; for (let i = 0; i < S.board.length; i++) { const it = S.board[i]; if (it && it.k === 'it' && o.reqs.some((q) => q.c === it.c && q.l === it.l)) idx.push(i); }
    hint = idx; setTimeout(() => { hint = []; }, 1800);
  }
  function deliver(o) {
    const el = orderEls.get(o.id), to = FX.elCenter(el), taken = [];
    for (const q of o.reqs) {
      let found = -1; for (let i = 0; i < S.board.length; i++) { const it = S.board[i]; if (it && it.k === 'it' && it.c === q.c && it.l === q.l && !taken.some((t) => t.i === i)) { found = i; break; } }
      if (found >= 0) taken.push({ i: found, q }); else { const si = S.inv.findIndex((it) => it && it.k === 'it' && it.c === q.c && it.l === q.l && !taken.some((t) => t.s === it)); taken.push({ s: S.inv[si], si, q }); }
    }
    taken.forEach((t, n) => {
      const it = { k: 'it', c: t.q.c, l: t.q.l };
      if (t.i != null) { const from = cellFx(t.i); S.board[t.i] = null; FX.fly(Art.sprite(it, 80), from, to, { size: 44, delay: n * 0.1, dur: 0.6 }); }
      else { S.inv[t.si] = null; FX.fly(Art.sprite(it, 80), centerOfScreen(), to, { size: 44, delay: n * 0.1, dur: 0.6 }); refreshSlots(); }
    });
    selected = -1; info(-1); Sfx.deliver(); S.orders = S.orders.filter((x) => x !== o); S.stats.orders++; S.q.prog.order++;
    const delay = 600 + taken.length * 100;
    setTimeout(() => {
      const c = FX.elCenter(el); FX.confetti(c.x, c.y, 28, 40); FX.ring(c.x, c.y, '#7aff9a', 70, 0.5); Sfx.coin();
      grant({ coins: o.rew.coins, xp: o.rew.xp, stars: o.rew.stars, gems: o.rew.gems }, c);
      el.classList.add('out'); setTimeout(() => { el.remove(); orderEls.delete(o.id); }, 420);
      setTimeout(() => { refreshOrders(); }, 520);
      refreshDots(); afterOrder();
    }, delay);
    refreshOrders(); tutEvent('deliver'); refreshQuestDot(); save();
  }

  /* ---------- quests / daily / dots ---------- */
  function dayRoll() { const d = dkey(); if (S.q.day !== d) S.q = { day: d, prog: { merge: 0, spawn: 0, order: 0 }, claimed: {} }; }
  function dailyReady() { return S.daily.last !== dkey(); }
  function freeSpin() { return S.wheel.day !== dkey(); }
  function boatReady() { return !!S.builds.boat && Date.now() - S.boatT >= 600000; }
  function questClaimable() { dayRoll(); return QUEST_DEFS.some((q) => !S.q.claimed[q.id] && S.q.prog[q.id] >= q.goal); }
  function refreshQuestDot() { refreshDots(); }
  function refreshDots() {
    $('#dot-daily').classList.toggle('on', dailyReady() || freeSpin() || boatReady() || questClaimable());
    $('#dot-resort').classList.toggle('on', BUILDS.some((b) => !S.builds[b.id] && S.stars >= b.cost));
  }
  function applyReward(r, from) {
    if (r.type === 'coins') grant({ coins: r.n }, from); else if (r.type === 'gems') grant({ gems: r.n }, from); else if (r.type === 'energy') grant({ energy: r.n }, from);
    else claimChestReward(r.type === 'bigchest');
  }
  const rewIcon = (t) => (t === 'coins' ? 'coin' : t === 'gems' ? 'gem' : t);
  const rewLabel = (r) => (r.type === 'chest' || r.type === 'bigchest' ? '' : '+' + r.n);

  /* ---------- Rewards sheet ---------- */
  let rewardsM = null, rewardsTick = 0;
  function openRewards() {
    if (rewardsM && !rewardsM.closed) return;
    dayRoll();
    rewardsM = openModal({ title: T('tab_daily'), sheet: true, onClose: () => { clearInterval(rewardsTick); } });
    renderRewards(); rewardsTick = setInterval(() => { const e = $('#boat-t'); if (e) e.textContent = boatText(); }, 1000);
  }
  function boatText() { const left = Math.max(0, 600000 - (Date.now() - S.boatT)); return left <= 0 ? T('boat_ready') : T('boat_in') + ' ' + Math.floor(left / 60000) + ':' + String(Math.floor(left / 1000) % 60).padStart(2, '0'); }
  function renderRewards() {
    const b = rewardsM.body; b.textContent = ''; dayRoll(); adDayCheck();
    // daily
    b.append(h('h3', { class: 'sec' }, T('daily_title')));
    const can = dailyReady(), cont = S.daily.last === yesterdayKey();
    const nextIdx = can ? (cont ? S.daily.streak % 7 : 0) : -1;
    const lastIdx = Math.max(0, S.daily.streak - 1) % 7;
    const days = h('div', { class: 'days' });
    DAILY.forEach((r, n) => { const done = can ? n < nextIdx : (S.daily.streak > 0 && n <= lastIdx); const today = can && n === nextIdx; days.append(h('div', { class: 'day' + (done ? ' done' : '') + (today ? ' today' : '') }, h('span', null, T('day') + ' ' + (n + 1)), ico(rewIcon(r.type), 30), h('span', null, rewLabel(r) || ' '))); });
    b.append(days);
    b.append(can ? btn(T('claim_day', { n: nextIdx + 1 }), 'gold full', () => { S.daily.streak = (cont ? S.daily.streak : 0) + 1; S.daily.last = dkey(); const r = DAILY[nextIdx]; Sfx.levelup(); applyReward(r, centerOfScreen()); refreshDots(); if (rewardsM && !rewardsM.closed) renderRewards(); save(); }) : h('div', { class: 'center muted' }, T('claimed') + ' · ' + T('streak') + ' ' + S.daily.streak));
    // free chests
    b.append(h('h3', { class: 'sec' }, T('free_chests')));
    const boat = h('div', { class: 'card' }, h('div', { class: 'pic' }, ico('chest', 40)), h('div', { class: 'txt' }, h('b', null, T('boat_chest')), h('small', { id: 'boat-t' }, S.builds.boat ? boatText() : T('boat_locked'))));
    const bb = btn(T('collect'), 'green sm', () => { S.boatT = Date.now(); claimChestReward(false); save(); }); if (!boatReady()) bb.setAttribute('disabled', ''); boat.append(bb); b.append(boat);
    if (CG.adsAvailable()) b.append(h('div', { class: 'card' }, h('div', { class: 'pic' }, ico('bigchest', 40)), h('div', { class: 'txt' }, h('b', null, T('chest_b')), h('small', null, T('chest_b_d') + ' · ' + (5 - S.adDay.chest) + ' ' + T('left'))), adBtn(T('watch_ad'), () => adChest(), 'sm')));
    // wheel
    b.append(h('h3', { class: 'sec' }, T('wheel')));
    const wrap = h('div', { class: 'wheelwrap' }, h('div', { class: 'ptr' }), h('canvas', { id: 'wheel', width: 460, height: 460 })); b.append(wrap); drawWheel(0);
    const spinRow = h('div', { class: 'row' });
    const free = freeSpin();
    spinRow.append(btn(free ? T('free_spin') : T('spin_gems'), free ? 'gold full' : 'blue full', () => spinWheel(free ? 'free' : 'gems')));
    if (!free && CG.adsAvailable() && S.wheel.ad < 3) spinRow.append(adBtn(T('ad_spin'), () => spinWheel('ad'), 'full')); b.append(spinRow);
    // quests
    b.append(h('h3', { class: 'sec' }, T('quests')));
    QUEST_DEFS.forEach((q) => {
      const p = Math.min(q.goal, S.q.prog[q.id]), done = p >= q.goal, claimed = S.q.claimed[q.id];
      const rw = q.reward.gems ? ico('gem', 18) : ico('coin', 18);
      const card = h('div', { class: 'card' }, h('div', { class: 'txt' }, h('b', null, T('q_' + q.id) + ' ' + p + '/' + q.goal), h('div', { class: 'prog' }, h('i', { style: 'width:' + (p / q.goal * 100) + '%' }))), h('span', { class: 'chip' }, rw, '+' + (q.reward.gems || q.reward.coins)));
      const cb = btn(claimed ? T('claimed') : T('claim'), 'green sm', () => { S.q.claimed[q.id] = true; grant(q.reward, centerOfScreen()); Sfx.deliver(); renderRewards(); }); if (!done || claimed) cb.setAttribute('disabled', ''); card.append(cb); b.append(card);
    });
  }
  function yesterdayKey() { const d = new Date(Date.now() - 86400000); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  /* ---------- lucky wheel ---------- */
  let wheelRot = 0;
  function drawWheel(rot) {
    const cv = $('#wheel'); if (!cv) return; const c = cv.getContext('2d'), R = 220, n = WHEEL.length;
    c.clearRect(0, 0, 460, 460); c.save(); c.translate(230, 230);
    c.beginPath(); c.arc(0, 0, R + 6, 0, Math.PI * 2); c.fillStyle = '#8f5528'; c.fill();
    c.rotate(rot);
    WHEEL.forEach((s, i) => {
      const a0 = i * (Math.PI * 2 / n) - Math.PI / 2 - Math.PI / n, a1 = a0 + Math.PI * 2 / n;
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, a0, a1); c.closePath(); c.fillStyle = i % 2 ? Art.lighten(s.c, 25) : s.c; c.fill(); c.strokeStyle = '#fff8'; c.lineWidth = 3; c.stroke();
      c.save(); c.rotate((a0 + a1) / 2 + Math.PI / 2); const icn = ico(rewIcon(s.type), 64); c.drawImage(icn, -26, -R + 22, 52, 52);
      c.fillStyle = '#fff'; c.font = '900 30px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.lineWidth = 6; c.strokeStyle = 'rgba(60,30,10,.8)'; const lb = rewLabel(s); if (lb) { c.strokeText(lb, 0, -R + 100); c.fillText(lb, 0, -R + 100); } c.restore();
    });
    c.beginPath(); c.arc(0, 0, 34, 0, Math.PI * 2); c.fillStyle = Art.lg(c, 0, -34, 0, 34, [[0, '#ffe27a'], [1, '#e8a21c']]); c.fill(); c.lineWidth = 5; c.strokeStyle = '#7a4a00'; c.stroke();
    c.restore();
  }
  function spinWheel(mode) {
    if (wheelBusy) return;
    const go = () => {
      wheelBusy = true; const n = WHEEL.length, target = ri(0, n - 1);
      const end = wheelRot + Math.PI * 2 * 5 + ((n - target) * (Math.PI * 2 / n) - (wheelRot % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const start = wheelRot, t0 = performance.now(), dur = 4200; let lastSeg = 0;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4); wheelRot = start + (end - start) * e; drawWheel(wheelRot);
        const seg = Math.floor(wheelRot / (Math.PI * 2 / n)); if (seg !== lastSeg) { lastSeg = seg; Sfx.tick(); }
        if (k < 1) requestAnimationFrame(step); else { wheelBusy = false; wheelRot = wheelRot % (Math.PI * 2); const r = WHEEL[target]; Sfx.levelup(); const w = $('#wheel'); const c = w ? FX.elCenter(w) : centerOfScreen(); FX.confetti(c.x, c.y, 40, 80); setTimeout(() => { applyReward(r, c); if (rewardsM && !rewardsM.closed) renderRewards(); }, 500); }
      };
      requestAnimationFrame(step);
    };
    if (mode === 'free') { S.wheel.day = dkey(); save(); refreshDots(); go(); renderSpinLock(); }
    else if (mode === 'gems') { if (spend('gems', 5)) { go(); renderSpinLock(); } }
    else if (mode === 'ad') { renderSpinLock(); CG.rewarded(() => { S.wheel.ad++; go(); }).then((ok) => { if (!ok) { toast(T('ad_unavailable'), true); renderSpinLock(true); } }); }
  }
  function renderSpinLock(undo) { if (undo) return; $$('.sheet .btn').forEach((b) => { if (b.textContent.indexOf(T('free_spin')) >= 0 || b.textContent.indexOf(T('spin_gems')) >= 0 || b.textContent.indexOf(T('ad_spin')) >= 0) b.setAttribute('disabled', ''); }); }

  /* ---------- Shop ---------- */
  function openShop() {
    const m = openModal({ title: T('shop_title'), sheet: true });
    const b = m.body, rebuild = () => { b.textContent = ''; shopItems(b, rebuild); }; rebuild();
  }
  function shopItems(b, rebuild) {
    const card = (pic, name, desc, action) => b.append(h('div', { class: 'card' }, h('div', { class: 'pic' }, pic), h('div', { class: 'txt' }, h('b', null, name), h('small', null, desc)), action));
    const gem = (n, fn) => btn([ico('gem', 20), String(n)], 'blue sm', () => { fn(); rebuild(); });
    const coin = (n, fn) => btn([ico('coin', 20), String(n)], 'gold sm', () => { fn(); rebuild(); });
    if (CG.adsAvailable()) { adDayCheck(); b.append(h('div', { class: 'card' }, h('div', { class: 'pic' }, ico('energy', 40)), h('div', { class: 'txt' }, h('b', null, T('ad_energy')), h('small', null, (6 - S.adDay.energy) + ' ' + T('left'))), adBtn(T('watch_ad'), async () => { await adEnergy(); rebuild(); }, 'sm'))); }
    card(ico('energy', 40), T('refill'), T('refill_d'), gem(10, () => { if (spend('gems', 10)) { S.energy = Math.max(S.energy, maxEnergy()); disp.energy = S.energy; Sfx.energy(); save(); } }));
    card(ico('energy', 40), T('energy25'), '', gem(6, () => { if (spend('gems', 6)) { grant({ energy: 25 }, FX.elCenter($('#modal-root'))); } }));
    card(ico('chest', 40), T('chest_s'), T('chest_s_d'), coin(150, () => { if (spend('coins', 150)) claimChestReward(false); }));
    card(ico('bigchest', 40), T('chest_b'), T('chest_b_d'), gem(8, () => { if (spend('gems', 8)) claimChestReward(true); }));
    card(Art.dom({ k: 'gen', c: 'wood', l: 1 }, 44), T('gen_buy'), T('gen_d'), gem(12, () => { if (spend('gems', 12)) { const c = pick(availChains()); closeAllModals(); switchTab('merge'); setTimeout(() => giveItems([{ k: 'gen', c, l: 1 }], null, null), 250); } }));
    card(h('div', { html: '<svg viewBox="0 0 24 24" width="36" height="36"><path fill="#b58cff" stroke="#5a2aa8" stroke-width="1" d="m4 20 11-11 2 2L6 22zM16 3l1.200 2.800L20 7l-2.800 1.200L16 11l-1.200-2.800L12 7l2.800-1.200z"/></svg>' }), T('wandbuy'), T('wandbuy_d') + ' · ' + T('owned_n', { n: S.wands }), gem(4, () => { if (spend('gems', 4)) { S.wands++; refreshWand(); Sfx.gem(); save(); } }));
    if (S.invOpen < S.inv.length) { const n = S.invOpen, cost = 8 + (n - 2) * 6; card(h('div', { class: 'slot', style: 'width:44px;height:44px' }), T('slot'), T('slot_d'), gem(cost, () => { if (spend('gems', cost)) { S.invOpen++; refreshSlots(); Sfx.gem(); save(); } })); }
  }

  /* ---------- Settings ---------- */
  function openSettings() {
    const tog = (label, on, fn) => { const t = h('div', { class: 'toggle' + (on ? ' on' : '') }); t.addEventListener('click', () => { const v = !t.classList.contains('on'); t.classList.toggle('on', v); fn(v); Sfx.click(); }); return h('div', { class: 'card' }, h('div', { class: 'txt' }, h('b', null, label)), t); };
    const seg = h('div', { class: 'seg' });
    [['en', 'English'], ['lt', 'Lietuvių']].forEach(([code, name]) => seg.append(h('button', { class: LANG === code ? 'on' : '', onclick: () => { setLang(code); m.close(); openSettings(); } }, name)));
    const m = openModal({
      title: T('settings'), content: [
        tog(T('sound'), S.sound, (v) => { S.sound = v; Sfx.setSound(v); save(); }),
        tog(T('music'), S.music, (v) => { S.music = v; Sfx.setMusic(v); save(); }),
        h('div', { class: 'card' }, h('div', { class: 'txt' }, h('b', null, T('language')))), seg,
        btn(T('reset'), 'red full', () => { const c = openModal({ title: T('reset'), content: [h('div', { class: 'center big' }, T('reset_q')), h('div', { class: 'row' }, btn(T('no'), 'gray full', () => c.close()), btn(T('yes'), 'red full', () => { CG.wipe(); S = null; location.reload(); }))] }); })
      ]
    });
  }
  function setLang(code) { LANG = code; S.lang = code; applyLang(); save(); }
  function applyLang() {
    document.documentElement.lang = LANG;
    $$('[data-i18n]').forEach((e) => { e.textContent = T(e.dataset.i18n); });
    $('#tut-skip').textContent = T('skip'); orderEls.forEach((e) => e.remove()); orderEls.clear(); refreshOrders(); info(selected); hudCache = {}; refreshHud();
  }

  /* ---------- Resort view ---------- */
  function switchTab(name) {
    if (name === 'daily') { openRewards(); return; }
    if (name === 'shop') { openShop(); return; }
    if (name === view) return;
    view = name; Sfx.click();
    $('#view-merge').classList.toggle('active', name === 'merge'); $('#view-resort').classList.toggle('active', name === 'resort');
    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    if (name === 'resort') { Scene.resize(); Scene.setStars(S.stars); selectSpot(null); CG.banner('banner'); } else { CG.clearBanner(); layoutBoard(); }
    FX.resize(); refreshDots();
  }
  const isResort = () => view === 'resort';
  function selectSpot(id) {
    buildSel = id; Scene.select(id); const card = $('#build-card');
    if (!id) { card.hidden = true; return; }
    const bd = BUILDS.find((x) => x.id === id), built = !!S.builds[id];
    card.hidden = false; card.textContent = ''; card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
    const perk = T('perk_' + bd.perk, { n: bd.val });
    card.append(h('div', { class: 'txt' }, h('h3', null, T('b_' + id)), h('p', null, T('perk') + ': ' + perk)));
    if (built) card.append(h('span', { class: 'chip big', style: 'color:#2e9a58' }, T('built')));
    else { const b = btn([ico('star', 22), ' ' + bd.cost + ' · ' + T('build')], S.stars >= bd.cost ? 'gold' : 'gray', () => buildSpot(id)); card.append(b); }
  }
  function buildSpot(id) {
    const bd = BUILDS.find((x) => x.id === id); if (S.builds[id]) return;
    if (S.stars < bd.cost) { toast(T('not_enough_stars'), true); Sfx.error(); return; }
    S.stars -= bd.cost; S.builds[id] = true; Scene.setBuilt(S.builds); Scene.build(id); Scene.setStars(S.stars); Sfx.build();
    if (id === 'cabin') S.energy += 20; if (id === 'boat') S.boatT = Date.now() - 600000;
    if (id === 'pier') setTimeout(() => { giveItems([{ k: 'gen', c: 'fish', l: 1 }], null, null); toast(T('unlocked_new') + ' ' + NAMES[LANG].gen.fish); }, 900);
    toast(T('b_' + id) + ' ✓'); selectSpot(id); refreshHud(); refreshDots(); CG.completed(resortPct()); save(true);
    if (Object.keys(S.builds).length === BUILDS.length) { setTimeout(() => { CG.happytime(); Sfx.big(); const r = $('#game').getBoundingClientRect(); FX.confetti(r.width / 2, r.height * 0.3, 120, 220); openModal({ title: T('resort_title'), content: [h('div', { class: 'center big' }, T('all_built')), btn(T('ok'), 'gold full', () => modals[modals.length - 1].close())] }); }, 1200); }
  }

  /* ---------- Tutorial ---------- */
  function tutActive() { return S && S.tut < 9; }
  function tutEvent(ev) {
    if (!tutActive()) return;
    if (ev === 'spawn' && S.tut === 0) S.tut = 1;
    if (ev === 'merge' && S.tut < 2) S.tut = 2;
    if (ev === 'deliver' && S.tut < 3) { S.tut = 3; tutMsgUntil = performance.now() + 6000; }
    save();
  }
  function tutFrame(now) {
    const bar = $('#tut'), hand = $('#hand');
    if (!tutActive() || view !== 'merge' || inputLocked) { bar.hidden = true; hand.hidden = true; return; }
    let text = '', pos = null, to = null;
    if (S.tut === 0) { text = T('tut1'); const gi = S.board.findIndex((it) => it && it.k === 'gen' && it.c === 'wood'); if (gi >= 0) pos = cellFx(gi); }
    else if (S.tut === 1) { text = T('tut2'); const hp = computeHint().filter((i) => S.board[i] && S.board[i].k === 'it'); if (hp.length === 2) { pos = cellFx(hp[0]); to = cellFx(hp[1]); } }
    else if (S.tut === 2) { const o = S.orders.find(orderReady); if (o && orderEls.get(o.id)) { text = T('tut3'); pos = FX.elCenter(orderEls.get(o.id)); pos.y += 10; } else text = T('tut3'); }
    else if (S.tut === 3) { text = T('tut4'); if (now > tutMsgUntil) { S.tut = 9; save(); } }
    bar.hidden = !text; if ($('#tut-text').textContent !== text) $('#tut-text').textContent = text;
    if (pos) {
      hand.hidden = false; hand.style.left = pos.x + 'px'; hand.style.top = pos.y + 'px';
      if (to) { hand.classList.add('drag'); hand.style.setProperty('--dx', (to.x - pos.x) + 'px'); hand.style.setProperty('--dy', (to.y - pos.y) + 'px'); } else hand.classList.remove('drag');
    } else hand.hidden = true;
  }

  /* ---------- per-frame ---------- */
  function frame(dt, now) {
    tutFrame(now);
    const s = Math.floor(now / 1000);
    if (s !== lastSec) { lastSec = s; if (!document.hidden && !adPaused) S.playSec++; tickEnergy(); refreshHud(); if (s % 5 === 0) { refreshDots(); } if (s % 20 === 0) save(); }
  }

  /* ---------- init ---------- */
  function init() {
    $$('.ico').forEach((e) => { e.append(ico(e.dataset.ico, 26)); });
    $$('.tab').forEach((t) => t.addEventListener('click', () => { Sfx.init(); switchTab(t.dataset.tab); }));
    $('#btn-settings').addEventListener('click', () => { Sfx.init(); Sfx.click(); openSettings(); });
    $('#btn-sort').addEventListener('click', () => { Sfx.init(); if (!inputLocked) sortBoard(); });
    $('#btn-wand').addEventListener('click', () => { Sfx.init(); if (inputLocked) return; if (wandMode) { setWand(false); return; } if (S.wands > 0) { Sfx.click(); setWand(true); } else openShop(); });
    $('#btn-time').addEventListener('click', () => { Sfx.click(); Scene.cycleTime(); });
    $('#tut-skip').addEventListener('click', () => { S.tut = 9; save(); });
    Scene.setBuilt(S.builds); Scene.setStars(S.stars);
    Scene.onTap((id) => { if (inputLocked) return; Sfx.click(); selectSpot(id); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modals.length) modals[modals.length - 1].close(); });
    dayRoll(); refreshSlots(); refreshWand(); refreshOrders(); refreshHud(); refreshDots(); info(-1); applyLang();
    disp.coins = S.coins; disp.gems = S.gems; disp.energy = S.energy;
  }
  function setAdPaused(v) { adPaused = v; recalcLock(); }

  return { selectSpot, buildSpot, init, toast, grant, info, refreshHud, refreshOrders, refreshSlots, refreshWand, refreshQuestDot, refreshDots, levelUp, outOfEnergy, confirmUnlock, confirmSell, unlockSlot, tutEvent, tutActive, frame, openModal, switchTab, setAdPaused, recalcLock, isResort, applyLang, dayRoll, adEnergy };
})();
