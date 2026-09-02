import { Question } from '../types/database';
import { LiveGameParticipant, LiveGameRoom, LiveGameStatus } from '../types/liveGame';
import { supabase, isSupabaseConfigured } from './supabase';

const LIVE_GAME_CHANNEL = 'live_game_broadcast_channel';

/**
 * Tạo mã PIN phòng 6 chữ số ngẫu nhiên
 */
export function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Tính điểm theo tốc độ trả lời (Tối đa 1000 điểm / câu)
 * Càng trả lời nhanh điểm càng cao!
 */
export function calculateSpeedPoints(
  isCorrect: boolean,
  responseTimeMs: number,
  timeLimitSeconds: number = 20,
  currentStreak: number = 0
): number {
  if (!isCorrect) return 0;

  const totalTimeMs = timeLimitSeconds * 1000;
  const clampedResponseTime = Math.min(totalTimeMs, Math.max(0, responseTimeMs));

  // Tỷ lệ thời gian: trả lời ngay được 100% điểm, trả lời sát nút được 50% điểm
  const timeRatio = 1 - clampedResponseTime / (2 * totalTimeMs);
  let basePoints = Math.floor(1000 * Math.max(0.5, timeRatio));

  // Thưởng chuỗi trả lời đúng liên tiếp (Streak Bonus)
  if (currentStreak >= 3) {
    basePoints += 100;
  } else if (currentStreak >= 2) {
    basePoints += 50;
  }

  return basePoints;
}

/**
 * Màu sắc & Biểu tượng đặc trưng cho 4 đáp án (Kahoot-style)
 */
