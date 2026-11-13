import { supabase, isSupabaseConfigured } from './supabase';
import { Assignment } from '../types/database';

const LOCAL_ASSIGNMENTS_KEY = 'geo_assignments';
const LOCAL_SUBMISSIONS_KEY = 'geo_student_submissions';
const LOCAL_TRASH_KEY = 'geo_deleted_assignments';
const LOCAL_DELETED_IDS_KEY = 'geo_deleted_assignment_ids';

const CLOUD_SETTINGS_KEY = 'geo_assignments_cloud';
const CLOUD_SUBMISSIONS_KEY = 'geo_student_submissions_cloud';
const CLOUD_TRASH_KEY = 'geo_assignments_trash_cloud';
const CLOUD_DELETED_IDS_KEY = 'geo_assignments_deleted_ids_cloud';

// Lấy danh sách ID các bài kiểm tra đã bị xóa / chuyển vào thùng rác
export function getDeletedAssignmentIds(): Set<string> {
  const ids = new Set<string>();
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_IDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) parsed.forEach((id) => ids.add(String(id)));
    }
    const trashRaw = localStorage.getItem(LOCAL_TRASH_KEY);
    if (trashRaw) {
      const parsedTrash = JSON.parse(trashRaw);
      if (Array.isArray(parsedTrash)) parsedTrash.forEach((a: any) => ids.add(String(a.id)));
    }
  } catch (e) {}
  return ids;
}

// 1. Lưu danh sách bài kiểm tra (Đồng bộ đồng thời LocalStorage & Supabase Cloud)
export async function saveAssignmentsToCloud(assignments: Assignment[]): Promise<void> {
  // Lọc bỏ bất kỳ đề thi nào nằm trong danh sách đã xóa / thùng rác
  const deletedIds = getDeletedAssignmentIds();
  const cleanAssignments = assignments.filter(
    (a) => !deletedIds.has(String(a.id)) && !['asg_1', 'asg_2', 'asg_3', 'asg_4'].includes(String(a.id))
  );

  // Sắp xếp bài kiểm tra mới nhất lên đầu danh sách
  const sorted = [...cleanAssignments].sort((a, b) => {
    const getTime = (asg: Assignment) => {
      if (asg.created_at) {
        const t = new Date(asg.created_at).getTime();
        if (!isNaN(t)) return t;
      }
      if (asg.start_time) {
        const t = new Date(asg.start_time).getTime();
        if (!isNaN(t)) return t;
      }
      const numMatch = String(asg.id).match(/\d+/);
      return numMatch ? Number(numMatch[0]) : 0;
    };
    return getTime(b) - getTime(a);
  });

  // Luôn lưu cục bộ trước để giao diện hiển thị ngay tức thì
  localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(sorted));
  window.dispatchEvent(new Event('geo_assignments_updated'));

  if (isSupabaseConfigured) {
    try {
      // Lưu danh sách sạch lên Supabase (không bao giờ hợp nhất lại các bài đã bị xóa)
      await supabase.from('system_settings').upsert({
        key: CLOUD_SETTINGS_KEY,
        value: {
          assignments: sorted,
          updated_at: new Date().toISOString(),
        },
      }, { onConflict: 'key' });
    } catch (err) {
      console.warn('Lỗi đồng bộ assignments lên Supabase:', err);
    }
  }
}

