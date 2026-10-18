// Relay bảng xếp hạng Tu Tiên Idle — Cloudflare Worker + Durable Object.
// Học từ inkwave/server: relay nhỏ, client tự tính điểm, server chỉ lưu top.
//
// Deploy (cần tài khoản Cloudflare của Captain):
//   cd server && npx wrangler login && npx wrangler deploy
// Xong copy URL worker vào game: localStorage['tutien-relay'] = 'https://...workers.dev'
// (hoặc mở Console trong game gõ: localStorage.setItem('tutien-relay', url))

export class Leaderboard {
  constructor(state) {
    this.state = state;
    this.scores = new Map(); // name -> { name, realm, layer, power, at }
  }

  async fetch(req) {
    const url = new URL(req.url);
    if (req.method === 'POST' && url.pathname === '/score') {
      let b;
      try { b = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }
      if (!b.name || typeof b.power !== 'number') return Response.json({ ok: false }, { status: 400 });
      const key = String(b.name).slice(0, 12);
      const prev = this.scores.get(key);
      // Chỉ giữ điểm cao nhất của mỗi người
      if (!prev || b.power > prev.power) {
        this.scores.set(key, {
          name: key,
          realm: b.realm | 0,
          layer: b.layer | 0,
          power: Math.floor(b.power),
          at: Date.now(),
        });
      }
      return Response.json({ ok: true });
    }
    if (req.method === 'GET' && url.pathname === '/top') {
      const top = [...this.scores.values()].sort((a, b) => b.power - a.power).slice(0, 20);
      return Response.json({ top });
    }
    return new Response('not found', { status: 404 });
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
    const id = env.LEADERBOARD.idFromName('global');
    const stub = env.LEADERBOARD.get(id);
    const res = await stub.fetch(req);
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
    return new Response(res.body, { status: res.status, headers });
  },
};
