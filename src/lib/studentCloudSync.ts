import { supabase, isSupabaseConfigured } from './supabase';
import { Profile, ClassItem } from '../types/database';
import { INITIAL_STUDENTS, INITIAL_CLASSES, getStoredStudents, reindexAllStudentCodes } from '../data/studentsData';

const LOCAL_STUDENTS_KEY = 'geo_classes_students';
const LOCAL_STUDENTS_TIME_KEY = 'geo_classes_students_updated_at';
const LOCAL_CLASSES_KEY = 'geo_classes_list';
const LOCAL_CLASSES_TIME_KEY = 'geo_classes_list_updated_at';
const CLOUD_STUDENTS_KEY = 'geo_classes_students_cloud';
const CLOUD_CLASSES_KEY = 'geo_classes_list_cloud';

// 1. Lưu danh sách học sinh (Đồng bộ đồng thời LocalStorage & Supabase Cloud kèm Timestamp)
export async function saveStudentsToCloud(students: Profile[]): Promise<boolean> {
  if (!Array.isArray(students)) return false;

  const nowIso = new Date().toISOString();

  // Lưu cục bộ để hiển thị ngay tức thì trên thiết bị hiện tại
  try {
    localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(students));
    localStorage.setItem(LOCAL_STUDENTS_TIME_KEY, nowIso);
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
            updated_at: nowIso,
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

// 2. Tải danh sách học sinh từ Supabase Cloud về máy/điện thoại (So sánh timestamp thông minh)
export async function fetchStudentsFromCloud(): Promise<Profile[]> {
  const localSaved = localStorage.getItem(LOCAL_STUDENTS_KEY);
  const localStudents: Profile[] = localSaved ? JSON.parse(localSaved) : [];
  const localTimeStr = localStorage.getItem(LOCAL_STUDENTS_TIME_KEY);
  const localTime = localTimeStr ? new Date(localTimeStr).getTime() : 0;

  if (!isSupabaseConfigured) {
    return localStudents.length > 0 ? localStudents : getStoredStudents();
  }

  try {
    const { data: row, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', CLOUD_STUDENTS_KEY)
      .maybeSingle();

    if (!error && row?.value?.students && Array.isArray(row.value.students)) {
      const cloudStudents: Profile[] = row.value.students;
      const cloudTimeStr = row.value.updated_at;
      const cloudTime = cloudTimeStr ? new Date(cloudTimeStr).getTime() : 0;

      // Trường hợp 1: Thiết bị hiện tại có dữ liệu và MỚI HƠN Cloud -> Giữ thiết bị và cập nhật lên Cloud
      if (localStudents.length > 0 && localTime > cloudTime) {
        const normalizedLocal = reindexAllStudentCodes(localStudents, INITIAL_CLASSES);
        await saveStudentsToCloud(normalizedLocal);
        return normalizedLocal;
      }

      // Trường hợp 2: Cloud có dữ liệu và MỚI HƠN hoặc bằng local (hoặc local rỗng) -> Cập nhật xuống máy
      if (cloudStudents.length > 0) {
        const normalizedCloud = reindexAllStudentCodes(cloudStudents, INITIAL_CLASSES);
        localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(normalizedCloud));
        if (cloudTimeStr) {
          localStorage.setItem(LOCAL_STUDENTS_TIME_KEY, cloudTimeStr);
        }
        window.dispatchEvent(new Event('geo_classes_students_updated'));
        return normalizedCloud;
      }
    } else if (localStudents.length > 0) {
      // Cloud chưa có dữ liệu mà máy hiện tại đang có -> Đẩy lên Cloud
      const normalizedLocal = reindexAllStudentCodes(localStudents, INITIAL_CLASSES);
      await saveStudentsToCloud(normalizedLocal);
      return normalizedLocal;
    }
  } catch (err) {
    console.warn('Lỗi tải students từ Cloud:', err);
  }

  return localStudents.length > 0 ? localStudents : getStoredStudents();
}

// 3. Lưu danh sách Lớp học lên Supabase Cloud
export async function saveClassesToCloud(classes: ClassItem[]): Promise<boolean> {
  if (!Array.isArray(classes)) return false;

  const nowIso = new Date().toISOString();

  try {
    localStorage.setItem(LOCAL_CLASSES_KEY, JSON.stringify(classes));
    localStorage.setItem(LOCAL_CLASSES_TIME_KEY, nowIso);
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
            updated_at: nowIso,
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
  const localSaved = localStorage.getItem(LOCAL_CLASSES_KEY);
  const localClasses: ClassItem[] = localSaved ? JSON.parse(localSaved) : INITIAL_CLASSES;
  const localTimeStr = localStorage.getItem(LOCAL_CLASSES_TIME_KEY);
  const localTime = localTimeStr ? new Date(localTimeStr).getTime() : 0;

  if (!isSupabaseConfigured) return localClasses;

  try {
    const { data: row, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', CLOUD_CLASSES_KEY)
      .maybeSingle();

    if (!error && row?.value?.classes && Array.isArray(row.value.classes) && row.value.classes.length > 0) {
      const cloudClasses: ClassItem[] = row.value.classes;
      const cloudTimeStr = row.value.updated_at;
      const cloudTime = cloudTimeStr ? new Date(cloudTimeStr).getTime() : 0;

      if (localClasses.length > 0 && localTime > cloudTime) {
        await saveClassesToCloud(localClasses);
        return localClasses;
      }

      localStorage.setItem(LOCAL_CLASSES_KEY, JSON.stringify(cloudClasses));
      if (cloudTimeStr) {
        localStorage.setItem(LOCAL_CLASSES_TIME_KEY, cloudTimeStr);
      }
      window.dispatchEvent(new Event('geo_classes_list_updated'));
      return cloudClasses;
    } else if (localClasses && localClasses.length > 0) {
      await saveClassesToCloud(localClasses);
      return localClasses;
    }
  } catch (err) {
    console.warn('Lỗi tải classes từ Cloud:', err);
  }
  return localClasses;
}

// 5. Tự động đồng bộ hai chiều (Khởi chạy khi mở ứng dụng)
export async function autoSyncStudentsWithCloud(): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    await fetchClassesFromCloud();
    await fetchStudentsFromCloud();
  } catch (err) {
    console.warn('Lỗi auto sync students:', err);
  }
}
