// Linh thú & đạo lữ đồng hành. Thuần logic.
export function companionBonus(state, DATA) {
  const b = { rate: 0, tuvi: 0, drop: 0 };
  for (const [id, lvl] of Object.entries(state.companions || {})) {
    if (lvl <= 0) continue;
    const c = DATA.companions.find((x) => x.id === id);
    if (!c) continue;
    for (const [k, v] of Object.entries(c.bonusPerLevel)) {
      b[k] = (b[k] || 0) + v * lvl;
    }
  }
  return b;
}

export function companionCost(c, lvl) {
  return Math.floor(c.costBase * Math.pow(1.8, lvl));
}

export function upgradeCompanion(state, DATA, id) {
  const c = DATA.companions.find((x) => x.id === id);
  if (!c) return { ok: false };
  if (state.realmIdx < c.unlockRealm) return { ok: false, msg: 'Chưa mở.' };
  const lvl = state.companions[id] || 0;
  if (lvl >= c.maxLevel) return { ok: false, msg: 'Đã max.' };
  const cost = companionCost(c, lvl);
  if ((state.linhThach || 0) < cost) return { ok: false, msg: 'Thiếu linh thạch.' };
  state.linhThach -= cost;
  state.companions[id] = lvl + 1;
  return { ok: true, msg: `${c.name} lên cấp ${lvl + 1}!` };
}