// 2. Tải toàn bộ bài kiểm tra từ đám mây (Hợp nhất Local và Cloud nhưng lọc sạch bài đã xóa)
export async function fetchAssignmentsFromCloud(): Promise<Assignment[]> {
  const deletedIds = getDeletedAssignmentIds();

  // Lấy dữ liệu local
  let localAsgs: Assignment[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localAsgs = parsed.filter(
          (a: any) =>
            !['asg_1', 'asg_2', 'asg_3', 'asg_4'].includes(String(a.id)) &&
            !deletedIds.has(String(a.id))
        );
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc assignments local:', e);
  }

  if (!isSupabaseConfigured) {
    return localAsgs;
  }

  try {
    // Tải đồng thời assignments, thùng rác và danh sách ID đã xóa từ Cloud
    const [asgRes, trashRes, deletedIdsRes] = await Promise.all([
      supabase.from('system_settings').select('value').eq('key', CLOUD_SETTINGS_KEY).maybeSingle(),
      supabase.from('system_settings').select('value').eq('key', CLOUD_TRASH_KEY).maybeSingle(),
      supabase.from('system_settings').select('value').eq('key', CLOUD_DELETED_IDS_KEY).maybeSingle(),
    ]);

    // Hợp nhất danh sách ID đã xóa từ đám mây
    if (deletedIdsRes.data?.value?.deleted_ids && Array.isArray(deletedIdsRes.data.value.deleted_ids)) {
      deletedIdsRes.data.value.deleted_ids.forEach((id: string) => deletedIds.add(String(id)));
    }
    if (trashRes.data?.value?.trash && Array.isArray(trashRes.data.value.trash)) {
      trashRes.data.value.trash.forEach((t: any) => deletedIds.add(String(t.id)));
    }

    // Lưu lại tập ID đã xóa vào localStorage
    localStorage.setItem(LOCAL_DELETED_IDS_KEY, JSON.stringify(Array.from(deletedIds)));

    if (asgRes.data?.value?.assignments && Array.isArray(asgRes.data.value.assignments)) {
      const rawCloudAsgs: Assignment[] = asgRes.data.value.assignments;

      // LỌC SẠCH: Loại bỏ mọi bài kiểm tra mặc định cũ và các bài đã bị xóa / trong thùng rác
      const cloudAsgs = rawCloudAsgs.filter(
        (a: any) =>
          !['asg_1', 'asg_2', 'asg_3', 'asg_4'].includes(String(a.id)) &&
          !deletedIds.has(String(a.id))
      );

      // Hợp nhất dữ liệu hợp lệ
      const map = new Map<string, Assignment>();
      cloudAsgs.forEach((a) => map.set(String(a.id), a));
      localAsgs.forEach((a) => {
        if (!map.has(String(a.id)) && !deletedIds.has(String(a.id))) {
          map.set(String(a.id), a);
        }
      });

      const sorted = Array.from(map.values()).sort((a, b) => {
        const getTime = (asg: Assignment) => {
          if (asg.created_at) {
            const t = new Date(asg.created_at).getTime();
            if (!isNaN(t)) return t;
          }
          if (asg.start_time) {
            const t = new Date(asg.start_time).getTime();
            if (!isNaN(t)) return t;
          }
          const numMatch = String(asg.id).match(/\d+/);
          return numMatch ? Number(numMatch[0]) : 0;
        };
        return getTime(b) - getTime(a);
      });

      localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(sorted));
      window.dispatchEvent(new Event('geo_assignments_updated'));

      // Nếu trên Cloud còn sót đề đã bị xóa, tự động dọn sạch trên Supabase Cloud
      if (cloudAsgs.length !== rawCloudAsgs.length) {
        await supabase.from('system_settings').upsert({
          key: CLOUD_SETTINGS_KEY,
          value: {
            assignments: sorted,
            updated_at: new Date().toISOString(),
          },
        }, { onConflict: 'key' });
      }

      return sorted;
    } else if (localAsgs.length > 0) {
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
  // 1. Luôn tải trực tiếp từ Supabase Cloud để đảm bảo học sinh trên điện thoại luôn nhận đề mới nhất từ giáo viên!
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
          // Ghi đè cập nhật bản mới nhất vào LocalStorage của điện thoại để xóa sạch bản cũ
          try {
            const raw = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
            const currentList: Assignment[] = raw ? JSON.parse(raw) : [];
            const filtered = currentList.filter((x: any) => String(x.id) !== String(found.id));
            localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify([found, ...filtered]));
          } catch (e) {}
          return found;
        }
      }
    } catch (err) {
      console.warn('Lỗi tải assignment từ cloud:', err);
    }
  }

  // 2. Dự phòng: Nếu mất kết nối mạng hoặc không có Cloud, đọc từ LocalStorage
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

  return null;
}

