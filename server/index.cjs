/**
 * server/index.js
 * ───────────────
 * Express backend that:
 *   1. Auto-downloads mediamtx.exe if not found
 *   2. Generates a fresh mediamtx.yml with CORS + HLS enabled
 *   3. Spawns mediamtx as a child process (stdout/stderr forwarded to console)
 *   4. Exposes REST endpoints for the React frontend:
 *      POST  /api/discover        → test 12 RTSP patterns against a camera IP
 *      GET   /api/streams         → list all active mediamtx paths
 *      POST  /api/streams         → add a new RTSP path to mediamtx
 *      DELETE /api/streams/:name  → remove a path from mediamtx
 *      GET   /api/health          → server + mediamtx health check
 */

const express = require('express');
const cors = require('cors');
const { spawn, execSync, spawnSync } = require('child_process');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ── Configuration ─────────────────────────────────────────────────────────────
const SERVER_PORT = 3001;
const MEDIAMTX_API = 'http://localhost:9997';
const MEDIAMTX_HLS = 'http://localhost:8889';
const MEDIAMTX_VERSION = 'v1.9.3';
const PROJECT_ROOT = path.resolve(__dirname, '..');
const BINARY_PATH = path.join(PROJECT_ROOT, 'mediamtx.exe');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'mediamtx.yml');

// ── Common RTSP path patterns (same list as frontend) ─────────────────────────
const RTSP_PATTERNS = [
    { label: 'Generic / Stream 1', path: '/stream1', brand: 'Generic' },
    { label: 'Generic / Stream', path: '/stream', brand: 'Generic' },
    { label: 'Hikvision Main', path: '/Streaming/channels/101', brand: 'Hikvision' },
    { label: 'Hikvision Sub', path: '/Streaming/channels/102', brand: 'Hikvision' },
    { label: 'Dahua Main', path: '/cam/realmonitor?channel=1&subtype=0', brand: 'Dahua' },
    { label: 'Reolink Main', path: '/h264Preview_01_main', brand: 'Reolink' },
    { label: 'Reolink Sub', path: '/h264Preview_01_sub', brand: 'Reolink' },
    { label: 'Axis Main', path: '/axis-media/media.amp', brand: 'Axis' },
    { label: 'Amcrest / Foscam', path: '/videoMain', brand: 'Amcrest' },
    { label: 'ONVIF / Live', path: '/live/ch0', brand: 'ONVIF' },
    { label: 'TP-Link Tapo', path: '/stream1', brand: 'Tapo' },
    { label: 'Uniview Main', path: '/unicast/c1/s0/live', brand: 'Uniview' },
];

let mediamtxProc = null;
let modelServerProc = null;

// ── Python model server ───────────────────────────────────────────────────────
const MODEL_SERVER_DIR = path.join(PROJECT_ROOT, 'model_server');
const MODEL_SERVER_PORT = 8001;

function findPython() {
    for (const cmd of ['python', 'python3', 'py']) {
        try {
            const r = spawnSync(cmd, ['--version'], { encoding: 'utf8' });
            if (r.status === 0) return cmd;
        } catch { }
    }
    return null;
}

async function startModelServer() {
    const python = findPython();
    if (!python) {
        console.warn('[evizz] Python not found — model server will not start.');
        console.warn('[evizz] Install Python 3.9+ and run: pip install -r model_server/requirements.txt');
        return;
    }

    const reqPath = path.join(MODEL_SERVER_DIR, 'requirements.txt');
    const markerPath = path.join(MODEL_SERVER_DIR, '.deps_installed');

    const launchUvicorn = () => {
        console.log(`[evizz] Starting Python model server on port ${MODEL_SERVER_PORT}…`);
        modelServerProc = spawn(
            python, ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', String(MODEL_SERVER_PORT)],
            { cwd: MODEL_SERVER_DIR, stdio: ['ignore', 'pipe', 'pipe'] }
        );
        modelServerProc.stdout.on('data', d => process.stdout.write(`[model] ${d}`));
        modelServerProc.stderr.on('data', d => process.stderr.write(`[model] ${d}`));
        modelServerProc.on('exit', code => {
            console.log(`[model] Server exited with code ${code}`);
            modelServerProc = null;
        });
        process.on('exit', () => { if (modelServerProc) modelServerProc.kill(); });
    };

    // First-run: install requirements non-blocking so Express starts immediately
    if (fs.existsSync(reqPath) && !fs.existsSync(markerPath)) {
        console.log('[evizz] Installing Python requirements in background (first run only)…');
        const pip = spawn(python, ['-m', 'pip', 'install', '-r', reqPath, '--quiet'],
            { stdio: ['ignore', 'pipe', 'pipe'] });
        pip.stderr.on('data', d => process.stderr.write(`[pip] ${d}`));
        pip.on('close', code => {
            if (code === 0) {
                try { fs.writeFileSync(markerPath, new Date().toISOString()); } catch { }
                console.log('[evizz] Python requirements installed ✓ — starting model server');
            } else {
                console.warn(`[evizz] pip install finished with code ${code} — attempting to start model server anyway`);
            }
            launchUvicorn();
        });
    } else {
        // Deps already installed — start immediately
        launchUvicorn();
    }
}


