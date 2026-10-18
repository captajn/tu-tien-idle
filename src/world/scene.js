// Ghép toàn bộ world 3D: trời + đảo + tu sĩ + linh khí + thiên kiếp.
import * as THREE from 'three';
import { buildSky } from './sky.js';
import { buildIsland } from './island.js';
import { buildCultivator } from './cultivator.js';
import { buildParticles } from './particles.js';
import { buildTribulation } from './tribulation.js';

export const ELEMENT_COLORS = {
  kim: 0xd4af37,
  moc: 0x3fae6a,
  thuy: 0x3f9fe0,
  hoa: 0xe05a3c,
  tho: 0xa0805a,
};

export function buildWorld(rc) {
  const { scene, camera } = rc;
  const sky = buildSky(scene);
  const island = buildIsland();
  scene.add(island.group);
  const cult = buildCultivator();
  scene.add(cult.group);
  const parts = buildParticles();
  scene.add(parts.group);
  const trib = buildTribulation(scene);

  // Vòng xung kích khi hạ yêu thú
  const shock = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.07, 8, 40),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0 })
  );
  shock.rotation.x = Math.PI / 2;
  shock.position.set(0, 1.7, 0.8);
  scene.add(shock);
  let shockT = 1;

  let t = 0;
  camera.position.set(13.4, 8.6, 13.4);
  camera.lookAt(0, 2.6, 0);

  return {
    setElement(el) {
      const c = ELEMENT_COLORS[el] ?? 0xe05a3c;
      cult.setElement(c);
      parts.setColor(c);
    },
    setPreset(p) {
      // p = { particles, clouds } từ core/renderer PRESETS
      parts.setCount(p.particles);
      sky.setClouds(p.clouds);
    },
    tribulationFx(success) {
      trib.strike(success);
    },
    combatFx() {
      shockT = 0; // phát vòng xung kích vàng
    },
    update(dt, rate) {
      t += dt;
      island.update(dt, t);
      cult.update(dt, t, rate);
      parts.update(dt, t, rate);
      sky.update(dt);
      const sh = trib.update(dt);

      if (shockT < 1) {
        shockT = Math.min(1, shockT + dt * 2.4);
        const sc = 1 + shockT * 4.5;
        shock.scale.set(sc, sc, sc);
        shock.material.opacity = 0.85 * (1 - shockT);
      } else {
        shock.material.opacity = 0;
      }

      // Camera quay chậm quanh đảo + rung khi có sét
      const a = t * 0.045, r = 19;
      const jx = () => (Math.random() - 0.5) * sh * 1.1;
      camera.position.set(Math.cos(a) * r + jx(), 8.6 + Math.sin(t * 0.13) * 0.5 + jx(), Math.sin(a) * r + jx());
      camera.lookAt(0, 2.6, 0);
      rc.render();
    },
  };
}
