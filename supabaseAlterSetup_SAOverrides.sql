-- Migration: add score_overrides column to reports table
-- Stores manual teacher grading overrides for Short Answer questions
-- Format: { "studentId___qIdx": true|false }
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS score_overrides JSONB DEFAULT '{}'::jsonb;
