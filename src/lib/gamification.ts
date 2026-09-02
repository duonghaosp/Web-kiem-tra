import confetti from 'canvas-confetti';
import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Tính Cấp độ (Level) từ điểm kinh nghiệm (XP):
 * Level = min(100, floor(sqrt(XP / 50)) + 1)
 */
export function calculateLevel(xp: number): number {
  if (!xp || xp <= 0) return 1;
  const rawLevel = Math.floor(Math.sqrt(xp / 50)) + 1;
  return Math.min(100, Math.max(1, rawLevel));
}

/**
 * Tính số XP tối thiểu cần để đạt Cấp độ mục tiêu
 */
export function getMinXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.pow(level - 1, 2) * 50;
}

/**
 * Tính % tiến độ đạt cấp độ tiếp theo
 */
export function getLevelProgress(xp: number) {
  const currentLevel = calculateLevel(xp);
  if (currentLevel >= 100) {
    return {
      currentLevel: 100,
      nextLevel: 100,
      percentage: 100,
      currentXp: xp,
      neededXp: 0,
    };
  }

  const currentLevelMinXp = getMinXpForLevel(currentLevel);
  const nextLevelMinXp = getMinXpForLevel(currentLevel + 1);
  const range = nextLevelMinXp - currentLevelMinXp;
  const currentInRange = xp - currentLevelMinXp;

  const percentage = Math.min(100, Math.max(0, Math.round((currentInRange / range) * 100)));
  const neededXp = nextLevelMinXp - xp;

  return {
    currentLevel,
    nextLevel: currentLevel + 1,
    percentage,
    currentXp: xp,
    neededXp,
  };
}

/**
 * Bắn pháo hoa ăn mừng khi học sinh hoàn thành xuất sắc hoặc lên cấp
 */
export function triggerCelebration() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#0ea5e9', '#22c55e', '#facc15', '#f97316'],
  });
}

/**
 * Tặng điểm thưởng XP cho học sinh (Giáo viên hoặc Hệ thống tự động)
 */
export async function grantStudentXp(
  studentId: string,
  amount: number,
  reason: string,
  grantedById?: string
): Promise<{ success: boolean; newXp?: number; error?: string }> {
  try {
    if (!isSupabaseConfigured) {
      console.log(`[Dev Mock] Đã cộng ${amount} XP cho học sinh ${studentId} (Lý do: ${reason})`);
      return { success: true, newXp: 150 };
    }

    // 1. Thêm vào bảng xp_logs
    const { error: logError } = await supabase.from('xp_logs').insert({
      student_id: studentId,
      amount,
      reason,
      granted_by: grantedById || null,
    });

    if (logError) {
      console.error('Lỗi khi ghi nhật ký XP:', logError);
      return { success: false, error: logError.message };
    }

    // 2. Lấy thông tin XP mới nhất từ bảng profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('xp, level')
      .eq('id', studentId)
      .single();

    if (profileError) {
      return { success: true };
    }

    return { success: true, newXp: profileData.xp };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
