import { ActId, FootstepTerrain, VoiceProfileId } from '../types/game';

const MUTE_STORAGE_KEY = 'echo_du_col_muted_v1';

interface VoiceSpec {
  type: OscillatorType;
  baseFreq: number;
  variance: number;
  duration: number;
  gain: number;
}

const VOICE_SPECS: Record<VoiceProfileId, VoiceSpec> = {
  narrator: { type: 'triangle', baseFreq: 340, variance: 35, duration: 0.045, gain: 0.05 },
  maren: { type: 'triangle', baseFreq: 260, variance: 28, duration: 0.055, gain: 0.048 },
  soren: { type: 'square', baseFreq: 310, variance: 42, duration: 0.038, gain: 0.025 },
  leo: { type: 'sine', baseFreq: 420, variance: 45, duration: 0.05, gain: 0.045 },
  lynx: { type: 'sawtooth', baseFreq: 185, variance: 30, duration: 0.05, gain: 0.03 },
  cerf: { type: 'sine', baseFreq: 230, variance: 25, duration: 0.07, gain: 0.048 },
  gypaete: { type: 'triangle', baseFreq: 520, variance: 65, duration: 0.048, gain: 0.042 },
  monolith: { type: 'sine', baseFreq: 165, variance: 18, duration: 0.09, gain: 0.055 },
  campfire: { type: 'triangle', baseFreq: 290, variance: 25, duration: 0.05, gain: 0.04 },
};

const ACT_ARPEGGIOS: Record<ActId, number[]> = {
  1: [220, 261.63, 329.63, 392, 329.63, 261.63],
  2: [246.94, 293.66, 369.99, 440, 369.99, 293.66],
  3: [261.63, 311.13, 392, 466.16, 392, 311.13],
  4: [293.66, 349.23, 440, 523.25, 587.33, 440],
};