// ── mediamtx YAML config ──────────────────────────────────────────────────────
function writeConfig() {
    const cfg = `# Auto-generated by Evizz dev server
logLevel: warn
logDestinations: [stdout]

# REST API — used by the Evizz backend to add/remove streams
api: yes
apiAddress: :9997

# HLS output — consumed by the React frontend (hls.js)
hls: yes
hlsAddress: :8889
hlsAlwaysRemux: yes
hlsSegmentDuration: 1s
hlsAllowOrigin: '*'

# RTSP input — cameras connect here
rtsp: yes
rtspAddress: :8554

# No static paths; they are added dynamically via /api/streams
paths: {}
`;
    fs.writeFileSync(CONFIG_PATH, cfg, 'utf8');
    console.log('[evizz] mediamtx.yml written');
}

// ── Auto-download mediamtx ────────────────────────────────────────────────────
async function downloadMediamtx() {
    const zipPath = path.join(PROJECT_ROOT, 'mediamtx.zip');
    const url = `https://github.com/bluenviron/mediamtx/releases/download/${MEDIAMTX_VERSION}/mediamtx_${MEDIAMTX_VERSION}_windows_amd64.zip`;

    console.log(`[evizz] Downloading mediamtx ${MEDIAMTX_VERSION} …`);
    console.log(`[evizz] URL: ${url}`);

    await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(zipPath);

        const download = (downloadUrl, redirects = 0) => {
            if (redirects > 5) { reject(new Error('Too many redirects')); return; }
            const protocol = downloadUrl.startsWith('https') ? https : http;
            protocol.get(downloadUrl, { headers: { 'User-Agent': 'evizz-setup' } }, (res) => {
                if (res.statusCode === 302 || res.statusCode === 301) {
                    download(res.headers.location, redirects + 1);
                    return;
                }
                if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
                res.pipe(file);
                file.on('finish', () => { file.close(); resolve(); });
            }).on('error', reject);
        };

        download(url);
    });

    // Extract using PowerShell (Windows native)
    console.log('[evizz] Extracting mediamtx.exe …');
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${PROJECT_ROOT}' -Force"`, { stdio: 'pipe' });
    fs.unlinkSync(zipPath);

    // Verify extraction
    if (!fs.existsSync(BINARY_PATH)) {
        throw new Error('mediamtx.exe not found after extraction. Please download manually from https://github.com/bluenviron/mediamtx/releases');
    }
    console.log('[evizz] mediamtx.exe ready ✓');
}

// ── Start mediamtx process ────────────────────────────────────────────────────
function startMediamtx() {
    if (mediamtxProc) return;

    console.log('[evizz] Starting mediamtx …');
    mediamtxProc = spawn(BINARY_PATH, [CONFIG_PATH], {
        cwd: PROJECT_ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    mediamtxProc.stdout.on('data', d => process.stdout.write(`[mediamtx] ${d}`));
    mediamtxProc.stderr.on('data', d => process.stderr.write(`[mediamtx] ${d}`));

    mediamtxProc.on('exit', (code) => {
        console.log(`[mediamtx] exited with code ${code}`);
        mediamtxProc = null;
    });

    process.on('exit', () => { if (mediamtxProc) mediamtxProc.kill(); });
    process.on('SIGINT', () => { if (mediamtxProc) mediamtxProc.kill(); process.exit(); });
}

// ── mediamtx REST API helpers ─────────────────────────────────────────────────
function mtxRequest(method, urlPath, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(MEDIAMTX_API + urlPath);
        const opts = {
            hostname: url.hostname, port: url.port || 9997,
            path: url.pathname, method,
            headers: { 'Content-Type': 'application/json' },
        };
        const req = http.request(opts, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: data ? JSON.parse(data) : {} }); }
                catch { resolve({ status: res.statusCode, body: data }); }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function mtxAddPath(name, rtspUrl) {
    return mtxRequest('POST', `/v3/config/paths/add/${encodeURIComponent(name)}`, {
        source: rtspUrl,
        sourceOnDemand: false,  // Connect immediately for discovery
        sourceOnDemandCloseAfterSec: 30,
    });
}

async function mtxDeletePath(name) {
    return mtxRequest('DELETE', `/v3/config/paths/delete/${encodeURIComponent(name)}`);
}

async function mtxGetPath(name) {
    return mtxRequest('GET', `/v3/paths/get/${encodeURIComponent(name)}`);
}

async function mtxListPaths() {
    return mtxRequest('GET', '/v3/paths/list');
}

// Wait for mediamtx API to become available
async function waitForMtxApi(timeoutMs = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const res = await mtxRequest('GET', '/v3/config/global/get');
            if (res.status === 200) return true;
        } catch { /* not ready yet */ }
        await new Promise(r => setTimeout(r, 500));
    }
    return false;
}

