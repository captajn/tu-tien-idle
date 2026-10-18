// Tu sĩ ngồi thiền — procedural, áo choàng đổi màu theo linh căn.
import * as THREE from 'three';

export function buildCultivator() {
  const g = new THREE.Group();
  const robeMat = new THREE.MeshStandardMaterial({ color: 0xe05a3a, roughness: 0.9, flatShading: true });
  const robeDark = new THREE.MeshStandardMaterial({ color: 0x9a3a24, roughness: 0.9, flatShading: true });
  const skin = new THREE.MeshStandardMaterial({ color: 0xf2cf9f, roughness: 0.7 });
  const hairM = new THREE.MeshStandardMaterial({ color: 0x1c1a20, roughness: 0.85 });

  // Chân xếp bằng (vòng)
  const legs = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.24, 8, 16), robeDark);
  legs.rotation.x = Math.PI / 2;
  legs.position.y = 0.3;
  // Áo choàng (nón)
  const robe = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.7, 8), robeMat);
  robe.position.y = 0.95;
  // Thân
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.5, 4, 10), robeMat);
  torso.position.y = 1.62;
  // Tay đặt trên đùi
  const armGeo = new THREE.CapsuleGeometry(0.11, 0.55, 4, 8);
  const armL = new THREE.Mesh(armGeo, robeMat);
  armL.position.set(-0.44, 1.32, 0.18); armL.rotation.set(0.95, 0, 0.55);
  const armR = new THREE.Mesh(armGeo, robeMat);
  armR.position.set(0.44, 1.32, 0.18); armR.rotation.set(0.95, 0, -0.55);
  // Đầu + búi tóc
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), skin);
  head.position.y = 2.32;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.31, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.3), hairM);
  hair.position.y = 2.36;
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), hairM);
  knot.position.y = 2.68;

  // Vòng sáng dưới chân (bồ đoàn phát quang)
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.045, 8, 40),
    new THREE.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.85 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;

  // Hào quang quanh người
  const glow = new THREE.PointLight(0xff9a3c, 10, 11, 2);
  glow.position.y = 1.7;

  g.add(legs, robe, torso, armL, armR, head, hair, knot, ring, glow);
  g.position.set(0, 1.42, 0.8); // ngồi trên bồ đoàn

  return {
    group: g,
    setElement(hex) {
      robeMat.color.set(hex);
      robeDark.color.set(hex).multiplyScalar(0.65);
      glow.color.set(hex);
    },
    update(dt, t, rate) {
      // "Hô hấp" tu luyện: phập phồng theo tốc độ linh khí
      const br = 1 + Math.sin(t * (1.1 + Math.min(rate * 0.02, 1.2))) * 0.022;
      robe.scale.set(br, 1, br);
      g.position.y = 1.42 + Math.sin(t * 1.15) * 0.07;
      g.rotation.y = Math.sin(t * 0.3) * 0.05;
      ring.material.opacity = 0.6 + Math.sin(t * 2.2) * 0.25;
    },
  };
}
