// Phù đảo: đá + mặt cỏ + đình đài + tùng + thác nước. Tất cả procedural.
import * as THREE from 'three';
import { stripeTexture } from './textures.js';

export function buildIsland() {
  const g = new THREE.Group();
  const std = (color, rough = 0.95) =>
    new THREE.MeshStandardMaterial({ color, roughness: rough, flatShading: true });

  // Thân đá (nón ngược)
  const rock = new THREE.Mesh(new THREE.ConeGeometry(8.5, 13, 7), std(0x5c6270));
  rock.rotation.x = Math.PI;
  rock.position.y = -5.4;
  g.add(rock);

  // Mặt đảo
  const top = new THREE.Mesh(new THREE.CylinderGeometry(8.6, 7.6, 2.2, 9), std(0x7ba05b));
  top.position.y = 0;
  g.add(top);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(8.55, 0.28, 8, 24), std(0x6b7a5a));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.05;
  g.add(rim);

  // Đình nhỏ phía sau
  const wood = std(0x5a4030), roofM = std(0x33565a);
  const hall = new THREE.Group();
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.3, 2.6), wood); b1.position.y = 0.65;
  const r1 = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.1, 4), roofM); r1.position.y = 1.85; r1.rotation.y = Math.PI / 4;
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 1.8), wood); b2.position.y = 2.4;
  const r2 = new THREE.Mesh(new THREE.ConeGeometry(1.8, 0.95, 4), roofM); r2.position.y = 3.35; r2.rotation.y = Math.PI / 4;
  hall.add(b1, r1, b2, r2);
  hall.position.set(0, 1.1, -4.6);
  g.add(hall);

  // Tùng
  const pineAt = (x, z, s = 1) => {
    const p = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * s, 0.24 * s, 1.1 * s, 6), std(0x4a3826));
    trunk.position.y = 0.55 * s;
    p.add(trunk);
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Mesh(new THREE.ConeGeometry((1.15 - i * 0.28) * s, 1.0 * s, 7), std(0x3f6b4f));
      c.position.y = (1.25 + i * 0.72) * s;
      p.add(c);
    }
    p.position.set(x, 1.1, z);
    g.add(p);
  };
  pineAt(4.2, -2.2, 1.1); pineAt(-4.6, -3, 0.9); pineAt(3.2, 3.6, 1.0); pineAt(-3.2, 4.2, 1.25); pineAt(5.6, 0.6, 0.8);

  // Đá tảng trang trí
  [[-5.5, 1.5, 0.9], [5.8, -3.4, 0.7], [1.8, -5.6, 0.55]].forEach(([x, z, s]) => {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), std(0x8a8f9a));
    r.position.set(x, 1.1 + s * 0.4, z);
    r.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    g.add(r);
  });

  // Bồ đoàn (chỗ ngồi thiền)
  const cushion = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.4, 0.32, 16), std(0x8a6a3a, 0.9));
  cushion.position.set(0, 1.26, 0.8);
  g.add(cushion);

  // Thác nước mép đảo
  const fallTex = stripeTexture();
  const fall = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 10),
    new THREE.MeshBasicMaterial({ map: fallTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.9 })
  );
  fall.position.set(8.0, -3.6, 2.0);
  fall.rotation.y = Math.PI / 2.6;
  g.add(fall);

  return {
    group: g,
    update(dt, t) {
      g.position.y = Math.sin(t * 0.4) * 0.35; // đảo trôi nhẹ
      fallTex.offset.y -= dt * 0.85; // nước chảy
    },
  };
}
