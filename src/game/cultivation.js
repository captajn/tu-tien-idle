// Thuần logic tu tiên — KHÔNG dùng DOM/three.js để test được bằng node.
// Mọi hàm nhận (state, DATA); DATA = { realms, techniques, ... } từ data/*.json
import { equipBonus, buffRateMult } from './items.js';
import { companionBonus } from './companions.js';
import { rebirthBonus } from './rebirth.js';

export const BASE_RATE = 1; // linh khí/s cơ bản

const TIER_MULT = { hoang: 1, huyen: 3, dia: 9, thien: 27, tien: 81 };

export function techById(DATA, id) {
  return DATA.techniques.find((t) => t.id === id);
}

// Hệ số của một công pháp ở cấp lvl với linh căn của người chơi.
// Đúng hệ linh căn phát huy 100%, khắc hệ chỉ còn 60% phần bonus.
export function techniqueEffect(tech, lvl, linhCan) {
  if (!tech || lvl <= 0) return 1;
  const raw = tech.base + tech.perLevel * (lvl - 1);
  if (tech.element === linhCan) return raw;
  return 1 + (raw - 1) * 0.6;
}

export function techMult(state, DATA) {
  let m = 1;
  for (const [id, lvl] of Object.entries(state.techs || {})) {
    m *= techniqueEffect(techById(DATA, id), lvl, state.linhCan);
  }
  return m;
}

export function linhKhiPerSec(state, DATA) {
  const eq = equipBonus(state, DATA);
  const cb = companionBonus(state, DATA);
  return (
    BASE_RATE *
    Math.pow(2, state.realmIdx) *
    techMult(state, DATA) *
    (1 + eq.rate + (cb.rate || 0)) *
    rebirthBonus(state) *
    buffRateMult(state)
  );
}

// Tu vi cần để đột phá tầng hiện tại (tăng theo hàm mũ cho kịp lạm phát thu nhập).
export function layerCost(state) {
  return Math.floor(50 * Math.pow(3.2, state.realmIdx) * Math.pow(1.35, state.layer));
}

export function isMaxed(state) {
  return state.realmIdx >= 9 && state.layer >= 9;
}

export function canBreakthrough(state) {
  return !isMaxed(state) && state.tuVi >= layerCost(state);
}

// Đột phá. Tầng thường: an toàn. Tầng 9 -> cảnh giới mới: độ kiếp có tỉ lệ tạch.
// rng: hàm random, inject để test (mặc định Math.random).
export function doBreakthrough(state, DATA, rng = Math.random) {
  if (isMaxed(state)) return { ok: false, reason: 'maxed' };
  const cost = layerCost(state);
  if (state.tuVi < cost) return { ok: false, reason: 'poor' };
  state.tuVi -= cost;
  state.stats.breakthroughs = (state.stats.breakthroughs || 0) + 1;
  if (state.quests && state.quests.daily && state.quests.daily.prog) {
    state.quests.daily.prog.breakthroughs = (state.quests.daily.prog.breakthroughs || 0) + 1;
  }

  if (state.layer < 9) {
    state.layer += 1;
    return { ok: true, realmUp: false };
  }
  // Độ kiếp lên đại cảnh giới
  const techLevels = Object.values(state.techs || {}).reduce((a, b) => a + b, 0);
  let chance = Math.min(0.95, 0.65 + techLevels * 0.02);
  if (state.buffs && state.buffs.doKiepBoost) {
    chance = Math.min(0.99, chance + 0.15);
    state.buffs.doKiepBoost = false; // Trúc Cơ Đan: dùng một lần
  }
  if (rng() < chance) {
    state.realmIdx = Math.min(9, state.realmIdx + 1);
    state.layer = 1;
    state.stats.tribWins = (state.stats.tribWins || 0) + 1;
    return { ok: true, realmUp: true, tribulation: true, chance };
  }
  if (state.buffs && state.buffs.baoHo) {
    state.buffs.baoHo = false; // Độ Ách Đan: miễn tổn thất một lần
  } else {
    state.tuVi = Math.floor(state.tuVi * 0.5); // tạch: mất nửa tu vi còn lại
  }
  return { ok: true, realmUp: false, tribulation: true, failed: true, chance };
}

export function techUpgradeCost(tech, lvl) {
  const tm = TIER_MULT[tech.tier] ?? 1;
  return Math.floor(25 * tm * Math.pow(2.2, lvl));
}

// Công pháp có thể học ở cảnh giới hiện tại (kể cả chưa học, lvl 0).
export function learnableTechs(state, DATA) {
  return DATA.techniques.filter((t) => (t.unlockRealm ?? 0) <= state.realmIdx);
}

export function realmName(DATA, idx) {
  return DATA.realms[idx] ? DATA.realms[idx].name : 'Vô Danh';
}
