/**
 * Web Audio API Retro Sound Effects & Chiptune BGM Generator
 * No external sound files required for instant loading and 100% offline reliability.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isBgmPlaying = false;
  private bgmInterval: number | null = null;
  private sfxVolume = 0.5;
  private bgmVolume = 0.3;
  private sfxMuted = false;
  private bgmMuted = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.bgmMuted ? 0 : this.bgmVolume;
      this.bgmGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxMuted ? 0 : this.sfxVolume;
      this.sfxGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public updateVolumes(sfxVol: number, bgmVol: number, sfxMute: boolean, bgmMute: boolean) {
    this.sfxVolume = sfxVol;
    this.bgmVolume = bgmVol;
    this.sfxMuted = sfxMute;
    this.bgmMuted = bgmMute;

    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxMuted ? 0 : this.sfxVolume;
    }
    if (this.bgmGain) {
      this.bgmGain.gain.value = this.bgmMuted ? 0 : this.bgmVolume;
    }
  }

  // --- SOUND EFFECTS ---

  public playLaser(weaponLevel = 1) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = weaponLevel > 2 ? 'sawtooth' : 'square';
    const baseFreq = 800 + weaponLevel * 100;
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  public playEnemyLaser() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playExplosion(isBoss = false) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;

    const duration = isBoss ? 0.8 : 0.25;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isBoss ? 400 : 800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isBoss ? 0.6 : 0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
    noise.stop(this.ctx.currentTime + duration);
  }

  public playPowerUp() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C E G C E
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.05);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.05 + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(this.ctx.currentTime + i * 0.05);
      osc.stop(this.ctx.currentTime + i * 0.05 + 0.1);
    });
  }

  public playGemCollect() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
    osc.frequency.setValueAtTime(1318.51, this.ctx.currentTime + 0.05); // E6

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  public playBomb() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);

    // Add noise layer
    this.playExplosion(true);
  }

  public playPlayerHit() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.setValueAtTime(80, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  public playStageClear() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;

    const notes = [392, 523.25, 659.25, 783.99]; // G4 C5 E5 G5
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.12 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(this.ctx.currentTime + idx * 0.12);
      osc.stop(this.ctx.currentTime + idx * 0.12 + 0.2);
    });
  }

  public playButtonClick() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(900, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  // --- BACKGROUND CHIPTUNE MUSIC ---

  public startBgm() {
    if (this.isBgmPlaying) return;
    this.initCtx();
    if (!this.ctx || !this.bgmGain) return;

    this.isBgmPlaying = true;
    let step = 0;

    // Upbeat Galaxian style retro arpeggio baseline
    const bassline = [110, 110, 146.83, 130.81, 110, 110, 164.81, 146.83]; // A2, D3, C3, E3
    const melody = [440, 523.25, 659.25, 523.25, 587.33, 659.25, 783.99, 659.25];

    this.bgmInterval = window.setInterval(() => {
      if (!this.ctx || !this.bgmGain || this.bgmMuted || !this.isBgmPlaying) return;

      const time = this.ctx.currentTime;

      // Bass note
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassline[step % bassline.length], time);
      bassGain.gain.setValueAtTime(0.08, time);
      bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      bassOsc.connect(bassGain);
      bassGain.connect(this.bgmGain);
      bassOsc.start(time);
      bassOsc.stop(time + 0.15);

      // Melody note
      if (step % 2 === 0) {
        const melOsc = this.ctx.createOscillator();
        const melGain = this.ctx.createGain();
        melOsc.type = 'square';
        melOsc.frequency.setValueAtTime(melody[(step / 2) % melody.length], time);
        melGain.gain.setValueAtTime(0.05, time);
        melGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

        melOsc.connect(melGain);
        melGain.connect(this.bgmGain);
        melOsc.start(time);
        melOsc.stop(time + 0.2);
      }

      step++;
    }, 180);
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const soundEngine = new SoundEngine();
