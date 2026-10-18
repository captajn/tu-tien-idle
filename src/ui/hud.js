// UI 2D phủ trên scene 3D: HUD, panel công pháp, màn hình tạo nhân vật, toast.
import {
  linhKhiPerSec, layerCost, canBreakthrough, doBreakthrough,
  techUpgradeCost, learnableTechs, techniqueEffect, realmName, isMaxed,
} from '../game/cultivation.js';
import { saveState } from '../game/state.js';
import { fmtNum, fmtTime, el } from './format.js';
import { createBattlePanel } from './panel-battle.js';
import { createInventoryPanel } from './panel-inventory.js';
import { createQuestsPanel } from './panel-quests.js';
import { createCompanionsPanel } from './panel-companions.js';

export { fmtNum, fmtTime };

export const ELEMENTS = [
  { id: 'kim', name: 'Kim', color: '#d4af37', desc: 'Sắc bén, công pháp Kim hệ mạnh nhất' },
  { id: 'moc', name: 'Mộc', color: '#3fae6a', desc: 'Sinh cơ dồi dào, tu luyện ổn định' },
  { id: 'thuy', name: 'Thủy', color: '#3f9fe0', desc: 'Tâm tĩnh như nước, căn cơ sâu' },
  { id: 'hoa', name: 'Hỏa', color: '#e05a3c', desc: 'Tiến cảnh thần tốc, cương mãnh' },
  { id: 'tho', name: 'Thổ', color: '#a0805a', desc: 'Trầm ổn như núi, hậu tích bạc phát' },
];

export function elName(id) {
  const e = ELEMENTS.find((x) => x.id === id);
  return e ? e.name : id;
}

// ---- Màn hình tạo nhân vật ----
export function showCreation(onDone) {
  // Ẩn màn hình loading (#fade z-index 50 đè lên overlay tạo nhân vật z-index 40)
  const fade = document.getElementById('fade');
  if (fade) { fade.style.opacity = '0'; fade.style.pointerEvents = 'none'; }
  const ov = el('div', 'overlay');
  ov.innerHTML = `
    <div class="card">
      <div class="banner"></div>
      <h1>Nhập Môn</h1>
      <p class="sub">Con đường trường sinh bắt đầu từ một niệm.</p>
      <input id="ten" maxlength="12" placeholder="Danh hiệu của ngươi (vd: Vô Danh)" />
      <p class="label">Chọn linh căn</p>
      <div class="el-grid"></div>
      <button id="batdau" class="btn gold big" disabled>Bắt đầu tu luyện</button>
    </div>`;
  document.body.appendChild(ov);
  const grid = ov.querySelector('.el-grid');
  let chosen = null;
  for (const e of ELEMENTS) {
    const b = el('button', 'el-card', `<img class="el-icon" src="./assets/elements/${e.id}.png" alt="${e.name}"><b>${e.name}</b><small>${e.desc}</small>`);
    b.onclick = () => {
      chosen = e.id;
      grid.querySelectorAll('.el-card').forEach((x) => x.classList.remove('sel'));
      b.classList.add('sel');
      ov.querySelector('#batdau').disabled = false;
    };
    grid.appendChild(b);
  }
  ov.querySelector('#batdau').onclick = () => {
    const name = ov.querySelector('#ten').value.trim() || 'Vô Danh Tiểu Tu';
    ov.remove();
    onDone(chosen, name);
  };
}

