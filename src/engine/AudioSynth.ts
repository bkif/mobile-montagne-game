import { VoiceProfileId, ZoneId } from '../types/game';

interface VoiceSpec {
  type: OscillatorType;
  baseFreq: number;
  variance: number;
  duration: number;
  gain: number;
}

const VOICE_SPECS: Record<VoiceProfileId, VoiceSpec> = {
  narrator: { type: 'triangle', baseFreq: 340, variance: 35, duration: 0.045, gain: 0.05 },
  ibex: { type: 'sawtooth', baseFreq: 195, variance: 28, duration: 0.055, gain: 0.032 },
  cablecar: { type: 'square', baseFreq: 260, variance: 45, duration: 0.042, gain: 0.024 },
  spirit: { type: 'sine', baseFreq: 560, variance: 70, duration: 0.06, gain: 0.045 },
  lantern: { type: 'sine', baseFreq: 440, variance: 50, duration: 0.07, gain: 0.05 },
  campfire: { type: 'triangle', baseFreq: 290, variance: 25, duration: 0.05, gain: 0.04 },
};

const ZONE_ARPEGGIOS: Record<ZoneId, number[]> = {
  forest: [220, 261.63, 329.63, 392, 329.63, 261.63], // Am7 warm
  bridge: [246.94, 293.66, 369.99, 440, 369.99, 293.66], // Bm7 airy
  summit: [261.63, 329.63, 392, 493.88, 523.25, 392], // Cmaj9 starry
};

class AudioSynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private muted = false;
  private startedAmbient = false;
  private currentZone: ZoneId = 'forest';
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
          // Ignore autoplay rejection gracefully
        });
      }

      if (!this.startedAmbient) {
        this.startAmbient();
      }
    } catch {
      // Audio unavailable
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
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

  public setZone(zone: ZoneId): void {
    this.currentZone = zone;
    if (this.windFilter && this.ctx) {
      const targetFreq =
        zone === 'forest' ? 320 : zone === 'bridge' ? 520 : 680;
      this.windFilter.frequency.setTargetAtTime(
        targetFreq,
        this.ctx.currentTime,
        0.6
      );
    }
    if (this.windGain && this.ctx) {
      const targetGain =
        zone === 'forest' ? 0.018 : zone === 'bridge' ? 0.032 : 0.024;
      this.windGain.gain.setTargetAtTime(
        targetGain,
        this.ctx.currentTime,
        0.6
      );
    }
  }

  private startAmbient(): void {
    if (!this.ctx || !this.masterGain || this.startedAmbient) return;
    this.startedAmbient = true;

    try {
      // Soft filtered alpine breeze
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 2.5;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'bandpass';
      this.windFilter.frequency.value = 360;
      this.windFilter.Q.value = 0.8;

      this.windGain = this.ctx.createGain();
      this.windGain.gain.value = 0.02;

      noise.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.masterGain);
      noise.start();

      // Gentle generative arpeggio loop
      this.arpTimer = window.setInterval(() => {
        if (!this.ctx || !this.masterGain || this.muted) return;
        if (this.ctx.state !== 'running') return;
        const notes = ZONE_ARPEGGIOS[this.currentZone];
        const freq = notes[this.arpStep % notes.length];
        this.arpStep = (this.arpStep + 1) % notes.length;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = this.currentZone === 'summit' ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.032, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 1.2);
      }, 950);
    } catch {
      // Ignore ambient failure
    }
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