// 4. Lưu bài nộp của học sinh (Đồng bộ đám mây để máy tính của Cô Hảo thấy ngay)
export async function saveStudentSubmission(submission: any): Promise<void> {
  // 1. Lưu local trên máy học sinh ngay tức thì
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

  // 2. Lưu lên Supabase Cloud
  if (isSupabaseConfigured) {
    // Bản sao gọn nhẹ loại bỏ mảng questions (tránh phình to dung lượng gây nghẽn kết nối)
    const compactSubmission = { ...submission };
    delete compactSubmission.questions;

    try {
      // A. Lưu vào bảng student_results (Chuẩn SQL Supabase)
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
          answers_json: {
            ...(submission.answers_json || {}),
            _assignment_id: submission.assignment_id,
          },
          detailed_scores_json: {
            ...(submission.detailed_scores_json || {}),
            _assignment_id: submission.assignment_id,
          },
          is_late: Boolean(submission.is_late),
          time_spent_seconds: Number(submission.time_spent_seconds || 0),
          status: submission.status === 'waiting_teacher_grading' ? 'waiting_teacher_grading' : 'graded',
          submitted_at: new Date().toISOString(),
        });
      } catch (tableErr) {
        console.warn('Lưu vào bảng student_results (tùy chọn):', tableErr);
      }

      // B. Lưu vào cloud backup trong system_settings (giữ 50 bài nộp mới nhất, siêu nhẹ)
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

      // Cắt gọn danh sách tối đa 60 bài nộp mới nhất để dung lượng luôn dưới 150KB
      const newCloudSubmissions = [compactSubmission, ...cloudFiltered].slice(0, 60);

      await supabase.from('system_settings').upsert({
        key: CLOUD_SUBMISSIONS_KEY,
        value: {
          submissions: newCloudSubmissions,
          updated_at: new Date().toISOString(),
        },
      }, { onConflict: 'key' });

      // C. Tăng submissions_count trong geo_assignments_cloud để thẻ đề thi nhảy số
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
              submissions_count: (a.submissions_count || 0) + 1,
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

// 6. Lưu toàn bộ danh sách bài nộp (Đồng bộ đồng thời LocalStorage & Supabase Cloud khi giáo viên xóa/dọn dẹp/nhận xét)
export async function saveAllSubmissionsToCloud(submissions: any[]): Promise<void> {
  localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(submissions));
  window.dispatchEvent(new Event('geo_student_submissions_updated'));

  if (isSupabaseConfigured) {
    try {
      await supabase.from('system_settings').upsert(
        {
          key: CLOUD_SUBMISSIONS_KEY,
          value: {
            submissions,
            updated_at: new Date().toISOString(),
          },
        },
        { onConflict: 'key' }
      );
      console.log('✅ Đã đồng bộ toàn bộ bài nộp lên Supabase Cloud:', submissions.length);
    } catch (err) {
      console.warn('Lỗi đồng bộ submissions lên Supabase Cloud:', err);
    }
  }
}

// 7. Đồng bộ Thùng Rác (geo_deleted_assignments) giữa Local & Supabase Cloud
export async function saveTrashToCloud(trash: Assignment[]): Promise<void> {
  localStorage.setItem(LOCAL_TRASH_KEY, JSON.stringify(trash));

  // Ghi nhận các ID trong thùng rác vào danh sách đã xóa để không bao giờ bị đồng bộ lại vào đề hoạt động
  const deletedIds = getDeletedAssignmentIds();
  trash.forEach((t) => deletedIds.add(String(t.id)));
  localStorage.setItem(LOCAL_DELETED_IDS_KEY, JSON.stringify(Array.from(deletedIds)));

  window.dispatchEvent(new Event('geo_trash_updated'));

  if (isSupabaseConfigured) {
    try {
      await supabase.from('system_settings').upsert({
        key: CLOUD_TRASH_KEY,
        value: {
          trash,
          updated_at: new Date().toISOString(),
        },
      }, { onConflict: 'key' });

      await supabase.from('system_settings').upsert({
        key: CLOUD_DELETED_IDS_KEY,
        value: {
          deleted_ids: Array.from(deletedIds),
          updated_at: new Date().toISOString(),
        },
      }, { onConflict: 'key' });
    } catch (err) {
      console.warn('Lỗi lưu thùng rác lên Supabase Cloud:', err);
    }
  }
}

