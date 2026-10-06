'use strict';
/* ===== Procedural audio (WebAudio) – no asset files needed ===== */
const Sfx = (() => {
  let ctx = null, master = null, musicGain = null, noiseBuf = null;
  let soundOn = true, musicOn = true, musicTimer = null, started = false, forced = false;
  const PENT = [0, 2, 4, 7, 9];

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = forced ? 0 : 0.7; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.16; musicGain.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    started = true;
    if (musicOn) startMusic();
  }
  const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);

  function tone(freq, t0, dur, type, vol, slideTo, dest) {
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, vol, f0, f1) {
    if (!ctx) return;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t0); s.stop(t0 + dur + 0.05);
  }
  function play(fn) { if (!soundOn || forced || !ctx) return; fn(ctx.currentTime); }

  const api = {
    init,
    /* platform / ad mute – overrides in-game toggles (CrazyGames requirement) */
    forceMute(v) { forced = !!v; if (master) master.gain.value = forced ? 0 : 0.7; },
    setSound(v) { soundOn = v; },
    setMusic(v) { musicOn = v; if (v) startMusic(); else stopMusic(); },
    click() { play(t => tone(620, t, 0.07, 'triangle', 0.18, 880)); },
    pop() { play(t => { tone(380, t, 0.12, 'sine', 0.3, 760); noise(t, 0.08, 0.05, 1500, 3000); }); },
    spawn() { play(t => { noise(t, 0.18, 0.12, 500, 2400); tone(300, t, 0.16, 'sine', 0.2, 620); }); },
    merge(level, combo) {
      play(t => {
        const base = 60 + level * 2 + Math.min(combo || 0, 6);
        [0, 4, 7, 12].slice(0, 2 + Math.min(level, 3)).forEach((s, i) => tone(hz(base + s), t + i * 0.055, 0.28, 'triangle', 0.22));
        tone(hz(base - 12), t, 0.2, 'sine', 0.2);
      });
    },
    big() {
      play(t => {
        [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone(hz(67 + s), t + i * 0.07, 0.5, 'triangle', 0.22));
        noise(t, 0.6, 0.12, 800, 6000);
      });
    },
    coin() { play(t => { tone(hz(88), t, 0.09, 'square', 0.1); tone(hz(95), t + 0.07, 0.22, 'square', 0.1); }); },
    gem() { play(t => [88, 92, 95, 100].forEach((n, i) => tone(hz(n), t + i * 0.05, 0.25, 'sine', 0.14))); },
    energy() { play(t => tone(300, t, 0.25, 'sawtooth', 0.1, 1200)); },
    error() { play(t => { tone(180, t, 0.16, 'square', 0.12, 120); tone(150, t + 0.12, 0.2, 'square', 0.12, 100); }); },
    deliver() { play(t => [72, 76, 79, 84].forEach((n, i) => tone(hz(n), t + i * 0.08, 0.3, 'triangle', 0.2))); },
    levelup() { play(t => [64, 67, 72, 76, 79, 84].forEach((n, i) => tone(hz(n), t + i * 0.1, 0.45, 'triangle', 0.22))); },
    build() { play(t => { for (let i = 0; i < 3; i++) { tone(110, t + i * 0.16, 0.12, 'square', 0.2, 55); noise(t + i * 0.16, 0.1, 0.1, 400, 200); } [72, 76, 79, 84].forEach((n, i) => tone(hz(n), t + 0.55 + i * 0.09, 0.35, 'triangle', 0.18)); }); },
    chest() { play(t => { noise(t, 0.25, 0.14, 300, 1800); [67, 71, 74, 79].forEach((n, i) => tone(hz(n), t + 0.15 + i * 0.07, 0.3, 'triangle', 0.18)); }); },
    tick() { play(t => tone(1200 + Math.random() * 200, t, 0.03, 'square', 0.05)); },
    sell() { play(t => { tone(900, t, 0.06, 'square', 0.1); tone(1300, t + 0.05, 0.1, 'square', 0.1); }); },
    whoosh() { play(t => noise(t, 0.25, 0.1, 400, 3000)); }
  };

  /* Gentle generative pentatonic pad + plucks */
  function startMusic() {
    if (!ctx || musicTimer) return;
    let step = 0;
    const root = 55; // A
    const chords = [[0, 7, 12], [-3, 4, 9], [-5, 2, 7], [-7, 0, 5]];
    const tick = () => {
      if (!musicOn || !ctx) return;
      const t = ctx.currentTime + 0.05;
      const bar = Math.floor(step / 8) % chords.length;
      if (step % 8 === 0) {
        chords[bar].forEach(n => tone(hz(root + 12 + n), t, 3.6, 'sine', 0.35, null, musicGain));
      }
      if (Math.random() < 0.7) {
        const n = PENT[Math.floor(Math.random() * PENT.length)] + 12 * (1 + Math.floor(Math.random() * 2));
        tone(hz(root + 24 + n), t, 1.2, 'triangle', 0.22, null, musicGain);
      }
      step++;
    };
    tick();
    musicTimer = setInterval(tick, 480);
  }
  function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }
  return api;
})();
