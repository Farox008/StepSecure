-- ============================================================
-- Evizz Dashboard — Supabase Schema + Seed Data
-- Run this in your Supabase project's SQL Editor
-- ============================================================

-- 1. CAMERAS TABLE
create table if not exists cameras (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    location text not null,
    status text not null default 'online',
    signal_strength integer not null default 75,
    ip_address text,
    brand text,
    model text,
    thumbnail_img text,
    created_at timestamptz default now()
);

-- 2. PERSONS TABLE
create table if not exists persons (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    role text not null default 'Staff',
    access_level text not null default 'All Areas',
    since text,
    status text not null default 'active',
    image_url text,
    created_at timestamptz default now()
);

-- 3. EVENTS TABLE
create table if not exists events (
    id uuid primary key default gen_random_uuid(),
    camera_id uuid references cameras(id) on delete set null,
    person_id uuid references persons(id) on delete set null,
    type text not null,
    severity text not null default 'low',
    status text not null default 'unread',
    timestamp timestamptz not null default now(),
    thumbnail_url text,
    confidence_score integer,
    camera_name text,
    created_at timestamptz default now()
);

-- Enable Row Level Security (allow anon reads for the dashboard)
alter table cameras enable row level security;
alter table persons enable row level security;
alter table events enable row level security;

-- Policies: allow anonymous SELECT
drop policy if exists "Allow anon read cameras" on cameras;
drop policy if exists "Allow anon insert cameras" on cameras;
drop policy if exists "Allow anon delete cameras" on cameras;
create policy "Allow anon read cameras" on cameras for select using (true);
create policy "Allow anon insert cameras" on cameras for insert with check (true);
create policy "Allow anon delete cameras" on cameras for delete using (true);

drop policy if exists "Allow anon read persons" on persons;
drop policy if exists "Allow anon insert persons" on persons;
drop policy if exists "Allow anon delete persons" on persons;
drop policy if exists "Allow anon update persons" on persons;
create policy "Allow anon read persons" on persons for select using (true);
create policy "Allow anon insert persons" on persons for insert with check (true);
create policy "Allow anon delete persons" on persons for delete using (true);
create policy "Allow anon update persons" on persons for update using (true);

drop policy if exists "Allow anon read events" on events;
drop policy if exists "Allow anon insert events" on events;
drop policy if exists "Allow anon update events" on events;
create policy "Allow anon read events" on events for select using (true);
create policy "Allow anon insert events" on events for insert with check (true);
create policy "Allow anon update events" on events for update using (true);

-- 5. SEED DATA
-- ============================================================

