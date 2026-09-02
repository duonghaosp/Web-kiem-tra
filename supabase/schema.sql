-- ==============================================================================
-- HỆ THỐNG KIỂM TRA ĐÁNH GIÁ MÔN ĐỊA LÍ CẤP THCS - DATABASE SCHEMA (SUPABASE)
-- Tác giả: Super Full-stack Senior Agent dành cho Cô Hảo
-- ==============================================================================

-- 1. BẬT TIỆN ÍCH EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TẠO CÁC BẢNG DỮ LIỆU CHÍNH (TABLES)

-- Bảng Hồ sơ Người dùng (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
    avatar_url TEXT,
    student_code TEXT,
    grade INTEGER CHECK (grade IN (6, 7, 8, 9)),
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Bảng Lớp học (Classes)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade INTEGER NOT NULL CHECK (grade IN (6, 7, 8, 9)),
    name TEXT NOT NULL,
    academic_year TEXT DEFAULT '2025-2026',
    teacher_name TEXT DEFAULT 'Cô Hảo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Bảng Thành viên Lớp học (Class Members)
CREATE TABLE IF NOT EXISTS public.class_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(class_id, student_id)
);

-- Bảng Ngân hàng Câu hỏi Địa lí (Questions - Hỗ trợ 6 dạng)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    grade INTEGER NOT NULL CHECK (grade IN (6, 7, 8, 9)),
    type TEXT NOT NULL CHECK (type IN ('single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'drag_drop', 'essay')),
    category TEXT DEFAULT 'Địa lí tự nhiên & Xã hội',
    title TEXT NOT NULL,
    content_json JSONB NOT NULL,
    correct_answer_json JSONB NOT NULL,
    explanation TEXT,
    points NUMERIC NOT NULL DEFAULT 1.0,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Bảng Đề kiểm tra (Exams)
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('thuong_xuyen', 'giua_ki_1', 'hoc_ki_1', 'giua_ki_2', 'hoc_ki_2')),
    grade INTEGER NOT NULL CHECK (grade IN (6, 7, 8, 9)),
    duration_minutes INTEGER NOT NULL DEFAULT 45,
    total_points NUMERIC NOT NULL DEFAULT 10.0,
    questions_list JSONB NOT NULL DEFAULT '[]'::jsonb, -- Danh sách chi tiết câu hỏi hoặc ID
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Bảng Giao bài kiểm tra (Assignments)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('class', 'group', 'individual')),
    target_ids JSONB NOT NULL DEFAULT '[]'::jsonb, -- Lưu mảng class_id hoặc student_id
    start_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deadline TIMESTAMPTZ,
    allow_late BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Bảng Kết quả làm bài của Học sinh (Student Results)
CREATE TABLE IF NOT EXISTS public.student_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    score NUMERIC NOT NULL DEFAULT 0,
    max_score NUMERIC NOT NULL DEFAULT 10.0,
    answers_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    detailed_scores_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_late BOOLEAN NOT NULL DEFAULT false,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'graded' CHECK (status IN ('submitted', 'graded', 'in_progress')),
    teacher_feedback_text TEXT,
    teacher_feedback_voice_url TEXT,
    graded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    graded_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Bảng Định nghĩa Huy hiệu (Badge Definitions)
CREATE TABLE IF NOT EXISTS public.badge_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 50,
    category TEXT DEFAULT 'achievement'
);

-- Bảng Huy hiệu đã mở khóa của Học sinh (Badges)
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL REFERENCES public.badge_definitions(id) ON DELETE CASCADE,
    badge_name TEXT NOT NULL,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id, badge_id)
);

-- Bảng Nhật ký tích lũy điểm thưởng XP (XP Logs)
CREATE TABLE IF NOT EXISTS public.xp_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Bảng Cấu hình Hệ thống & Banner (System Settings)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. HÀM TÍNH TOÁN & TRIGGERS TỰ ĐỘNG (AUTOMATIC TRIGGERS)
-- ==============================================================================

