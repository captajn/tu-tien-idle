// Phù đảo: đá + mặt cỏ + đình đài mái cong + tùng + thác nước + đảo xa. Tất cả procedural.
import * as THREE from 'three';
import { stripeTexture, cloudTexture, radialTexture } from './textures.js';

export function buildIsland() {
  const g = new THREE.Group();
  const std = (color, rough = 0.95) =>
    new THREE.MeshStandardMaterial({ color, roughness: rough, flatShading: true });

  // Thân đá (nón ngược) — jitter đỉnh cho tự nhiên
  const rockGeo = new THREE.ConeGeometry(8.5, 13, 7);
  {
    const p = rockGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      p.setX(i, p.getX(i) + (Math.random() - 0.5) * 1.1);
      p.setZ(i, p.getZ(i) + (Math.random() - 0.5) * 1.1);
    }
    rockGeo.computeVertexNormals();
  }
  const rock = new THREE.Mesh(rockGeo, std(0x565b68));
  rock.rotation.x = Math.PI;
  rock.position.y = -5.4;
  g.add(rock);
  // Mỏm đá phụ dưới đáy
  const crag = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2, 0), std(0x4a4f5c));
  crag.position.set(1.5, -11.6, -1);
  crag.scale.y = 1.7;
  g.add(crag);

  // Mặt đảo
  const top = new THREE.Mesh(new THREE.CylinderGeometry(8.6, 7.6, 2.2, 9), std(0x6f9a52));
  top.position.y = 0;
  top.receiveShadow = true;
  g.add(top);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(8.55, 0.28, 8, 24), std(0x5d7048));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.05;
  g.add(rim);

  // Cỏ dại rải mặt đảo
  {
    const tuft = new THREE.ConeGeometry(0.09, 0.5, 5);
    const gm1 = std(0x5d8a44), gm2 = std(0x7fae5a);
    for (let i = 0; i < 46; i++) {
      const m = new THREE.Mesh(tuft, Math.random() < 0.5 ? gm1 : gm2);
      const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 6;
      m.position.set(Math.cos(a) * r, 1.28, Math.sin(a) * r);
      m.rotation.z = (Math.random() - 0.5) * 0.5;
      m.scale.setScalar(0.7 + Math.random() * 0.9);
      g.add(m);
    }
  }

  // Mái cong kiểu đình đài (lathe 4 cạnh, diềm hất lên)
  function curvedRoof(w, h, color) {
    const pts = [
      new THREE.Vector2(0.02, h),
      new THREE.Vector2(w * 0.42, h * 0.52),
      new THREE.Vector2(w * 0.78, h * 0.16),
      new THREE.Vector2(w, h * 0.3), // diềm hất
    ];
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 4), std(color, 0.85));
    m.rotation.y = Math.PI / 4;
    m.castShadow = true;
    return m;
  }

  // Đình 2 tầng phía sau
  const wood = std(0x6b4a30), roofM = std(0x2f6f76), pillarM = std(0x8a2f28);
  const hall = new THREE.Group();
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.25, 2.6), wood);
  b1.position.y = 0.62; b1.castShadow = true;
  const r1 = curvedRoof(2.5, 1.15, 0x2f6f76); r1.position.y = 1.25;
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.95, 1.8), wood);
  b2.position.y = 2.35; b2.castShadow = true;
  const r2 = curvedRoof(1.9, 1.0, 0x2f6f76); r2.position.y = 2.82;
  const spire = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.35, metalness: 0.7 }));
  spire.position.y = 4.0;
  hall.add(b1, r1, b2, r2, spire);
  // 4 cột đỏ hiên trước
  for (const [px, pz] of [[-1.05, 1.05], [1.05, 1.05], [-1.05, -1.05], [1.05, -1.05]]) {
    const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.25, 8), pillarM);
    pil.position.set(px, 0.62, pz);
    hall.add(pil);
  }
  hall.position.set(0, 1.1, -4.6);
  g.add(hall);

  // Đèn đá
  {
    const stone = std(0x9aa0ab);
    const lg = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.7), stone); base.position.y = 0.12;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.7, 6), stone); post.position.y = 0.6;
    const boxm = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.55), stone); boxm.position.y = 1.2;
    const glowBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.32, 0.4),
      new THREE.MeshBasicMaterial({ color: 0xffd98a }));
    glowBox.position.y = 1.2;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.35, 4), stone);
    cap.position.y = 1.62; cap.rotation.y = Math.PI / 4;
    lg.add(base, post, boxm, glowBox, cap);
    lg.position.set(-3.4, 1.1, -1.4);
    g.add(lg);
    const lg2 = lg.clone();
    lg2.position.set(3.6, 1.1, 2.8);
    g.add(lg2);
  }

  // Tùng
  const pineAt = (x, z, s = 1) => {
    const p = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * s, 0.24 * s, 1.1 * s, 6), std(0x4a3826));
    trunk.position.y = 0.55 * s;
    trunk.castShadow = true;
    p.add(trunk);
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Mesh(new THREE.ConeGeometry((1.15 - i * 0.28) * s, 1.0 * s, 7), std(0x3f6b4f));
      c.position.y = (1.25 + i * 0.72) * s;
      c.castShadow = true;
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
    r.castShadow = true;
    g.add(r);
  });

  // Bồ đoàn (chỗ ngồi thiền)
  const cushion = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.4, 0.32, 16), std(0x8a6a3a, 0.9));
  cushion.position.set(0, 1.26, 0.8);
  cushion.receiveShadow = true;
  g.add(cushion);

  // Thác nước mép đảo + sương mù chân thác
  const fallTex = stripeTexture();
  const fall = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 10),
    new THREE.MeshBasicMaterial({ map: fallTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.9 })
  );
  fall.position.set(8.0, -3.6, 2.0);
  fall.rotation.y = Math.PI / 2.6;
  g.add(fall);
  const mist = new THREE.Sprite(new THREE.SpriteMaterial({
    map: cloudTexture(false), transparent: true, opacity: 0.5, depthWrite: false,
  }));
  mist.scale.set(7, 4, 1);
  mist.position.set(8.6, -8.2, 2.4);
  g.add(mist);

  // Đảo xa làm nền (bóng mờ giữa biển mây)
  const far = new THREE.Group();
  const farMat = new THREE.MeshBasicMaterial({ color: 0x2c3550, transparent: true, opacity: 0.75, fog: true });
  const farIsles = [];
  [[-70, -4, 40, 10], [62, 2, -52, 13], [-38, 8, -78, 8], [84, -8, 30, 9], [10, 12, 95, 7]].forEach(([x, y, z, s]) => {
    const grp = new THREE.Group();
    const rk = new THREE.Mesh(new THREE.ConeGeometry(s * 0.8, s * 1.4, 6), farMat);
    rk.rotation.x = Math.PI; rk.position.y = -s * 0.55;
    const tp = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.85, s * 0.7, s * 0.25, 7), farMat);
    tp.position.y = s * 0.1;
    const miniHall = new THREE.Mesh(new THREE.ConeGeometry(s * 0.22, s * 0.3, 4), farMat);
    miniHall.position.y = s * 0.42; miniHall.rotation.y = Math.PI / 4;
    grp.add(rk, tp, miniHall);
    grp.position.set(x, y, z);
    grp.userData = { baseY: y, ph: Math.random() * 6.28, sp: 0.25 + Math.random() * 0.3 };
    far.add(grp);
    farIsles.push(grp);
  });
  g.add(far);

  // Quầng sáng ấm quanh đỉnh đảo lúc hoàng hôn/đêm (sprite)
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radialTexture(128), color: 0xffe0a8, transparent: true,
    opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  halo.scale.set(30, 18, 1);
  halo.position.set(0, 3, -2);
  g.add(halo);

  return {
    group: g,
    update(dt, t) {
      g.position.y = Math.sin(t * 0.4) * 0.35; // đảo trôi nhẹ
      fallTex.offset.y -= dt * 0.85; // nước chảy
      mist.material.opacity = 0.4 + Math.sin(t * 1.7) * 0.12;
      for (const f of farIsles) {
        f.position.y = f.userData.baseY + Math.sin(t * f.userData.sp + f.userData.ph) * 1.6;
      }
    },
  };
}
