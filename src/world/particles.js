// Hạt linh khí: chỉ còn lớp khói bay lên thật nhẹ.
// (Đã bỏ lớp hạt quỹ đạo quanh nhân vật vì rối mắt — feedback Captain 18/10.)
import * as THREE from 'three';
import { radialTexture } from './textures.js';

export function buildParticles() {
  const sprite = radialTexture(64);
  const group = new THREE.Group();
  let wisps = null;
  let wseeds = [], count = 0, colorHex = 0xe05a3c;

  function build(n) {
    if (wisps) { group.remove(wisps); wisps.geometry.dispose(); wisps.material.dispose(); }
    wisps = null;
    count = n; wseeds = [];

    const m = Math.max(20, Math.floor(n * 0.15));
    const pos = new Float32Array(m * 3), col = new Float32Array(m * 3);
    for (let i = 0; i < m; i++) {
      const a = Math.random() * Math.PI * 2, r = 1.5 + Math.random() * 4.5;
      wseeds.push({
        x: Math.cos(a) * r, z: 0.8 + Math.sin(a) * r,
        y: Math.random() * 6, sp: 0.25 + Math.random() * 0.5, sway: Math.random() * 6.28,
      });
      const c = new THREE.Color(colorHex).offsetHSL((Math.random() - 0.5) * 0.05, 0, Math.random() * 0.12);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      pos[i * 3] = wseeds[i].x; pos[i * 3 + 1] = wseeds[i].y; pos[i * 3 + 2] = wseeds[i].z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    wisps = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.42, map: sprite, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, vertexColors: true, opacity: 0.32,
    }));
    group.add(wisps);
  }

  build(480);

  return {
    group,
    setCount(n) { if (n !== count) build(n); },
    setColor(hex) { colorHex = hex; build(count); },
    update(dt, t, rate) {
      if (!wisps) return;
      const boost = 1 + Math.min(rate * 0.008, 1.2);
      const pos = wisps.geometry.attributes.position.array;
      for (let i = 0; i < wseeds.length; i++) {
        const s = wseeds[i];
        s.y += dt * s.sp * boost;
        if (s.y > 6.5) s.y = 0.8;
        pos[i * 3] = s.x + Math.sin(t * 0.5 + s.sway) * 0.4;
        pos[i * 3 + 1] = s.y;
        pos[i * 3 + 2] = s.z + Math.cos(t * 0.45 + s.sway) * 0.4;
      }
      wisps.geometry.attributes.position.needsUpdate = true;
    },
  };
}
