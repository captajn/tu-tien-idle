// Lớp FX 2.5D: nền tranh AI (backdrop) + hạt linh khí + trận pháp + thiên kiếp + xung kích.
// Giữ nguyên interface cũ để main.js không phải sửa.
import * as THREE from 'three';
import { buildBackdrop } from './backdrop.js';
import { buildParticles } from './particles.js';
import { buildTribulation } from './tribulation.js';
import { runeTexture } from './textures.js';

export const ELEMENT_COLORS = {
  kim: 0xd4af37,
  moc: 0x3fae6a,
  thuy: 0x3f9fe0,
  hoa: 0xe05a3c,
  tho: 0xa0805a,
};

export function buildWorld(rc) {
  const { scene, camera } = rc;
  const backdrop = buildBackdrop();

  const parts = buildParticles();
  parts.group.position.set(0, 0.6, 0);
  scene.add(parts.group);

  // Trận pháp rune phát sáng tại đài đá giữa tranh (đổi màu theo linh căn)
  const runeMat = new THREE.MeshBasicMaterial({
    map: runeTexture(256), color: 0xe05a3c, transparent: true, opacity: 0.32,
    depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const rune = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), runeMat);
  rune.rotation.x = -Math.PI / 2;
  rune.position.set(0, 0.9, 0);
  scene.add(rune);

  // Quầng hào quang quanh vị trí tu sĩ trong tranh
  const aura = new THREE.Sprite(new THREE.SpriteMaterial({
    map: runeMat.map, color: 0xe05a3c, transparent: true, opacity: 0.35,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  aura.scale.set(4.5, 4.5, 1);
  aura.position.set(0, 2.6, 0);
  scene.add(aura);

  const trib = buildTribulation(scene);

  // Vòng xung kích khi hạ yêu thú
  const shock = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.07, 8, 40),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0 })
  );
  shock.rotation.x = Math.PI / 2;
  shock.position.set(0, 2.2, 0);
  scene.add(shock);
  let shockT = 1;

  let t = 0;
  camera.position.set(0, 3.6, 13);
  camera.lookAt(0, 2.1, 0);

  return {
    setElement(el) {
      const c = ELEMENT_COLORS[el] ?? 0xe05a3c;
      parts.setColor(c);
      runeMat.color.set(c);
      aura.material.color.set(c);
    },
    // Đổi form nhân vật theo cảnh giới — trả về true nếu vừa lột xác
    setRealm(idx) {
      return backdrop.setRealm(idx);
    },
    setPreset(p) {
      parts.setCount(p.particles);
    },
    tribulationFx(success) {
      trib.strike(success);
    },
    combatFx() {
      shockT = 0;
    },
    update(dt, rate) {
      t += dt;
      backdrop.update(dt);
      parts.update(dt, t, rate);
      const sh = trib.update(dt);
      rune.rotation.z += dt * 0.12;
      runeMat.opacity = 0.26 + Math.sin(t * 2.2) * 0.07;
      aura.material.opacity = 0.2 + Math.sin(t * 1.4) * 0.06;

      if (shockT < 1) {
        shockT = Math.min(1, shockT + dt * 2.4);
        const sc = 1 + shockT * 4.5;
        shock.scale.set(sc, sc, sc);
        shock.material.opacity = 0.85 * (1 - shockT);
      } else {
        shock.material.opacity = 0;
      }

      // Camera đung đưa rất nhẹ + rung khi có sét
      const jx = () => (Math.random() - 0.5) * sh * 0.9;
      camera.position.set(Math.sin(t * 0.1) * 0.35 + jx(), 3.6 + Math.sin(t * 0.23) * 0.15 + jx(), 13);
      camera.lookAt(0, 2.1, 0);
      rc.render();
    },
  };
}
