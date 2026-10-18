// Nền 2.5D: tranh AI (ngày/hoàng hôn/đêm) crossfade theo giờ thực + mây trôi 2 lớp.
import { cloudTexture } from './textures.js';

function hourNow() {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

// đêm: 19-5, hoàng hôn: 5-7 & 17-19, ngày: 7-17
function pickKey(h) {
  if (h >= 19 || h < 5) return 'night';
  if (h < 7 || h >= 17) return 'sunset';
  return 'day';
}

export function buildBackdrop() {
  const layers = {
    day: document.getElementById('bg-day'),
    sunset: document.getElementById('bg-sunset'),
    night: document.getElementById('bg-night'),
  };
  let cur = '';

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

  function apply() {
    const k = pickKey(hourNow());
    if (k === cur) return;
    cur = k;
    for (const [key, img] of Object.entries(layers)) {
      if (img) img.classList.toggle('on', key === k);
    }
  }
  apply();

  let t = 0;
  return {
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