export async function fetchTrashFromCloud(): Promise<Assignment[]> {
  let localTrash: Assignment[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_TRASH_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) localTrash = parsed;
    }
  } catch (e) {
    console.warn('Lỗi đọc thùng rác local:', e);
  }

  if (!isSupabaseConfigured) return localTrash;

  try {
    const { data: cloudRow } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', CLOUD_TRASH_KEY)
      .maybeSingle();

    if (cloudRow?.value?.trash && Array.isArray(cloudRow.value.trash)) {
      const cloudTrash: Assignment[] = cloudRow.value.trash;
      const map = new Map<string, Assignment>();
      cloudTrash.forEach((t) => map.set(String(t.id), t));
      localTrash.forEach((t) => {
        if (!map.has(String(t.id))) map.set(String(t.id), t);
      });
      const merged = Array.from(map.values());
      localStorage.setItem(LOCAL_TRASH_KEY, JSON.stringify(merged));
      window.dispatchEvent(new Event('geo_trash_updated'));

      if (merged.length > cloudTrash.length) {
        await saveTrashToCloud(merged);
      }
      return merged;
    } else if (localTrash.length > 0) {
      await saveTrashToCloud(localTrash);
      return localTrash;
    }
  } catch (err) {
    console.warn('Lỗi fetch thùng rác từ Supabase:', err);
  }

  return localTrash;
}

// 8. Xóa bài kiểm tra (Xóa vĩnh viễn hoặc Chuyển vào thùng rác) - Đảm bảo triệt để cả Local & Cloud
export async function deleteAssignmentFromCloud(
  assignmentId: string,
  moveToTrashItem?: Assignment
): Promise<void> {
  const strId = String(assignmentId);

  // 1. Thêm vào tập ID đã xóa (localStorage)
  const deletedIds = getDeletedAssignmentIds();
  deletedIds.add(strId);
  localStorage.setItem(LOCAL_DELETED_IDS_KEY, JSON.stringify(Array.from(deletedIds)));

  // 2. Xóa sạch khỏi localStorage assignments
  try {
    const rawAsgs = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
    if (rawAsgs) {
      const current = JSON.parse(rawAsgs);
      if (Array.isArray(current)) {
        const remaining = current.filter((a: any) => String(a.id) !== strId);
        localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(remaining));
      }
    }
  } catch (e) {}

  // 3. Nếu chuyển vào thùng rác -> lưu vào localStorage trash
  if (moveToTrashItem) {
    try {
      const rawTrash = localStorage.getItem(LOCAL_TRASH_KEY);
      const currentTrash = rawTrash ? JSON.parse(rawTrash) : [];
      const updatedTrash = [
        moveToTrashItem,
        ...currentTrash.filter((t: any) => String(t.id) !== strId),
      ];
      localStorage.setItem(LOCAL_TRASH_KEY, JSON.stringify(updatedTrash));
    } catch (e) {}
  }

  // 4. Phát sự kiện cập nhật ngay tức thì cho giao diện
  window.dispatchEvent(new Event('geo_assignments_updated'));
  window.dispatchEvent(new Event('geo_trash_updated'));
  window.dispatchEvent(new Event('storage'));

  // 5. Cập nhật đồng bộ trên Supabase Cloud
  if (isSupabaseConfigured) {
    try {
      // A. Cập nhật CLOUD_DELETED_IDS_KEY
      await supabase.from('system_settings').upsert({
        key: CLOUD_DELETED_IDS_KEY,
        value: {
          deleted_ids: Array.from(deletedIds),
          updated_at: new Date().toISOString(),
        },
      }, { onConflict: 'key' });

      // B. Xóa khỏi CLOUD_SETTINGS_KEY
      const { data: cloudRow } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', CLOUD_SETTINGS_KEY)
        .maybeSingle();

      if (cloudRow?.value?.assignments && Array.isArray(cloudRow.value.assignments)) {
        const remainingCloud = cloudRow.value.assignments.filter(
          (a: any) => String(a.id) !== strId
        );
        await supabase.from('system_settings').upsert({
          key: CLOUD_SETTINGS_KEY,
          value: {
            assignments: remainingCloud,
            updated_at: new Date().toISOString(),
          },
        }, { onConflict: 'key' });
      }

      // C. Nếu chuyển vào thùng rác -> cập nhật CLOUD_TRASH_KEY
      if (moveToTrashItem) {
        const { data: trashRow } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', CLOUD_TRASH_KEY)
          .maybeSingle();

        const cloudTrash =
          trashRow?.value?.trash && Array.isArray(trashRow.value.trash)
            ? trashRow.value.trash
            : [];
        const updatedCloudTrash = [
          moveToTrashItem,
          ...cloudTrash.filter((t: any) => String(t.id) !== strId),
        ];

        await supabase.from('system_settings').upsert({
          key: CLOUD_TRASH_KEY,
          value: {
            trash: updatedCloudTrash,
            updated_at: new Date().toISOString(),
          },
        }, { onConflict: 'key' });
      }
    } catch (err) {
      console.warn('Lỗi đồng bộ xóa assignment lên Supabase:', err);
    }
  }
}

