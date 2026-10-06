'use strict';
/* ===== CrazyGames SDK v3 wrapper =====
 * - Every SDK call is guarded: the game stays fully playable when the SDK script is blocked
 *   (adblock / offline / non-CrazyGames host).
 * - Rewards are granted ONLY from adFinished.  adError always resumes + unmutes.
 * - Add ?mockads=1 to the URL to test rewarded/midgame flows with a fake ad overlay.
 */
const CONFIG = {
  SITELOCK: true,            // set false for local testing on custom hosts
  MIDGAME_MIN_LEVEL: 3,      // first midgame no earlier than level 3 ...
  MIDGAME_MIN_SECONDS: 180,  // ... or 3 minutes of play
  BANNER_MIN_GAP_MS: 35000   // same banner may re-display only after 30 s
};

const CG = (() => {
  let sdk = null, env = 'none', playing = false, adsOK = false, adBusy = false, platMute = false;
  let hooks = { pause() {}, resume() {}, mute() {} };
  let bannerAt = 0, bannerOn = false;
  const mockAds = /[?&]mockads=1/.test(location.search);
  const LS_KEY = 'mergelodge.save.v1';

  function isAllowedHost() {
    if (!CONFIG.SITELOCK) return true;
    const h = location.hostname;
    if (location.protocol === 'file:' || h === '' || h === 'localhost' || h === '127.0.0.1' || h === '[::1]') return true;
    if (/[?&]useLocalSdk=true/.test(location.search)) return true;
    const parts = h.split('.'), idx = parts.indexOf('crazygames');
    return idx !== -1 && idx >= parts.length - 3;
  }

  async function init() {
    try {
      const w = window.CrazyGames;
      if (w && w.SDK) {
        await w.SDK.init();
        sdk = w.SDK; env = sdk.environment || 'unknown';
        try {
          platMute = !!(sdk.game.settings && sdk.game.settings.muteAudio);
          sdk.game.addSettingsChangeListener((s) => { platMute = !!(s && s.muteAudio); hooks.mute(platMute); });
        } catch (e) { /* settings optional */ }
        try { adsOK = env !== 'disabled' && !(await sdk.ad.hasAdblock()); } catch (e) { adsOK = env !== 'disabled'; }
      }
    } catch (e) { console.warn('[CG] SDK init failed – running standalone', e); sdk = null; env = 'none'; }
    if (!sdk && mockAds) adsOK = true;
  }

  const safe = (fn) => { try { return fn(); } catch (e) { console.warn('[CG]', e); } };

  function loadingStart() { if (sdk) safe(() => sdk.game.loadingStart()); }
  function loadingStop() { if (sdk) safe(() => sdk.game.loadingStop()); }
  function gameplayStart() { if (playing) return; playing = true; if (sdk) safe(() => sdk.game.gameplayStart()); }
  function gameplayStop() { if (!playing) return; playing = false; if (sdk) safe(() => sdk.game.gameplayStop()); }
  function happytime() { if (sdk) safe(() => sdk.game.happytime()); }
  function completed(p) { if (sdk) safe(() => sdk.game.reportGameCompletedPercentage(Math.max(0, Math.min(100, Math.round(p))))); }
  function context(o) { if (sdk) safe(() => sdk.game.setGameContext(o)); }

  /* ---- persistence (SDK.data preferred, localStorage fallback) ---- */
  function load() {
    try { if (sdk && env !== 'disabled') { const v = sdk.data.getItem('save'); if (v) return v; } } catch (e) { /* fall through */ }
    try { return localStorage.getItem(LS_KEY); } catch (e) { return null; }
  }
  function save(str) {
    try { if (sdk && env !== 'disabled') { sdk.data.setItem('save', str); return; } } catch (e) { /* fall through */ }
    try { localStorage.setItem(LS_KEY, str); } catch (e) { /* storage unavailable */ }
  }
  function wipe() {
    try { if (sdk && env !== 'disabled') sdk.data.clear(); } catch (e) { /* ignore */ }
    try { localStorage.removeItem(LS_KEY); } catch (e) { /* ignore */ }
  }

  /* ---- ads ---- */
  function adsAvailable() { return adsOK; }
  function request(type) {
    return new Promise((resolve) => {
      if (adBusy || !adsOK) { resolve(false); return; }
      adBusy = true;
      let finished = false, done = false;
      const wasPlaying = playing;
      gameplayStop();
      clearBanner();
      const cleanup = () => {
        if (done) return; done = true; adBusy = false;
        hooks.resume(); hooks.mute(platMute);        // resume + unmute on BOTH finished and error
        if (wasPlaying) gameplayStart();
        resolve(finished);
      };
      const cb = {
        adStarted: () => { hooks.pause(); hooks.mute(true); },
        adFinished: () => { finished = true; cleanup(); },
        adError: (e) => { console.warn('[CG] ad error', e); cleanup(); }
      };
      if (sdk) {
        try { sdk.ad.requestAd(type, cb); } catch (e) { cb.adError(e); }
      } else if (mockAds) {
        cb.adStarted(); mockOverlay(type, () => cb.adFinished());
      } else { cb.adError('no-sdk'); }
    });
  }
  /* rewarded: onReward fires only after adFinished */
  async function rewarded(onReward) { const ok = await request('rewarded'); if (ok && onReward) onReward(); return ok; }
  function midgame() { return request('midgame'); }

  function mockOverlay(type, done) {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#000d;color:#fff;display:grid;place-items:center;font:700 20px system-ui;text-align:center';
    let s = 2; d.textContent = 'MOCK ' + type.toUpperCase() + ' AD… ' + s;
    document.body.appendChild(d);
    const iv = setInterval(() => { s--; d.textContent = 'MOCK ' + type.toUpperCase() + ' AD… ' + s; if (s <= 0) { clearInterval(iv); d.remove(); done(); } }, 1000);
  }

  /* ---- banner (menu-type screens only, never during video ads) ---- */
  function banner(id) {
    if (!sdk || !adsOK || adBusy || bannerOn) return;
    if (Date.now() - bannerAt < CONFIG.BANNER_MIN_GAP_MS) return;
    bannerAt = Date.now(); bannerOn = true;
    try {
      const p = sdk.banner.requestBanner({ id, width: 320, height: 50 });
      if (p && p.catch) p.catch(() => { bannerOn = false; });
    } catch (e) { bannerOn = false; }
  }
  function clearBanner() {
    if (!sdk || !bannerOn) return;
    bannerOn = false; safe(() => sdk.banner.clearAllBanners());
  }

  function setHooks(h) { hooks = Object.assign(hooks, h); }
  return {
    isAllowedHost, init, loadingStart, loadingStop, gameplayStart, gameplayStop, happytime, completed, context,
    load, save, wipe, adsAvailable, rewarded, midgame, banner, clearBanner, setHooks,
    get platformMuted() { return platMute; }, get env() { return env; }, get busy() { return adBusy; }
  };
})();
