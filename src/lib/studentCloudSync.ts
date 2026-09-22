import { supabase, isSupabaseConfigured } from './supabase';
import { Profile, ClassItem } from '../types/database';
import { INITIAL_STUDENTS, INITIAL_CLASSES, getStoredStudents, reindexAllStudentCodes } from '../data/studentsData';

const LOCAL_STUDENTS_KEY = 'geo_classes_students';
const LOCAL_CLASSES_KEY = 'geo_classes_list';
const CLOUD_STUDENTS_KEY = 'geo_classes_students_cloud';
const CLOUD_CLASSES_KEY = 'geo_classes_list_cloud';

// 1. Lưu danh sách học sinh (Đồng bộ đồng thời LocalStorage & Supabase Cloud)
export async function saveStudentsToCloud(students: Profile[]): Promise<boolean> {
  if (!Array.isArray(students)) return false;

  // Lưu cục bộ để hiển thị ngay tức thì trên thiết bị hiện tại
  try {
    localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(students));
    window.dispatchEvent(new Event('geo_classes_students_updated'));
  } catch (e) {
    console.warn('Lỗi lưu LocalStorage students:', e);
  }

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('system_settings').upsert(
        {
          key: CLOUD_STUDENTS_KEY,
          value: {
            students,
            updated_at: new Date().toISOString(),
          },
        },
        { onConflict: 'key' }
      );
      if (error) {
        console.warn('Lỗi Supabase upsert students:', error);
        return false;
      }
      console.log('✅ Đã đồng bộ danh sách học sinh lên Supabase Cloud:', students.length);
      return true;
    } catch (err) {
      console.warn('Lỗi đồng bộ students lên Supabase Cloud:', err);
      return false;
    }
  }
  return true;
}

// 2. Tải danh sách học sinh từ Supabase Cloud về máy/điện thoại
export async function fetchStudentsFromCloud(): Promise<Profile[]> {
  let localStudents = getStoredStudents();

  if (!isSupabaseConfigured) {
    return localStudents;
  }

  try {
    const { data: row, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', CLOUD_STUDENTS_KEY)
      .maybeSingle();

    if (!error && row?.value?.students && Array.isArray(row.value.students) && row.value.students.length > 0) {
      const cloudStudents: Profile[] = row.value.students;

      // Luôn chuẩn hóa sắp xếp A-Z theo Tên và đánh lại mã liên tục
      const normalizedCloud = reindexAllStudentCodes(cloudStudents, INITIAL_CLASSES);

      // Lưu vào LocalStorage của thiết bị (đặc biệt là điện thoại) để các lần sau nạp tức thì
      localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(normalizedCloud));
      window.dispatchEvent(new Event('geo_classes_students_updated'));
      return normalizedCloud;
    } else if (localStudents && localStudents.length > 0) {
      // Nếu Cloud chưa có mà thiết bị hiện tại đang có danh sách -> Đẩy lên Cloud
      const normalizedLocal = reindexAllStudentCodes(localStudents, INITIAL_CLASSES);
      await saveStudentsToCloud(normalizedLocal);
      return normalizedLocal;
    }
  } catch (err) {
    console.warn('Lỗi tải students từ Cloud:', err);
  }

  return localStudents;
}

// 3. Lưu danh sách Lớp học lên Supabase Cloud
export async function saveClassesToCloud(classes: ClassItem[]): Promise<boolean> {
  if (!Array.isArray(classes)) return false;

  try {
    localStorage.setItem(LOCAL_CLASSES_KEY, JSON.stringify(classes));
    window.dispatchEvent(new Event('geo_classes_list_updated'));
  } catch (e) {
    console.warn('Lỗi lưu LocalStorage classes:', e);
  }

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('system_settings').upsert(
        {
          key: CLOUD_CLASSES_KEY,
          value: {
            classes,
            updated_at: new Date().toISOString(),
          },
        },
        { onConflict: 'key' }
      );
      if (!error) {
        console.log('✅ Đã đồng bộ danh sách lớp học lên Supabase Cloud:', classes.length);
        return true;
      }
    } catch (err) {
      console.warn('Lỗi đồng bộ classes lên Supabase Cloud:', err);
    }
  }
  return true;
}

// 4. Tải danh sách Lớp học từ Supabase Cloud
export async function fetchClassesFromCloud(): Promise<ClassItem[]> {
  try {
    const saved = localStorage.getItem(LOCAL_CLASSES_KEY);
    const localClasses: ClassItem[] = saved ? JSON.parse(saved) : INITIAL_CLASSES;

    if (!isSupabaseConfigured) return localClasses;

    const { data: row, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', CLOUD_CLASSES_KEY)
      .maybeSingle();

    if (!error && row?.value?.classes && Array.isArray(row.value.classes) && row.value.classes.length > 0) {
      const cloudClasses: ClassItem[] = row.value.classes;
      localStorage.setItem(LOCAL_CLASSES_KEY, JSON.stringify(cloudClasses));
      window.dispatchEvent(new Event('geo_classes_list_updated'));
      return cloudClasses;
    } else if (localClasses && localClasses.length > 0) {
      await saveClassesToCloud(localClasses);
      return localClasses;
    }
    return localClasses;
  } catch (err) {
    console.warn('Lỗi tải classes từ Cloud:', err);
    return INITIAL_CLASSES;
  }
}

// 5. Tự động đồng bộ hai chiều (Khởi chạy khi mở ứng dụng)
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

    if (localStudents.length > 0) {
      const normalized = reindexAllStudentCodes(localStudents, INITIAL_CLASSES);
      localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(normalized));
      await saveStudentsToCloud(normalized);
    } else if (cloudStudents.length > 0) {
      const normalized = reindexAllStudentCodes(cloudStudents, INITIAL_CLASSES);
      localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(normalized));
      window.dispatchEvent(new Event('geo_classes_students_updated'));
      await saveStudentsToCloud(normalized);
    } else {
      const initialNormalized = getStoredStudents();
      await saveStudentsToCloud(initialNormalized);
    }
  } catch (err) {
    console.warn('Lỗi auto sync students:', err);
  }
}
