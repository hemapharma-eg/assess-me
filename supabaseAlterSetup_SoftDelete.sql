-- Add hidden column to reports for soft-delete (session history cleanup without affecting gradebook)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS hidden boolean DEFAULT false;
