// A tiny in-browser score for the experience: four moods that cross-fade, plus a
// few cinematic effects (thunder, whoosh, shimmer, firework boom). Everything is
// synthesized with Web Audio, so there are no music files to load.
let ctx = null;
let master = null;
let musicBus = null;
let sfxBus = null;
let mood = null;
let step = 0;
let nextTime = 0;
let timer = 0;
let muted = false;

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
// moods: tempo, chord roots (midi) per bar, scale for the melody, feel
const MOODS = {
  magic: { bpm: 92, chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]], bells: true, drums: false, pad: 0.05, lead: 0.05 },
  storm: { bpm: 84, chords: [[57, 60, 64], [53, 57, 60], [52, 55, 59], [57, 60, 64]], bells: false, drums: false, pad: 0.07, lead: 0.035, tremolo: true },
  boss: { bpm: 132, chords: [[57, 60, 64], [57, 60, 64], [53, 57, 60], [55, 59, 62]], bells: false, drums: true, pad: 0.05, lead: 0.05, ostinato: true },
  celebrate: { bpm: 120, chords: [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]], bells: true, drums: true, pad: 0.05, lead: 0.07, fanfare: true },
};

function init() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);
  musicBus = ctx.createGain();
  musicBus.gain.value = 0.0;
  musicBus.connect(master);
  sfxBus = ctx.createGain();
  sfxBus.gain.value = 1;
  sfxBus.connect(master);
}

function tone(freq, t, dur, { type = 'sine', vol = 0.1, attack = 0.01, bus = musicBus, detune = 0 } = {}) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  o.detune.value = detune;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g).connect(bus);
  o.start(t);
  o.stop(t + dur + 0.05);
}

let noiseBuf = null;
function noise(t, dur, { vol = 0.2, from = 800, to = 200, q = 0.7, type = 'lowpass', bus = sfxBus, attack = 0.005 } = {}) {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  s.connect(f).connect(g).connect(bus);
  s.start(t);
  s.stop(t + dur + 0.05);
}

// one 16th-note step of the current mood
function schedule(t) {
  const m = MOODS[mood];
  const s16 = 60 / m.bpm / 4;
  const bar = Math.floor(step / 16) % 4;
  const pos = step % 16;
  const chord = m.chords[bar];
  if (pos === 0) {
    // warm pad: two detuned saws per chord note, long and soft
    for (const n of chord) {
      tone(NOTE(n - 12), t, s16 * 16, { type: 'sawtooth', vol: m.pad * 0.35, attack: 0.4, detune: -6 });
      tone(NOTE(n - 12), t, s16 * 16, { type: 'triangle', vol: m.pad, attack: 0.4, detune: 6 });
    }
    tone(NOTE(chord[0] - 24), t, s16 * 15, { type: 'sine', vol: 0.12, attack: 0.05 });
  }
  if (m.tremolo && pos % 2 === 0) tone(NOTE(chord[pos % 3] - 12), t, s16 * 1.8, { type: 'triangle', vol: 0.035, attack: 0.02 });
  if (m.bells && pos % 2 === 0) {
    // harp / music-box arpeggio up and down the chord
    const seq = [0, 1, 2, 1, 2, 3, 2, 1];
    const n = chord[seq[(pos / 2) % 8] % 3] + (seq[(pos / 2) % 8] === 3 ? 12 : 12);
    tone(NOTE(n), t, s16 * 3, { type: 'sine', vol: 0.045 });
    tone(NOTE(n + 12), t, s16 * 2, { type: 'sine', vol: 0.012 });
  }
  if (m.ostinato) tone(NOTE(chord[pos % 2 ? 0 : 2] - 12), t, s16 * 0.9, { type: 'square', vol: 0.03 });
  if (m.fanfare && [0, 6, 8, 12].includes(pos)) {
    const lead = { 0: chord[2] + 12, 6: chord[1] + 12, 8: chord[2] + 12, 12: chord[0] + 24 }[pos];
    tone(NOTE(lead), t, s16 * 3.5, { type: 'sawtooth', vol: 0.03, attack: 0.02 });
    tone(NOTE(lead), t, s16 * 3.5, { type: 'triangle', vol: m.lead, attack: 0.02 });
  } else if (!m.fanfare && !m.ostinato && pos % 8 === 4) {
    tone(NOTE(chord[(bar + 1) % 3] + 24), t, s16 * 6, { type: 'triangle', vol: m.lead * 0.7, attack: 0.08 });
  }
  if (m.drums) {
    if (pos % 4 === 0) { tone(110, t, 0.18, { type: 'sine', vol: 0.18 }); tone(55, t, 0.25, { type: 'sine', vol: 0.15 }); }
    if (pos % 8 === 4) noise(t, 0.12, { vol: 0.06, from: 3000, to: 1500, type: 'bandpass', bus: musicBus });
    if (pos % 2 === 1) noise(t, 0.04, { vol: 0.02, from: 9000, to: 7000, type: 'highpass', bus: musicBus });
  }
}

