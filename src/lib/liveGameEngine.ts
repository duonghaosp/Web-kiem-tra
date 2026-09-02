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
 * Bộ phát sự kiện Realtime đa kênh (Supabase Realtime Cloud WebSocket + BroadcastChannel cục bộ)
 * Giúp máy chiếu của Cô Hảo & điện thoại di động của học sinh trên lớp đồng bộ tức thì qua Internet!
 */
export class LiveGameSync {
  private channel: BroadcastChannel | null = null;
  private supabaseChannel: any = null;
  private onMessageCallback?: (event: { type: string; payload: any }) => void;
  private storageHandler?: (e: StorageEvent) => void;
  private roomId: string;
  private isSubscribed: boolean = false;
  private pendingQueue: Array<{ type: string; payload: any }> = [];

  constructor(roomId: string, onMessage?: (event: { type: string; payload: any }) => void) {
    this.roomId = roomId;
    this.onMessageCallback = onMessage;

    // 1. Kênh WebSocket Supabase Realtime Cloud (Kết nối điện thoại học sinh & máy chiếu toàn cầu)
    if (isSupabaseConfigured) {
      try {
        this.supabaseChannel = supabase.channel(`live_arena_${roomId}`, {
          config: { broadcast: { self: false } },
        });

        this.supabaseChannel
          .on('broadcast', { event: 'arena_event' }, (msg: any) => {
            if (this.onMessageCallback && msg?.payload) {
              this.onMessageCallback(msg.payload);
            }
          })
          .subscribe((channelStatus: string) => {
            if (channelStatus === 'SUBSCRIBED') {
              this.isSubscribed = true;
              while (this.pendingQueue.length > 0) {
                const item = this.pendingQueue.shift();
                if (item) this.sendSupabaseBroadcast(item.type, item.payload);
              }
            }
          });
      } catch (e) {
        console.warn('Lỗi khởi tạo kênh Supabase Realtime:', e);
      }
    }

    // 2. Kênh BroadcastChannel cục bộ (Hỗ trợ thử nghiệm trên cùng 1 máy tính)
    try {
      this.channel = new BroadcastChannel(`geo_live_${roomId}`);
      this.channel.onmessage = (e) => {
        if (this.onMessageCallback) {
          this.onMessageCallback(e.data);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel không được hỗ trợ:', e);
    }

    // 3. Fallback qua Storage Event (Giữa các tab trình duyệt)
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

  private sendSupabaseBroadcast(type: string, payload: any) {
    if (this.supabaseChannel && this.isSubscribed) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'arena_event',
          payload: { type, payload },
        });
      } catch (err) {
        console.warn('Lỗi gửi qua Supabase channel:', err);
      }
    }
  }

  broadcast(type: string, payload: any) {
    // 1. Phát trực tiếp qua Supabase Cloud cho điện thoại học sinh
    if (this.supabaseChannel) {
      if (this.isSubscribed) {
        this.sendSupabaseBroadcast(type, payload);
      } else {
        this.pendingQueue.push({ type, payload });
      }
    }

    // 2. Phát qua BroadcastChannel cục bộ
    if (this.channel) {
      try {
        this.channel.postMessage({ type, payload });
      } catch (e) {}
    }

    // 3. Ghi vào localStorage kích hoạt sự kiện cục bộ
    try {
      const eventKey = `geo_live_event_${this.roomId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      localStorage.setItem(eventKey, JSON.stringify({ type, payload }));
      setTimeout(() => {
        try { localStorage.removeItem(eventKey); } catch (e) {}
      }, 3000);
    } catch (e) {}
  }

  close() {
    if (this.supabaseChannel) {
      try {
        supabase.removeChannel(this.supabaseChannel);
        this.supabaseChannel = null;
      } catch (e) {}
    }
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
 * Tự động ghi vào cả Supabase Cloud DB và LocalStorage
 */
export function registerActiveRoom(room: Partial<ActiveLiveRoom> & { pin: string }): void {
  const cleanPin = room.pin.trim().replace(/\s+/g, '');
  const title = room.title || 'Đấu Trường Đố Vui Địa Lí THCS';
  const teacherName = room.teacher_name || 'Cô Dương Thu Hảo';
  const grade = room.grade || 7;
  let rawStatus = room.status || 'lobby';
  let dbStatus: string = rawStatus;
  if (rawStatus === 'final_summary') {
    dbStatus = 'leaderboard';
  }
  const totalQuestions = room.total_questions || 5;

  // 1. Lưu trữ LocalStorage cục bộ
  try {
    const raw = localStorage.getItem(ACTIVE_ROOMS_KEY);
    const rooms: ActiveLiveRoom[] = raw ? JSON.parse(raw) : [];
    const updatedRooms = rooms.filter((r) => r.pin !== cleanPin);
    const newRoom: ActiveLiveRoom = {
      pin: cleanPin,
      title,
      teacher_name: teacherName,
      grade,
      status: rawStatus,
      total_questions: totalQuestions,
      created_at: room.created_at || new Date().toISOString(),
      updated_at: Date.now(),
    };
    updatedRooms.push(newRoom);
    localStorage.setItem(ACTIVE_ROOMS_KEY, JSON.stringify(updatedRooms));
    window.dispatchEvent(new Event('geo_active_rooms_updated'));
  } catch (e) {
    console.warn('Lỗi đăng ký phòng đấu trong LocalStorage:', e);
  }

  // 2. Đồng bộ lên Supabase Cloud Database để điện thoại học sinh trên toàn quốc có thể tra cứu
  if (isSupabaseConfigured) {
    supabase
      .from('live_game_rooms')
      .upsert(
        {
          room_code: cleanPin,
          title,
          teacher_name: teacherName,
          status: dbStatus,
          time_per_question: (room as any).time_per_question || 20,
          current_question_index: (room as any).current_question_index || 0,
          questions_json: (room as any).questions || [],
        },
        { onConflict: 'room_code' }
      )
      .then(({ error }) => {
        if (error) {
          console.warn('Lỗi đồng bộ phòng đấu lên Supabase Cloud:', error.message);
        }
      });
  }
}

/**
 * Xóa phòng đấu khi kết thúc hoặc đóng phòng
 */
export function removeActiveRoom(pin: string): void {
  const cleanPin = pin.trim().replace(/\s+/g, '');
  try {
    const raw = localStorage.getItem(ACTIVE_ROOMS_KEY);
    if (raw) {
      const rooms: ActiveLiveRoom[] = JSON.parse(raw);
      const updated = rooms.filter((r) => r.pin !== cleanPin);
      localStorage.setItem(ACTIVE_ROOMS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('geo_active_rooms_updated'));
    }
  } catch (e) {
    console.warn('Lỗi xóa phòng đấu:', e);
  }

  // Cập nhật trạng thái đã kết thúc trên Supabase Cloud
  if (isSupabaseConfigured) {
    supabase
      .from('live_game_rooms')
      .update({ status: 'finished' })
      .eq('room_code', cleanPin)
      .then(() => {});
  }
}

/**
 * Lấy danh sách các phòng đấu đang mở hợp lệ từ LocalStorage
 */
export function getActiveRooms(): ActiveLiveRoom[] {
  try {
    const raw = localStorage.getItem(ACTIVE_ROOMS_KEY);
    if (!raw) return [];
    const rooms: ActiveLiveRoom[] = JSON.parse(raw);
    const now = Date.now();
    return rooms.filter((r) => now - (r.updated_at || 0) < 6 * 60 * 60 * 1000 && r.status !== 'finished');
  } catch (e) {
    console.warn('Lỗi đọc active rooms:', e);
    return [];
  }
}

/**
 * Lấy danh sách các phòng đấu đang mở từ Supabase Cloud (cho điện thoại học sinh)
 */
export async function fetchActiveRooms(): Promise<ActiveLiveRoom[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('live_game_rooms')
        .select('*')
        .neq('status', 'finished')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data && data.length > 0) {
        return data.map((r: any) => ({
          pin: r.room_code,
          title: r.title || 'Đấu Trường Đố Vui Địa Lí THCS',
          teacher_name: r.teacher_name || 'Cô Dương Thu Hảo',
          status: r.status,
          total_questions: Array.isArray(r.questions_json) && r.questions_json.length > 0 ? r.questions_json.length : 5,
          created_at: r.created_at,
          updated_at: new Date(r.created_at).getTime(),
        }));
      }
    } catch (e) {
      console.warn('Lỗi đọc phòng đấu từ Supabase:', e);
    }
  }
  return getActiveRooms();
}

/**
 * Xác thực mã PIN bất đồng bộ - Ưu tiên kiểm tra trên Supabase Cloud DB
 * Đảm bảo học sinh dùng điện thoại 4G hay máy tính ở nhà đều vào được phòng của Cô Hảo 100%!
 */
export async function checkValidActiveRoom(
  pin: string
): Promise<{ valid: boolean; room?: ActiveLiveRoom; error?: string }> {
  const clean = pin.trim().replace(/\s+/g, '');
  if (!clean || clean.length < 4) {
    return { valid: false, error: 'Vui lòng nhập đúng mã PIN phòng đấu gồm 6 chữ số!' };
  }

  // 1. Kiểm tra trực tiếp trên Supabase Cloud (Dành cho điện thoại hoặc thiết bị khác)
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('live_game_rooms')
        .select('*')
        .eq('room_code', clean)
        .maybeSingle();

      if (data) {
        if (data.status === 'finished') {
          return {
            valid: false,
            error: `⏰ Phòng đấu [${clean}] đã kết thúc. Vui lòng chờ Cô Hảo mở phòng đấu mới!`,
          };
        }
        return {
          valid: true,
          room: {
            pin: data.room_code,
            title: data.title,
            teacher_name: data.teacher_name,
            status: data.status,
            total_questions: Array.isArray(data.questions_json) && data.questions_json.length > 0 ? data.questions_json.length : 5,
            created_at: data.created_at,
            updated_at: new Date(data.created_at).getTime(),
          },
        };
      }
    } catch (e) {
      console.warn('Lỗi tra cứu mã PIN trên Supabase:', e);
    }
  }

  // 2. Fallback: Kiểm tra LocalStorage (nếu cùng 1 máy tính thử nghiệm)
  return isValidActiveRoom(clean);
}

/**
 * Xác thực mã PIN đồng bộ (Hỗ trợ fallback)
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

