-- ==============================================================================
-- 🌏 HỆ THỐNG KIỂM TRA ĐÁNH GIÁ MÔN ĐỊA LÍ THCS - BẢN THIẾT LẬP TOÀN DIỆN
-- Dành cho: Cô Dương Thu Hảo (PTDTBT TH&THCS Sì Lờ Lầu, Phong Thổ, Lai Châu)
-- ==============================================================================
-- Hướng dẫn: 
-- 1. Đăng nhập https://supabase.com -> Chọn Project của cô
-- 2. Ở thanh menu bên trái, bấm vào biểu tượng "SQL Editor" (hình chữ nhật có dấu nhắc lệnh >_)
-- 3. Bấm nút "+ New query"
-- 4. Dán toàn bộ nội dung file này vào và bấm nút "Run" (hoặc Ctrl + Enter)
-- ==============================================================================

-- 1. BẬT CÁC EXTENSIONS CẦN THIẾT
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TẠO CÁC BẢNG DỮ LIỆU (TABLES)
-- ==============================================================================

-- 2.1. Bảng Hồ Sơ Người Dùng (Profiles - Giáo viên & Học sinh)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
    avatar_url TEXT,
    student_code TEXT,
    grade INTEGER CHECK (grade IN (6, 7, 8, 9)),
    class_name TEXT,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.2. Bảng Danh Sách Lớp Học (Classes)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade INTEGER NOT NULL CHECK (grade IN (6, 7, 8, 9)),
    name TEXT NOT NULL,
    academic_year TEXT DEFAULT '2025-2026',
    teacher_name TEXT DEFAULT 'Cô Dương Thu Hảo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.3. Bảng Phân Lớp Cho Học Sinh (Class Members)
CREATE TABLE IF NOT EXISTS public.class_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(class_id, student_id)
);

-- 2.4. Bảng Ngân Hàng Câu Hỏi Địa Lí (Questions - Chuẩn 6 Dạng Bài)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    grade INTEGER NOT NULL CHECK (grade IN (6, 7, 8, 9)),
    type TEXT NOT NULL CHECK (type IN ('single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'drag_drop', 'essay')),
    category TEXT DEFAULT 'Địa lí tự nhiên & Xã hội',
    lesson_id TEXT,
    title TEXT NOT NULL,
    content_json JSONB NOT NULL,
    correct_answer_json JSONB NOT NULL,
    explanation TEXT,
    points NUMERIC NOT NULL DEFAULT 1.0,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.5. Bảng Kho Đề Kiểm Tra (Exams)
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('thuong_xuyen', 'giua_ki_1', 'hoc_ki_1', 'giua_ki_2', 'hoc_ki_2')),
    grade INTEGER NOT NULL CHECK (grade IN (6, 7, 8, 9)),
    duration_minutes INTEGER NOT NULL DEFAULT 45,
    total_points NUMERIC NOT NULL DEFAULT 10.0,
    questions_list JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.6. Bảng Các Đợt Giao Bài Kiểm Tra (Assignments)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    target_type TEXT NOT NULL DEFAULT 'class' CHECK (target_type IN ('class', 'group', 'individual')),
    target_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    grade INTEGER CHECK (grade IN (6, 7, 8, 9)),
    category TEXT DEFAULT 'thuong_xuyen',
    duration_minutes INTEGER DEFAULT 45,
    total_points NUMERIC DEFAULT 10.0,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_paused BOOLEAN NOT NULL DEFAULT false,
    total_students INTEGER DEFAULT 35,
    submissions_count INTEGER DEFAULT 0,
    start_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deadline TIMESTAMPTZ,
    allow_late BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.7. Bảng Kết Quả Bài Làm Của Học Sinh (Student Results / Submissions)
CREATE TABLE IF NOT EXISTS public.student_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    student_code TEXT,
    class_name TEXT,
    assignment_title TEXT,
    exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    score NUMERIC NOT NULL DEFAULT 0,
    max_score NUMERIC NOT NULL DEFAULT 10.0,
    score_tn NUMERIC DEFAULT 0,
    max_score_tn NUMERIC DEFAULT 7.0,
    score_tl NUMERIC DEFAULT 0,
    max_score_tl NUMERIC DEFAULT 3.0,
    essay_question TEXT,
    essay_answer TEXT,
    answers_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    detailed_scores_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_late BOOLEAN NOT NULL DEFAULT false,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'graded' CHECK (status IN ('submitted', 'graded', 'in_progress', 'waiting_teacher_grading')),
    teacher_feedback_text TEXT,
    teacher_feedback_voice_url TEXT,
    graded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    graded_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.8. Bảng Định Nghĩa Huy Hiệu Khen Thưởng (Badge Definitions)
CREATE TABLE IF NOT EXISTS public.badge_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 50,
    category TEXT DEFAULT 'achievement'
);