// 9. Khôi phục bài kiểm tra từ thùng rác - Đồng bộ cả Local & Cloud
export async function restoreAssignmentFromCloud(assignment: Assignment): Promise<void> {
  const strId = String(assignment.id);

  // 1. Xóa khỏi danh sách deletedIds
  const deletedIds = getDeletedAssignmentIds();
  deletedIds.delete(strId);
  localStorage.setItem(LOCAL_DELETED_IDS_KEY, JSON.stringify(Array.from(deletedIds)));

  // 2. Xóa khỏi localStorage trash
  try {
    const rawTrash = localStorage.getItem(LOCAL_TRASH_KEY);
    if (rawTrash) {
      const currentTrash = JSON.parse(rawTrash);
      if (Array.isArray(currentTrash)) {
        const remainingTrash = currentTrash.filter((t: any) => String(t.id) !== strId);
        localStorage.setItem(LOCAL_TRASH_KEY, JSON.stringify(remainingTrash));
      }
    }
  } catch (e) {}

  // 3. Thêm lại vào localStorage assignments
  const { deleted_at, ...cleanAsg } = assignment as any;
  try {
    const rawAsgs = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
    const currentAsgs = rawAsgs ? JSON.parse(rawAsgs) : [];
    const updatedAsgs = [cleanAsg, ...currentAsgs.filter((a: any) => String(a.id) !== strId)];
    localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(updatedAsgs));
  } catch (e) {}

  window.dispatchEvent(new Event('geo_assignments_updated'));
  window.dispatchEvent(new Event('geo_trash_updated'));
  window.dispatchEvent(new Event('storage'));

  // 4. Đồng bộ lên Supabase Cloud
  if (isSupabaseConfigured) {
    try {
      // Cập nhật deleted_ids
      await supabase.from('system_settings').upsert({
        key: CLOUD_DELETED_IDS_KEY,
        value: {
          deleted_ids: Array.from(deletedIds),
          updated_at: new Date().toISOString(),
        },
      }, { onConflict: 'key' });

      // Xóa khỏi trash cloud
      const { data: trashRow } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', CLOUD_TRASH_KEY)
        .maybeSingle();

      if (trashRow?.value?.trash && Array.isArray(trashRow.value.trash)) {
        const remainingTrash = trashRow.value.trash.filter((t: any) => String(t.id) !== strId);
        await supabase.from('system_settings').upsert({
          key: CLOUD_TRASH_KEY,
          value: {
            trash: remainingTrash,
            updated_at: new Date().toISOString(),
          },
        }, { onConflict: 'key' });
      }

      // Thêm lại vào assignments cloud
      const { data: cloudRow } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', CLOUD_SETTINGS_KEY)
        .maybeSingle();

      const cloudAsgs =
        cloudRow?.value?.assignments && Array.isArray(cloudRow.value.assignments)
          ? cloudRow.value.assignments
          : [];
      const updatedCloudAsgs = [cleanAsg, ...cloudAsgs.filter((a: any) => String(a.id) !== strId)];

      await supabase.from('system_settings').upsert({
        key: CLOUD_SETTINGS_KEY,
        value: {
          assignments: updatedCloudAsgs,
          updated_at: new Date().toISOString(),
        },
      }, { onConflict: 'key' });
    } catch (err) {
      console.warn('Lỗi khôi phục assignment lên Supabase:', err);
    }
  }
}


