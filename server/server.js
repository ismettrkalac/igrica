// Co-op relay server: serves the built game (dist/) and pairs two players per room code.
// The host's browser runs the simulation; this server only forwards messages between them.
//   npm run build && npm run server      → http://<this-machine>:8787
//   (in development, `npm run dev` proxies /ws and /rt here)
//
// Two transports reach the same rooms:
//   /ws          WebSocket (preferred)
//   /rt/stream   Server-Sent Events down + POST /rt/send up, for hosts whose proxy blocks WebSockets
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT) || 8787;
const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };

// ---- rooms (transport-independent) ----------------------------------------
// A peer is { id, room, send(msg), close() }.
const rooms = new Map(); // code -> { code, host, guest, hostType }

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newCode() {
  for (;;) {
    let c = '';
    for (let i = 0; i < 4; i++) c += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    if (!rooms.has(c)) return c;
  }
}

function handle(peer, m) {
  if (!m || typeof m !== 'object' || m.t === 'ping') return; // pings only keep free hosts awake
  if (m.t === 'create') {
    leave(peer);
    const code = newCode();
    const hostType = m.pick === 'water' ? 'water' : 'fire';
    rooms.set(code, { code, host: peer, guest: null, hostType });
    peer.room = code;
    peer.send({ t: 'created', code, you: hostType });
  } else if (m.t === 'join') {
    const code = String(m.code || '').toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return peer.send({ t: 'error', msg: 'Room not found' });
    if (room.guest) return peer.send({ t: 'error', msg: 'Room is full' });
    room.guest = peer;
    peer.room = code;
    peer.send({ t: 'joined', code, you: room.hostType === 'fire' ? 'water' : 'fire' });
    room.host.send({ t: 'peer-joined' });
  } else if (peer.room) {
    const room = rooms.get(peer.room);
    const other = room && (room.host === peer ? room.guest : room.host);
    other?.send(m);
  }
}

function leave(peer) {
  const room = peer.room && rooms.get(peer.room);
  peer.room = null;
  if (!room) return;
  (room.host === peer ? room.guest : room.host)?.send({ t: 'leave' });
  rooms.delete(room.code);
}

// ---- HTTP: static files, health check, SSE transport -----------------------
const ssePeers = new Map(); // id -> peer

function readBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function openStream(req, res, id) {
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
  });
  res.write(`: ${' '.repeat(2048)}\n\n`); // padding so buffering proxies start streaming right away
  const peer = {
    id, room: null, kind: 'sse',
    send: (msg) => { res.write(`data: ${JSON.stringify(msg)}\n\n`); },
    close: () => res.end(),
  };
  ssePeers.get(id)?.close();
  ssePeers.set(id, peer);
  peer.send({ t: 'ready' });
  const beat = setInterval(() => res.write(': keep-alive\n\n'), 15000);
  req.on('close', () => {
    clearInterval(beat);
    if (ssePeers.get(id) === peer) ssePeers.delete(id);
    leave(peer);
  });
}

async function postMessages(req, res, id) {
  const peer = ssePeers.get(id);
  if (!peer) { res.writeHead(410).end(); return; }
  try {
    const list = JSON.parse(await readBody(req));
    for (const m of Array.isArray(list) ? list : [list]) handle(peer, m);
    res.writeHead(204).end();
  } catch {
    res.writeHead(400).end();
  }
}

const server = http.createServer((req, res) => {
  const [rawPath, query = ''] = (req.url || '/').split('?');
  const url = decodeURIComponent(rawPath);
  if (url === '/healthz') { res.writeHead(200, { 'content-type': 'text/plain' }).end('ok'); return; } // Render health check

  if (url === '/rt/stream' || url === '/rt/send') {
    const id = new URLSearchParams(query).get('id') || '';
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) { res.writeHead(400).end(); return; }
    if (url === '/rt/stream' && req.method === 'GET') return openStream(req, res, id);
    if (url === '/rt/send' && req.method === 'POST') return postMessages(req, res, id);
    res.writeHead(405).end();
    return;
  }

  let file = path.normalize(path.join(DIST, url));
  if (!file.startsWith(DIST)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(200, { 'content-type': 'text/plain' }).end('Co-op server running. Build the game with `npm run build` to serve it here.'); return; }
  // Vite's hashed asset names never change, so they can be cached for good; index.html must stay fresh
  const cache = file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache';
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': cache });
  fs.createReadStream(file).pipe(res);
});

// ---- WebSocket transport ----------------------------------------------------
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 64 * 1024 });

wss.on('connection', (ws) => {
  const peer = {
    id: crypto.randomUUID(), room: null, kind: 'ws',
    send: (msg) => { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); },
    close: () => ws.close(),
  };
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', (raw) => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    handle(peer, m);
  });
  ws.on('close', () => leave(peer));
});

// drop dead WebSocket connections
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 15000);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use – the co-op server is probably already running in another terminal.`);
    console.error(`Stop that one first, or pick another port: PORT=8788 npm run server (and update the /ws proxy in vite.config.js).`);
    process.exit(1);
  }
  throw err;
});
wss.on('error', () => {}); // listen errors are reported once, by the HTTP server above

server.listen(PORT, () => console.log(`Fireboy & Watergirl co-op server on http://localhost:${PORT}`));
