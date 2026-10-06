'use strict';
/* ===== Boot sequence (CrazyGames contract): init -> loadingStart -> load -> loadingStop -> gameplayStart ===== */
(function () {
  /* required HTML5 fixes */
  window.addEventListener('wheel', (e) => { if (!(e.target.closest && e.target.closest('.body'))) e.preventDefault(); }, { passive: false });
  window.addEventListener('keydown', (e) => { if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault(); });
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  /* iOS suspends AudioContext – resume from a real user gesture */
  ['pointerdown', 'touchstart', 'keydown'].forEach((ev) => document.addEventListener(ev, () => Sfx.init(), { passive: true }));

  async function boot() {
    if (!CG.isAllowedHost()) { $('#lock-msg').textContent = T('sitelock'); $('#lock').hidden = false; $('#game').style.display = 'none'; return; }
    await CG.init();                       // 1) SDK.init() before anything else
    CG.loadingStart();                     // 2)
    loadState();                           // everything is procedural – nothing to download
    Sfx.setSound(S.sound); Sfx.setMusic(S.music); Sfx.forceMute(CG.platformMuted);
    initBoard($('#board')); Scene.init($('#scene')); FX.init($('#fx'), $('#game'));
    UI.init();
    CG.setHooks({ pause: () => UI.setAdPaused(true), resume: () => UI.setAdPaused(false), mute: (v) => Sfx.forceMute(v || document.hidden) });
    const ro = new ResizeObserver(() => { layoutBoard(); Scene.resize(); FX.resize(); });
    ro.observe($('#game')); ro.observe($('#board-wrap'));
    CG.loadingStop();                      // 3)
    CG.context({ level: S.lvl });
    CG.completed(resortPct());
    requestAnimationFrame((t) => { last = t; loop(t); });
    CG.gameplayStart();                    // 4) straight into gameplay – no splash, no click gate
  }

  let last = 0;
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;   // time-based animation = identical at 60/120/144 Hz
    if (!document.hidden) {
      if (UI.isResort()) Scene.render(now); else { drawBoard(now); updateHint(now); }
      FX.frame(dt); UI.frame(dt, now);
    }
    requestAnimationFrame(loop);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { CG.gameplayStop(); Sfx.forceMute(true); if (S) save(true); }
    else { Sfx.forceMute(CG.platformMuted); UI.recalcLock(); tickEnergy(); }
  });
  window.addEventListener('pagehide', () => { if (S) save(true); });

  boot().catch((e) => console.error('boot failed', e));
})();
