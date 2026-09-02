import { getStoredStudents } from './studentsData';

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: 'Moon' | 'Award' | 'Trophy' | 'Compass' | 'MapPin' | 'Globe' | 'Sparkles' | 'Star' | 'Flame';
  xp_reward: number;
  category: 'effort' | 'accuracy' | 'progress' | 'mastery';
}

export const ALL_BADGES: BadgeItem[] = [
  {
    id: 'cu_dem_cham_chi',
    name: 'Cú Đêm Chăm Chỉ',
    description: 'Hoàn thành bài kiểm tra đúng hạn',
    icon: 'Moon',
    xp_reward: 50,
    category: 'effort',
  },
  {
    id: 'chuyen_gia_trac_nghiem',
    name: 'Chuyên Gia Trắc Nghiệm',
    description: 'Đạt điểm tối đa phần trắc nghiệm',
    icon: 'Award',
    xp_reward: 100,
    category: 'accuracy',
  },
  {
    id: 'ngoi_sao_tien_bo',
    name: 'Ngôi Sao Tiến Bộ',
    description: 'Có sự tiến bộ vượt bậc so với bài trước',
    icon: 'Star',
    xp_reward: 80,
    category: 'progress',
  },
  {
    id: 'cay_but_tu_luan',
    name: 'Cây Bút Xuất Sắc',
    description: 'Bài tự luận lập luận chặt chẽ, sâu sắc',
    icon: 'Sparkles',
    xp_reward: 100,
    category: 'accuracy',
  },
  {
    id: 'nha_dia_li_nhi',
    name: 'Nhà Địa Lí Nhí',
    description: 'Tích lũy đạt Cấp độ Level cao',
    icon: 'Compass',
    xp_reward: 80,
    category: 'mastery',
  },
  {
    id: 'tham_hiem_ban_do',
    name: 'Thám Hiểm Bản Đồ',
    description: 'Đọc Atlat và xác định vị trí xuất sắc',
    icon: 'MapPin',
    xp_reward: 70,
    category: 'accuracy',
  },
  {
    id: 'am_hieu_dia_li_vn',
    name: 'Am Hiểu Địa Lí VN',
    description: 'Xuất sắc các câu hỏi Địa lí Việt Nam',
    icon: 'Globe',
    xp_reward: 90,
    category: 'mastery',
  },
  {
    id: 'top_1_game',
    name: 'Chiến Binh Đấu Trường',
    description: 'Dẫn đầu bảng xếp hạng đấu trực tiếp',
    icon: 'Trophy',
    xp_reward: 150,
    category: 'mastery',
  },
];

const STORAGE_KEY = 'geo_student_badges';

