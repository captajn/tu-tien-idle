// Hạt linh khí: lớp quỹ đạo quanh tu sĩ + lớp khói bay lên. Tốc độ/mật độ tăng theo linh khí/s.
import * as THREE from 'three';
import { radialTexture } from './textures.js';

export function buildParticles() {
  const sprite = radialTexture(64);
  const group = new THREE.Group();
  let orbit = null, wisps = null;
  let seeds = [], wseeds = [], count = 0, colorHex = 0xe05a3c;

  function tinted(hex, dl, dh) {
    const c = new THREE.Color(hex).offsetHSL((Math.random() - 0.5) * 0.06, 0, dl + Math.random() * (dh - dl));
    return [c.r, c.g, c.b];
  }

  function build(n) {
    for (const p of [orbit, wisps]) {
      if (p) { group.remove(p); p.geometry.dispose(); p.material.dispose(); }
    }
    orbit = wisps = null;
    count = n; seeds = []; wseeds = [];

    // Lớp 1: hạt quỹ đạo quanh tu sĩ
    {
      const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        seeds.push({
          r: 1.6 + Math.random() * 3.4,
          y: 1.2 + Math.random() * 3.6,
          sp: 0.25 + Math.random() * 0.9,
          ph: Math.random() * Math.PI * 2,
          tilt: (Math.random() - 0.5) * 0.9,
        });
        const [r, gg, b] = tinted(colorHex, -0.12, 0.13);
        col[i * 3] = r; col[i * 3 + 1] = gg; col[i * 3 + 2] = b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      orbit = new THREE.Points(geo, new THREE.PointsMaterial({
        size: 0.32, map: sprite, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, vertexColors: true, opacity: 0.95,
      }));
      group.add(orbit);
    }

    // Lớp 2: khói linh khí bay lên từ mặt đảo
    {
      const m = Math.floor(n * 0.45);
      const pos = new Float32Array(m * 3), col = new Float32Array(m * 3);
      for (let i = 0; i < m; i++) {
        const a = Math.random() * Math.PI * 2, r = 0.8 + Math.random() * 3.6;
        wseeds.push({ x: Math.cos(a) * r, z: 0.8 + Math.sin(a) * r, y: Math.random() * 6, sp: 0.5 + Math.random() * 1.1, sway: Math.random() * 6.28 });
        const [rr, gg, b] = tinted(colorHex, -0.05, 0.2);
        col[i * 3] = rr; col[i * 3 + 1] = gg; col[i * 3 + 2] = b;
        pos[i * 3] = wseeds[i].x; pos[i * 3 + 1] = wseeds[i].y; pos[i * 3 + 2] = wseeds[i].z;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      wisps = new THREE.Points(geo, new THREE.PointsMaterial({
        size: 0.55, map: sprite, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, vertexColors: true, opacity: 0.55,
      }));
      group.add(wisps);
    }
  }

  build(480);

  return {
    group,
    setCount(n) { if (n !== count) build(n); },
    setColor(hex) { colorHex = hex; build(count); },
    update(dt, t, rate) {
      const boost = 1 + Math.min(rate * 0.015, 2.2);
      if (orbit) {
        const pos = orbit.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
          const s = seeds[i];
          const a = s.ph + t * s.sp * boost;
          pos[i * 3] = Math.cos(a) * s.r;
          pos[i * 3 + 1] = s.y + Math.sin(t * 0.9 + s.ph) * 0.45 + s.tilt * Math.sin(a);
          pos[i * 3 + 2] = 0.8 + Math.sin(a) * s.r;
        }
        orbit.geometry.attributes.position.needsUpdate = true;
      }
      if (wisps) {
        const pos = wisps.geometry.attributes.position.array;
        for (let i = 0; i < wseeds.length; i++) {
          const s = wseeds[i];
          s.y += dt * s.sp * boost;
          if (s.y > 6.5) s.y = 0.8;
          pos[i * 3] = s.x + Math.sin(t * 0.8 + s.sway) * 0.35;
          pos[i * 3 + 1] = s.y;
          pos[i * 3 + 2] = s.z + Math.cos(t * 0.7 + s.sway) * 0.35;
        }
        wisps.geometry.attributes.position.needsUpdate = true;
      }
    },
  };
}
