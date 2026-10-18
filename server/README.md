# Relay bảng xếp hạng (server/)

Cloudflare Worker + Durable Object lưu top 20 người chơi.

## Deploy

```bash
cd server
npx wrangler login      # đăng nhập tài khoản Cloudflare của Captain (một lần)
npx wrangler deploy     # deploy, nhận URL dạng https://tutien-leaderboard.<user>.workers.dev
```

## Nối vào game

Mở game → F12 Console → chạy:

```js
localStorage.setItem('tutien-relay', 'https://tutien-leaderboard.<user>.workers.dev')
```

Rồi vào panel Chiến đấu → **Gửi điểm** để lên bảng xếp hạng.

## API

- `POST /score` `{ name, realm, layer, power }` — gửi điểm (giữ điểm cao nhất)
- `GET /top` — top 20 `{ top: [...] }`

Lưu ý: điểm lưu trong RAM của Durable Object — deploy lại là mất. Đủ cho bản chơi thử;
muốn bền thì gắn D1/KV sau.