function normalizeStr(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

/**
 * Tìm tất cả các định danh tương đương của 1 học sinh
 * (Mã số HS071, ID s_7_1, Username lananh_7a1, Họ tên có dấu, Họ tên không dấu, v.v.)
 */
export function getStudentLookupKeys(studentIdentifier: string, studentName?: string): string[] {
  const keys = new Set<string>();

  const addVariants = (val: string) => {
    if (!val) return;
    const raw = val.trim();
    if (!raw) return;
    keys.add(raw);
    keys.add(raw.toUpperCase());
    keys.add(raw.toLowerCase());
    keys.add(raw.toLowerCase().replace(/[^a-z0-9]/g, ''));
    keys.add(normalizeStr(raw));
    keys.add(normalizeStr(raw).replace(/[^a-z0-9]/g, ''));
  };

  if (studentIdentifier) addVariants(studentIdentifier);
  if (studentName) addVariants(studentName);

  try {
    const all = getStoredStudents();
    const idLower = studentIdentifier ? studentIdentifier.toLowerCase().trim() : '';
    const nameNorm = studentName ? normalizeStr(studentName) : (studentIdentifier ? normalizeStr(studentIdentifier) : '');
    const cleanId = idLower ? idLower.replace(/[^a-z0-9]/g, '') : '';

    const found = all.find((s) => {
      const sCode = (s.student_code || '').toLowerCase();
      const sId = (s.id || '').toLowerCase();
      const sUname = (s.username || '').toLowerCase();
      const sNameNorm = normalizeStr(s.full_name || '');

      return (
        (idLower && (sCode === idLower || sId === idLower || sUname === idLower || sCode.replace(/[^a-z0-9]/g, '') === cleanId)) ||
        (nameNorm && sNameNorm === nameNorm) ||
        (nameNorm && sNameNorm.replace(/[^a-z0-9]/g, '') === nameNorm.replace(/[^a-z0-9]/g, ''))
      );
    });

    if (found) {
      if (found.student_code) addVariants(found.student_code);
      if (found.id) addVariants(found.id);
      if (found.username) addVariants(found.username);
      if (found.full_name) addVariants(found.full_name);
    }
  } catch (e) {
    console.warn('Lỗi tra cứu alias học sinh:', e);
  }

  return Array.from(keys);
}

/**
 * Đọc danh sách ID các huy hiệu đã được Cô Hảo trao tặng cho học sinh
 */
export function getStudentBadges(studentCodeOrId: string, studentName?: string): string[] {
  if (!studentCodeOrId && !studentName) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const map = JSON.parse(raw);
      const lookupKeys = getStudentLookupKeys(studentCodeOrId, studentName);
      const allFound = new Set<string>();

      for (const k of lookupKeys) {
        if (Array.isArray(map[k])) {
          map[k].forEach((bId: string) => allFound.add(bId));
        }
      }
      return Array.from(allFound);
    }
  } catch (e) {
    console.warn('Lỗi đọc huy hiệu học sinh:', e);
  }
  return [];
}

/**
 * Lưu danh sách huy hiệu được trao cho học sinh (đồng bộ qua tất cả alias của em)
 */
export function saveStudentBadges(
  studentCodeOrId: string,
  badgeIds: string[],
  studentName?: string
): void {
  if (!studentCodeOrId && !studentName) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const lookupKeys = getStudentLookupKeys(studentCodeOrId, studentName);
    const cleanList = Array.from(new Set(badgeIds));

    lookupKeys.forEach((k) => {
      map[k] = cleanList;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event('geo_badges_updated'));
  } catch (e) {
    console.warn('Lỗi lưu huy hiệu học sinh:', e);
  }
}

/**
 * Giáo viên Bật/Tắt (Toggle) 1 huy hiệu cho học sinh
 * Trả về true nếu vừa bật sáng (trao tặng), false nếu vừa tắt
 */
export function toggleBadgeForStudent(
  studentCodeOrId: string,
  badgeId: string,
  studentName?: string
): boolean {
  const current = getStudentBadges(studentCodeOrId, studentName);
  const exists = current.includes(badgeId);
  let updated: string[];
  let isAwarded = false;

  if (exists) {
    updated = current.filter((id) => id !== badgeId);
    isAwarded = false;
  } else {
    updated = [...current, badgeId];
    isAwarded = true;

    // Gửi thông báo lời chúc mừng trao huy hiệu từ Cô Hảo
    const badgeDef = ALL_BADGES.find((b) => b.id === badgeId);
    if (badgeDef) {
      try {
        const notifs = JSON.parse(localStorage.getItem('geo_student_notifications') || '[]');
        const newNotif = {
          id: 'notif_badge_' + Date.now(),
          student_code: studentCodeOrId,
          student_name: studentName || '',
          type: 'badge',
          badge_id: badgeId,
          badge_name: badgeDef.name,
          badge_xp: badgeDef.xp_reward,
          assignment_id: '',
          assignment_title: `Huy hiệu "${badgeDef.name}"`,
          feedback_text: `🎖️ Chúc mừng em ${studentName || ''}! Cô Hảo vừa trao tặng em Huy hiệu Danh dự "${badgeDef.name}" (+${badgeDef.xp_reward} XP).`,
          is_read: false,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('geo_student_notifications', JSON.stringify([newNotif, ...notifs]));
        window.dispatchEvent(new Event('geo_notifications_updated'));
      } catch (e) {
        console.warn('Lỗi gửi thông báo huy hiệu:', e);
      }
    }
  }

  saveStudentBadges(studentCodeOrId, updated, studentName);
  return isAwarded;
}
