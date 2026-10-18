// Format + helper DOM dùng chung cho UI.
export function fmtNum(n) {
  if (!isFinite(n)) return '∞';
  if (n < 1000) return Math.floor(n).toString();
  const units = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  for (const [v, s] of units) if (n >= v) return (n / v).toFixed(1) + s;
  return Math.floor(n).toString();
}

export function fmtTime(sec) {
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h} giờ ${m} phút`;
  if (m > 0) return `${m} phút`;
  return `${sec} giây`;
}

export function el(tag, cls, html) {
  const d = document.createElement(tag);
  if (cls) d.className = cls;
  if (html !== undefined) d.innerHTML = html;
  return d;
}
