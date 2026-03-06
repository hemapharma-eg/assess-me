-- Copy and paste this directly into the Supabase SQL Editor
-- This script safely updates your existing `quizzes` table to support Video Quizzes.

ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'standard';
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS video_url TEXT;
