// Tiện ích phát âm thanh tương tác êm dịu (Sử dụng Web Audio API tích hợp sẵn của trình duyệt)
// Không cần tải file mp3 bên ngoài, tự động tổng hợp sóng âm ấm áp, mượt mà và cực kỳ nhẹ.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem('geo_sound_enabled');
  return val === null ? true : val === 'true';
}

export function toggleSoundEnabled(): boolean {
  const next = !isSoundEnabled();
  localStorage.setItem('geo_sound_enabled', String(next));
  return next;
}

/**
 * Tiếng click "tách" nhẹ nhàng, ấm tai khi bấm vào các nút con nhộng (Capsule Badges)
 */
export function playSoftClick(): void {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Tần số từ 800Hz hạ nhanh xuống 200Hz tạo tiếng gõ nhẹ như phím bấm cao cấp
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);
  } catch (err) {
    console.debug('Audio not supported or blocked by policy', err);
  }
}

/**
 * Âm thanh chuyển tab / chuyển tuyến hành trình êm dịu (2 nốt thăng hoa)
 */
export function playSwitchTab(): void {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch (err) {
    console.debug('Audio not supported', err);
  }
}

/**
 * Chuông thông báo học sinh vừa nộp bài (Âm thanh trong trẻo, êm dịu, ấm áp)
 * Hợp âm E Major (Mi trưởng): E5 -> G#5 -> B5 -> E6
 */
export function playSubmissionNotificationSound(): void {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [
      { freq: 659.25, time: 0.0, dur: 0.35, gain: 0.12 }, // E5
      { freq: 830.61, time: 0.09, dur: 0.35, gain: 0.14 }, // G#5
      { freq: 987.77, time: 0.18, dur: 0.4, gain: 0.15 }, // B5
      { freq: 1318.51, time: 0.27, dur: 0.65, gain: 0.18 }, // E6
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.time);

      gain.gain.setValueAtTime(n.gain, ctx.currentTime + n.time);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.time + n.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + n.time);
      osc.stop(ctx.currentTime + n.time + n.dur);
    });
  } catch (err) {
    console.debug('Audio not supported or blocked by policy', err);
  }
}

