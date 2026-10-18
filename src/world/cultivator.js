// Tu sĩ ngồi thiền — procedural, áo choàng + trận pháp đổi màu theo linh căn.
import * as THREE from 'three';
import { runeTexture } from './textures.js';

export function buildCultivator() {
  const g = new THREE.Group();
  const robeMat = new THREE.MeshStandardMaterial({ color: 0xe05a3a, roughness: 0.85, flatShading: true });
  const robeDark = new THREE.MeshStandardMaterial({ color: 0x9a3a24, roughness: 0.9, flatShading: true });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4, metalness: 0.6 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xf2cf9f, roughness: 0.7 });
  const hairM = new THREE.MeshStandardMaterial({ color: 0x1c1a20, roughness: 0.85 });

  const add = (m, cast = true) => { m.castShadow = cast; g.add(m); return m; };

  // Chân xếp bằng (vòng)
  const legs = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.24, 8, 16), robeDark);
  legs.rotation.x = Math.PI / 2;
  legs.position.y = 0.3;
  add(legs);
  // Áo choàng (nón) + viền vàng eo
  const robe = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.7, 8), robeMat);
  robe.position.y = 0.95;
  add(robe);
  const sash = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.06, 8, 20), trimMat);
  sash.rotation.x = Math.PI / 2;
  sash.position.y = 1.02;
  add(sash);
  // Vai rộng (cầu dẹt)
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), robeMat);
  shoulders.scale.set(1.15, 0.55, 0.9);
  shoulders.position.y = 1.78;
  add(shoulders);
  // Cổ áo
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.055, 8, 16), trimMat);
  collar.position.y = 1.98;
  collar.rotation.x = Math.PI / 2 - 0.25;
  add(collar);
  // Tay áo rộng đặt trên đùi
  const sleeveGeo = new THREE.CapsuleGeometry(0.16, 0.5, 4, 8);
  const slL = new THREE.Mesh(sleeveGeo, robeDark);
  slL.position.set(-0.5, 1.28, 0.2); slL.rotation.set(0.95, 0, 0.5);
  const slR = new THREE.Mesh(sleeveGeo, robeDark);
  slR.position.set(0.5, 1.28, 0.2); slR.rotation.set(0.95, 0, -0.5);
  add(slL); add(slR);
  // Bàn tay chắp trước bụng
  const handGeo = new THREE.SphereGeometry(0.11, 8, 6);
  const hL = new THREE.Mesh(handGeo, skin); hL.position.set(-0.12, 1.12, 0.52); hL.scale.set(1, 1.4, 0.8);
  const hR = new THREE.Mesh(handGeo, skin); hR.position.set(0.12, 1.12, 0.52); hR.scale.set(1, 1.4, 0.8);
  add(hL, false); add(hR, false);
  // Đầu + búi tóc + trâm vàng
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), skin);
  head.position.y = 2.32;
  add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.31, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.3), hairM);
  hair.position.y = 2.36;
  add(hair);
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), hairM);
  knot.position.y = 2.68;
  add(knot);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 6), trimMat);
  pin.position.y = 2.66;
  pin.rotation.z = Math.PI / 2.3;
  add(pin, false);

  // Vòng sáng dưới chân
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.045, 8, 40),
    new THREE.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.85 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  g.add(ring);

  // Trận pháp rune xoay dưới bồ đoàn
  const runeMat = new THREE.MeshBasicMaterial({
    map: runeTexture(256), color: 0xe05a3c, transparent: true, opacity: 0.75,
    depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const rune = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), runeMat);
  rune.rotation.x = -Math.PI / 2;
  rune.position.y = 0.05;
  g.add(rune);
  const rune2 = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 3.1), runeMat.clone());
  rune2.material.opacity = 0.5;
  rune2.rotation.x = -Math.PI / 2;
  rune2.position.y = 0.06;
  g.add(rune2);

  // Hào quang quanh người
  const glow = new THREE.PointLight(0xff9a3c, 10, 11, 2);
  glow.position.y = 1.7;
  g.add(glow);

  g.position.set(0, 1.42, 0.8); // ngồi trên bồ đoàn

  return {
    group: g,
    setElement(hex) {
      robeMat.color.set(hex);
      robeDark.color.set(hex).multiplyScalar(0.65);
      glow.color.set(hex);
      runeMat.color.set(hex);
      rune2.material.color.set(hex);
    },
    update(dt, t, rate) {
      // "Hô hấp" tu luyện: phập phồng theo tốc độ linh khí
      const br = 1 + Math.sin(t * (1.1 + Math.min(rate * 0.02, 1.2))) * 0.022;
      robe.scale.set(br, 1, br);
      g.position.y = 1.42 + Math.sin(t * 1.15) * 0.07;
      g.rotation.y = Math.sin(t * 0.3) * 0.05;
      ring.material.opacity = 0.6 + Math.sin(t * 2.2) * 0.25;
      // Trận pháp xoay 2 chiều, sáng theo nhịp thở
      rune.rotation.z += dt * 0.25;
      rune2.rotation.z -= dt * 0.4;
      const rp = 0.55 + Math.sin(t * 2.2) * 0.2;
      runeMat.opacity = rp;
      rune2.material.opacity = rp * 0.7;
    },
  };
}
