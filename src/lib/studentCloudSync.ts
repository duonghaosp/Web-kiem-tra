import { supabase, isSupabaseConfigured } from './supabase';
import { Profile, ClassItem } from '../types/database';
import { INITIAL_STUDENTS, INITIAL_CLASSES, getStoredStudents } from '../data/studentsData';

const LOCAL_STUDENTS_KEY = 'geo_classes_students';
const LOCAL_CLASSES_KEY = 'geo_classes_list';
const CLOUD_STUDENTS_KEY = 'geo_classes_students_cloud';
const CLOUD_CLASSES_KEY = 'geo_classes_list_cloud';

// 1. Lưu danh sách học sinh (Đồng bộ đồng thời LocalStorage & Supabase Cloud)
export async function saveStudentsToCloud(students: Profile[]): Promise<void> {
  if (!Array.isArray(students) || students.length === 0) return;

  // Lưu cục bộ để hiển thị ngay tức thì trên thiết bị hiện tại
  localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(students));
  window.dispatchEvent(new Event('geo_classes_students_updated'));

  if (isSupabaseConfigured) {
    try {
      await supabase.from('system_settings').upsert(
        {
          key: CLOUD_STUDENTS_KEY,
          value: {
            students,
            updated_at: new Date().toISOString(),
          },
        },
        { onConflict: 'key' }
      );
      console.log('✅ Đã đồng bộ danh sách học sinh lên Supabase Cloud:', students.length);
    } catch (err) {
      console.warn('Lỗi đồng bộ students lên Supabase Cloud:', err);
    }
  }
}

// 2. Tải danh sách học sinh từ Supabase Cloud về máy/điện thoại
export async function fetchStudentsFromCloud(): Promise<Profile[]> {
  let localStudents = getStoredStudents();

  if (!isSupabaseConfigured) {
    return localStudents;
  }

  try {
    const { data: row } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', CLOUD_STUDENTS_KEY)
      .maybeSingle();

    if (row?.value?.students && Array.isArray(row.value.students) && row.value.students.length > 0) {
      const cloudStudents: Profile[] = row.value.students;

      // Lưu vào LocalStorage của thiết bị (đặc biệt là điện thoại) để các lần sau nạp tức thì
      localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(cloudStudents));
      window.dispatchEvent(new Event('geo_classes_students_updated'));
      return cloudStudents;
    } else if (localStudents && localStudents.length > 0) {
      // Nếu Cloud chưa có mà thiết bị hiện tại (máy tính cô Hảo) đang có danh sách học sinh thật
      // -> Tự động đẩy ngay lên Cloud để mọi điện thoại quét QR đều nhận được!
      await saveStudentsToCloud(localStudents);
      return localStudents;
    }
  } catch (err) {
    console.warn('Lỗi tải students từ Cloud:', err);
  }

  return localStudents;
}

// 3. Tự động đồng bộ hai chiều (Khởi chạy khi mở ứng dụng)
export async function autoSyncStudentsWithCloud(): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const localRaw = localStorage.getItem(LOCAL_STUDENTS_KEY);
    const localStudents: Profile[] = localRaw ? JSON.parse(localRaw) : [];

    const { data: row } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', CLOUD_STUDENTS_KEY)
      .maybeSingle();

    const cloudStudents: Profile[] = row?.value?.students || [];

    // Nếu trên máy tính cô Hảo đã có danh sách học sinh thật (ví dụ Lý Linh Bình...)
    // mà trên Cloud chưa có hoặc số lượng ít hơn -> Đẩy danh sách của cô lên Cloud ngay lập tức!
    const hasRealLocalStudents = localStudents.some(
      (s) => s.full_name.includes('Linh Bình') || s.class_name === 'Lớp 7A4'
    );

    if (localStudents.length > 0 && (cloudStudents.length === 0 || hasRealLocalStudents)) {
      await saveStudentsToCloud(localStudents);
    } else if (cloudStudents.length > 0 && localStudents.length === 0) {
      // Nếu là điện thoại mới quét mã -> Kéo danh sách học sinh từ Cloud về máy
      localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(cloudStudents));
      window.dispatchEvent(new Event('geo_classes_students_updated'));
    }
  } catch (err) {
    console.warn('Lỗi auto sync students:', err);
  }
}
