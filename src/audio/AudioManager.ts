import type { AudioTrack } from '../utils/constants'

// ─── Procedural Tone Generator ─────────────────────────────────────────────
function synth(
  ctx: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.3,
  fadeIn = 0.01,
): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime)
  gain.gain.setValueAtTime(0, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(gainPeak, ctx.currentTime + fadeIn)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration + 0.05)
}

function noise(ctx: AudioContext, duration: number, gainPeak = 0.15): void {
  const bufSize = ctx.sampleRate * duration
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  const gain = ctx.createGain()
  src.connect(gain)
  gain.connect(ctx.destination)
  gain.gain.setValueAtTime(gainPeak, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  src.start()
}

// ─── Track Definitions ────────────────────────────────────────────────────
type TrackFn = (ctx: AudioContext) => void

const TRACKS: Partial<Record<AudioTrack, TrackFn>> = {
  card_deal: (ctx) => {
    synth(ctx, 820, 0.08, 'triangle', 0.2)
    setTimeout(() => synth(ctx, 640, 0.06, 'triangle', 0.15), 40)
  },
  card_play: (ctx) => {
    synth(ctx, 440, 0.15, 'sine', 0.3)
    setTimeout(() => synth(ctx, 660, 0.12, 'sine', 0.25), 60)
  },
  card_draw: (ctx) => {
    synth(ctx, 380, 0.12, 'triangle', 0.2)
  },
  shuffle: (ctx) => {
    for (let i = 0; i < 6; i++) {
      setTimeout(() => noise(ctx, 0.06, 0.12), i * 50)
    }
  },
  skip: (ctx) => {
    synth(ctx, 330, 0.12, 'sawtooth', 0.15)
    setTimeout(() => synth(ctx, 220, 0.15, 'sawtooth', 0.2), 80)
  },
  reverse: (ctx) => {
    // Descending sweep
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.4)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(); osc.stop(ctx.currentTime + 0.45)
  },
  draw2: (ctx) => {
    synth(ctx, 550, 0.1, 'square', 0.15)
    setTimeout(() => synth(ctx, 550, 0.1, 'square', 0.15), 120)
  },
  wild: (ctx) => {
    // Prismatic chord
    for (const [freq, delay] of [[261, 0], [329, 30], [392, 60], [523, 90]] as [number, number][]) {
      setTimeout(() => synth(ctx, freq, 0.4, 'sine', 0.18), delay)
    }
  },
  wild4: (ctx) => {
    // Big slam
    for (const [freq, delay] of [[130, 0], [185, 40], [261, 80], [370, 120]] as [number, number][]) {
      setTimeout(() => synth(ctx, freq, 0.55, 'sawtooth', 0.22), delay)
    }
    setTimeout(() => noise(ctx, 0.3, 0.18), 60)
  },
  uno_call: (ctx) => {
    synth(ctx, 1047, 0.06, 'sine', 0.3)
    setTimeout(() => synth(ctx, 1319, 0.18, 'sine', 0.35), 80)
  },
  jump_in: (ctx) => {
    synth(ctx, 659, 0.1, 'square', 0.22)
    setTimeout(() => synth(ctx, 880, 0.18, 'square', 0.22), 80)
  },
  win: (ctx) => {
    const chord = [523, 659, 784, 1047]
    chord.forEach((f, i) => setTimeout(() => synth(ctx, f, 0.8, 'sine', 0.25), i * 80))
  },
  lose: (ctx) => {
    synth(ctx, 349, 0.5, 'sine', 0.2)
    setTimeout(() => synth(ctx, 261, 0.7, 'sine', 0.25), 200)
  },
  player_join: (ctx) => {
    synth(ctx, 784, 0.08, 'sine', 0.2)
    setTimeout(() => synth(ctx, 1047, 0.12, 'sine', 0.2), 80)
  },
  player_leave: (ctx) => {
    synth(ctx, 440, 0.12, 'sine', 0.2)
    setTimeout(() => synth(ctx, 330, 0.18, 'sine', 0.2), 80)
  },
  chat_ping: (ctx) => {
    synth(ctx, 1174, 0.06, 'triangle', 0.12)
  },
}

// ─── AudioManager Singleton ───────────────────────────────────────────────
class AudioManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private _masterVolume = 0.85
  private _sfxVolume = 1.0
  private _musicVolume = 0.5
  private enabled = true

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = this._masterVolume
      this.masterGain.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  play(track: AudioTrack): void {
    if (!this.enabled) return
    try {
      const ctx = this.getCtx()
      const fn = TRACKS[track]
      if (fn) fn(ctx)
    } catch (e) {
      // Silently ignore — audio is non-critical
    }
  }

  setMasterVolume(v: number) {
    this._masterVolume = Math.max(0, Math.min(1, v))
    if (this.masterGain) this.masterGain.gain.value = this._masterVolume
  }

  setEnabled(v: boolean) { this.enabled = v }
  getMasterVolume() { return this._masterVolume }
}

export const audioManager = new AudioManager()

// ─── Convenience hook ──────────────────────────────────────────────────────
export function useAudio() {
  return {
    play: (track: AudioTrack) => audioManager.play(track),
    setVolume: (v: number) => audioManager.setMasterVolume(v),
    setEnabled: (v: boolean) => audioManager.setEnabled(v),
  }
}
