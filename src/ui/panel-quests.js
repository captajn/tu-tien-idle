// Panel Nhiệm vụ: chính tuyến / hằng ngày / thành tựu.
import { ensureDaily, questProgress, isComplete, isClaimed, claimQuest } from '../game/quests.js';
import { fmtNum, el } from './format.js';

const SECTIONS = [
  { key: 'main', title: '📜 Chính tuyến' },
  { key: 'daily', title: '📅 Hằng ngày' },
  { key: 'achievements', title: '🏅 Thành tựu' },
];

export function createQuestsPanel({ DATA, state, toast }) {
  const root = el('div', 'panel hidden');
  root.id = 'panel-quest';
  root.innerHTML = `
    <div class="panel-head"><b>Nhiệm vụ</b><button class="btn small" data-close>Đóng</button></div>
    <div id="q-body"></div>`;

  const q = (s) => root.querySelector(s);
  q('[data-close]').onclick = () => root.classList.add('hidden');

  function rewardText(r) {
    const parts = [];
    if (r.tuVi) parts.push(`${fmtNum(r.tuVi)} tu vi`);
    if (r.linhThach) parts.push(`${fmtNum(r.linhThach)} linh thạch`);
    return parts.join(' + ');
  }

  function render() {
    ensureDaily(state);
    const body = q('#q-body');
    body.innerHTML = '';
    for (const sec of SECTIONS) {
      body.appendChild(el('div', 'sec-title', sec.title));
      const daily = sec.key === 'daily';
      for (const quest of DATA.quests[sec.key] || []) {
        const prog = questProgress(state, DATA, quest, daily);
        const done = isComplete(state, DATA, quest, daily);
        const claimed = isClaimed(state, sec.key, quest.id);
        const row = el('div', 'quest-row', `
          <span><b>${quest.name}</b><br>
          <small class="muted">${quest.desc} (${fmtNum(Math.min(prog, quest.need.count))}/${fmtNum(quest.need.count)})<br>
          Thưởng: ${rewardText(quest.reward)}</small></span>
          <button class="btn small ${done && !claimed ? 'gold' : ''}" ${done && !claimed ? '' : 'disabled'}>
            ${claimed ? 'Đã nhận' : done ? 'Nhận' : 'Chưa xong'}</button>`);
        if (done && !claimed) {
          row.querySelector('button').onclick = () => {
            const r = claimQuest(state, DATA, sec.key, quest.id);
            if (r.ok) toast(`Hoàn thành "${r.name}"!`);
            render();
          };
        }
        body.appendChild(row);
      }
    }
  }

  return { root, render, update() {} };
}
