// Connection to the co-op relay (server/server.js).
// Tries a WebSocket first; if the host's proxy blocks WebSockets (as Render's did), it falls back to
// Server-Sent Events for incoming messages plus batched POSTs for outgoing ones. Same messages either way.
export class NetClient {
  constructor() {
    this.onMessage = null;
    this.transport = null; // 'ws' | 'sse'
    this.ws = null;
    this.es = null;
    this.pingTimer = null;
    this.closed = false;
  }

  static wsUrl() {
    const override = new URLSearchParams(location.search).get('server');
    if (override) return override;
    return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
  }

  static httpBase() {
    return NetClient.wsUrl().replace(/^ws/, 'http').replace(/\/ws\/?$/, '');
  }

  // A sleeping free-tier host can take a while to answer, so retry a few times.
  async connect(attempts = 4) {
    const forced = new URLSearchParams(location.search).get('transport');
    let lastErr;
    for (let i = 0; i < attempts; i++) {
      if (forced !== 'sse') {
        try { await this.openWs(); return this.started('ws'); } catch (e) { lastErr = e; }
      }
      if (forced !== 'ws') {
        try { await this.openSse(); return this.started('sse'); } catch (e) { lastErr = e; }
      }
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
    throw lastErr;
  }

  started(kind) {
    this.transport = kind;
    // keep-alive so hosts that idle quiet servers (e.g. Render free) don't drop a waiting room
    clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => this.send({ t: 'ping' }), 30000);
    return this;
  }

  emit(m) { this.onMessage?.(m); }

  dropped() {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this.pingTimer);
    this.emit({ t: 'leave' });
  }

  // ---- WebSocket ----------------------------------------------------------
  openWs() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(NetClient.wsUrl());
      const timer = setTimeout(() => { ws.close(); reject(new Error('Could not reach the co-op server')); }, 6000);
      ws.onopen = () => { clearTimeout(timer); this.ws = ws; resolve(); };
      ws.onerror = () => { clearTimeout(timer); reject(new Error('Could not reach the co-op server')); };
      ws.onmessage = (e) => {
        let m;
        try { m = JSON.parse(e.data); } catch { return; }
        this.emit(m);
      };
      ws.onclose = () => { if (this.ws === ws) this.dropped(); };
    });
  }

  // ---- Server-Sent Events + POST -------------------------------------------
  openSse() {
    return new Promise((resolve, reject) => {
      const id = (crypto.randomUUID?.() || `${Date.now()}${Math.random()}`).replace(/[^A-Za-z0-9]/g, '');
      const base = NetClient.httpBase();
      const es = new EventSource(`${base}/rt/stream?id=${id}`);
      let ready = false;
      const timer = setTimeout(() => { es.close(); reject(new Error('Could not reach the co-op server')); }, 8000);
      es.onmessage = (e) => {
        let m;
        try { m = JSON.parse(e.data); } catch { return; }
        if (m.t === 'ready') {
          if (!ready) { ready = true; clearTimeout(timer); this.es = es; this.sseId = id; this.sseBase = base; this.queue = []; this.inFlight = false; resolve(); }
          return;
        }
        this.emit(m);
      };
      es.onerror = () => {
        es.close(); // the server forgets a peer whose stream drops, so never auto-reconnect into a stale session
        if (!ready) { clearTimeout(timer); reject(new Error('Could not reach the co-op server')); } else if (this.es === es) this.dropped();
      };
    });
  }

  flush() {
    if (this.inFlight || !this.queue.length || !this.es) return;
    const batch = this.queue;
    this.queue = [];
    this.inFlight = true;
    fetch(`${this.sseBase}/rt/send?id=${this.sseId}`, { method: 'POST', body: JSON.stringify(batch), headers: { 'content-type': 'application/json' }, keepalive: batch.length < 20 })
      .then((r) => { if (r.status === 410) this.dropped(); })
      .catch(() => {})
      .finally(() => { this.inFlight = false; if (this.queue.length) setTimeout(() => this.flush(), 0); });
  }

  // ---- common ---------------------------------------------------------------
  send(m) {
    if (this.closed) return;
    if (this.transport === 'ws' || (!this.transport && this.ws)) {
      if (this.ws?.readyState === 1) this.ws.send(JSON.stringify(m));
    } else if (this.es) {
      this.queue.push(m);
      if (!this.flushTimer) this.flushTimer = setTimeout(() => { this.flushTimer = null; this.flush(); }, 30);
    }
  }

  close() {
    this.closed = true;
    clearInterval(this.pingTimer);
    const ws = this.ws, es = this.es;
    this.ws = null;
    this.es = null;
    ws?.close();
    es?.close();
  }
}