export const KAHOOT_COLORS = [
  {
    idx: 0,
    name: 'Đỏ',
    symbol: '▲',
    letter: 'A',
    bg: 'bg-red-600 hover:bg-red-700',
    border: 'border-red-700',
    ring: 'ring-red-300',
    text: 'text-white',
    lightBg: 'bg-red-50 text-red-700 border-red-200',
  },
  {
    idx: 1,
    name: 'Xanh Lam',
    symbol: '◆',
    letter: 'B',
    bg: 'bg-blue-600 hover:bg-blue-700',
    border: 'border-blue-700',
    ring: 'ring-blue-300',
    text: 'text-white',
    lightBg: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    idx: 2,
    name: 'Vàng',
    symbol: '●',
    letter: 'C',
    bg: 'bg-amber-500 hover:bg-amber-600',
    border: 'border-amber-600',
    ring: 'ring-amber-300',
    text: 'text-white',
    lightBg: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    idx: 3,
    name: 'Xanh Lục',
    symbol: '■',
    letter: 'D',
    bg: 'bg-emerald-600 hover:bg-emerald-700',
    border: 'border-emerald-700',
    ring: 'ring-emerald-300',
    text: 'text-white',
    lightBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
];

/**
 * Bộ phát sự kiện Realtime cục bộ (BroadcastChannel) giúp máy chiếu & điện thoại đồng bộ tức thì
 */
export class LiveGameSync {
  private channel: BroadcastChannel | null = null;
  private onMessageCallback?: (event: { type: string; payload: any }) => void;
  private storageHandler?: (e: StorageEvent) => void;
  private roomId: string;

  constructor(roomId: string, onMessage?: (event: { type: string; payload: any }) => void) {
    this.roomId = roomId;
    this.onMessageCallback = onMessage;
    try {
      this.channel = new BroadcastChannel(`geo_live_${roomId}`);
      this.channel.onmessage = (e) => {
        if (this.onMessageCallback) {
          this.onMessageCallback(e.data);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel không được hỗ trợ, chuyển sang fallback:', e);
    }

    // Lắng nghe sự kiện qua storage để hoạt động giữa các cửa sổ/tab
    this.storageHandler = (e: StorageEvent) => {
      if (e.key && e.key.startsWith(`geo_live_event_${this.roomId}_`) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (this.onMessageCallback) {
            this.onMessageCallback(parsed);
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', this.storageHandler);
  }

  broadcast(type: string, payload: any) {
    if (this.channel) {
      this.channel.postMessage({ type, payload });
    }
    // Ghi vào localStorage để kích hoạt event storage giữa các tab
    try {
      const eventKey = `geo_live_event_${this.roomId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      localStorage.setItem(eventKey, JSON.stringify({ type, payload }));
      setTimeout(() => {
        try { localStorage.removeItem(eventKey); } catch (e) {}
      }, 3000);
    } catch (e) {}
  }

  close() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.storageHandler) {
      window.removeEventListener('storage', this.storageHandler);
    }
  }
}

const ACTIVE_ROOMS_KEY = 'geo_active_live_rooms';

export interface ActiveLiveRoom {
  pin: string;
  title: string;
  teacher_name: string;
  grade?: number;
  status: 'lobby' | 'question' | 'result' | 'final_summary' | 'podium' | 'finished';
  total_questions: number;
  created_at: string;
  updated_at: number;
}

/**
 * Đăng ký phòng đấu trực tiếp khi Giáo viên (Cô Hảo) mở phòng
 */
export function registerActiveRoom(room: Partial<ActiveLiveRoom> & { pin: string }): void {
  try {
    const raw = localStorage.getItem(ACTIVE_ROOMS_KEY);
    const rooms: ActiveLiveRoom[] = raw ? JSON.parse(raw) : [];

    const updatedRooms = rooms.filter((r) => r.pin !== room.pin);
    const newRoom: ActiveLiveRoom = {
      pin: room.pin,
      title: room.title || 'Đấu Trường Đố Vui Địa Lí THCS',
      teacher_name: room.teacher_name || 'Cô Dương Thu Hảo',
      grade: room.grade || 7,
      status: room.status || 'lobby',
      total_questions: room.total_questions || 5,
      created_at: room.created_at || new Date().toISOString(),
      updated_at: Date.now(),
    };

    updatedRooms.push(newRoom);
    localStorage.setItem(ACTIVE_ROOMS_KEY, JSON.stringify(updatedRooms));
    window.dispatchEvent(new Event('geo_active_rooms_updated'));
  } catch (e) {
    console.warn('Lỗi đăng ký phòng đấu:', e);
  }
}

/**
 * Xóa phòng đấu khi kết thúc hoặc đóng phòng
 */
export function removeActiveRoom(pin: string): void {
  try {
    const raw = localStorage.getItem(ACTIVE_ROOMS_KEY);
    if (!raw) return;
    const rooms: ActiveLiveRoom[] = JSON.parse(raw);
    const updated = rooms.filter((r) => r.pin !== pin);
    localStorage.setItem(ACTIVE_ROOMS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('geo_active_rooms_updated'));
  } catch (e) {
    console.warn('Lỗi xóa phòng đấu:', e);
  }
}

/**
 * Lấy danh sách các phòng đấu đang mở hợp lệ
 */
export function getActiveRooms(): ActiveLiveRoom[] {
  try {
    const raw = localStorage.getItem(ACTIVE_ROOMS_KEY);
    if (!raw) return [];
    const rooms: ActiveLiveRoom[] = JSON.parse(raw);
    const now = Date.now();
    // Giữ các phòng trong vòng 6 tiếng gần nhất
    return rooms.filter((r) => now - (r.updated_at || 0) < 6 * 60 * 60 * 1000 && r.status !== 'finished');
  } catch (e) {
    console.warn('Lỗi đọc active rooms:', e);
    return [];
  }
}

/**
 * Xác thực mã PIN khi học sinh nhập vào
 */
export function isValidActiveRoom(pin: string): { valid: boolean; room?: ActiveLiveRoom; error?: string } {
  const clean = pin.trim().replace(/\s+/g, '');
  if (!clean || clean.length < 4) {
    return { valid: false, error: 'Vui lòng nhập đúng mã PIN phòng đấu gồm 6 chữ số!' };
  }

  const activeRooms = getActiveRooms();
  const matched = activeRooms.find((r) => r.pin === clean);

  if (!matched) {
    return {
      valid: false,
      error: `❌ Mã PIN [${clean}] không tồn tại hoặc Cô Hảo chưa mở phòng đấu này! Vui lòng kiểm tra mã PIN 6 số trên màn hình máy chiếu của Cô nhé.`,
    };
  }

  if (matched.status === 'finished') {
    return {
      valid: false,
      error: `⏰ Phòng đấu [${clean}] đã kết thúc. Vui lòng chờ Cô Hảo mở phòng đấu mới!`,
    };
  }

  return { valid: true, room: matched };
}
