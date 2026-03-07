-- Copy and paste this directly into the Supabase SQL Editor
-- This script adds timer support for asynchronous standard quizzes.

-- 1. Add timer_duration column to rooms (in minutes, nullable = no timer)
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS timer_duration INTEGER;

-- 2. Add quiz_started_at column to responses (epoch ms, per-student start time)
ALTER TABLE public.responses ADD COLUMN IF NOT EXISTS quiz_started_at BIGINT;
