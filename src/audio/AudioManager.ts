/**
 * AudioManager.ts — Howler.js + Web Audio API procedural audio
 * All sounds are procedurally generated — no file dependencies
 * Designed to hot-swap real audio files when added
 */

export type SoundName =
  | 'card_deal' | 'card_play' | 'card_draw' | 'shuffle'
  | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4'
  | 'uno_call' | 'jump_in' | 'win' | 'lose'
  | 'player_join' | 'player_leave' | 'chat_ping'
  | 'button_click' | 'color_pick';

// ---- Web Audio API context ----
let _ctx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  return _ctx;
}

// ---- Procedural sound generators ----

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainValue: number = 0.15,
  detune: number = 0
): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  osc.detune.setValueAtTime(detune, ctx.currentTime);

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, gainValue: number = 0.05): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2000;
  filter.Q.value = 0.3;

  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  gain.gain.setValueAtTime(gainValue, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  source.start();
  source.stop(ctx.currentTime + duration);
}

// ---- Sound map ----

const SOUND_GENERATORS: Record<SoundName, () => void> = {
  card_deal: () => {
    playNoise(0.08, 0.08);
    playTone(800, 0.06, 'triangle', 0.08);
  },
  card_play: () => {
    playNoise(0.1, 0.1);
    playTone(600, 0.12, 'triangle', 0.1);
    setTimeout(() => playTone(900, 0.06, 'sine', 0.06), 40);
  },
  card_draw: () => {
    playNoise(0.07, 0.06);
    playTone(400, 0.08, 'triangle', 0.07);
  },
  shuffle: () => {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => playNoise(0.06, 0.07), i * 40);
    }
  },
  skip: () => {
    playTone(600, 0.12, 'sawtooth', 0.1);
    setTimeout(() => playTone(300, 0.15, 'sawtooth', 0.08), 80);
  },
  reverse: () => {
    playTone(880, 0.08, 'sine', 0.12);
    setTimeout(() => playTone(660, 0.08, 'sine', 0.12), 80);
    setTimeout(() => playTone(880, 0.08, 'sine', 0.12), 160);
  },
  draw2: () => {
    playTone(440, 0.1, 'square', 0.08);
    setTimeout(() => playTone(440, 0.1, 'square', 0.08), 100);
  },
  wild: () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    [261, 329, 392, 523].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.3, 'sine', 0.12), i * 60);
    });
  },
  wild4: () => {
    [261, 329, 392, 523].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.4, 'sine', 0.15), i * 50);
    });
    setTimeout(() => playNoise(0.3, 0.12), 150);
  },
  uno_call: () => {
    playTone(880, 0.05, 'square', 0.2);
    setTimeout(() => playTone(1100, 0.15, 'sine', 0.18), 60);
    setTimeout(() => playTone(880, 0.2, 'sine', 0.15), 140);
  },
  jump_in: () => {
    playTone(1320, 0.05, 'sawtooth', 0.15);
    setTimeout(() => playTone(1760, 0.12, 'sine', 0.12), 40);
  },
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.5, 'sine', 0.15), i * 120);
    });
    setTimeout(() => playNoise(0.4, 0.1), 480);
  },
  lose: () => {
    [784, 659, 523, 392].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.4, 'triangle', 0.12), i * 100);
    });
  },
  player_join: () => {
    playTone(660, 0.08, 'sine', 0.1);
    setTimeout(() => playTone(880, 0.12, 'sine', 0.1), 80);
  },
  player_leave: () => {
    playTone(880, 0.08, 'sine', 0.1);
    setTimeout(() => playTone(660, 0.12, 'sine', 0.08), 80);
  },
  chat_ping: () => playTone(1200, 0.06, 'sine', 0.06),
  button_click: () => playTone(600, 0.05, 'triangle', 0.08),
  color_pick: () => {
    playTone(800, 0.1, 'sine', 0.1);
    setTimeout(() => playTone(1000, 0.08, 'sine', 0.08), 60);
  },
};

// ---- Volume controls ----
let _masterVolume = 1.0;
let _sfxEnabled = true;
let _musicEnabled = true;

// ---- Public API ----

export const AudioManager = {
  play(sound: SoundName): void {
    if (!_sfxEnabled || _masterVolume === 0) return;
    try {
      SOUND_GENERATORS[sound]?.();
    } catch (e) {
      // Silently ignore audio context errors
    }
  },

  setMasterVolume(vol: number): void {
    _masterVolume = Math.max(0, Math.min(1, vol));
  },

  setSfxEnabled(enabled: boolean): void {
    _sfxEnabled = enabled;
  },

  setMusicEnabled(enabled: boolean): void {
    _musicEnabled = enabled;
  },

  getMasterVolume(): number {
    return _masterVolume;
  },

  isSfxEnabled(): boolean {
    return _sfxEnabled;
  },

  /** Resume context after user gesture */
  resume(): void {
    _ctx?.resume();
  },
};
