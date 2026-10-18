// Nhiệm vụ: chính tuyến / hằng ngày / thành tựu. Thuần logic.
import { addItem } from './items.js';

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Reset nhiệm vụ ngày khi sang ngày mới (giờ địa phương)
export function ensureDaily(state) {
  const t = todayStr();
  if (state.quests.dailyDate !== t) {
    state.quests.dailyDate = t;
    state.quests.daily = { prog: { login: 1 }, claimed: [] };
  }
}

// Tiến độ hiện tại của một nhiệm vụ; daily=true đọc prog ngày
export function questProgress(state, DATA, q, daily) {
  const s = state.stats || {};
  const prog = daily ? state.quests.daily.prog || {} : null;
  const get = (k, fb) => (daily ? prog[k] || 0 : fb);
  switch (q.need.type) {
    case 'realm': return state.realmIdx;
    case 'kills': return get('kills', s.kills || 0);
    case 'breakthroughs': return get('breakthroughs', s.breakthroughs || 0);
    case 'tribWins': return s.tribWins || 0;
    case 'rebirths': return state.rebirths || 0;
    case 'equipment': {
      const inv = Object.keys(state.inventory || {}).filter((id) => DATA.equipment.some((e) => e.id === id)).length;
      const worn = Object.values(state.equipment || {}).filter(Boolean).length;
      return inv + worn;
    }
    case 'login': return 1;
    case 'earnTuVi': return prog ? prog.earnTuVi || 0 : 0;
    default: return 0;
  }
}

export function isComplete(state, DATA, q, daily) {
  return questProgress(state, DATA, q, daily) >= q.need.count;
}

export function isClaimed(state, listName, id) {
  if (listName === 'daily') return (state.quests.daily.claimed || []).includes(id);
  const key = listName === 'main' ? 'claimedMain' : 'ach';
  return (state.quests[key] || []).includes(id);
}

export function applyReward(state, DATA, r) {
  state.tuVi += r.tuVi || 0;
  state.linhThach = (state.linhThach || 0) + (r.linhThach || 0);
  for (const [id, n] of Object.entries(r.items || {})) addItem(state, id, n);
}

export function claimQuest(state, DATA, listName, id) {
  ensureDaily(state);
  const q = (DATA.quests[listName] || []).find((x) => x.id === id);
  if (!q || isClaimed(state, listName, id)) return { ok: false };
  if (!isComplete(state, DATA, q, listName === 'daily')) return { ok: false };
  if (listName === 'daily') state.quests.daily.claimed.push(id);
  else state.quests[listName === 'main' ? 'claimedMain' : 'ach'].push(id);
  applyReward(state, DATA, q.reward);
  return { ok: true, reward: q.reward, name: q.name };
}
