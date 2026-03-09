-- Run this exactly once in your Supabase SQL Editor to grant UPDATE access
create policy "Allow anon update persons" on persons for update using (true);
