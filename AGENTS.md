# AGENTS.md — Tu Tiên Idle

Game tu tiên idle: thiền tu, đột phá 10 cảnh giới, độ kiếp phi thăng.
Scene 3D ambient (three.js, procedural 100%) + UI 2D. Một codebase chạy web, desktop (Electron), mobile (PWA/touch).

## Chạy

```bash
npm test            # test logic thuần bằng node (KHÔNG cần browser)
npm run serve       # web: http://localhost:8491  (bất kỳ static server nào cũng được)
npm install         # một lần, chỉ khi cần bản desktop
npm start           # app desktop (Electron bọc qua scheme app://)
```

Không có build step. ES modules thuần + import map (`index.html`), three.js r186 vendored ở `vendor/three/`.
> BẮT BUỘC: `vendor/three/` phải có đủ **cả hai file** `three.module.js` + `three.core.js` (từ r167 trở đi `three.module.js` import từ `./three.core.js`). Thiếu `three.core.js` → 404 → game kẹt ở màn hình loading. Bài học 18/10/2026: lúc vendor chỉ copy `three.module.js`, phải tải bổ sung `three.core.js` cùng version từ jsdelivr.

## Đồ họa 2.5D (từ 18/10/2026, sau khi Captain chê 3D procedural "í ẹ")
Nền = tranh AI vẽ tay (`assets/bg-day.jpg`, `bg-sunset.jpg`, `bg-night.jpg`, crossfade theo giờ thực trong `src/world/backdrop.js`) + mây trôi 2 lớp bằng DOM. three.js chỉ vẽ lớp FX trong suốt phía trên: hạt linh khí (`particles.js`), trận pháp rune (`scene.js`), sấm sét độ kiếp (`tribulation.js`), vòng xung kích. Các file `world/sky.js`, `world/island.js`, `world/cultivator.js` đời 3D cũ vẫn còn trên đĩa nhưng không còn được dùng.

## Kiến trúc

```
index.html            import map + UI root + màn hình loading
src/main.js           boot: nạp data -> renderer -> world -> HUD -> loop
src/core/             renderer.js (preset Cao/Trung/Thấp), loop.js (rAF + pause khi tab ẩn)
src/game/             LOGIC THUẦN — cấm import DOM/three.js để `npm test` chạy được
  data.js             fetch data/*.json
  state.js            new/load/save localStorage + offline progress (cap 8h, hiệu suất 50%)
  cultivation.js      tốc độ linh khí, giá đột phá, độ kiếp, giá nâng công pháp
src/world/            three.js: scene.js ghép; sky/island/cultivator/particles/tribulation/textures
src/ui/hud.js         DOM: HUD, panel công pháp, màn hình tạo nhân vật, toast
src/audio/ambient.js  nhạc procedural WebAudio (drone + chuông ngũ cung + gió)
styles/ui.css          theme mực tàu + vàng kim
data/*.json           CONTENT — thêm map/vật phẩm/công pháp/nhiệm vụ CHỈ SỬA JSON
assets/               Art 2D vẽ bằng AI: splash.jpg (loading), icon-512/192.png (PWA),
                      elements/{kim,moc,thuy,hoa,tho}.png (icon linh căn). 3D vẫn procedural.
electron/             shell desktop (serve app://), preload tối giản
test/logic.test.mjs   test node cho src/game
```

## Đã hoàn thành (full game v0.2)

- M2 map + auto-battle: 9 map × 100 ải, boss mỗi 10 ải rớt pháp bảo riêng, thua thì đứng yên
- M3 nhiệm vụ: chính tuyến / hằng ngày (reset theo ngày) / thành tựu, nhận thưởng tay
- M4 vật phẩm: linh thạch/linh thảo, đan dược (buff + tự dùng Hồi Xuân Đan khi nguy cấp),
  pháp bảo 3 slot (vũ khí/pháp y/phụ kiện), luyện đan theo công thức
- M5 đồng hành: 3 linh thú + đạo lữ (mở ở Nguyên Anh), nâng cấp bằng linh thạch
- M6 online: relay Cloudflare Worker + Durable Object (server/), client gửi/xem top 20 —
  CẦN Captain `npx wrangler login && npx wrangler deploy` rồi set localStorage['tutien-relay']
- M7 chuyển thế: Phi Thăng tầng 9 → reset nhận +50% linh khí vĩnh viễn mỗi lần

## Quy tắc

1. **Content là data.** Thêm cảnh giới/map/vật phẩm/công pháp/nhiệm vụ/kỹ năng → sửa `data/*.json`, không đụng code. Giữ schema field như file mẫu.
2. **Giữ `src/game/` thuần.** Không `document`, `window`, `THREE` trong đó — `npm test` phải luôn xanh.
3. **World đọc preset.** Mọi thứ tốn GPU (số hạt, số mây, pixelRatio) đi qua `PRESETS` trong `core/renderer.js`; `world.setPreset(p)` được gọi khi đổi.
4. **Tiếng Việt UI.** Text người chơi đọc viết tiếng Việt có dấu; tên Hán để kèm trong data.
5. **Tiết kiệm pin.** Render pause khi tab ẩn (`core/loop.js`); game logic dùng timestamp nên không lệch.
6. Commit nhỏ, mỗi milestone chạy `npm test` trước.

## Cân bằng số (đang dùng)

- Tốc độ = 1 × 2^realmIdx × tích hệ số công pháp (linh khí/s)
- Giá đột phá tầng = 50 × (realm+1)^2.6 × layer^1.6 tu vi
- Độ kiếp (tầng 9 → cảnh giới mới): tỉ lệ = 65% + 2%/cấp công pháp (max 95%); tạch mất 50% tu vi còn lại
- Nâng công pháp tốn tu vi (đánh đổi với đột phá): 30 × tierMult × (lvl+1)^1.8
- Đúng hệ linh căn 100% hiệu quả công pháp, khắc hệ còn 60% phần bonus

## Hướng mở rộng tiếp (chưa làm)

- Kỹ năng visual trong battle: khi công pháp unlock skill, hiện hiệu ứng chém trên scene 3D
- Thêm tier pháp bảo (Linh khí → Tiên khí) + cường hóa
- Tông môn: gia nhập, điểm cống hiến, boss tông môn (dùng relay M6)
- Event tuần: double drop, thiên kiếp giáng lâm toàn server
- Splash art cho boss mỗi map (AI generate thêm vào assets/)