// ── Express App ───────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', async (req, res) => {
    const mtxReady = mediamtxProc !== null;
    let mtxApiReady = false;
    try { const r = await mtxRequest('GET', '/v3/config/global/get'); mtxApiReady = r.status === 200; } catch { }
    res.json({ server: 'ok', mediamtxProcess: mtxReady, mediamtxApi: mtxApiReady });
});

// List all active streams
app.get('/api/streams', async (req, res) => {
    try {
        const result = await mtxListPaths();
        res.json(result.body?.items || []);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Add a stream to mediamtx
app.post('/api/streams', async (req, res) => {
    const { name, rtspUrl } = req.body;
    if (!name || !rtspUrl) { res.status(400).json({ error: 'name and rtspUrl required' }); return; }

    try {
        const result = await mtxAddPath(name, rtspUrl);
        if (result.status === 200 || result.status === 201) {
            res.json({ ok: true, hlsUrl: `${MEDIAMTX_HLS}/${name}/index.m3u8` });
        } else {
            res.status(400).json({ error: result.body });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Remove a stream from mediamtx
app.delete('/api/streams/:name', async (req, res) => {
    try {
        await mtxDeletePath(req.params.name);
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * POST /api/discover  { ip, port, user, pass }
 * → Adds all 12 RTSP pattern paths to mediamtx, waits 4s for connections, 
 *   returns which paths are "ready" (camera responded), then cleans up non-ready ones.
 */
app.post('/api/discover', async (req, res) => {
    const { ip, port = '554', user = 'admin', pass = '' } = req.body;
    if (!ip) { res.status(400).json({ error: 'ip required' }); return; }

    const prefix = `evizz_scan_${ip.replace(/\./g, '_')}`;
    const candidates = RTSP_PATTERNS.map((p, i) => ({
        ...p,
        pathName: `${prefix}_${i}`,
        rtspUrl: `rtsp://${user}:${encodeURIComponent(pass)}@${ip}:${port}${p.path}`,
        hlsUrl: `${MEDIAMTX_HLS}/${prefix}_${i}/index.m3u8`,
        status: 'checking',
    }));

    // Remove any leftover scan paths from previous runs
    for (const c of candidates) {
        try { await mtxDeletePath(c.pathName); } catch { }
    }

    // Add all paths at once
    await Promise.all(candidates.map(c => mtxAddPath(c.pathName, c.rtspUrl).catch(() => { })));

    // Wait for mediamtx to attempt connections
    await new Promise(r => setTimeout(r, 4000));

    // Check each path status
    const results = await Promise.all(candidates.map(async (c) => {
        try {
            const r = await mtxGetPath(c.pathName);
            const ready = r.body?.ready === true || r.body?.readyTime != null;
            return { ...c, status: ready ? 'ok' : 'fail' };
        } catch {
            return { ...c, status: 'fail' };
        }
    }));

    // Clean up ALL scan paths (successful ones will be re-added properly when user saves)
    await Promise.all(candidates.map(c => mtxDeletePath(c.pathName).catch(() => { })));

    res.json(results.map(r => ({
        label: r.label,
        brand: r.brand,
        rtspUrl: r.rtspUrl,
        hlsUrl: r.hlsUrl,
        pathName: r.pathName,
        status: r.status,
    })));
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function main() {
    console.log('[evizz] Backend starting…');

    // Auto-download mediamtx if not present
    if (!fs.existsSync(BINARY_PATH)) {
        console.log('[evizz] mediamtx.exe not found — attempting auto-download…');
        try {
            await downloadMediamtx();
        } catch (e) {
            console.error(`[evizz] Auto-download failed: ${e.message}`);
            console.error(`[evizz] Please download mediamtx manually from:`);
            console.error(`[evizz] https://github.com/bluenviron/mediamtx/releases/latest`);
            console.error(`[evizz] Place mediamtx.exe in: ${PROJECT_ROOT}`);
        }
    }

    // Write fresh mediamtx config
    writeConfig();

    // Start mediamtx
    if (fs.existsSync(BINARY_PATH)) {
        startMediamtx();
        const ready = await waitForMtxApi(12000);
        if (ready) {
            console.log('[evizz] mediamtx API ready ✓  (HLS at http://localhost:8889)');
        } else {
            console.warn('[evizz] mediamtx API not responding — streams may not work yet');
        }
    }

    // Start model server (Python)
    await startModelServer();

    // Start Express
    app.listen(SERVER_PORT, () => {
        console.log(`[evizz] Backend API listening on http://localhost:${SERVER_PORT}`);
    });
}

main().catch(e => { console.error(e); process.exit(1); });
