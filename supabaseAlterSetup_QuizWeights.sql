-- Migration script to support customizable quiz weightages and Top-N scoring in Class Gradebook

-- Add a new JSONB column to store a mapping of { "Quiz Title": WeightPercentage }
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS quiz_weights JSONB DEFAULT '{}'::jsonb;

-- Add gradebook scoring mode: 'simple' | 'weighted' | 'top_n'
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS gradebook_mode TEXT DEFAULT 'simple';

-- Add top_n_count: the number of top quiz scores to consider when mode = 'top_n'
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS top_n_count INTEGER DEFAULT 0;
