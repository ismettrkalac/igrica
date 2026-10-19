// Co-op relay server: serves the built game (dist/) and pairs two players per room code.
// The host's browser runs the simulation; this server only forwards messages between them.
//   npm run build && npm run server      → http://<this-machine>:8787
//   (in development, `npm run dev` proxies /ws here)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT) || 8787;
const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  if (url === '/healthz') { res.writeHead(200, { 'content-type': 'text/plain' }).end('ok'); return; } // Render health check
  let file = path.normalize(path.join(DIST, url));
  if (!file.startsWith(DIST)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(200, { 'content-type': 'text/plain' }).end('Co-op server running. Build the game with `npm run build` to serve it here.'); return; }
  // Vite's hashed asset names never change, so they can be cached for good; index.html must stay fresh
  const cache = file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache';
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': cache });
  fs.createReadStream(file).pipe(res);
});

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 64 * 1024 });
const rooms = new Map(); // code -> { host, guest, hostType }

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newCode() {
  for (;;) {
    let c = '';
    for (let i = 0; i < 4; i++) c += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    if (!rooms.has(c)) return c;
  }
}
const send = (ws, msg) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); };

wss.on('connection', (ws) => {
  ws.room = null;
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (raw) => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (m.t === 'ping') return; // client keep-alive: counts as traffic so free hosts don't idle the server
    if (m.t === 'create') {
      const code = newCode();
      const hostType = m.pick === 'water' ? 'water' : 'fire';
      rooms.set(code, { host: ws, guest: null, hostType });
      ws.room = code;
      send(ws, { t: 'created', code, you: hostType });
    } else if (m.t === 'join') {
      const code = String(m.code || '').toUpperCase().trim();
      const room = rooms.get(code);
      if (!room) return send(ws, { t: 'error', msg: 'Room not found' });
      if (room.guest) return send(ws, { t: 'error', msg: 'Room is full' });
      room.guest = ws;
      ws.room = code;
      const guestType = room.hostType === 'fire' ? 'water' : 'fire';
      send(ws, { t: 'joined', code, you: guestType });
      send(room.host, { t: 'peer-joined' });
    } else if (ws.room) {
      const room = rooms.get(ws.room);
      if (!room) return;
      send(room.host === ws ? room.guest : room.host, m);
    }
  });

  ws.on('close', () => {
    const room = ws.room && rooms.get(ws.room);
    if (!room) return;
    send(room.host === ws ? room.guest : room.host, { t: 'leave' });
    rooms.delete(ws.room);
  });
});

// drop dead connections
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
