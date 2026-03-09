import { supabase } from '../lib/supabase';

// Static UI constants (not from DB)
export const TABS = ["All", "Basement", "Backyard", "Front Door", "Kid's Room", "Kitchen"];
export const DAYS = [
    { l: "Thu", n: "09" }, { l: "Fri", n: "10" }, { l: "Sat", n: "11" },
    { l: "Sun", n: "12" }, { l: "Mon", n: "13" }, { l: "Tue", n: "14" }, { l: "Wed", n: "15" },
];

// ── Cameras ──────────────────────────────────────────────────
export async function fetchCameras() {
    const { data, error } = await supabase
        .from('cameras')
        .select('*')
        .order('location')
        .order('name');
    if (error) throw error;
    return data;
}

// Returns cameras grouped by location: { Basement: [...], Backyard: [...], ... }
export async function fetchCamerasGrouped() {
    const cameras = await fetchCameras();
    return cameras.reduce((acc, cam) => {
        if (!acc[cam.location]) acc[cam.location] = [];
        acc[cam.location].push({
            id: cam.id,
            name: cam.name,
            location: cam.location,
            status: cam.status,
            signal: cam.signal_strength,
            ip: cam.ip_address,
            brand: cam.brand,
            model: cam.model,
            img: cam.thumbnail_img,
            rtsp_url: cam.rtsp_url || null,
            hls_url: cam.hls_url || null,
            stream_name: cam.stream_name || null,
            // Keep legacy date/time fields for CameraCard
            date: new Date(cam.created_at).toLocaleDateString('en-GB').replace(/\//g, '-'),
            time: new Date(cam.created_at).toLocaleTimeString('en-US'),
        });
        return acc;
    }, {});
}


// ── Persons ───────────────────────────────────────────────────
export async function fetchPersons() {
    const { data, error } = await supabase
        .from('persons')
        .select('*')
        .order('name');
    if (error) throw error;
    return data.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        access: p.access_level,
        since: p.since,
        status: p.status,
        img: p.image_url,
        video_urls: p.video_urls || [],
    }));
}

export async function insertPerson({ name, role, access, email, video_urls }) {
    const { data, error } = await supabase
        .from('persons')
        .insert([{
            name,
            role,
            access_level: access,
            status: 'active',
            video_urls: video_urls || [],
        }])
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updatePerson(id, updates) {
    const { data, error } = await supabase
        .from('persons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}


// ── Events ────────────────────────────────────────────────────
export async function fetchEvents(limit = 20) {
    const { data, error } = await supabase
        .from('events')
        .select(`
            *,
            cameras (name, location, thumbnail_img),
            persons (name, role, image_url)
        `)
        .order('timestamp', { ascending: false })
        .limit(limit);
    if (error) throw error;

    return data.map(e => ({
        id: e.id,
        type: e.type,
        cam: e.camera_name || e.cameras?.name || 'Unknown Camera',
        severity: e.severity,
        status: e.status,
        date: new Date(e.timestamp).toLocaleDateString('en-GB', { day: '2-digit' }),
        time: new Date(e.timestamp).toLocaleTimeString('en-US'),
        thumb: e.thumbnail_url || e.cameras?.thumbnail_img || '',
        person: e.persons ? {
            name: e.persons.name,
            role: e.persons.role.includes('Staff') ? `Registered — Staff` : `Registered — ${e.persons.role}`,
            confidence: e.confidence_score || 90,
            img: e.persons.image_url,
        } : null,
    }));
}

export async function markEventRead(id) {
    const { error } = await supabase
        .from('events')
        .update({ status: 'read' })
        .eq('id', id);
    if (error) throw error;
}

// ── Devices (cameras table used as device registry) ───────────
export async function insertCamera(device) {
    // Auto-derive HLS URL from stream_name if not explicitly provided
    const hlsUrl = device.hls_url ||
        (device.stream_name
            ? `http://localhost:8889/${device.stream_name.trim().toLowerCase().replace(/\s+/g, '_')}/index.m3u8`
            : null);

    const { data, error } = await supabase
        .from('cameras')
        .insert([{
            name: device.name,
            location: device.location,
            status: 'online',
            signal_strength: Math.floor(60 + Math.random() * 40),
            ip_address: device.ip,
            brand: device.brand,
            model: device.model,
            rtsp_url: device.rtsp_url || null,
            hls_url: hlsUrl,
            stream_name: device.stream_name || null,
        }])
        .select()
        .single();
    if (error) throw error;
    return data;
}


export async function deleteCamera(id) {
    const { error } = await supabase.from('cameras').delete().eq('id', id);
    if (error) throw error;
}

export async function deletePerson(id) {
    const { error } = await supabase.from('persons').delete().eq('id', id);
    if (error) throw error;
}
