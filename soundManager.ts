
class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private bgmInterval: number | null = null;

  private init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.2;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 0.2;
    }
    return this.isMuted;
  }

  private playTone(freq: number, type: OscillatorType, start: number, duration: number, volume: number = 1) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(start);
    osc.stop(start + duration);
  }

  playJump() {
    this.init();
    const now = this.ctx!.currentTime;
    this.playTone(150, 'square', now, 0.2, 0.5);
    // Sweep up
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playCoin() {
    this.init();
    const now = this.ctx!.currentTime;
    this.playTone(987.77, 'square', now, 0.1, 0.4); // B5
    this.playTone(1318.51, 'square', now + 0.05, 0.2, 0.4); // E6
  }

  playStomp() {
    this.init();
    const now = this.ctx!.currentTime;
    this.playTone(100, 'sawtooth', now, 0.1, 0.6);
    this.playTone(50, 'sawtooth', now + 0.05, 0.2, 0.4);
  }

  playGameOver() {
    this.init();
    const now = this.ctx!.currentTime;
    const notes = [440, 415, 392, 349];
    notes.forEach((freq, i) => {
      this.playTone(freq, 'square', now + i * 0.2, 0.3, 0.5);
    });
  }

  playLevelStart() {
    this.init();
    const now = this.ctx!.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C-E-G-C
    notes.forEach((freq, i) => {
      this.playTone(freq, 'triangle', now + i * 0.1, 0.4, 0.6);
    });
  }

  startBGM() {
    this.init();
    if (this.bgmInterval) return;
    
    const melody = [261.63, 293.66, 329.63, 349.23, 392.00, 329.63, 261.63, 196.00];
    let step = 0;
    
    this.bgmInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const now = this.ctx.currentTime;
      this.playTone(melody[step % melody.length], 'triangle', now, 0.4, 0.2);
      // Simple bass
      if (step % 2 === 0) {
        this.playTone(melody[step % melody.length] / 2, 'sine', now, 0.4, 0.3);
      }
      step++;
    }, 400);
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const soundManager = new SoundManager();
