// Auto-battle theo ải: đánh yêu thú, nhặt đồ, qua map. Thuần logic.
// Trạng thái trận hiện tại (cur) chỉ nằm runtime, load game là đánh lại từ đầu ải.
import { equipBonus, addItem, ownsEquipment } from './items.js';
import { companionBonus } from './companions.js';

export function enemyPower(state) {
  return state.mapIdx * 100 + state.stage;
}

export function enemyStats(state, DATA) {
  const m = state.mapIdx, s = state.stage;
  const map = DATA.maps[m];
  const isBoss = s % 10 === 0;
  return {
    name: isBoss ? map.bossName : `${map.mobName} · ải ${s}`,
    hp: Math.floor(30 * Math.pow(1.9, m) * Math.pow(1.02, s) * (isBoss ? 4 : 1)),
    atk: Math.floor(3.2 * Math.pow(1.75, m) * Math.pow(1.012, s) * (isBoss ? 1.7 : 1)),
    isBoss,
  };
}

// Sức mạnh người chơi từ cảnh giới + công pháp + pháp bảo.
// Thiết kế: boss cuối map là tường — cần đầu tư công pháp mới qua được.
export function playerStats(state, DATA) {
  const eq = equipBonus(state, DATA);
  let techMult = 1;
  for (const lvl of Object.values(state.techs || {})) techMult *= Math.pow(1.1, lvl);
  const atk = Math.max(1, Math.floor(11 * Math.pow(1.95, state.realmIdx) * techMult + eq.atk));
  const hp = Math.max(10, Math.floor(105 * Math.pow(1.95, state.realmIdx) + eq.hp));
  return { atk, hp };
}

let cur = null;
export function battleKey(state) {
  return `${state.mapIdx}-${state.stage}`;
}

export function battleStatus() {
  if (!cur) return null;
  return { hp: Math.max(0, cur.hp), max: cur.max, php: Math.max(0, cur.php), pmax: cur.pmax };
}

function rollDrops(state, DATA, isBoss, rng) {
  const drops = [];
  const cb = companionBonus(state, DATA);
  const dropMult = 1 + (cb.drop || 0);
  const map = DATA.maps[state.mapIdx];
  const give = (id, n) => { addItem(state, id, n); drops.push({ id, n }); };

  if (rng() < 0.18 * dropMult) give('linh-thao', 1 + Math.floor(rng() * 3));
  if (!isBoss && rng() < 0.04 * dropMult) give('tu-linh-dan', 1);
  if (isBoss) {
    // Pháp bảo boss: chưa có thì rớt, có rồi thì quy ra linh thạch
    const eqId = map.bossDrop;
    if (eqId && !ownsEquipment(state, eqId)) {
      give(eqId, 1);
    } else {
      const bonus = Math.floor(50 * Math.pow(1.25, enemyPower(state)));
      state.linhThach = (state.linhThach || 0) + bonus;
      drops.push({ id: 'linh-thach', n: bonus });
    }
    if (rng() < 0.35) give(rng() < 0.5 ? 'tu-linh-dan' : 'hoi-xuan-dan', 1);
  }
  return drops;
}

export function battleTick(state, DATA, dt, rng = Math.random) {
  const events = [];
  const e = enemyStats(state, DATA);
  const p = playerStats(state, DATA);
  const key = battleKey(state);
  if (!cur || cur.key !== key || cur.pmax !== p.hp) {
    cur = { key, hp: e.hp, max: e.hp, php: p.hp, pmax: p.hp };
  }
  cur.hp -= p.atk * dt;
  cur.php -= e.atk * dt;

  // Hồi Xuân Đan tự dùng khi nguy cấp
  if (cur.php < cur.pmax * 0.3 && cur.php > 0 && (state.inventory['hoi-xuan-dan'] || 0) > 0) {
    state.inventory['hoi-xuan-dan']--;
    if (state.inventory['hoi-xuan-dan'] <= 0) delete state.inventory['hoi-xuan-dan'];
    cur.php = Math.min(cur.pmax, cur.php + cur.pmax * 0.5);
    events.push({ type: 'heal' });
  }

  if (cur.php <= 0 && cur.hp > 0) {
    cur.php = cur.pmax;
    events.push({ type: 'defeat', enemy: e.name });
    return events;
  }

  if (cur.hp <= 0) {
    const pw = enemyPower(state);
    const cb = companionBonus(state, DATA);
    const tuviGain = Math.floor(9 * Math.pow(1.28, pw) * (e.isBoss ? 5 : 1) * (1 + (cb.tuvi || 0)));
    const ltGain = Math.floor(2 * Math.pow(1.22, pw) * (e.isBoss ? 4 : 1));
    state.tuVi += tuviGain;
    state.linhThach = (state.linhThach || 0) + ltGain;
    state.stats.kills = (state.stats.kills || 0) + 1;
    state.quests.daily.prog.kills = (state.quests.daily.prog.kills || 0) + 1;
    const drops = rollDrops(state, DATA, e.isBoss, rng);
    events.push({ type: e.isBoss ? 'bossKill' : 'kill', enemy: e.name, tuviGain, ltGain, drops });

    const map = DATA.maps[state.mapIdx];
    if (state.stage >= map.stages) {
      const nm = DATA.maps[state.mapIdx + 1];
      if (nm && state.realmIdx >= nm.realmReq) {
        state.mapIdx++;
        state.stage = 1;
        events.push({ type: 'mapUp', map: nm.name });
      } else {
        state.stage = 1; // chưa đủ cảnh giới: farm lại boss cuối
      }
    } else {
      state.stage++;
    }
    cur = null;
  }
  return events;
}