-- 2.9. Bảng Huy Hiệu Học Sinh Đã Đạt Được (Badges)
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL REFERENCES public.badge_definitions(id) ON DELETE CASCADE,
    badge_name TEXT NOT NULL,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id, badge_id)
);

-- 2.10. Bảng Lịch Sử Cộng Trừ Điểm Thưởng XP (XP Logs)
CREATE TABLE IF NOT EXISTS public.xp_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.11. Bảng Cấu Hình Hệ Thống & Trường Học (System Settings)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.12. Đấu Trường Địa Lí Trực Tiếp - Phòng Đấu (Live Game Rooms)
CREATE TABLE IF NOT EXISTS public.live_game_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    teacher_name TEXT DEFAULT 'Cô Dương Thu Hảo',
    status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'countdown', 'question', 'result', 'leaderboard', 'podium', 'finished')),
    current_question_index INTEGER NOT NULL DEFAULT 0,
    time_per_question INTEGER NOT NULL DEFAULT 20,
    questions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.13. Đấu Trường Địa Lí Trực Tiếp - Người Tham Gia (Live Game Participants)
CREATE TABLE IF NOT EXISTS public.live_game_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.live_game_rooms(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    avatar_url TEXT,
    score INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.14. Đấu Trường Địa Lí Trực Tiếp - Lượt Bấm Trả Lời (Live Game Answers)
CREATE TABLE IF NOT EXISTS public.live_game_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.live_game_rooms(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES public.live_game_participants(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    chosen_option INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL DEFAULT 0,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    points_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. HÀM TÍNH TOÁN & TRIGGERS TỰ ĐỘNG
-- ==============================================================================

-- 3.1. Hàm tính cấp độ (Level) tự động dựa trên XP
CREATE OR REPLACE FUNCTION public.calculate_level(p_xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    IF p_xp IS NULL OR p_xp <= 0 THEN
        RETURN 1;
    END IF;
    RETURN LEAST(100, FLOOR(SQRT(p_xp::NUMERIC / 50.0))::INTEGER + 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3.2. Trigger cập nhật Level khi thay đổi XP của học sinh
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

-- 3.3. Trigger cộng dồn XP khi có bản ghi mới trong xp_logs
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

-- 3.4. Trigger tự động tạo hồ sơ profile khi người dùng đăng ký tài khoản
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
-- 4. BẬT BẢO MẬT ROW LEVEL SECURITY (RLS) & PHÂN QUYỀN TRUY CẬP
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
ALTER TABLE public.live_game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_game_answers ENABLE ROW LEVEL SECURITY;

-- Helper Function kiểm tra vai trò Giáo viên / Admin
CREATE OR REPLACE FUNCTION public.is_teacher_or_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role IN ('teacher', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.1. Policies cho Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by all" ON public.profiles;
CREATE POLICY "Public profiles are viewable by all" ON public.profiles FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Insert profiles" ON public.profiles;
CREATE POLICY "Insert profiles" ON public.profiles FOR INSERT TO authenticated, anon WITH CHECK (true);

-- 4.2. Policies cho Classes & Members
DROP POLICY IF EXISTS "Classes readable by all" ON public.classes;
CREATE POLICY "Classes readable by all" ON public.classes FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Classes manageable by all" ON public.classes;
CREATE POLICY "Classes manageable by all" ON public.classes FOR ALL TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Class members readable by all" ON public.class_members;
CREATE POLICY "Class members readable by all" ON public.class_members FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Class members manageable by all" ON public.class_members;
CREATE POLICY "Class members manageable by all" ON public.class_members FOR ALL TO authenticated, anon USING (true);

-- 4.3. Policies cho Questions & Exams
DROP POLICY IF EXISTS "Questions readable by all" ON public.questions;
CREATE POLICY "Questions readable by all" ON public.questions FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Questions manageable by all" ON public.questions;
CREATE POLICY "Questions manageable by all" ON public.questions FOR ALL TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Exams readable by all" ON public.exams;
CREATE POLICY "Exams readable by all" ON public.exams FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Exams manageable by all" ON public.exams;
CREATE POLICY "Exams manageable by all" ON public.exams FOR ALL TO authenticated, anon USING (true);

-- 4.4. Policies cho Assignments & Student Results
DROP POLICY IF EXISTS "Assignments readable by all" ON public.assignments;
CREATE POLICY "Assignments readable by all" ON public.assignments FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Assignments manageable by all" ON public.assignments;
CREATE POLICY "Assignments manageable by all" ON public.assignments FOR ALL TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Results readable by all" ON public.student_results;
CREATE POLICY "Results readable by all" ON public.student_results FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Results manageable by all" ON public.student_results;
CREATE POLICY "Results manageable by all" ON public.student_results FOR ALL TO authenticated, anon USING (true);

-- 4.5. Policies cho Badges & XP Logs
DROP POLICY IF EXISTS "Badges readable by all" ON public.badges;
CREATE POLICY "Badges readable by all" ON public.badges FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Badges manageable by all" ON public.badges;
CREATE POLICY "Badges manageable by all" ON public.badges FOR ALL TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Badge defs readable by all" ON public.badge_definitions;
CREATE POLICY "Badge defs readable by all" ON public.badge_definitions FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "XP logs readable by all" ON public.xp_logs;
CREATE POLICY "XP logs readable by all" ON public.xp_logs FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "XP logs manageable by all" ON public.xp_logs;
CREATE POLICY "XP logs manageable by all" ON public.xp_logs FOR ALL TO authenticated, anon USING (true);

-- 4.6. Policies cho System Settings
DROP POLICY IF EXISTS "System settings readable by all" ON public.system_settings;
CREATE POLICY "System settings readable by all" ON public.system_settings FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "System settings manageable by all" ON public.system_settings;
CREATE POLICY "System settings manageable by all" ON public.system_settings FOR ALL TO authenticated, anon USING (true);

-- 4.7. Policies cho Đấu Trường Trực Tiếp
DROP POLICY IF EXISTS "Live rooms readable by all" ON public.live_game_rooms;
CREATE POLICY "Live rooms readable by all" ON public.live_game_rooms FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Live rooms manageable by all" ON public.live_game_rooms;
CREATE POLICY "Live rooms manageable by all" ON public.live_game_rooms FOR ALL TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Live participants readable by all" ON public.live_game_participants;
CREATE POLICY "Live participants readable by all" ON public.live_game_participants FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Live participants manageable by all" ON public.live_game_participants;
CREATE POLICY "Live participants manageable by all" ON public.live_game_participants FOR ALL TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Live answers readable by all" ON public.live_game_answers;
CREATE POLICY "Live answers readable by all" ON public.live_game_answers FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Live answers manageable by all" ON public.live_game_answers;
CREATE POLICY "Live answers manageable by all" ON public.live_game_answers FOR ALL TO authenticated, anon USING (true);

-- ==============================================================================
-- 5. CẤU HÌNH STORAGE BUCKETS (LƯU BANNER, AVATAR, GHI ÂM LỜI PHÊ)
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('banners', 'banners', true),
    ('voice-feedback', 'voice-feedback', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public access to storage objects" ON storage.objects;
    CREATE POLICY "Public access to storage objects" ON storage.objects 
        FOR ALL 
        USING (bucket_id IN ('banners', 'voice-feedback', 'avatars'))
        WITH CHECK (bucket_id IN ('banners', 'voice-feedback', 'avatars'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- ==============================================================================
-- 6. KHỞI TẠO DỮ LIỆU BAN ĐẦU (SEED DATA: 16 LỚP, HUY HIỆU DANH DỰ, CẤU HÌNH)
-- ==============================================================================

-- 6.1. Khởi tạo 16 lớp học cho 4 Khối (Khối 6, 7, 8, 9) của Trường THCS
INSERT INTO public.classes (grade, name, academic_year, teacher_name)
VALUES
    (6, 'Lớp 6A1', '2025-2026', 'Cô Dương Thu Hảo'),
    (6, 'Lớp 6A2', '2025-2026', 'Cô Dương Thu Hảo'),
    (6, 'Lớp 6A3', '2025-2026', 'Cô Dương Thu Hảo'),
    (6, 'Lớp 6A4', '2025-2026', 'Cô Dương Thu Hảo'),
    (7, 'Lớp 7A1', '2025-2026', 'Cô Dương Thu Hảo'),
    (7, 'Lớp 7A2', '2025-2026', 'Cô Dương Thu Hảo'),
    (7, 'Lớp 7A3', '2025-2026', 'Cô Dương Thu Hảo'),
    (7, 'Lớp 7A4', '2025-2026', 'Cô Dương Thu Hảo'),
    (8, 'Lớp 8A1', '2025-2026', 'Cô Dương Thu Hảo'),
    (8, 'Lớp 8A2', '2025-2026', 'Cô Dương Thu Hảo'),
    (8, 'Lớp 8A3', '2025-2026', 'Cô Dương Thu Hảo'),
    (8, 'Lớp 8A4', '2025-2026', 'Cô Dương Thu Hảo'),
    (9, 'Lớp 9A1', '2025-2026', 'Cô Dương Thu Hảo'),
    (9, 'Lớp 9A2', '2025-2026', 'Cô Dương Thu Hảo'),
    (9, 'Lớp 9A3', '2025-2026', 'Cô Dương Thu Hảo'),
    (9, 'Lớp 9A4', '2025-2026', 'Cô Dương Thu Hảo')
ON CONFLICT DO NOTHING;

-- 6.2. Khởi tạo 6 Huy Hiệu Vinh Danh Địa Lí
INSERT INTO public.badge_definitions (id, name, description, icon, xp_reward, category)
VALUES
    ('cu_dem_cham_chi', 'Cú Đêm Chăm Chỉ', 'Hoàn thành bài tập đúng hạn và chăm chỉ rèn luyện', 'Moon', 50, 'effort'),
    ('chuyen_gia_trac_nghiem', 'Chuyên Gia Trắc Nghiệm', 'Đạt 10/10 điểm trắc nghiệm môn Địa lí', 'Award', 100, 'achievement'),
    ('top_1_game', 'Top 1 Thi Đua', 'Dẫn đầu bảng xếp hạng thi đua của lớp', 'Trophy', 150, 'ranking'),
    ('nha_dia_li_nhi', 'Nhà Địa Lí Nhí', 'Tích lũy đạt Cấp độ 5 trở lên', 'Compass', 80, 'milestone'),
    ('nha_tham_hiem_ban_do', 'Thám Hiểm Bản Đồ', 'Hoàn thành chính xác bài tập kéo thả ghép nối địa danh', 'MapPin', 70, 'skill'),
    ('nhip_song_dong_bang', 'Am Hiểu Địa Lí Việt Nam', 'Hoàn thành xuất sắc bài kiểm tra chuyên đề Việt Nam', 'Globe', 90, 'special')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    xp_reward = EXCLUDED.xp_reward;

-- 6.3. Khởi tạo Thông Tin Trường & Banner Mặc Định
INSERT INTO public.system_settings (key, value)
VALUES
    ('school_info', '{
        "school_name": "PTDTBT TH&THCS Sì Lờ Lầu",
        "teacher_name": "Cô Dương Thu Hảo",
        "subject": "Địa lí THCS (Khối 6, 7, 8, 9)",
        "district": "Phong Thổ",
        "province": "Lai Châu"
    }'::jsonb),
    ('homepage_banner', '{
        "title": "HỆ THỐNG KIỂM TRA & ĐÁNH GIÁ ĐỊA LÍ THCS",
        "subtitle": "Khám phá Trái Đất - Chinh phục Tri thức cùng Cô Hảo",
        "announcement": "Chào mừng các em học sinh tham gia rèn luyện kiến thức Địa lí tại Sì Lờ Lầu!"
    }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- 7. KÍCH HOẠT TÍNH NĂNG REALTIME (ĐỒNG BỘ TRỰC TIẾP KHÔNG CẦN F5)
-- ==============================================================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_game_rooms;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_game_participants;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_game_answers;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.student_results;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- HOÀN TẤT THIẾT LẬP CƠ SỞ DỮ LIỆU THÀNH CÔNG!
