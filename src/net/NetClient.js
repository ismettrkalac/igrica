// Thin WebSocket wrapper for the co-op relay (server/server.js).
export class NetClient {
  constructor() {
    this.ws = null;
    this.onMessage = null;
    this.pingTimer = null;
  }

  static url() {
    const override = new URLSearchParams(location.search).get('server');
    if (override) return override;
    return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
  }

  // A sleeping free-tier host can take a while to accept sockets, so retry a few times.
  async connect(attempts = 4) {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
      try { return await this.open(); } catch (e) { lastErr = e; await new Promise((r) => setTimeout(r, 1500 * (i + 1))); }
    }
    throw lastErr;
  }

  open() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(NetClient.url());
      this.ws = ws;
      const timer = setTimeout(() => { ws.close(); reject(new Error('Could not reach the co-op server')); }, 8000);
      ws.onopen = () => {
        clearTimeout(timer);
        // keep-alive so hosts that idle quiet servers (e.g. Render free) don't drop a waiting room
        clearInterval(this.pingTimer);
        this.pingTimer = setInterval(() => this.send({ t: 'ping' }), 30000);
        resolve(this);
      };
      ws.onerror = () => { clearTimeout(timer); reject(new Error('Could not reach the co-op server')); };
      ws.onmessage = (e) => {
        let m;
        try { m = JSON.parse(e.data); } catch { return; }
        this.onMessage?.(m);
      };
      ws.onclose = () => {
        if (this.ws !== ws) return;
        clearInterval(this.pingTimer);
        this.onMessage?.({ t: 'leave' });
      };
    });
  }

  send(m) { if (this.ws?.readyState === 1) this.ws.send(JSON.stringify(m)); }

  close() {
    const ws = this.ws;
    this.ws = null;
    clearInterval(this.pingTimer);
    ws?.close();
  }
}
