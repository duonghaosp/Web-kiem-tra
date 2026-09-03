import { supabase, isSupabaseConfigured } from './supabase';
import { Assignment } from '../types/database';

const LOCAL_ASSIGNMENTS_KEY = 'geo_assignments';
const LOCAL_SUBMISSIONS_KEY = 'geo_student_submissions';
const CLOUD_SETTINGS_KEY = 'geo_assignments_cloud';
const CLOUD_SUBMISSIONS_KEY = 'geo_student_submissions_cloud';

// 1. Lưu danh sách bài kiểm tra (Đồng bộ đồng thời LocalStorage & Supabase Cloud)
export async function saveAssignmentsToCloud(assignments: Assignment[]): Promise<void> {
  // Luôn lưu cục bộ trước để giao diện hiển thị ngay tức thì
  localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(assignments));
  window.dispatchEvent(new Event('geo_assignments_updated'));

  if (isSupabaseConfigured) {
    try {
      // Lưu toàn bộ danh sách vào system_settings để mọi máy tính & điện thoại đều đọc được ngay lập tức
      await supabase.from('system_settings').upsert({
        key: CLOUD_SETTINGS_KEY,
        value: {
          assignments,
          updated_at: new Date().toISOString(),
        },
      }, { onConflict: 'key' });
    } catch (err) {
      console.warn('Lỗi đồng bộ assignments lên Supabase:', err);
    }
  }
}

// 2. Tải toàn bộ bài kiểm tra từ đám mây (Hợp nhất Local và Cloud)
export async function fetchAssignmentsFromCloud(): Promise<Assignment[]> {
  // Lấy dữ liệu local
  let localAsgs: Assignment[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localAsgs = parsed.filter((a: any) => !['asg_1', 'asg_2', 'asg_3', 'asg_4'].includes(a.id));
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc assignments local:', e);
  }

  if (!isSupabaseConfigured) {
    return localAsgs;
  }

  try {
    const { data: cloudRow } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', CLOUD_SETTINGS_KEY)
      .maybeSingle();

    if (cloudRow?.value?.assignments && Array.isArray(cloudRow.value.assignments)) {
      const cloudAsgs: Assignment[] = cloudRow.value.assignments;

      // Hợp nhất: Những bài kiểm tra nào có ở cloud hoặc local
      const map = new Map<string, Assignment>();
      cloudAsgs.forEach((a) => map.set(String(a.id), a));
      localAsgs.forEach((a) => {
        // Nếu local có bài mới chưa có trên cloud, thêm vào map
        if (!map.has(String(a.id))) {
          map.set(String(a.id), a);
        }
      });

      const merged = Array.from(map.values());
      localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(merged));
      window.dispatchEvent(new Event('geo_assignments_updated'));

      // Nếu local có thêm bài mà cloud chưa có, tự động đẩy lên cloud
      if (merged.length > cloudAsgs.length) {
        await saveAssignmentsToCloud(merged);
      }

      return merged;
    } else if (localAsgs.length > 0) {
      // Nếu cloud chưa có gì mà local đã có đề của cô Hảo -> Đẩy ngay lên cloud!
      await saveAssignmentsToCloud(localAsgs);
      return localAsgs;
    }
  } catch (err) {
    console.warn('Lỗi fetch assignments từ Supabase:', err);
  }

  return localAsgs;
}

// 3. Tìm 1 bài kiểm tra theo ID (Hỗ trợ học sinh quét QR từ điện thoại bất kỳ)
export async function fetchAssignmentById(id: string): Promise<Assignment | null> {
  // 1. Thử tìm trong LocalStorage
  try {
    const raw = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const found = parsed.find((a: any) => String(a.id) === String(id));
        if (found) return found;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc local assignment:', e);
  }

  // 2. Tải trực tiếp từ Supabase Cloud
  if (isSupabaseConfigured) {
    try {
      const { data: cloudRow } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', CLOUD_SETTINGS_KEY)
        .maybeSingle();

      if (cloudRow?.value?.assignments && Array.isArray(cloudRow.value.assignments)) {
        const found = cloudRow.value.assignments.find((a: any) => String(a.id) === String(id));
        if (found) {
          // Lưu vào local của điện thoại để lần sau truy cập nhanh
          try {
            const raw = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
            const currentList = raw ? JSON.parse(raw) : [];
            if (!currentList.some((x: any) => String(x.id) === String(found.id))) {
              localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify([found, ...currentList]));
            }
          } catch (e) {}
          return found;
        }
      }
    } catch (err) {
      console.warn('Lỗi tải assignment từ cloud:', err);
    }
  }

  return null;
}

