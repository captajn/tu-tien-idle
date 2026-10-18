// Hạt linh khí bay quanh tu sĩ — tốc độ/mật độ tăng theo linh khí/s.
import * as THREE from 'three';
import { radialTexture } from './textures.js';

export function buildParticles() {
  const sprite = radialTexture(64);
  let points = null, seeds = [], count = 0, colorHex = 0xe05a3c;
  const group = new THREE.Group();

  function build(n) {
    if (points) {
      group.remove(points);
      points.geometry.dispose();
      points.material.dispose();
    }
    count = n;
    seeds = [];
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const base = new THREE.Color(colorHex);
    for (let i = 0; i < n; i++) {
      seeds.push({
        r: 1.6 + Math.random() * 3.2,
        y: 1.2 + Math.random() * 3.4,
        sp: 0.25 + Math.random() * 0.9,
        ph: Math.random() * Math.PI * 2,
        tilt: (Math.random() - 0.5) * 0.9,
      });
      const c = base.clone().offsetHSL((Math.random() - 0.5) * 0.06, 0, (Math.random() - 0.5) * 0.25);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.3, map: sprite, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, vertexColors: true, opacity: 0.95,
    });
    points = new THREE.Points(geo, mat);
    group.add(points);
  }

  build(480);

  return {
    group,
    setCount(n) { if (n !== count) build(n); },
    setColor(hex) { colorHex = hex; build(count); }, // dựng lại để đổi màu
    update(dt, t, rate) {
      if (!points) return;
      const pos = points.geometry.attributes.position.array;
      const boost = 1 + Math.min(rate * 0.015, 2.2); // linh khí càng mạnh bay càng nhanh
      for (let i = 0; i < count; i++) {
        const s = seeds[i];
        const a = s.ph + t * s.sp * boost;
        pos[i * 3] = Math.cos(a) * s.r;
        pos[i * 3 + 1] = s.y + Math.sin(t * 0.9 + s.ph) * 0.45 + s.tilt * Math.sin(a);
        pos[i * 3 + 2] = 0.8 + Math.sin(a) * s.r; // quanh vị trí tu sĩ (z=0.8)
      }
      points.geometry.attributes.position.needsUpdate = true;
    },
  };
}
