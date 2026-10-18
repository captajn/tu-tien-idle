// Bầu trời: ngày/đêm theo giờ thực, biển mây, sao, mặt trời/mặt trăng.
import * as THREE from 'three';
import { radialTexture, cloudTexture } from './textures.js';

const KEYS = [
  { h: 0,  bg: 0x070b1a, fog: 0x070b1a, hemi: 0x2a3a5f, sun: 0x8fa8ff, sunI: 0.25, hemiI: 0.4,  star: 1 },
  { h: 5,  bg: 0x0a1024, fog: 0x0a1024, hemi: 0x35406a, sun: 0x9fb0ff, sunI: 0.3,  hemiI: 0.45, star: 0.8 },
  { h: 7,  bg: 0xe0b58f, fog: 0xe0b58f, hemi: 0xffe2b8, sun: 0xffd9a0, sunI: 0.9,  hemiI: 0.7,  star: 0 },
  { h: 12, bg: 0xbdd9e8, fog: 0xbdd9e8, hemi: 0xeaf4ff, sun: 0xfff4e0, sunI: 1.25, hemiI: 0.95, star: 0 },
  { h: 17, bg: 0xe8a87e, fog: 0xe8a87e, hemi: 0xffc890, sun: 0xffb070, sunI: 0.85, hemiI: 0.65, star: 0 },
  { h: 19, bg: 0x1a2340, fog: 0x1a2340, hemi: 0x4a5480, sun: 0xa0a8ff, sunI: 0.3,  hemiI: 0.45, star: 0.6 },
  { h: 24, bg: 0x070b1a, fog: 0x070b1a, hemi: 0x2a3a5f, sun: 0x8fa8ff, sunI: 0.25, hemiI: 0.4,  star: 1 },
];

function sampleKeys(h) {
  let a = KEYS[0], b = KEYS[KEYS.length - 1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (h >= KEYS[i].h && h <= KEYS[i + 1].h) { a = KEYS[i]; b = KEYS[i + 1]; break; }
  }
  const f = (h - a.h) / Math.max(1e-6, b.h - a.h);
  const mix = (x, y) => new THREE.Color(x).lerp(new THREE.Color(y), f);
  return {
    bg: mix(a.bg, b.bg), fog: mix(a.fog, b.fog), hemi: mix(a.hemi, b.hemi), sun: mix(a.sun, b.sun),
    sunI: a.sunI + (b.sunI - a.sunI) * f,
    hemiI: a.hemiI + (b.hemiI - a.hemiI) * f,
    star: a.star + (b.star - a.star) * f,
  };
}

export function buildSky(scene) {
  scene.background = new THREE.Color(0x070b1a);
  scene.fog = new THREE.Fog(0x070b1a, 48, 175);

  const hemi = new THREE.HemisphereLight(0x2a3a5f, 0x141a28, 0.4);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 0.3);
  sun.position.set(60, 80, -40);
  scene.add(sun);

  // Sao
  const starGeo = new THREE.BufferGeometry();
  const sp = new Float32Array(360 * 3);
  for (let i = 0; i < 360; i++) {
    const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * 0.48;
    const r = 230;
    sp[i * 3] = Math.cos(th) * Math.cos(ph) * r;
    sp[i * 3 + 1] = Math.sin(ph) * r + 12;
    sp[i * 3 + 2] = Math.sin(th) * Math.cos(ph) * r;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.7, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false });
  scene.add(new THREE.Points(starGeo, starMat));

  // Mặt trời / mặt trăng (sprite phát sáng)
  const glowTex = radialTexture(128);
  const sunSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffe9a8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  sunSpr.scale.set(34, 34, 1);
  scene.add(sunSpr);
  const moonSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xcfe0ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  moonSpr.scale.set(16, 16, 1);
  scene.add(moonSpr);

  // Biển mây
  const cloudTex = cloudTexture(false);
  let clouds = [];
  function setClouds(n) {
    for (const m of clouds) { scene.remove(m); m.geometry.dispose(); m.material.dispose(); }
    clouds = [];
    for (let i = 0; i < n; i++) {
      const mat = new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, depthWrite: false, opacity: 0.85 });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(150, 70), mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set((Math.random() - 0.5) * 150, -15 + Math.random() * 5, (Math.random() - 0.5) * 150);
      m.userData.speed = 0.4 + Math.random() * 0.7;
      scene.add(m);
      clouds.push(m);
    }
  }
  setClouds(6);

  const now = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };

  return {
    setClouds,
    update(dt) {
      const k = sampleKeys(now());
      scene.background.copy(k.bg);
      scene.fog.color.copy(k.fog);
      hemi.color.copy(k.hemi);
      hemi.intensity = k.hemiI;
      sun.color.copy(k.sun);
      sun.intensity = k.sunI;
      starMat.opacity = k.star * 0.9;

      const ang = ((now() - 6) / 12) * Math.PI; // mọc 6h, lặn 18h
      const sx = Math.cos(ang) * 150, sy = Math.sin(ang) * 115 + 6;
      sun.position.set(sx, Math.max(sy, 4), -70);
      sunSpr.position.set(sx, sy, -75);
      sunSpr.material.opacity = sy > 0 ? 0.95 : 0;
      const mang = ang + Math.PI;
      const mx = Math.cos(mang) * 150, my = Math.sin(mang) * 115 + 6;
      moonSpr.position.set(mx, my, -75);
      moonSpr.material.opacity = my > 0 ? 0.85 : 0;

      for (const m of clouds) {
        m.position.x += m.userData.speed * dt;
        if (m.position.x > 95) m.position.x = -95;
      }
    },
  };
}
