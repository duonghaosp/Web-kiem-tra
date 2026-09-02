// Bộ xử lý âm thanh Web Audio API chuẩn, nhẹ, không cần tải file ngoài
class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Tiếng tích tắc đếm ngược
  public playTick(isUrgent: boolean = false) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isUrgent ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isUrgent ? 880 : 440, ctx.currentTime); // A5 hoặc A4
      gain.gain.setValueAtTime(isUrgent ? 0.15 : 0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // Ignored
    }
  }

  // Tiếng chuông hết giờ công bố đáp án
  public playTimesUp() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.3);
      });
    } catch (e) {}
  }

  // Tiếng nhạc vinh quang Fanfare lên bục Top 3
  public playFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [
        { freq: 523.25, time: 0.0, dur: 0.15 }, // C5
        { freq: 659.25, time: 0.15, dur: 0.15 }, // E5
        { freq: 783.99, time: 0.3, dur: 0.15 }, // G5
        { freq: 1046.5, time: 0.45, dur: 0.5 }, // C6
      ];

      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.time);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + n.time);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.time + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + n.time);
        osc.stop(ctx.currentTime + n.time + n.dur);
      });
    } catch (e) {}
  }

  // Tiếng ting ting vui nhộn khi học sinh vừa tham gia phòng
  public playJoin() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [587.33, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.1, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.15);
      });
    } catch (e) {}
  }
}

export const soundFx = new SoundEffectsManager();