function readInitialMute(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

class AudioSynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted = readInitialMute();
  private startedAmbient = false;
  private currentAct: ActId = 1;
  private windGustActive = false;
  private arpStep = 0;
  private arpTimer: number | null = null;
  private lastBlipAt = 0;

  public unlock(): void {
    if (typeof window === 'undefined') return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    try {
      if (!this.ctx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : 0.65;
        this.masterGain.connect(this.ctx.destination);
      }

      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {
          // Gracefully ignore autoplay suspension
        });
      }

      if (!this.startedAmbient) {
        this.startAmbient();
      }
    } catch {
      // Web Audio unavailable
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(MUTE_STORAGE_KEY, mute ? '1' : '0');
      }
    } catch {
      // Ignore storage error
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        mute ? 0 : 0.65,
        this.ctx.currentTime,
        0.04
      );
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public setAct(actId: ActId): void {
    this.currentAct = actId;
    this.updateWindModulation();
  }

  public setWindGustActive(active: boolean): void {
    if (this.windGustActive === active) return;
    this.windGustActive = active;
    this.updateWindModulation();
  }

  private updateWindModulation(): void {
    if (!this.ctx || !this.windFilter || !this.windGain) return;
    const baseFreq =
      this.currentAct === 1
        ? 300
        : this.currentAct === 2
        ? 440
        : this.currentAct === 3
        ? 620
        : 520;
    const baseGain =
      this.currentAct === 1
        ? 0.015
        : this.currentAct === 2
        ? 0.022
        : this.currentAct === 3
        ? 0.032
        : 0.024;

    const targetFreq = this.windGustActive ? baseFreq + 420 : baseFreq;
    const targetGain = this.windGustActive ? baseGain * 2.4 : baseGain;

    this.windFilter.frequency.setTargetAtTime(
      targetFreq,
      this.ctx.currentTime,
      0.35
    );
    this.windGain.gain.setTargetAtTime(
      targetGain,
      this.ctx.currentTime,
      0.35
    );
  }

  private ensureNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (this.noiseBuffer) return this.noiseBuffer;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.03 * white) / 1.03;
      lastOut = data[i];
      data[i] *= 2.4;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  private startAmbient(): void {
    if (!this.ctx || !this.masterGain || this.startedAmbient) return;
    this.startedAmbient = true;

    try {
      const buffer = this.ensureNoiseBuffer();
      if (buffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        this.windFilter = this.ctx.createBiquadFilter();
        this.windFilter.type = 'bandpass';
        this.windFilter.frequency.value = 320;
        this.windFilter.Q.value = 0.85;

        this.windGain = this.ctx.createGain();
        this.windGain.gain.value = 0.016;

        noise.connect(this.windFilter);
        this.windFilter.connect(this.windGain);
        this.windGain.connect(this.masterGain);
        noise.start();
        this.updateWindModulation();
      }

      this.arpTimer = window.setInterval(() => {
        if (!this.ctx || !this.masterGain || this.muted) return;
        if (this.ctx.state !== 'running') return;
        const notes = ACT_ARPEGGIOS[this.currentAct];
        const freq = notes[this.arpStep % notes.length];
        this.arpStep = (this.arpStep + 1) % notes.length;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = this.currentAct === 4 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.03, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 1.2);
      }, 950);
    } catch {
      // Ignore ambient error
    }
  }

  public playFootstep(terrain: FootstepTerrain): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    if (this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    if (terrain === 'stone') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160 + Math.random() * 28, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.04);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.05);
      return;
    }

    const buffer = this.ensureNoiseBuffer();
    if (!buffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = terrain === 'snow' ? 'highpass' : 'lowpass';
    filter.frequency.value = terrain === 'snow' ? 1400 : 420;

    const gain = this.ctx.createGain();
    const peak = terrain === 'snow' ? 0.045 : 0.035;
    gain.gain.setValueAtTime(peak, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now, Math.random() * 1.2, 0.07);
  }

  public playBellPulse(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    if (this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const harmonics = [587.33, 880, 1174.66];
    harmonics.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.06 / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85 - i * 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.9);
    });
  }

  public playDash(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    if (this.ctx.state !== 'running') return;
    const buffer = this.ensureNoiseBuffer();
    if (!buffer) return;

    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(340, now + 0.16);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now, 0.1, 0.18);
  }

  public playCairnRebuild(): void {
    this.playSequence([196, 293.66, 392, 587.33], 'triangle', 0.1, 0.06);
  }

  public playClimb(): void {
    this.playSequence([246.94, 329.63, 440], 'triangle', 0.08, 0.05);
  }

  public playVoiceBlip(voice: VoiceProfileId): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    if (this.ctx.state !== 'running') return;

    const nowMs = performance.now();
    if (nowMs - this.lastBlipAt < 38) return;
    this.lastBlipAt = nowMs;

    const spec = VOICE_SPECS[voice];
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = spec.type;
    const jitter = (Math.random() - 0.5) * spec.variance;
    osc.frequency.setValueAtTime(spec.baseFreq + jitter, now);

    gain.gain.setValueAtTime(spec.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + spec.duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + spec.duration + 0.01);
  }

  public playUiSelect(): void {
    this.playTone(520, 'square', 0.05, 0.035);
  }

  public playItemPickup(): void {
    this.playSequence([523.25, 659.25, 783.99], 'triangle', 0.09, 0.055);
  }

  public playSaveChime(): void {
    this.playSequence([392, 493.88, 587.33, 783.99], 'sine', 0.14, 0.065);
  }

  public playPacifySuccess(): void {
    this.playSequence([329.63, 415.3, 493.88, 659.25, 830.61], 'sine', 0.16, 0.075);
  }

  public playNoteCollect(): void {
    this.playSequence([659.25, 880], 'sine', 0.07, 0.05);
  }

  public playHitSoft(): void {
    this.playTone(155, 'triangle', 0.11, 0.06);
  }

  private playTone(
    freq: number,
    type: OscillatorType,
    duration: number,
    peakGain: number
  ): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    if (this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(peakGain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  private playSequence(
    freqs: number[],
    type: OscillatorType,
    stepSeconds: number,
    peakGain: number
  ): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    if (this.ctx.state !== 'running') return;

    const baseTime = this.ctx.currentTime;
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const start = baseTime + idx * stepSeconds * 0.75;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(peakGain, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + stepSeconds * 1.4);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + stepSeconds * 1.5);
    });
  }

  public dispose(): void {
    if (this.arpTimer !== null) {
      window.clearInterval(this.arpTimer);
      this.arpTimer = null;
    }
  }
}

export const audioSynth = new AudioSynthEngine();
