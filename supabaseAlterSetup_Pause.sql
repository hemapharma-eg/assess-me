-- Add is_paused column to rooms table to support pausing asynchronous activities
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE;
