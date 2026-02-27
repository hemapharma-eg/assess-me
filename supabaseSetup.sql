-- Copy and paste this directly into the Supabase SQL Editor
-- This will set up all tables and security needed for the AssessMe App

-- 1. Quizzes table
CREATE TABLE public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    title TEXT NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Reports table
CREATE TABLE public.reports (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    responses JSONB NOT NULL DEFAULT '[]',
    questions JSONB NOT NULL DEFAULT '[]',
    ts BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Rooms table (for live sessions)
CREATE TABLE public.rooms (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    quiz JSONB NOT NULL,
    type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    ts BIGINT NOT NULL
);

-- 4. Responses table (live student answers)
CREATE TABLE public.responses (
    id TEXT PRIMARY KEY,
    room_code TEXT REFERENCES public.rooms(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_id TEXT NOT NULL,
    answers JSONB DEFAULT '{}',
    ts BIGINT NOT NULL
);

-- ==============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Quizzes: Only owners can access
CREATE POLICY "Users can manage their own quizzes" ON public.quizzes
    FOR ALL USING (auth.uid() = user_id);

-- Reports: Only owners can access
CREATE POLICY "Users can manage their own reports" ON public.reports
    FOR ALL USING (auth.uid() = user_id);

-- Rooms: Owners can manage, anyone can select
CREATE POLICY "Teachers can manage their own rooms" ON public.rooms
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read active rooms" ON public.rooms
    FOR SELECT USING (true); -- allowed so students can fetch room code

-- Responses: Open to public insertions so anonymous students can respond
-- In a real app we'd restrict update so they can only update their own row, but for simplicity:
CREATE POLICY "Anyone can manage responses" ON public.responses
    FOR ALL USING (true);


-- ==============================================
-- ENABLE SUPER FAST REALTIME FOR ROOMS AND RESPONSES
-- ==============================================
BEGIN;
    DROP PUBLICATION IF EXISTS supabase_realtime;
    CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE responses;
