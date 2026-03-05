-- Copy and paste this directly into the Supabase SQL Editor
-- This script safely updates your existing database WITHOUT deleting your old data.

-- 1. Add new columns to existing tables
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS assigned_classes JSONB DEFAULT '[]';
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS lock_screen BOOLEAN DEFAULT false;

-- 2. Create the new classes and students tables
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Apply Security Policies to the new tables
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Safely create policies (these might error if they already exist, but that's okay)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own classes' AND tablename = 'classes'
    ) THEN
        CREATE POLICY "Users can manage their own classes" ON public.classes FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can manage students' AND tablename = 'students'
    ) THEN
        CREATE POLICY "Anyone can manage students" ON public.students FOR ALL USING (true);
    END IF;
END $$;
