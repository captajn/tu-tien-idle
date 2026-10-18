// Âm thanh ambient procedural bằng WebAudio: drone trầm + chuông ngũ cung + gió.
// Không tải file nhạc nào. Bật sau gesture đầu tiên (chính sách autoplay).
export function createAudio() {
  let ctx = null, master = null, on = false;

  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // Drone trầm: 2 sine lệch pha qua lowpass
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 220;
    const dg = ctx.createGain(); dg.gain.value = 0.05;
    for (const f of [55, 55.7]) {
      const o = ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = f;
      o.connect(lp); o.start();
    }
    lp.connect(dg); dg.connect(master);

    // Gió: noise loop qua bandpass
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const ns = ctx.createBufferSource();
    ns.buffer = buf; ns.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 480; bp.Q.value = 0.6;
    const ng = ctx.createGain(); ng.gain.value = 0.014;
    ns.connect(bp); bp.connect(ng); ng.connect(master);
    ns.start();

    // Chuông ngũ cung ngẫu nhiên
    const scale = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3];
    const chime = () => {
      if (on && ctx) {
        const t0 = ctx.currentTime;
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = scale[Math.floor(Math.random() * scale.length)];
        const eg = ctx.createGain();
        eg.gain.setValueAtTime(0.0001, t0);
        eg.gain.exponentialRampToValueAtTime(0.11, t0 + 0.06);
        eg.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.2);
        o.connect(eg); eg.connect(master);
        o.start(t0); o.stop(t0 + 3.4);
      }
      setTimeout(chime, 7000 + Math.random() * 9000);
    };
    setTimeout(chime, 2500);
  }

  return {
    unlock() {
      ensure();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    },
    toggle() {
      ensure();
      if (!ctx) return false;
      on = !on;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(on ? 0.85 : 0, ctx.currentTime + 0.8);
      return on;
    },
    get enabled() { return on; },
  };
}
