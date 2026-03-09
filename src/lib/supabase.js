import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zkmeleisqzofrvhnpvfz.supabase.co';
const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprbWVsZWlzcXpvZnJ2aG5wdmZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTAxMzgsImV4cCI6MjA3Mjk4NjEzOH0.c5kK6od7BFXUuMChFZE9M9KMDBBk-qATLf8xXBP5hjQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
