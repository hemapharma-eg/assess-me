-- Copy and paste this directly into the Supabase SQL Editor
-- This script safely updates your existing `rooms` table WITHOUT deleting your old data.

-- 1. Add new columns to existing tables for asynchronous and video quiz features
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS is_async BOOLEAN DEFAULT false;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS prevent_skipping BOOLEAN DEFAULT false;