// 4. Lưu bài nộp của học sinh (Đồng bộ đám mây để máy tính của Cô Hảo thấy ngay)
export async function saveStudentSubmission(submission: any): Promise<void> {
  // Lưu local trên máy học sinh
  try {
    const raw = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter(
      (s: any) => !(String(s.assignment_id) === String(submission.assignment_id) && s.student_code === submission.student_code)
    );
    const updated = [submission, ...filtered];
    localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('geo_student_submissions_updated'));
  } catch (e) {
    console.warn('Lỗi lưu submission local:', e);
  }

  // Lưu lên Supabase Cloud
  if (isSupabaseConfigured) {
    try {
      // A. Lưu vào cloud backup trong system_settings
      const { data: cloudRow } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', CLOUD_SUBMISSIONS_KEY)
        .maybeSingle();

      const cloudExisting = cloudRow?.value?.submissions && Array.isArray(cloudRow.value.submissions)
        ? cloudRow.value.submissions
        : [];

      const cloudFiltered = cloudExisting.filter(
        (s: any) => !(String(s.assignment_id) === String(submission.assignment_id) && s.student_code === submission.student_code)
      );

      const newCloudSubmissions = [submission, ...cloudFiltered];

      await supabase.from('system_settings').upsert({
        key: CLOUD_SUBMISSIONS_KEY,
        value: {
          submissions: newCloudSubmissions,
          updated_at: new Date().toISOString(),
        },
      }, { onConflict: 'key' });

      // B. Tăng submissions_count trong geo_assignments_cloud
      const { data: asgRow } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', CLOUD_SETTINGS_KEY)
        .maybeSingle();

      if (asgRow?.value?.assignments && Array.isArray(asgRow.value.assignments)) {
        const asgs = asgRow.value.assignments.map((a: any) => {
          if (String(a.id) === String(submission.assignment_id)) {
            return {
              ...a,
              submissions_count: Math.min(a.total_students || 35, (a.submissions_count || 0) + 1),
            };
          }
          return a;
        });

        await supabase.from('system_settings').upsert({
          key: CLOUD_SETTINGS_KEY,
          value: {
            assignments: asgs,
            updated_at: new Date().toISOString(),
          },
        }, { onConflict: 'key' });
      }

      // C. Thử lưu vào bảng student_results chuẩn nếu có thể
      try {
        await supabase.from('student_results').insert({
          student_name: submission.student_name || 'Học sinh',
          student_code: submission.student_code || null,
          class_name: submission.class_name || null,
          assignment_title: submission.assignment_title || null,
          score: Number(submission.score || 0),
          max_score: Number(submission.max_score || 10),
          score_tn: Number(submission.score_tn || 0),
          max_score_tn: Number(submission.max_score_tn || 7),
          score_tl: Number(submission.score_tl || 0),
          max_score_tl: Number(submission.max_score_tl || 3),
          essay_question: submission.essay_question || null,
          essay_answer: submission.essay_answer || null,
          answers_json: submission.answers_json || {},
          detailed_scores_json: submission.detailed_scores_json || {},
          is_late: Boolean(submission.is_late),
          time_spent_seconds: Number(submission.time_spent_seconds || 0),
          status: submission.status === 'waiting_teacher_grading' ? 'waiting_teacher_grading' : 'graded',
          submitted_at: new Date().toISOString(),
        });
      } catch (tableErr) {
        console.warn('Lưu vào bảng student_results (tùy chọn):', tableErr);
      }
    } catch (err) {
      console.warn('Lỗi lưu submission lên Supabase Cloud:', err);
    }
  }
}

// 5. Tải bài nộp của học sinh từ đám mây (Dành cho trang Chấm bài của Cô Hảo)
export async function fetchStudentSubmissionsFromCloud(): Promise<any[]> {
  let localSubs: any[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
    if (raw) localSubs = JSON.parse(raw);
  } catch (e) {}

  if (!isSupabaseConfigured) return localSubs;

  try {
    const { data: cloudRow } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', CLOUD_SUBMISSIONS_KEY)
      .maybeSingle();

    if (cloudRow?.value?.submissions && Array.isArray(cloudRow.value.submissions)) {
      const cloudSubs = cloudRow.value.submissions;
      // Hợp nhất
      const map = new Map<string, any>();
      cloudSubs.forEach((s: any) => {
        const key = `${s.assignment_id}_${s.student_code || s.student_name}`;
        map.set(key, s);
      });
      localSubs.forEach((s: any) => {
        const key = `${s.assignment_id}_${s.student_code || s.student_name}`;
        if (!map.has(key)) {
          map.set(key, s);
        }
      });

      const merged = Array.from(map.values());
      localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(merged));
      window.dispatchEvent(new Event('geo_student_submissions_updated'));
      return merged;
    }
  } catch (err) {
    console.warn('Lỗi tải submissions từ Supabase Cloud:', err);
  }

  return localSubs;
}