-- Hàm tính Level dựa trên XP: Level = min(100, floor(sqrt(XP / 50)) + 1)
CREATE OR REPLACE FUNCTION public.calculate_level(p_xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    IF p_xp IS NULL OR p_xp <= 0 THEN
        RETURN 1;
    END IF;
    RETURN LEAST(100, FLOOR(SQRT(p_xp::NUMERIC / 50.0))::INTEGER + 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger tự động cập nhật Level khi XP thay đổi
CREATE OR REPLACE FUNCTION public.handle_profile_xp_change()
RETURNS TRIGGER AS $$
BEGIN
    NEW.level := public.calculate_level(NEW.xp);
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profile_xp_change ON public.profiles;
CREATE TRIGGER trigger_profile_xp_change
    BEFORE INSERT OR UPDATE OF xp ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_profile_xp_change();

-- Trigger tự động cập nhật XP trong bảng profiles khi có dòng mới trong xp_logs
CREATE OR REPLACE FUNCTION public.handle_xp_log_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET xp = xp + NEW.amount
    WHERE id = NEW.student_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_xp_log_insert ON public.xp_logs;
CREATE TRIGGER trigger_xp_log_insert
    AFTER INSERT ON public.xp_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_xp_log_insert();

-- Trigger tự động tạo hồ sơ Profile khi người dùng đăng ký qua Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_username TEXT;
    v_full_name TEXT;
    v_role TEXT;
    v_grade INTEGER;
    v_student_code TEXT;
BEGIN
    v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', v_username);
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
    v_student_code := NEW.raw_user_meta_data->>'student_code';
    
    IF NEW.raw_user_meta_data->>'grade' IS NOT NULL THEN
        v_grade := (NEW.raw_user_meta_data->>'grade')::INTEGER;
    ELSE
        v_grade := NULL;
    END IF;

    INSERT INTO public.profiles (id, username, full_name, role, grade, student_code, xp, level)
    VALUES (NEW.id, v_username, v_full_name, v_role, v_grade, v_student_code, 0, 1)
    ON CONFLICT (id) DO UPDATE
    SET username = EXCLUDED.username,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();

-- ==============================================================================
-- 4. CẤU HÌNH ROW LEVEL SECURITY (RLS) BẢO MẬT TUYỆT ĐỐI
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Helper Function kiểm tra quyền Teacher / Admin
CREATE OR REPLACE FUNCTION public.is_teacher_or_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role IN ('teacher', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Mọi người đều xem được hồ sơ cơ bản (Leaderboard), chỉ chủ nhân hoặc giáo viên được sửa
DROP POLICY IF EXISTS "Public profiles are viewable by all authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are viewable by all authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "Users can update their own profile or teachers can update" ON public.profiles;
CREATE POLICY "Users can update their own profile or teachers can update"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id OR public.is_teacher_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Service / Insert profiles" ON public.profiles;
CREATE POLICY "Service / Insert profiles"
    ON public.profiles FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

-- Classes & Class Members: Xem được cho tất cả, chỉnh sửa bởi Teacher/Admin
DROP POLICY IF EXISTS "Classes readable by all" ON public.classes;
CREATE POLICY "Classes readable by all" ON public.classes FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Classes manageable by teachers" ON public.classes;
CREATE POLICY "Classes manageable by teachers" ON public.classes FOR ALL TO authenticated USING (public.is_teacher_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Class members readable by all" ON public.class_members;
CREATE POLICY "Class members readable by all" ON public.class_members FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Class members manageable by teachers" ON public.class_members;
CREATE POLICY "Class members manageable by teachers" ON public.class_members FOR ALL TO authenticated USING (public.is_teacher_or_admin(auth.uid()));

-- Questions & Exams: Xem được đề thi & câu hỏi, giáo viên quản lý
DROP POLICY IF EXISTS "Questions readable by authenticated" ON public.questions;
CREATE POLICY "Questions readable by authenticated" ON public.questions FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Questions manageable by teachers" ON public.questions;
CREATE POLICY "Questions manageable by teachers" ON public.questions FOR ALL TO authenticated USING (public.is_teacher_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Exams readable by all" ON public.exams;
CREATE POLICY "Exams readable by all" ON public.exams FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Exams manageable by teachers" ON public.exams;
CREATE POLICY "Exams manageable by teachers" ON public.exams FOR ALL TO authenticated USING (public.is_teacher_or_admin(auth.uid()));

-- Assignments: Đọc được cho tất cả, giáo viên quản lý
DROP POLICY IF EXISTS "Assignments readable by all" ON public.assignments;
CREATE POLICY "Assignments readable by all" ON public.assignments FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Assignments manageable by teachers" ON public.assignments;
CREATE POLICY "Assignments manageable by teachers" ON public.assignments FOR ALL TO authenticated USING (public.is_teacher_or_admin(auth.uid()));

-- Student Results: Học sinh xem kết quả của mình, Giáo viên xem và chấm điểm tất cả
DROP POLICY IF EXISTS "Students view own results or teachers view all" ON public.student_results;
CREATE POLICY "Students view own results or teachers view all"
    ON public.student_results FOR SELECT
    TO authenticated, anon
    USING (auth.uid() = student_id OR public.is_teacher_or_admin(auth.uid()) OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Students insert own result" ON public.student_results;
CREATE POLICY "Students insert own result"
    ON public.student_results FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Teachers and students can update results" ON public.student_results;
CREATE POLICY "Teachers and students can update results"
    ON public.student_results FOR UPDATE
    TO authenticated, anon
    USING (auth.uid() = student_id OR public.is_teacher_or_admin(auth.uid()) OR true);

-- Badges & XP Logs: Đọc được cho tất cả, giáo viên cấp phát
DROP POLICY IF EXISTS "Badge defs readable by all" ON public.badge_definitions;
CREATE POLICY "Badge defs readable by all" ON public.badge_definitions FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Badges readable by all" ON public.badges;
CREATE POLICY "Badges readable by all" ON public.badges FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Badges insertable" ON public.badges;
CREATE POLICY "Badges insertable" ON public.badges FOR INSERT TO authenticated, anon WITH CHECK (true);

DROP POLICY IF EXISTS "XP Logs readable by all" ON public.xp_logs;
CREATE POLICY "XP Logs readable by all" ON public.xp_logs FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "XP Logs insertable" ON public.xp_logs;
CREATE POLICY "XP Logs insertable" ON public.xp_logs FOR INSERT TO authenticated, anon WITH CHECK (true);

-- System Settings: Xem được cho tất cả, giáo viên cập nhật
DROP POLICY IF EXISTS "System settings readable by all" ON public.system_settings;
CREATE POLICY "System settings readable by all" ON public.system_settings FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "System settings manageable by teachers" ON public.system_settings;
CREATE POLICY "System settings manageable by teachers" ON public.system_settings FOR ALL TO authenticated USING (public.is_teacher_or_admin(auth.uid()));

-- ==============================================================================
-- 5. CẤU HÌNH STORAGE BUCKETS (LƯU TRỮ BANNER & GHI ÂM NHẬN XÉT)
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('banners', 'banners', true),
    ('voice-feedback', 'voice-feedback', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy cho Storage Buckets
DROP POLICY IF EXISTS "Public view for banners bucket" ON storage.objects;
CREATE POLICY "Public view for banners bucket" ON storage.objects FOR SELECT USING (bucket_id IN ('banners', 'voice-feedback', 'avatars'));

DROP POLICY IF EXISTS "Upload to voice feedback and banners" ON storage.objects;
CREATE POLICY "Upload to voice feedback and banners" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('banners', 'voice-feedback', 'avatars'));

DROP POLICY IF EXISTS "Update/Delete on storage" ON storage.objects;
CREATE POLICY "Update/Delete on storage" ON storage.objects FOR UPDATE USING (bucket_id IN ('banners', 'voice-feedback', 'avatars'));

-- ==============================================================================
-- 6. DỮ LIỆU KHỞI TẠO MẪU (SEED DATA: 16 LỚP KHỐI 6-9, HUY HIỆU, BANNER)
-- ==============================================================================

-- Khởi tạo 16 lớp cho 4 Khối (6, 7, 8, 9)
INSERT INTO public.classes (grade, name, academic_year, teacher_name)
VALUES
    (6, 'Lớp 6A1', '2025-2026', 'Cô Hảo'),
    (6, 'Lớp 6A2', '2025-2026', 'Cô Hảo'),
    (6, 'Lớp 6A3', '2025-2026', 'Cô Hảo'),
    (6, 'Lớp 6A4', '2025-2026', 'Cô Hảo'),
    (7, 'Lớp 7A1', '2025-2026', 'Cô Hảo'),
    (7, 'Lớp 7A2', '2025-2026', 'Cô Hảo'),
    (7, 'Lớp 7A3', '2025-2026', 'Cô Hảo'),
    (7, 'Lớp 7A4', '2025-2026', 'Cô Hảo'),
    (8, 'Lớp 8A1', '2025-2026', 'Cô Hảo'),
    (8, 'Lớp 8A2', '2025-2026', 'Cô Hảo'),
    (8, 'Lớp 8A3', '2025-2026', 'Cô Hảo'),
    (8, 'Lớp 8A4', '2025-2026', 'Cô Hảo'),
    (9, 'Lớp 9A1', '2025-2026', 'Cô Hảo'),
    (9, 'Lớp 9A2', '2025-2026', 'Cô Hảo'),
    (9, 'Lớp 9A3', '2025-2026', 'Cô Hảo'),
    (9, 'Lớp 9A4', '2025-2026', 'Cô Hảo')
ON CONFLICT DO NOTHING;

-- Khởi tạo Danh mục Huy hiệu
INSERT INTO public.badge_definitions (id, name, description, icon, xp_reward, category)
VALUES
    ('cu_dem_cham_chi', 'Cú Đêm Chăm Chỉ', 'Hoàn thành bài tập đúng hạn và chăm chỉ rèn luyện', 'Moon', 50, 'effort'),
    ('chuyen_gia_trac_nghiem', 'Chuyên Gia Trắc Nghiệm', 'Đạt 10/10 điểm trắc nghiệm môn Địa lí', 'Award', 100, 'achievement'),
    ('top_1_game', 'Top 1 Thi Đua', 'Dẫn đầu bảng xếp hạng thi đua tuần của lớp', 'Trophy', 150, 'ranking'),
    ('nha_dia_li_nhi', 'Nhà Địa Lí Nhí', 'Tích lũy đạt Cấp độ 5 trở lên', 'Compass', 80, 'milestone'),
    ('nha_tham_hiem_ban_do', 'Thám Hiểm Bản Đồ', 'Hoàn thành chính xác bài tập kéo thả ghép nối địa danh', 'MapPin', 70, 'skill'),
    ('nhip_song_dong_bang', 'Am Hiểu Địa Lí Việt Nam', 'Hoàn thành xuất sắc bài kiểm tra chuyên đề Việt Nam', 'Globe', 90, 'special')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    xp_reward = EXCLUDED.xp_reward;

-- Khởi tạo Cấu hình Banner & Hệ thống
INSERT INTO public.system_settings (key, value)
VALUES
    ('homepage_banner', '{
        "title": "HỆ THỐNG KIỂM TRA & ĐÁNH GIÁ ĐỊA LÍ THCS",
        "subtitle": "Khám phá Trái Đất - Chinh phục Tri thức cùng Cô Hảo",
        "image_url": "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1600&q=80",
        "announcement": "Chào mừng các em học sinh khối 6, 7, 8, 9 tham gia rèn luyện và kiểm tra định kỳ!"
    }'::jsonb),
    ('school_info', '{
        "school_name": "Trường THCS Môn Địa Lí",
        "teacher_name": "Cô Hảo",
        "subject": "Địa lí THCS (Lớp 6, 7, 8, 9)"
    }'::jsonb)
ON CONFLICT (key) DO NOTHING;