// ---- HUD chính ----
export function createHUD({ DATA, state, world, audio, rc }) {
  const root = el('div', '', '');
  root.id = 'hud';
  root.innerHTML = `
    <div id="topbar">
      <div id="realm-badge"><b></b><small></small></div>
      <div id="tuvi-wrap"><div id="tuvi-bar"><div id="tuvi-fill"></div></div><span id="tuvi-text"></span></div>
      <div id="stats"><span id="stat-rate"></span><span id="stat-el"></span></div>
    </div>
    <div id="toast"></div>
    <button id="btn-bp" class="btn gold big"></button>
    <div id="toolbar">
      <button id="t-battle" class="btn">⚔️ Chiến đấu</button>
      <button id="t-inv" class="btn">🎒 Túi đồ</button>
      <button id="t-quest" class="btn">📜 Nhiệm vụ</button>
      <button id="t-comp" class="btn">🐾 Đồng hành</button>
      <button id="t-tech" class="btn">📖 Công pháp</button>
      <button id="t-sound" class="btn">🔈 Tắt</button>
      <button id="t-quality" class="btn"></button>
    </div>
    <div id="panel-tech" class="panel hidden"><div class="panel-head"><b>📖 Công pháp</b><button id="tech-close" class="btn small">Đóng</button></div><div id="tech-list"></div></div>
  `;
  document.body.appendChild(root);

  // Panels mới
  const battleP = createBattlePanel({ DATA, state });
  const invP = createInventoryPanel({ DATA, state, toast: (m) => toast(m) });
  const questP = createQuestsPanel({ DATA, state, toast: (m) => toast(m) });
  const compP = createCompanionsPanel({ DATA, state, toast: (m) => toast(m) });
  root.appendChild(battleP.root);
  root.appendChild(invP.root);
  root.appendChild(questP.root);
  root.appendChild(compP.root);

  const $ = (s) => root.querySelector(s);
  const toastBox = $('#toast');
  let toastTimer = 0;
  function toast(msg) {
    toastBox.textContent = msg;
    toastBox.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastBox.classList.remove('show'), 2600);
  }

  // Panel công pháp
  function renderTechs() {
    const list = $('#tech-list');
    list.innerHTML = '';
    for (const t of learnableTechs(state, DATA)) {
      const lvl = state.techs[t.id] || 0;
      const maxed = lvl >= t.maxLevel;
      const cost = maxed ? 0 : techUpgradeCost(t, lvl);
      const eff = techniqueEffect(t, Math.max(lvl, 1), state.linhCan);
      const match = t.element === state.linhCan;
      const card = el('div', 'tech-card', `
        <div class="tech-head"><img class="el-icon small" src="./assets/elements/${t.element}.png" alt="${elName(t.element)}">
        <b>${t.name}</b><small>${t.tierName} · ${elName(t.element)} hệ</small></div>
        <div class="tech-desc">${t.hanzi} — ${t.desc}${match ? '' : ' <i>(khắc hệ: hiệu quả 60%)</i>'}</div>
        <div class="tech-row"><span>Cấp ${lvl}/${t.maxLevel} · ×${eff.toFixed(2)} linh khí</span>
        <button class="btn small gold" ${maxed || state.tuVi < cost ? 'disabled' : ''}>${lvl === 0 ? 'Học' : 'Nâng cấp'}${maxed ? ' (max)' : ` (${fmtNum(cost)})`}</button></div>`);
      if (!maxed) {
        card.querySelector('button').onclick = () => {
          if (state.tuVi < cost) return;
          state.tuVi -= cost;
          state.techs[t.id] = lvl + 1;
          saveState(state);
          renderTechs();
          toast(`Đã ${lvl === 0 ? 'học' : 'nâng'} ${t.name} lên cấp ${lvl + 1}`);
        };
      }
      list.appendChild(card);
    }
  }

  // Quản lý panels: mở một, đóng còn lại
  const panels = {
    tech: $('#panel-tech'),
    battle: battleP.root,
    inv: invP.root,
    quest: questP.root,
    comp: compP.root,
  };
  const refreshers = {
    tech: renderTechs,
    battle: () => battleP.update(),
    inv: () => invP.render(),
    quest: () => questP.render(),
    comp: () => compP.render(),
  };
  function togglePanel(name) {
    const p = panels[name];
    const willShow = p.classList.contains('hidden');
    Object.values(panels).forEach((x) => x.classList.add('hidden'));
    if (willShow) {
      p.classList.remove('hidden');
      refreshers[name]();
    }
  }
  $('#t-tech').onclick = () => togglePanel('tech');
  $('#t-battle').onclick = () => togglePanel('battle');
  $('#t-inv').onclick = () => togglePanel('inv');
  $('#t-quest').onclick = () => togglePanel('quest');
  $('#t-comp').onclick = () => togglePanel('comp');
  $('#tech-close').onclick = () => $('#panel-tech').classList.add('hidden');
  $('#t-sound').onclick = (e) => {
    const on = audio.toggle();
    e.target.textContent = on ? '🔊 Bật' : '🔈 Tắt';
  };
  const qBtn = $('#t-quality');
  const syncQ = () => { qBtn.textContent = `Chất lượng: ${({ high: 'Cao', medium: 'Trung', low: 'Thấp' })[rc.presetName()]}`; };
  qBtn.onclick = () => {
    const order = ['low', 'medium', 'high'];
    const next = order[(order.indexOf(rc.presetName()) + 1) % 3];
    const p = rc.setPreset(next);
    world.setPreset(p);
    syncQ();
    toast(`Chất lượng đồ họa: ${p.label}`);
  };
  syncQ();

  $('#btn-bp').onclick = () => {
    const r = doBreakthrough(state, DATA);
    if (!r.ok) return;
    saveState(state);
    if (r.tribulation) {
      world.tribulationFx(!r.failed);
      if (r.failed) toast('Độ kiếp thất bại! Thiên lôi đánh tan một nửa tu vi.');
      else if (r.realmUp) toast(`Độ kiếp thành công! Chúc mừng lên ${realmName(DATA, state.realmIdx)}.`);
    } else {
      toast(`Đột phá thành công — ${realmName(DATA, state.realmIdx)} tầng ${state.layer}.`);
    }
    renderTechs();
  };

  // Cập nhật số liệu (throttle chữ, bar mượt mỗi frame)
  let acc = 1;
  function update(dt, rate) {
    const cost = layerCost(state);
    $('#tuvi-fill').style.width = `${Math.min(100, (state.tuVi / cost) * 100)}%`;
    acc += dt;
    if (acc < 0.25) return;
    acc = 0;
    const realm = DATA.realms[state.realmIdx];
    const badge = $('#realm-badge');
    badge.querySelector('b').textContent = `${state.name}`;
    badge.querySelector('b').style.color = realm.color;
    badge.querySelector('small').textContent = `${realm.name} · tầng ${state.layer}/9`;
    $('#tuvi-text').textContent = `${fmtNum(state.tuVi)} / ${fmtNum(cost)} tu vi`;
    $('#stat-rate').textContent = `⚡ ${fmtNum(rate)}/s`;
    $('#stat-el').textContent = `${elName(state.linhCan)} linh căn · 💎${fmtNum(state.linhThach || 0)}`;
    const bp = $('#btn-bp');
    if (isMaxed(state)) {
      bp.textContent = 'Đã Phi Thăng — vào Đồng hành để chuyển thế';
      bp.disabled = true;
    } else if (canBreakthrough(state)) {
      bp.textContent = state.layer === 9 ? `ĐỘ KIẾP — lên ${DATA.realms[Math.min(9, state.realmIdx + 1)].name}!` : `ĐỘT PHÁ — tầng ${state.layer + 1}`;
      bp.disabled = false;
    } else {
      bp.textContent = `Đột phá (${fmtNum(state.tuVi)}/${fmtNum(cost)})`;
      bp.disabled = true;
    }
    if (!panels.battle.classList.contains('hidden')) battleP.update();
  }

  return {
    update, toast, renderTechs,
    battleLog: (msg, cls) => battleP.log(msg, cls),
    setRank: (html) => battleP.setRank(html),
    onRankGo: (fn) => battleP.onRankGo(fn),
  };
}
