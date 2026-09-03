import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, UserRole } from '../types/database';
import { getStoredStudents } from '../data/studentsData';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
  signInAsTeacher: (email: string, password?: string) => Promise<{ error: any }>;
  signInAsStudent: (studentCodeOrUsername: string, expectedGrade?: number) => Promise<{ error: any }>;
  quickLogin: (role: UserRole, customName?: string, grade?: number) => void;
  updateProfile: (updatedData: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'geo_thcs_auth_user';
const LOCAL_STORAGE_PROFILE_KEY = 'geo_thcs_auth_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Khởi tạo và đồng bộ phiên đăng nhập
  useEffect(() => {
    async function initAuth() {
      try {
        if (isSupabaseConfigured) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          } else {
            loadFromLocalStorage();
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
              setUser(session.user);
              await fetchProfile(session.user.id);
            } else {
              loadFromLocalStorage();
            }
          });

          return () => {
            subscription.unsubscribe();
          };
        } else {
          loadFromLocalStorage();
        }
      } catch (err) {
        console.error('Lỗi khởi tạo Auth:', err);
        loadFromLocalStorage();
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const loadFromLocalStorage = () => {
    try {
      const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        setProfile(parsed);
        setUser({ id: parsed.id, email: `${parsed.username}@diali.edu.vn` });
      } else {
        // Thiết bị mới / học sinh quét mã QR chưa đăng nhập
        setProfile(null);
        setUser(null);
      }
    } catch (e) {
      console.warn('Lỗi đọc Auth từ LocalStorage:', e);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setProfile(data as Profile);
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Không thể tải profile từ Supabase:', err);
    }
  };

  const refreshProfile = async () => {
    if (profile?.id && isSupabaseConfigured) {
      await fetchProfile(profile.id);
    }
  };

  const updateProfile = async (updatedData: Partial<Profile>) => {
    if (!profile) return;
    const newProfile = { ...profile, ...updatedData };
    setProfile(newProfile);
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(newProfile));

    if (isSupabaseConfigured && profile.id && !profile.id.startsWith('teacher-')) {
      try {
        await supabase.from('profiles').update(updatedData).eq('id', profile.id);
      } catch (e) {
        console.warn('Lỗi cập nhật profile Supabase:', e);
      }
    }
  };

  // Đăng nhập dành cho Giáo viên (Cô Dương Thu Hảo)
  const signInAsTeacher = async (email: string, password: string = '') => {
    try {
      const cleanEmail = (email || '').trim();
      const cleanPassword = (password || '').trim();

      if (!cleanEmail) {
        return { error: { message: 'Cô vui lòng nhập tài khoản hoặc email giáo viên!' } };
      }
      if (!cleanPassword) {
        return { error: { message: 'Cô vui lòng nhập mật khẩu bảo mật giáo viên!' } };
      }

      // Lấy mật khẩu giáo viên bảo mật đã lưu (mặc định ban đầu là 123456, cô Hảo có thể đổi trong Cài đặt)
      let storedTeacherPassword = localStorage.getItem('geo_teacher_secret_password') || '123456';
      if (isSupabaseConfigured) {
        try {
          const { data: settingData } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'teacher_security')
            .maybeSingle();

          if (settingData?.value?.password) {
            storedTeacherPassword = settingData.value.password;
            localStorage.setItem('geo_teacher_secret_password', storedTeacherPassword);
          }
        } catch (e) {
          // Bỏ qua lỗi mạng
        }
      }

      // 1. Kiểm tra mật khẩu giáo viên: Nếu nhập sai mật khẩu -> Chặn tuyệt đối!
      if (cleanPassword !== storedTeacherPassword) {
        return {
          error: {
            message: 'Mật khẩu giáo viên không chính xác! Học sinh không có quyền truy cập bàn làm việc giáo viên.',
          },
        };
      }

      // 2. Nếu có kết nối Supabase và email có đuôi thực tế (như gmail.com), thử đăng nhập Supabase Auth
      if (isSupabaseConfigured && cleanEmail.includes('@') && !cleanEmail.endsWith('@diali.edu.vn')) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword,
          });

          if (!error && data?.user) {
            setUser(data.user);
            await fetchProfile(data.user.id);
            return { error: null };
          }
        } catch (supabaseErr) {
          console.warn('Supabase Auth error, chuyển sang xác thực giáo viên trực tiếp:', supabaseErr);
        }
      }

      // 3. Xác thực thành công tài khoản Giáo viên (Cô Dương Thu Hảo)
      const username = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;
      const teacherProfile: Profile = {
        id: 'teacher-duong-thu-hao',
        username: username || 'duongthuhao_diali',
        full_name: 'Cô Dương Thu Hảo',
        role: 'teacher',
        xp: 0,
        level: 1,
        avatar_url: profile?.avatar_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80',
      };

      setProfile(teacherProfile);
      setUser({ id: teacherProfile.id, email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@diali.edu.vn` });
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(teacherProfile));
      return { error: null };
    } catch (err: any) {
      console.warn('Lỗi signInAsTeacher:', err);
      return { error: err };
    }
  };

  // Đăng nhập dành cho Học sinh: Xác thực mã học sinh và bắt buộc chọn đúng Khối lớp
  const signInAsStudent = async (studentCodeOrUsername: string, expectedGrade?: number) => {
    try {
      const rawInput = studentCodeOrUsername.trim();
      if (!rawInput) {
        return { error: { message: 'Em vui lòng nhập mã học sinh của mình!' } };
      }
      const code = rawInput.toLowerCase();

      // 1. Tìm trong Supabase (nếu có cấu hình)
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`student_code.ilike.%${code}%,username.ilike.%${code}%`)
          .limit(1)
          .maybeSingle();

        if (data && !error) {
          if (expectedGrade && data.grade && Number(data.grade) !== Number(expectedGrade)) {
            return {
              error: {
                message: `Mã học sinh ${data.student_code || rawInput.toUpperCase()} (${data.full_name}) thuộc Khối ${data.grade} (${data.class_name || ''}). Em vui lòng chọn đúng Khối ${data.grade} để đăng nhập!`,
              },
            };
          }
          setProfile(data as Profile);
          setUser({ id: data.id, email: `${data.username}@diali.edu.vn` });
          localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(data));
          return { error: null };
        }
      }

      // 2. Tìm trong danh sách học sinh toàn trường (LocalStorage hoặc INITIAL_STUDENTS)
      const allStudents = getStoredStudents();
      let found = allStudents.find((s: Profile) =>
        (s.student_code && s.student_code.toLowerCase() === code) ||
        (s.username && s.username.toLowerCase() === code) ||
        (s.id && s.id.toLowerCase() === code)
      );

      // Thử tìm theo chuỗi mã không phân biệt định dạng (VD: hs71 thay vì hs071)
      if (!found) {
        const cleanInput = code.replace(/[^a-z0-9]/g, '');
        found = allStudents.find((s: Profile) => {
          const cleanCode = (s.student_code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return cleanCode === cleanInput;
        });
      }

      if (found) {
        // Bắt buộc kiểm tra đúng Khối lớp
        if (expectedGrade && found.grade && Number(found.grade) !== Number(expectedGrade)) {
          return {
            error: {
              message: `Mã học sinh ${found.student_code || rawInput.toUpperCase()} (${found.full_name}) thuộc Khối ${found.grade} (${found.class_name || ''}). Em vui lòng chọn đúng Khối ${found.grade} để đăng nhập!`,
            },
          };
        }

        setProfile(found);
        setUser({ id: found.id, email: `${found.username}@diali.edu.vn` });
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(found));
        return { error: null };
      }

      // 3. Nếu không tìm thấy: Báo lỗi chi tiết để học sinh dễ nhận biết
      const gradeMatch = code.match(/hs0?(\d)/i);
      if (gradeMatch) {
        const codeGrade = parseInt(gradeMatch[1]);
        if (codeGrade >= 6 && codeGrade <= 9 && expectedGrade && codeGrade !== expectedGrade) {
          return {
            error: {
              message: `Mã "${rawInput.toUpperCase()}" thuộc Khối ${codeGrade}. Em hãy chọn đúng Khối ${codeGrade} và kiểm tra lại mã do cô Hảo cung cấp nhé!`,
            },
          };
        }
      }

      return {
        error: {
          message: `Không tìm thấy mã học sinh "${rawInput.toUpperCase()}" trong danh sách Khối ${expectedGrade || 6}. Em vui lòng kiểm tra lại chính xác mã số do cô Hảo cung cấp nhé!`,
        },
      };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Chuyển đổi vai trò nhanh
  const quickLogin = (newRole: UserRole, customName?: string, grade: number = 6) => {
    let mockProfile: Profile;
    if (newRole === 'teacher' || newRole === 'admin') {
      mockProfile = {
        id: 'teacher-duong-thu-hao-main',
        username: 'duongthuhao_diali',
        full_name: customName || 'Dương Thu Hảo',
        role: 'teacher',
        xp: 0,
        level: 1,
        avatar_url: profile?.avatar_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80',
      };
    } else {
      mockProfile = {
        id: 'student-nguyen-van-a',
        username: 'hs_nguyenvana',
        student_code: 'HS0601',
        full_name: customName || 'Nguyễn Văn An (Lớp 6A1)',
        role: 'student',
        grade,
        xp: 320,
        level: 3,
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      };
    }

    setProfile(mockProfile);
    setUser({ id: mockProfile.id, email: `${mockProfile.username}@diali.edu.vn` });
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(mockProfile));
  };

  // Đăng xuất hoàn toàn
  const signOut = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Lỗi Supabase signOut:', e);
      }
    }
    localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    setProfile(null);
    setUser(null);
  };

  const role: UserRole = profile?.role || 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        signInAsTeacher,
        signInAsStudent,
        quickLogin,
        updateProfile,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
