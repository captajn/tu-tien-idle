// Vật phẩm, trang bị, luyện đan, buff đan dược. Thuần logic.
export function itemById(DATA, id) {
  return DATA.items.find((i) => i.id === id) || DATA.equipment.find((e) => e.id === id);
}

export function itemName(DATA, id) {
  const d = itemById(DATA, id);
  return d ? d.name : id;
}

export function addItem(state, id, n = 1) {
  state.inventory[id] = (state.inventory[id] || 0) + n;
}

// Tổng chỉ số từ pháp bảo đang mặc
export function equipBonus(state, DATA) {
  const b = { atk: 0, hp: 0, rate: 0 };
  for (const itemId of Object.values(state.equipment || {})) {
    if (!itemId) continue;
    const e = DATA.equipment.find((x) => x.id === itemId);
    if (!e) continue;
    b.atk += e.atk || 0;
    b.hp += e.hp || 0;
    b.rate += e.rate || 0;
  }
  return b;
}

export function ownsEquipment(state, id) {
  return (state.inventory[id] || 0) > 0 || Object.values(state.equipment || {}).includes(id);
}

export function equipItem(state, DATA, itemId) {
  const e = DATA.equipment.find((x) => x.id === itemId);
  if (!e || (state.inventory[itemId] || 0) < 1) return false;
  const old = state.equipment[e.slot];
  if (old) addItem(state, old, 1);
  state.inventory[itemId]--;
  if (state.inventory[itemId] <= 0) delete state.inventory[itemId];
  state.equipment[e.slot] = itemId;
  return true;
}

export function unequipItem(state, slot) {
  const old = state.equipment[slot];
  if (!old) return false;
  addItem(state, old, 1);
  state.equipment[slot] = null;
  return true;
}

// Dùng đan dược
export function useItem(state, DATA, id) {
  const def = DATA.items.find((i) => i.id === id);
  if (!def || (state.inventory[id] || 0) < 1) return { ok: false };
  const eff = def.effect || {};
  state.inventory[id]--;
  if (state.inventory[id] <= 0) delete state.inventory[id];
  const now = Date.now();
  if (eff.linhKhi) {
    state.buffs.tuLinhUntil = Math.max(state.buffs.tuLinhUntil || 0, now) + eff.giay * 1000;
    return { ok: true, msg: 'Tụ Linh Đan: +50% linh khí trong 1 giờ!' };
  }
  if (eff.doKiep) {
    state.buffs.doKiepBoost = true;
    return { ok: true, msg: 'Trúc Cơ Đan: lần độ kiếp tới +15% tỉ lệ!' };
  }
  if (eff.baoHo) {
    state.buffs.baoHo = true;
    return { ok: true, msg: 'Độ Ách Đan: được bảo hộ khỏi thiên kiếp một lần!' };
  }
  return { ok: true, msg: `Đã dùng ${def.name}.` };
}

// Luyện đan theo công thức data/alchemy.json
export function craft(state, DATA, outputId) {
  const r = DATA.alchemy.find((x) => x.output === outputId);
  if (!r) return { ok: false, msg: 'Không có đan phương.' };
  if ((state.linhThao || 0) < r.cost.linhThao || (state.linhThach || 0) < r.cost.linhThach) {
    return { ok: false, msg: 'Thiếu nguyên liệu.' };
  }
  state.linhThao -= r.cost.linhThao;
  state.linhThach -= r.cost.linhThach;
  addItem(state, outputId, r.count);
  return { ok: true, msg: `Luyện thành ${r.count} viên ${itemName(DATA, outputId)}!` };
}

export function buffRateMult(state) {
  return state.buffs && state.buffs.tuLinhUntil > Date.now() ? 1.5 : 1;
}
