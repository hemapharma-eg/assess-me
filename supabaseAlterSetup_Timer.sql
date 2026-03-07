-- Copy and paste this directly into the Supabase SQL Editor
-- This script adds timer + resume support for asynchronous quizzes.

-- 1. Add timer_duration column to rooms (in seconds per question, nullable = no timer)
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS timer_duration INTEGER;

-- 2. Add current_idx column to responses (tracks which question the student is on, for resume)
ALTER TABLE public.responses ADD COLUMN IF NOT EXISTS current_idx INTEGER;

-- 3. (Legacy) quiz_started_at is no longer used by the per-question timer,
--    but we keep the column to avoid breaking old data.
-- ALTER TABLE public.responses ADD COLUMN IF NOT EXISTS quiz_started_at BIGINT;
