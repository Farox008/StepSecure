-- ============================================================
-- Migration: Add RTSP / HLS stream URL columns to cameras
-- Run this ONCE in your Supabase SQL Editor
-- ============================================================
alter table cameras add column if not exists rtsp_url  text;
alter table cameras add column if not exists hls_url   text;
alter table cameras add column if not exists stream_name text;
