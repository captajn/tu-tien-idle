// Nền 2.5D: tranh AI theo FORM nhân vật × buổi trong ngày + mây trôi 2 lớp.
// Form: phàm (Luyện Khí–Trúc Cơ) → linh (Kim Đan–Hóa Thần) → tiên (Luyện Hư–Phi Thăng).
import { cloudTexture } from './textures.js';

function hourNow() {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

// đêm: 19-5, hoàng hôn: 5-7 & 17-19, ngày: 7-17
function pickTime(h) {
  if (h >= 19 || h < 5) return 'night';
  if (h < 7 || h >= 17) return 'sunset';
  return 'day';
}

function pickTier(realmIdx) {
  if (realmIdx >= 5) return 'tien';
  if (realmIdx >= 2) return 'linh';
  return 'pham';
}

const src = (tier, time) => `./assets/bg-${tier}-${time}.jpg`;

export function buildBackdrop() {
  const layers = {
    day: document.getElementById('bg-day'),
    sunset: document.getElementById('bg-sunset'),
    night: document.getElementById('bg-night'),
  };
  let curTier = 'pham', curTime = '', realmIdx = 0;

  // Mây trôi: dùng cloud texture procedural làm background lặp ngang
  const drifts = [];
  const defs = [
    { el: document.getElementById('cloud-a'), speed: 14, opacity: 0.55, scale: 1.6 },
    { el: document.getElementById('cloud-b'), speed: -9, opacity: 0.35, scale: 2.6 },
  ];
  for (const d of defs) {
    if (!d.el) continue;
    const tex = cloudTexture(false);
    const url = tex.image.toDataURL();
    tex.dispose();
    d.el.style.backgroundImage = `url(${url})`;
    d.el.style.opacity = d.opacity;
    d.el.style.backgroundSize = `auto ${Math.round(100 * d.scale)}%`;
    drifts.push({ ...d, off: Math.random() * 800 });
  }

  function showTime(time) {
    curTime = time;
    for (const [key, img] of Object.entries(layers)) {
      if (img) img.classList.toggle('on', key === time);
    }
  }

  // Đổi form: fade tối rồi hiện form mới (kịch tính như lột xác)
  function applyTier(tier) {
    if (tier === curTier) return;
    curTier = tier;
    const active = pickTime(hourNow());
    for (const [t, img] of Object.entries(layers)) {
      if (!img) continue;
      img.classList.remove('on');
      img.src = src(tier, t);
    }
    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      showTime(active);
    };
    const im = layers[active];
    if (im) {
      im.onload = show;
      if (im.complete && im.naturalWidth) show();
    }
    setTimeout(show, 1600); // fallback nếu onload chậm
  }

  function apply() {
    applyTier(pickTier(realmIdx));
    const t = pickTime(hourNow());
    if (t !== curTime) showTime(t);
  }
  apply();

  let t = 0;
  return {
    // Trả về true nếu vừa đổi form (để main toast chúc mừng)
    setRealm(i) {
      const before = pickTier(realmIdx);
      realmIdx = i;
      const after = pickTier(i);
      if (after !== before) {
        applyTier(after);
        return true;
      }
      return false;
    },
    update(dt) {
      t += dt;
      if (Math.floor(t) % 20 === 0) apply(); // kiểm tra giờ mỗi ~20s
      for (const d of drifts) {
        d.off += d.speed * dt;
        d.el.style.backgroundPosition = `${d.off.toFixed(1)}px 50%`;
      }
    },
  };
}
