-- ==============================================================================
-- BỔ SUNG: CƠ SỞ DỮ LIỆU ĐẤU TRƯỜNG ĐỊA LÍ TRỰC TIẾP (LIVE KAHOOT-STYLE GAME)
-- ==============================================================================

-- Bảng Phòng Chơi Trực Tiếp (Live Game Rooms)
CREATE TABLE IF NOT EXISTS public.live_game_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    teacher_name TEXT DEFAULT 'Cô Hảo',
    status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'countdown', 'question', 'result', 'leaderboard', 'podium', 'finished')),
    current_question_index INTEGER NOT NULL DEFAULT 0,
    time_per_question INTEGER NOT NULL DEFAULT 20,
    questions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Bảng Học Sinh Tham Gia Phòng Đấu (Live Game Participants)
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

-- Bảng Lượt Bấm Đáp Án Thời Gian Thực (Live Game Answers)
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

-- Bật RLS
ALTER TABLE public.live_game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_game_answers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public live rooms readable" ON public.live_game_rooms FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Public live rooms manageable" ON public.live_game_rooms FOR ALL TO authenticated, anon USING (true);

CREATE POLICY "Public participants readable" ON public.live_game_participants FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Public participants manageable" ON public.live_game_participants FOR ALL TO authenticated, anon USING (true);

CREATE POLICY "Public live answers readable" ON public.live_game_answers FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Public live answers manageable" ON public.live_game_answers FOR ALL TO authenticated, anon USING (true);