function tick() {
  if (!ctx || !mood) return;
  while (nextTime < ctx.currentTime + 0.15) {
    schedule(nextTime);
    nextTime += 60 / MOODS[mood].bpm / 4;
    step++;
  }
}

export const music = {
  start(name) {
    init();
    if (ctx.state === 'suspended') ctx.resume();
    if (mood === name) return;
    const t = ctx.currentTime;
    // dip, swap, swell back up so moods cross over smoothly
    musicBus.gain.cancelScheduledValues(t);
    musicBus.gain.setValueAtTime(musicBus.gain.value, t);
    musicBus.gain.linearRampToValueAtTime(0.0001, t + 0.35);
    setTimeout(() => {
      mood = name;
      step = 0;
      nextTime = ctx.currentTime + 0.05;
      const t2 = ctx.currentTime;
      musicBus.gain.setValueAtTime(0.0001, t2);
      musicBus.gain.linearRampToValueAtTime(muted ? 0 : 0.85, t2 + 1.2);
    }, 380);
    if (!timer) timer = setInterval(tick, 50);
  },
  stop() {
    if (!ctx) return;
    musicBus.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    setTimeout(() => { mood = null; }, 700);
  },
  duck(on) {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    musicBus.gain.cancelScheduledValues(t);
    musicBus.gain.setValueAtTime(musicBus.gain.value, t);
    musicBus.gain.linearRampToValueAtTime(on ? 0.3 : 0.85, t + 0.25);
  },
  setMuted(m) {
    muted = m;
    if (!ctx) return;
    master.gain.setValueAtTime(m ? 0 : 0.9, ctx.currentTime);
  },
  unlock() { init(); if (ctx.state === 'suspended') ctx.resume(); },
  // ---- cinematic effects ----
  thunder() {
    if (!ctx) return;
    const t = ctx.currentTime;
    noise(t, 0.25, { vol: 0.5, from: 3000, to: 400, type: 'lowpass' });
    noise(t + 0.1, 2.2, { vol: 0.45, from: 400, to: 40, type: 'lowpass', attack: 0.15 });
  },
  whoosh() {
    if (!ctx) return;
    noise(ctx.currentTime, 1.1, { vol: 0.22, from: 300, to: 4000, type: 'bandpass', q: 1.5, attack: 0.5 });
  },
  shimmer() {
    if (!ctx) return;
    const t = ctx.currentTime;
    [72, 76, 79, 84, 88, 91, 96].forEach((n, i) => tone(NOTE(n), t + i * 0.06, 1.2, { type: 'sine', vol: 0.05, bus: sfxBus }));
  },
  boom() {
    if (!ctx) return;
    const t = ctx.currentTime;
    noise(t, 0.6, { vol: 0.35, from: 1200, to: 80, type: 'lowpass' });
    noise(t + 0.05, 0.9, { vol: 0.08, from: 6000, to: 3000, type: 'highpass', attack: 0.05 });
  },
  rise() {
    if (!ctx) return;
    const t = ctx.currentTime;
    noise(t, 2.2, { vol: 0.18, from: 200, to: 6000, type: 'bandpass', q: 2, attack: 2 });
    [60, 64, 67, 72].forEach((n, i) => tone(NOTE(n), t + 1.4 + i * 0.1, 1.6, { type: 'triangle', vol: 0.06, bus: sfxBus }));
  },
};
