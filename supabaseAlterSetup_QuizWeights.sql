-- Migration script to support customizable quiz weightages in Class Gradebook

-- Add a new JSONB column to store a mapping of { "Quiz Title": WeightPercentage }
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS quiz_weights JSONB DEFAULT '{}'::jsonb;

-- Ensure the column can be updated by authenticated users (teachers) who own the class
-- No new RLS policies need to be written *if* your standard 'classes' update policy covers 
-- updates to all non-protected columns. If your update policy is strict, you may need to amend it.
-- Generally, if a teacher can update `name` or `students` on a class, they can update `quiz_weights`.
