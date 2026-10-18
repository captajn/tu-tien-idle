// Panel Đồng hành: linh thú, đạo lữ + chuyển thế.
import { companionBonus, companionCost, upgradeCompanion } from '../game/companions.js';
import { canRebirth, doRebirth, rebirthBonus } from '../game/rebirth.js';
import { fmtNum, el } from './format.js';

const ICONS = { pet: '🐾', partner: '🧚' };

function bonusText(c, lvl) {
  const parts = [];
  for (const [k, v] of Object.entries(c.bonusPerLevel)) {
    const pct = Math.round(v * lvl * 100);
    if (k === 'rate') parts.push(`+${pct}% linh khí`);
    else if (k === 'tuvi') parts.push(`+${pct}% tu vi`);
    else if (k === 'drop') parts.push(`+${pct}% rớt đồ`);
  }
  return parts.join(' · ') || '—';
}

export function createCompanionsPanel({ DATA, state, toast }) {
  const root = el('div', 'panel hidden');
  root.id = 'panel-comp';
  root.innerHTML = `
    <div class="panel-head"><b>Đồng hành</b><button class="btn small" data-close>Đóng</button></div>
    <div id="c-body"></div>
    <div class="sec-title">♻️ Binh giải chuyển thế</div>
    <div id="c-rebirth"></div>`;

  const q = (s) => root.querySelector(s);
  q('[data-close]').onclick = () => root.classList.add('hidden');

  function render() {
    const body = q('#c-body');
    body.innerHTML = '';
    for (const c of DATA.companions) {
      const lvl = state.companions[c.id] || 0;
      const locked = state.realmIdx < c.unlockRealm;
      const maxed = lvl >= c.maxLevel;
      const cost = maxed ? 0 : companionCost(c, lvl);
      const row = el('div', 'comp-card', `
        <span><b>${ICONS[c.type] || ''} ${c.name}</b> <small class="muted">cấp ${lvl}/${c.maxLevel}</small><br>
        <small class="muted">${c.hanzi} — ${c.desc}</small><br>
        <small>Hiệu quả: <b>${bonusText(c, Math.max(lvl, 1))}</b>${lvl === 0 ? ' (khi sở hữu)' : ''}</small></span>
        <button class="btn small gold" ${locked || maxed || (state.linhThach || 0) < cost ? 'disabled' : ''}>
          ${locked ? `🔒 ${DATA.realms[c.unlockRealm].name}` : maxed ? 'Max' : lvl === 0 ? `Thu phục (💎${fmtNum(cost)})` : `Nâng (💎${fmtNum(cost)})`}</button>`);
      if (!locked && !maxed) {
        row.querySelector('button').onclick = () => {
          const r = upgradeCompanion(state, DATA, c.id);
          toast(r.msg || (r.ok ? 'Đã nâng cấp!' : 'Thất bại.'));
          render();
        };
      }
      body.appendChild(row);
    }

    // Chuyển thế
    const rb = q('#c-rebirth');
    const n = state.rebirths || 0;
    if (canRebirth(state)) {
      rb.innerHTML = `<p class="muted small">Reset toàn bộ tu vi, cảnh giới, công pháp, bản đồ, túi đồ.<br>
        Giữ: thành tựu, đồng hành. Nhận <b class="gold-text">+50% linh khí vĩnh viễn</b> mỗi lần (hiện ×${rebirthBonus(state).toFixed(1)}).</p>
        <button class="btn gold big" id="rb-go">Binh giải chuyển thế</button>`;
      rb.querySelector('#rb-go').onclick = () => {
        if (doRebirth(state)) toast(`Chuyển thế lần ${n + 1}! Linh khí vĩnh viễn ×${rebirthBonus(state).toFixed(1)}.`);
        render();
      };
    } else {
      rb.innerHTML = `<p class="muted small">Đạt <b>Phi Thăng tầng 9</b> mới có thể binh giải chuyển thế.<br>
        Đã chuyển thế ${n} lần — bonus vĩnh viễn ×${rebirthBonus(state).toFixed(1)} linh khí.</p>`;
    }
  }

  return { root, render, update() {} };
}
