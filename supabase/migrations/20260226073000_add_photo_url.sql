-- Add photo_url column to youth_members
ALTER TABLE youth_members ADD COLUMN IF NOT EXISTS photo_url TEXT;
