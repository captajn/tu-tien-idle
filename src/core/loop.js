// Vòng lặp game: rAF render + tự dừng khi tab ẩn (tiết kiệm pin).
// Game logic dùng timestamp nên tab ẩn mở lại vẫn tính đúng.

export function startLoop({ update }) {
  let last = performance.now();
  let raf = 0;
  let running = true;

  const frame = (now) => {
    if (!running) return;
    let dt = (now - last) / 1000;
    last = now;
    dt = Math.min(dt, 5); // tab ngủ đông lâu: không nhảy vọt
    update(dt);
    raf = requestAnimationFrame(frame);
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  });

  raf = requestAnimationFrame(frame);
  return () => { running = false; cancelAnimationFrame(raf); };
}
