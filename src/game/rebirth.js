// Binh giải chuyển thế (prestige): reset để nhận bonus vĩnh viễn. Thuần logic.
export function rebirthBonus(state) {
  return 1 + (state.rebirths || 0) * 0.5;
}

export function canRebirth(state) {
  return state.realmIdx >= 9 && state.layer >= 9;
}

export function doRebirth(state) {
  if (!canRebirth(state)) return false;
  const keep = {
    name: state.name,
    linhCan: state.linhCan,
    rebirths: (state.rebirths || 0) + 1,
    achievements: state.quests ? state.quests.ach : [],
    companions: state.companions || {},
    stats: state.stats || { kills: 0, breakthroughs: 0, tribWins: 0 },
  };
  const fresh = {
    v: 2,
    tuVi: 0, realmIdx: 0, layer: 1, techs: {},
    linhThach: 0, linhThao: 0, mapIdx: 0, stage: 1,
    inventory: {},
    equipment: { 'vu-khi': null, 'phap-y': null, 'phu-kien': null },
    buffs: {},
    quests: { claimedMain: [], ach: keep.achievements, dailyDate: '', daily: { prog: {}, claimed: [] } },
    lastSeen: Date.now(),
  };
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, keep, fresh);
  return true;
}
