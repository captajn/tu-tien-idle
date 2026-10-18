// Client bảng xếp hạng online.
// URL relay cấu hình qua localStorage['tutien-relay'] sau khi deploy server/.
// Chưa cấu hình hoặc mất mạng: các hàm throw, UI tự hiển thị "chưa triển khai".

export function relayUrl() {
  try { return localStorage.getItem('tutien-relay') || ''; } catch { return ''; }
}

export function setRelayUrl(url) {
  try { localStorage.setItem('tutien-relay', url); } catch { /* bỏ qua */ }
}

// Điểm xếp hạng: cảnh giới nặng nhất, rồi tầng, rồi số yêu thú hạ
export function powerOf(state) {
  return state.realmIdx * 1000 + state.layer * 100 + Math.floor((state.stats.kills || 0) / 10);
}

export async function submitScore(state) {
  const base = relayUrl();
  if (!base) throw new Error('no-relay');
  const res = await fetch(base.replace(/\/$/, '') + '/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: state.name,
      realm: state.realmIdx,
      layer: state.layer,
      power: powerOf(state),
    }),
  });
  if (!res.ok) throw new Error('http ' + res.status);
}

export async function fetchTop() {
  const base = relayUrl();
  if (!base) throw new Error('no-relay');
  const res = await fetch(base.replace(/\/$/, '') + '/top');
  if (!res.ok) throw new Error('http ' + res.status);
  return (await res.json()).top || [];
}
