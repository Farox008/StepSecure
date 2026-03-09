-- ================================================================
-- Migration: Add video_urls column to persons table
-- Run ONCE in your Supabase SQL Editor
-- ================================================================

-- Store array of video public URLs
ALTER TABLE persons ADD COLUMN IF NOT EXISTS video_urls jsonb DEFAULT '[]';

-- ================================================================
-- Supabase Storage Setup — do this in Supabase Dashboard
-- ================================================================
-- 1. Go to: Storage → New Bucket
-- 2. Name: person-videos
-- 3. Check "Public bucket"
-- 4. Save
--
-- Then add this RLS policy in the SQL editor:
INSERT INTO storage.buckets (id, name, public)
VALUES ('person-videos', 'person-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload and read
CREATE POLICY IF NOT EXISTS "Public Access" ON storage.objects
    FOR ALL USING (bucket_id = 'person-videos');
