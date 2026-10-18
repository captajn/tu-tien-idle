// Panel Túi đồ: tiền tệ, pháp bảo đang mặc, vật phẩm, luyện đan.
import { equipBonus, equipItem, unequipItem, useItem, craft, itemById, itemName } from '../game/items.js';
import { fmtNum, el } from './format.js';

const SLOTS = { 'vu-khi': 'Vũ khí', 'phap-y': 'Pháp y', 'phu-kien': 'Phụ kiện' };

export function createInventoryPanel({ DATA, state, toast }) {
  const root = el('div', 'panel hidden');
  root.id = 'panel-inv';
  root.innerHTML = `
    <div class="panel-head"><b>🎒 Túi đồ</b><button class="btn small" data-close>Đóng</button></div>
    <div id="v-currencies" class="currencies"></div>
    <div class="sec-title">Pháp bảo đang mặc</div>
    <div id="v-slots"></div>
    <div class="sec-title">Vật phẩm</div>
    <div id="v-items"></div>
    <div class="sec-title">Luyện đan</div>
    <div id="v-alchemy"></div>`;

  const q = (s) => root.querySelector(s);
  q('[data-close]').onclick = () => root.classList.add('hidden');

  function statLine(e) {
    const parts = [];
    if (e.atk) parts.push(`+${e.atk} công`);
    if (e.hp) parts.push(`+${fmtNum(e.hp)} máu`);
    if (e.rate) parts.push(`+${Math.round(e.rate * 100)}% linh khí`);
    return parts.join(' · ');
  }

  function render() {
    q('#v-currencies').innerHTML =
      `<span>💎 Linh thạch: <b>${fmtNum(state.linhThach || 0)}</b></span><span>🌿 Linh thảo: <b>${fmtNum(state.linhThao || 0)}</b></span>`;

    // Slots
    const slots = q('#v-slots');
    slots.innerHTML = '';
    for (const [slot, label] of Object.entries(SLOTS)) {
      const id = state.equipment[slot];
      const e = id ? DATA.equipment.find((x) => x.id === id) : null;
      const row = el('div', 'slot-row', `
        <span class="slot-label">${label}</span>
        <span>${e ? `<b>${e.name}</b> <small class="muted">${statLine(e)}</small>` : '<span class="muted">— trống —</span>'}</span>
        ${e ? '<button class="btn small">Tháo</button>' : ''}`);
      if (e) row.querySelector('button').onclick = () => { unequipItem(state, slot); render(); };
      slots.appendChild(row);
    }

    // Items
    const box = q('#v-items');
    box.innerHTML = '';
    const ids = Object.keys(state.inventory || {});
    if (!ids.length) box.innerHTML = '<span class="muted">Trống rỗng. Đi đánh yêu thú kiếm đồ đi!</span>';
    for (const id of ids) {
      const n = state.inventory[id];
      const def = itemById(DATA, id);
      if (!def) continue;
      const isEq = DATA.equipment.some((e) => e.id === id);
      const isDan = def.type === 'dan-duoc';
      const row = el('div', 'inv-row', `
        <span><b>${def.name}</b> ×${n}<br><small class="muted">${def.desc || ''}</small></span>
        ${isEq ? '<button class="btn small gold">Mặc</button>' : isDan ? '<button class="btn small gold">Dùng</button>' : ''}`);
      const btn = row.querySelector('button');
      if (btn) {
        btn.onclick = () => {
          if (isEq) { equipItem(state, DATA, id); toast(`Đã mặc ${def.name}.`); }
          else { const r = useItem(state, DATA, id); toast(r.msg); }
          render();
        };
      }
      box.appendChild(row);
    }

    // Alchemy
    const al = q('#v-alchemy');
    al.innerHTML = '';
    for (const r of DATA.alchemy) {
      const can = (state.linhThao || 0) >= r.cost.linhThao && (state.linhThach || 0) >= r.cost.linhThach;
      const row = el('div', 'inv-row', `
        <span><b>${itemName(DATA, r.output)}</b><br>
        <small class="muted">${r.desc}<br>Giá: 🌿${r.cost.linhThao} + 💎${r.cost.linhThach}</small></span>
        <button class="btn small gold" ${can ? '' : 'disabled'}>Luyện</button>`);
      row.querySelector('button').onclick = () => { const res = craft(state, DATA, r.output); toast(res.msg); render(); };
      al.appendChild(row);
    }
  }

  return { root, render, update() {} };
}