-- Cameras
insert into cameras (name, location, status, signal_strength, ip_address, brand, model, thumbnail_img) values
('Camera 1', 'Basement',    'online',  86,  '192.168.1.110', 'Hikvision', 'DS-7616NI',     'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'),
('Camera 2', 'Basement',    'online',  56,  '192.168.1.111', 'Hikvision', 'DS-2CD2143',    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80'),
('Camera 1', 'Backyard',    'online',  32,  '192.168.1.103', 'Axis',      'P3245-V',       'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=80'),
('Camera 2', 'Backyard',    'offline',  0,  '192.168.1.104', 'Reolink',   'RLC-810A',      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80'),
('Camera 3', 'Backyard',    'online',  24,  '192.168.1.115', 'Dahua',     'IPC-HDW2831T',  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80'),
('Camera 4', 'Backyard',    'online',  14,  '192.168.1.116', 'Amcrest',   'IP8M-2496EW',   'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80'),
('Camera 1', 'Front Door',  'online',  91,  '192.168.1.101', 'Hikvision', 'DS-2CD2143',    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80'),
('Camera 2', 'Front Door',  'online',  77,  '192.168.1.102', 'Dahua',     'IPC-HDW2831T',  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80'),
('Camera 1', 'Kid''s Room', 'online',  63,  '192.168.1.117', 'Reolink',   'RLC-810A',      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80'),
('Camera 1', 'Kitchen',     'online',  44,  '192.168.1.105', 'Amcrest',   'IP8M-2496EW',   'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80'),
('Camera 2', 'Kitchen',     'online',  29,  '192.168.1.106', 'Axis',      'P3245-V',       'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=600&q=80'),
('Camera 1', 'Garage',      'online',  88,  '192.168.1.118', 'Ubiquiti',  'G4 Pro',        'https://images.unsplash.com/photo-1580216377673-455b9e0722cc?w=600&q=80');

-- Persons
insert into persons (name, role, access_level, since, status, image_url) values
('Sarah Chen',   'Staff',     'All Areas',   'Jan 2024', 'active', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=120&q=80'),
('Mike Torres',  'Family',    'Full Access', 'Mar 2023', 'active', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=80'),
('Lisa Park',    'Staff',     'Front Only',  'Feb 2024', 'active', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80'),
('James Wilson', 'Contractor','Ground Floor','Mar 2024', 'active', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80'),
('Emma Davis',   'Family',    'Full Access', 'Jan 2022', 'active', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80'),
('Alex Kumar',   'Staff',     'All Areas',   'Nov 2023', 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80');

-- Events 
do $$
declare
    cam_fd1 uuid; cam_fd2 uuid; cam_back1 uuid; cam_kitchen1 uuid; cam_basement2 uuid; cam_garage uuid;
    p_sarah uuid; p_mike uuid; p_lisa uuid; p_james uuid; p_emma uuid; p_alex uuid;
begin
    select id into cam_fd1        from cameras where name='Camera 1' and location='Front Door'  limit 1;
    select id into cam_fd2        from cameras where name='Camera 2' and location='Front Door'  limit 1;
    select id into cam_back1      from cameras where name='Camera 1' and location='Backyard'    limit 1;
    select id into cam_kitchen1   from cameras where name='Camera 1' and location='Kitchen'     limit 1;
    select id into cam_basement2  from cameras where name='Camera 2' and location='Basement'    limit 1;
    select id into cam_garage     from cameras where name='Camera 1' and location='Garage'      limit 1;
    
    select id into p_sarah  from persons where name='Sarah Chen' limit 1;
    select id into p_mike   from persons where name='Mike Torres' limit 1;
    select id into p_lisa   from persons where name='Lisa Park' limit 1;
    select id into p_james  from persons where name='James Wilson' limit 1;
    select id into p_emma   from persons where name='Emma Davis' limit 1;
    select id into p_alex   from persons where name='Alex Kumar' limit 1;

    insert into events (camera_id, person_id, type, severity, status, timestamp, thumbnail_url, confidence_score, camera_name) values
    -- UNREAD (Recent Events - Last 2 Hours)
    (cam_fd1,       null,         'Unknown Person',  'high',   'unread', now() - interval '2 minutes',    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&q=70',  81,   'Front Door 1'),
    (cam_fd2,       null,         'PIR Alarm',       'medium', 'unread', now() - interval '8 minutes',    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=120&q=70',  null, 'Front Door 2'),
    (cam_back1,     p_james,      'Person Detected', 'low',    'unread', now() - interval '14 minutes',   'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=70',  96,   'Backyard 1'),
    (cam_garage,    null,         'Vehicle Detected','medium', 'unread', now() - interval '22 minutes',   'https://images.unsplash.com/photo-1580216377673-455b9e0722cc?w=120&q=70',  89,   'Garage 1'),
    (cam_kitchen1,  p_sarah,      'Staff Entry',     'low',    'unread', now() - interval '35 minutes',   'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=120&q=70',  99,   'Kitchen 1'),
    (cam_basement2, null,         'Motion Detected', 'low',    'unread', now() - interval '41 minutes',   'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=120&q=70',  null, 'Basement 2'),
    
    -- READ (Older Events - Last 24 Hours)
    (cam_fd1,       p_mike,       'Family Arrival',  'low',    'read',   now() - interval '90 minutes',   'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=70',  97,   'Front Door 1'),
    (cam_fd2,       null,         'Package Delivery','medium', 'read',   now() - interval '112 minutes',  'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=120&q=70',  84,   'Front Door 2'),
    (cam_back1,     null,         'Perimeter Breach','high',   'read',   now() - interval '3 hours',      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=120&q=70',  76,   'Backyard 1'),
    (cam_garage,    p_emma,       'Vehicle Exit',    'low',    'read',   now() - interval '4.5 hours',    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=70',  92,   'Garage 1'),
    (cam_kitchen1,  null,         'Motion Detected', 'low',    'read',   now() - interval '5 hours',      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=120&q=70',  null, 'Kitchen 1'),
    (cam_fd1,       p_lisa,       'Staff Entry',     'low',    'read',   now() - interval '8 hours',      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=70',  94,   'Front Door 1'),
    (cam_fd2,       null,         'Unknown Person',  'high',   'read',   now() - interval '9 hours',      'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=120&q=70',  64,   'Front Door 2'),
    (cam_basement2, p_alex,       'Maintenance',     'low',    'read',   now() - interval '11 hours',     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=70',  91,   'Basement 2'),
    (cam_back1,     null,         'Animal Detected', 'low',    'read',   now() - interval '13 hours',     'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=120&q=70',  88,   'Backyard 1'),
    (cam_garage,    null,         'Garage Opened',   'medium', 'read',   now() - interval '14 hours',     'https://images.unsplash.com/photo-1580216377673-455b9e0722cc?w=120&q=70',  null, 'Garage 1'),
    (cam_kitchen1,  p_sarah,      'Person Detected', 'low',    'read',   now() - interval '15 hours',     'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=120&q=70',  98,   'Kitchen 1'),
    (cam_fd1,       p_james,      'Contractor Entry','medium', 'read',   now() - interval '18 hours',     'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=70',  95,   'Front Door 1'),
    (cam_basement2, null,         'Motion Detected', 'low',    'read',   now() - interval '20 hours',     'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=120&q=70',  null, 'Basement 2'),
    (cam_fd2,       null,         'Loitering',       'high',   'read',   now() - interval '21 hours',     'https://images.unsplash.com/photo-1590086782957-93c06ef21604?w=120&q=70',  72,   'Front Door 2'),
    (cam_back1,     p_mike,       'Family Detected', 'low',    'read',   now() - interval '23 hours',     'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=70',  99,   'Backyard 1');
end $$;
