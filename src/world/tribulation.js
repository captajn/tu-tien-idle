// Thiên kiếp: mây đen kéo tới + sấm sét đánh xuống + rung màn hình.
import * as THREE from 'three';
import { cloudTexture } from './textures.js';

export function buildTribulation(scene) {
  const group = new THREE.Group();
  group.visible = false;
  const darkTex = cloudTexture(true);
  const clouds = [];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 15),
      new THREE.MeshBasicMaterial({ map: darkTex, transparent: true, depthWrite: false, opacity: 0.95 })
    );
    const a = (i / 6) * Math.PI * 2;
    m.position.set(Math.cos(a) * 14, 17 + Math.random() * 3, Math.sin(a) * 14);
    m.rotation.y = -a + Math.PI / 2;
    group.add(m);
    clouds.push(m);
  }
  scene.add(group);

  const flash = new THREE.PointLight(0xcfe4ff, 0, 70, 1.4);
  flash.position.set(0, 15, 0);
  scene.add(flash);

  let bolts = [];
  let shake = 0;
  let active = false;

  function addBolt() {
    const pts = [];
    let x = (Math.random() - 0.5) * 10, y = 18, z = (Math.random() - 0.5) * 10;
    pts.push(new THREE.Vector3(x, y, z));
    for (let i = 0; i < 8; i++) {
      x += (Math.random() - 0.5) * 3.2;
      z += (Math.random() - 0.5) * 3.2;
      y -= 2.1;
      pts.push(new THREE.Vector3(x, Math.max(y, 1.4), z));
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0xd8ecff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending })
    );
    scene.add(line);
    bolts.push({ line, life: 0.16 });
  }

  // success=true: sét đánh trúng đỉnh đầu rồi tan; false: sét đánh trượt xung quanh
  function strike(success) {
    if (active) return;
    active = true;
    group.visible = true;
    const n = success ? 4 : 6;
    for (let k = 0; k < n; k++) {
      setTimeout(() => {
        if (!active) return;
        addBolt();
        flash.intensity = 500;
        shake = 1;
        setTimeout(() => { flash.intensity = 0; }, 140);
      }, 200 + k * 220);
    }
    setTimeout(() => {
      active = false;
      group.visible = false;
      for (const b of bolts) { scene.remove(b.line); b.line.geometry.dispose(); b.line.material.dispose(); }
      bolts = [];
    }, 200 + n * 220 + 500);
  }

  return {
    strike,
    update(dt) {
      for (const c of clouds) c.rotation.z += dt * 0.05;
      for (let i = bolts.length - 1; i >= 0; i--) {
        bolts[i].life -= dt;
        bolts[i].line.material.opacity = Math.max(0, bolts[i].life / 0.16);
        if (bolts[i].life <= 0) {
          scene.remove(bolts[i].line);
          bolts[i].line.geometry.dispose();
          bolts[i].line.material.dispose();
          bolts.splice(i, 1);
        }
      }
      shake = Math.max(0, shake - dt * 2.2);
      return shake;
    },
  };
}
