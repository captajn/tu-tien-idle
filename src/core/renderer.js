// Renderer + preset chất lượng (học inkwave: High/Medium/Low cho mobile yếu).
import * as THREE from 'three';

export const PRESETS = {
  high: { pr: 2, particles: 850, clouds: 9, label: 'Cao' },
  medium: { pr: 1.5, particles: 480, clouds: 6, label: 'Trung' },
  low: { pr: 1, particles: 220, clouds: 4, label: 'Thấp' },
};

export function createRenderer(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Điện ảnh hóa: tone mapping + bóng đổ mềm
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 600);

  // Mobile (cảm ứng) mặc định Low cho đỡ hao pin
  let presetName = window.matchMedia('(pointer: coarse)').matches ? 'low' : 'high';

  function apply() {
    const p = PRESETS[presetName];
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, p.pr));
  }
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  apply();

  return {
    renderer, scene, camera,
    presetName: () => presetName,
    setPreset(n) {
      if (PRESETS[n]) { presetName = n; apply(); }
      return PRESETS[presetName];
    },
    render() { renderer.render(scene, camera); },
  };
}
