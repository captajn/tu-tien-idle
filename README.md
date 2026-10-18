# Tu Tiên Idle — Con Đường Trường Sinh

Game tu tiên idle: chọn linh căn, thiền tu trên phù đảo, tích tu vi, đột phá 10 cảnh giới
(Luyện Khí → Phi Thăng), độ kiếp với sấm sét thiên lôi, học công pháp ngũ hành.

Kiến trúc học từ [inkwave](https://github.com/amiaoapp/inkwave): **no build step**
(ES modules + import map, three.js vendored), một codebase chạy web + desktop (Electron)
+ mobile (PWA/touch), mọi asset 3D/âm thanh procedural bằng code.

## Chơi thử (30 giây)

```bash
cd tu-tien-idle
npm run serve
# mở http://localhost:8491 — trên điện thoại thì mở IP LAN của máy
```

Chọn linh căn → nhân vật ngồi thiền, linh khí tự tích → đủ tu vi bấm **Đột phá** →
học **Công pháp** để tu nhanh hơn → tầng 9 mỗi cảnh giới phải **Độ kiếp** (có tỉ lệ tạch).

Mở panel **⚔️ Chiến đấu**: tự động đánh yêu thú qua 9 bản đồ, boss mỗi 10 ải rớt
pháp bảo → **🎒 Túi đồ** mặc đồ, dùng đan, luyện đan → **📜 Nhiệm vụ** nhận thưởng →
**🐾 Đồng hành** thu phục linh thú, đạo lữ → Phi Thăng thì **chuyển thế** lấy bonus vĩnh viễn.

## Desktop

```bash
npm install   # một lần
npm start     # app Electron
```

## Mobile

Mở URL trên trình duyệt điện thoại → "Thêm vào màn hình chính" là thành app
(PWA). Mặc định dùng preset đồ họa Thấp cho đỡ hao pin, đổi ở nút "Chất lượng".

## Cấu trúc

Xem `AGENTS.md` — file dành cho agent/dev: kiến trúc, quy tắc, milestone tiếp theo
(map auto-battle, nhiệm vụ, vật phẩm, linh thú, online...).

## Test

```bash
npm test   # logic game thuần chạy bằng node, không cần browser
```
