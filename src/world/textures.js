// Texture procedural vẽ bằng canvas — không tải asset nào từ mạng.
import * as THREE from 'three';

// Hạt sáng tròn mờ (linh khí, mặt trời, mặt trăng)
export function radialTexture(size = 64, inner = 'rgba(255,255,255,1)', mid = 'rgba(255,255,255,0.35)') {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, inner);
  gr.addColorStop(0.4, mid);
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Đám mây mềm; dark=true cho mây đen lúc độ kiếp
export function cloudTexture(dark = false) {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const base = dark ? '24,18,46' : '235,242,250';
  for (let i = 0; i < 48; i++) {
    const x = s / 2 + (Math.random() - 0.5) * s * 0.72;
    const y = s / 2 + (Math.random() - 0.5) * s * 0.45;
    const r = 18 + Math.random() * 44;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${base},${dark ? 0.55 : 0.17})`);
    gr.addColorStop(1, `rgba(${base},0)`);
    g.fillStyle = gr;
    g.beginPath();
    g.arc(x, y, r, 0, 7);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Vòng trận pháp (vẽ rune + bát quái) — đặt dưới bồ đoàn, xoay chậm
export function runeTexture(size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const cx = size / 2, cy = size / 2;
  g.strokeStyle = 'rgba(255,255,255,0.95)';
  g.fillStyle = 'rgba(255,255,255,0.9)';
  for (const [r, w] of [[0.46, 4], [0.405, 1.6], [0.23, 2.4], [0.07, 2]]) {
    g.lineWidth = w;
    g.beginPath(); g.arc(cx, cy, size * r, 0, Math.PI * 2); g.stroke();
  }
  // 8 quẻ: vạch liền/đứt quanh vòng
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const r1 = size * 0.31, r2 = size * 0.385;
    for (let k = -1; k <= 1; k++) {
      const rr = size * 0.348 + k * size * 0.022;
      const x1 = cx + Math.cos(a - 0.055) * rr, y1 = cy + Math.sin(a - 0.055) * rr;
      const x2 = cx + Math.cos(a + 0.055) * rr, y2 = cy + Math.sin(a + 0.055) * rr;
      const broken = (i + k + 8) % 3 === 0; // vài vạch đứt kiểu hào
      g.lineWidth = 3;
      if (broken) {
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        g.beginPath(); g.moveTo(x1, y1); g.lineTo(mx - (x2 - x1) * 0.12, my - (y2 - y1) * 0.12); g.stroke();
        g.beginPath(); g.moveTo(mx + (x2 - x1) * 0.12, my + (y2 - y1) * 0.12); g.lineTo(x2, y2); g.stroke();
      } else {
        g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      }
    }
    void r1; void r2;
  }
  // chấm sao ở tâm
  g.beginPath(); g.arc(cx, cy, size * 0.028, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Vệt nước thác đổ (scroll theo trục Y)
export function stripeTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 128;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 64, 128);
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * 64;
    g.fillStyle = `rgba(205,232,255,${0.25 + Math.random() * 0.45})`;
    g.fillRect(x, Math.random() * 128, 2 + Math.random() * 3, 22 + Math.random() * 44);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
