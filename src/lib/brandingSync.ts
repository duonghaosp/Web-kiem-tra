import { supabase, isSupabaseConfigured, uploadToStorage } from './supabase';

export const LOCAL_TEACHER_AVATAR_KEY = 'geo_teacher_avatar';
export const LOCAL_SCHOOL_LOGO_KEY = 'geo_school_logo';
export const LOCAL_SCHOOL_NAME_KEY = 'geo_school_name';

export interface BrandingData {
  teacher_avatar_url?: string;
  school_logo_url?: string;
  school_name?: string;
  teacher_name?: string;
}

// 1. Lấy dữ liệu ảnh & logo hiện tại từ LocalStorage
export function getLocalBranding(): BrandingData {
  return {
    teacher_avatar_url: localStorage.getItem(LOCAL_TEACHER_AVATAR_KEY) || '',
    school_logo_url: localStorage.getItem(LOCAL_SCHOOL_LOGO_KEY) || '',
    school_name: localStorage.getItem(LOCAL_SCHOOL_NAME_KEY) || 'Trường PTDTBT TH&THCS Sì Lở Lầu',
  };
}

// 2. Lưu ảnh đại diện giáo viên (Cả LocalStorage và Supabase Cloud)
export async function saveTeacherAvatar(urlOrBase64: string): Promise<void> {
  if (!urlOrBase64) return;
  localStorage.setItem(LOCAL_TEACHER_AVATAR_KEY, urlOrBase64);

  // Cập nhật vào profile đã lưu trong LocalStorage
  try {
    const raw = localStorage.getItem('geo_thcs_auth_profile');
    if (raw) {
      const p = JSON.parse(raw);
      p.avatar_url = urlOrBase64;
      localStorage.setItem('geo_thcs_auth_profile', JSON.stringify(p));
    }
  } catch (e) {}

  // Bắn sự kiện cập nhật giao diện toàn hệ thống
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent('geo_settings_updated'));

  // Đồng bộ lên Supabase Cloud system_settings
  if (isSupabaseConfigured) {
    try {
      await supabase.from('system_settings').upsert({
        key: 'teacher_avatar',
        value: {
          avatar_url: urlOrBase64,
          updated_at: new Date().toISOString(),
        },
      });

      // Cập nhật cả vào bảng profiles nếu có tài khoản giáo viên
      await supabase.from('profiles').update({ avatar_url: urlOrBase64 }).eq('role', 'teacher');
    } catch (err) {
      console.warn('Lỗi lưu avatar lên Supabase:', err);
    }
  }
}

// 3. Xử lý tải file ảnh avatar lên Supabase Storage và lưu trữ lâu dài
export async function uploadAndSaveTeacherAvatar(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result as string;
      // Lưu tạm bản base64 ngay lập tức để giao diện hiển thị không bị trễ
      await saveTeacherAvatar(base64Url);

      // Tải lên Supabase Storage nếu có kết nối
      if (isSupabaseConfigured) {
        const filename = `teacher_avatar_${Date.now()}.png`;
        uploadToStorage('avatars', filename, file).then(async ({ url }) => {
          if (url) {
            await saveTeacherAvatar(url);
            resolve(url);
          } else {
            resolve(base64Url);
          }
        });
      } else {
        resolve(base64Url);
      }
    };
    reader.readAsDataURL(file);
  });
}

// 4. Lưu Logo Trường (Cả LocalStorage và Supabase Cloud)
export async function saveSchoolLogo(urlOrBase64: string): Promise<void> {
  if (urlOrBase64) {
    localStorage.setItem(LOCAL_SCHOOL_LOGO_KEY, urlOrBase64);
  } else {
    localStorage.removeItem(LOCAL_SCHOOL_LOGO_KEY);
  }

  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent('geo_settings_updated'));

  if (isSupabaseConfigured) {
    try {
      await supabase.from('system_settings').upsert({
        key: 'school_logo',
        value: {
          logo_url: urlOrBase64 || '',
          updated_at: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.warn('Lỗi lưu logo lên Supabase:', err);
    }
  }
}

// 5. Xử lý tải file Logo trường lên Supabase Storage và lưu trữ lâu dài
export async function uploadAndSaveSchoolLogo(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result as string;
      await saveSchoolLogo(base64Url);

      if (isSupabaseConfigured) {
        const filename = `school_logo_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        uploadToStorage('banners', filename, file).then(async ({ url }) => {
          if (url) {
            await saveSchoolLogo(url);
            resolve(url);
          } else {
            resolve(base64Url);
          }
        });
      } else {
        resolve(base64Url);
      }
    };
    reader.readAsDataURL(file);
  });
}

// 6. Đồng bộ toàn bộ ảnh đại diện & logo từ Supabase Cloud về máy khách khi tải trang (F5)
export async function syncBrandingFromCloud(): Promise<BrandingData> {
  const result: BrandingData = getLocalBranding();

  if (!isSupabaseConfigured) return result;

  try {
    // 1. Tải ảnh avatar giáo viên từ Supabase
    const { data: avatarData } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'teacher_avatar')
      .maybeSingle();

    if (avatarData?.value?.avatar_url) {
      result.teacher_avatar_url = avatarData.value.avatar_url;
      localStorage.setItem(LOCAL_TEACHER_AVATAR_KEY, avatarData.value.avatar_url);
    }

    // 2. Tải logo trường từ Supabase
    const { data: logoData } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'school_logo')
      .maybeSingle();

    if (logoData?.value?.logo_url) {
      result.school_logo_url = logoData.value.logo_url;
      localStorage.setItem(LOCAL_SCHOOL_LOGO_KEY, logoData.value.logo_url);
    }

    // 3. Tải tên trường & cấu hình chung nếu có
    const { data: generalData } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'general_settings')
      .maybeSingle();

    if (generalData?.value) {
      if (generalData.value.schoolLogoUrl && !result.school_logo_url) {
        result.school_logo_url = generalData.value.schoolLogoUrl;
        localStorage.setItem(LOCAL_SCHOOL_LOGO_KEY, generalData.value.schoolLogoUrl);
      }
      if (generalData.value.teacherAvatarUrl && !result.teacher_avatar_url) {
        result.teacher_avatar_url = generalData.value.teacherAvatarUrl;
        localStorage.setItem(LOCAL_TEACHER_AVATAR_KEY, generalData.value.teacherAvatarUrl);
      }
      if (generalData.value.schoolName) {
        result.school_name = generalData.value.schoolName;
        localStorage.setItem(LOCAL_SCHOOL_NAME_KEY, generalData.value.schoolName);
      }
    }

    // Cập nhật vào profile trong LocalStorage nếu là giáo viên
    const raw = localStorage.getItem('geo_thcs_auth_profile');
    if (raw && result.teacher_avatar_url) {
      try {
        const p = JSON.parse(raw);
        if (p.role === 'teacher') {
          p.avatar_url = result.teacher_avatar_url;
          localStorage.setItem('geo_thcs_auth_profile', JSON.stringify(p));
        }
      } catch (e) {}
    }

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('geo_settings_updated'));
  } catch (err) {
    console.warn('Lỗi đồng bộ branding từ Supabase:', err);
  }

  return result;
}
