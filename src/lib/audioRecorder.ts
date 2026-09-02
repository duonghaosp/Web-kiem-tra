import { uploadToStorage } from './supabase';

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  durationSeconds: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
}

export class VoiceNoteRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private timerInterval: any = null;
  private duration = 0;
  private onStateChangeCallback?: (state: AudioRecorderState) => void;

  constructor(onStateChange?: (state: AudioRecorderState) => void) {
    this.onStateChangeCallback = onStateChange;
  }

  private notifyState(isRecording: boolean, isPaused: boolean, blob: Blob | null = null, url: string | null = null) {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({
        isRecording,
        isPaused,
        durationSeconds: this.duration,
        audioBlob: blob,
        audioUrl: url,
      });
    }
  }

  async start(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      this.duration = 0;

      // Chọn mimeType hỗ trợ phổ biến
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else {
          mimeType = '';
        }
      }

      this.mediaRecorder = mimeType ? new MediaRecorder(this.stream, { mimeType }) : new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(200); // 200ms slices

      this.timerInterval = setInterval(() => {
        this.duration += 1;
        this.notifyState(true, false);
      }, 1000);

      this.notifyState(true, false);
      return true;
    } catch (error) {
      console.error('Không thể truy cập Microphone:', error);
      alert('Không thể mở Microphone! Cô vui lòng cấp quyền truy cập Micro trên trình duyệt để ghi âm nhận xét.');
      return false;
    }
  }

  stop(): Promise<{ blob: Blob; url: string } | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);

        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }

        this.notifyState(false, false, blob, url);
        resolve({ blob, url });
      };

      this.mediaRecorder.stop();
    });
  }

  cancel() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.audioChunks = [];
    this.duration = 0;
    this.notifyState(false, false, null, null);
  }

  /**
   * Upload file ghi âm lên Supabase Storage
   */
  async uploadVoiceNote(resultId: string, blob: Blob): Promise<string | null> {
    const filename = `voice_feedback_${resultId}_${Date.now()}.webm`;
    const { url, error } = await uploadToStorage('voice-feedback', filename, blob, blob.type);
    if (error) {
      console.error('Lỗi khi tải ghi âm lên máy chủ:', error);
      return null;
    }
    return url;
  }
}
