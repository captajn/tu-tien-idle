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

// ---- HUD chuẩn game: topbar avatar + tài nguyên, nav dưới, nút đột phá/độ kiếp ----
export function createHUD({ DATA, state, world, audio, rc }) {
  state.flags = state.flags || {};
  const root = el('div', '', '');
  root.id = 'hud';
  root.innerHTML = `
    <div id="topbar">
      <div id="avatar"><img id="avatar-el" src="./assets/elements/${state.linhCan}.png" alt="linh căn">
        <div><b></b><small></small></div></div>
      <div id="tuvi-wrap"><div id="tuvi-bar"><div id="tuvi-fill"></div></div><span id="tuvi-text"></span></div>
      <div id="currencies"><span class="cur" id="c-rate"></span><span class="cur" id="c-stone"></span></div>
    </div>
    <div id="settings">
      <button class="icon-btn" id="t-sound" title="Âm thanh">🔊</button>
      <button class="icon-btn" id="t-quality" title="Chất lượng">✨</button>
    </div>
    <div id="toast"></div>
    <button id="btn-bp"></button>
    <nav id="navbar">
      <button class="nav-btn" id="nav-battle"><span class="nav-ic"><img src="./assets/icons/battle.webp" alt="Chiến đấu"></span><span>Chiến đấu</span></button>
      <button class="nav-btn" id="nav-tech"><span class="nav-ic"><img src="./assets/icons/tech.webp" alt="Công pháp"></span><span>Công pháp</span></button>
      <button class="nav-btn" id="nav-inv"><span class="nav-ic"><img src="./assets/icons/inv.webp" alt="Túi đồ"></span><span>Túi đồ</span></button>
      <button class="nav-btn" id="nav-quest"><span class="nav-ic"><img src="./assets/icons/quest.webp" alt="Nhiệm vụ"></span><span>Nhiệm vụ</span></button>
      <button class="nav-btn" id="nav-comp"><span class="nav-ic"><img src="./assets/icons/comp.webp" alt="Đồng hành"></span><span>Đồng hành</span></button>
    </nav>
    <div id="panel-tech" class="panel hidden"><div class="panel-head"><b>📖 Công pháp</b><button id="tech-close" class="btn small">Đóng</button></div><div id="tech-list"></div></div>
    <div id="trib-cine" class="hidden">
      <div class="trib-title">⚡ THIÊN KIẾP GIÁNG XUỐNG ⚡</div>
      <div class="trib-sub"></div>
      <div id="trib-result" class="hidden"></div>
    </div>
    <div id="tutorial" class="hidden"><div class="tut-card">
      <h3 id="tut-title"></h3><p id="tut-text"></p>
      <div class="tut-dots" id="tut-dots"></div>
      <div class="tut-row"><button class="btn small" id="tut-skip">Bỏ qua</button><button class="btn gold" id="tut-next">Tiếp theo</button></div>
    </div></div>
  `;
  document.body.appendChild(root);

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

  // Quản lý panels + nav active
  const panels = {
    tech: $('#panel-tech'),
    battle: battleP.root,
    inv: invP.root,
    quest: questP.root,
    comp: compP.root,
  };
  const navBtns = {
    tech: $('#nav-tech'),
    battle: $('#nav-battle'),
    inv: $('#nav-inv'),
    quest: $('#nav-quest'),
    comp: $('#nav-comp'),
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
    Object.values(navBtns).forEach((x) => x.classList.remove('on'));
    if (willShow) {
      p.classList.remove('hidden');
      navBtns[name].classList.add('on');
      refreshers[name]();
    }
  }
  for (const [name, btn] of Object.entries(navBtns)) btn.onclick = () => togglePanel(name);
  $('#tech-close').onclick = () => { $('#panel-tech').classList.add('hidden'); navBtns.tech.classList.remove('on'); };
  $('#t-sound').onclick = (e) => {
    const on = audio.toggle();
    e.target.textContent = on ? '🔊' : '🔇';
  };
  const qBtn = $('#t-quality');
  const qLabels = { high: '✨', medium: '🌤️', low: '🌥️' };
  const syncQ = () => { qBtn.textContent = qLabels[rc.presetName()] || '✨'; };
  qBtn.onclick = () => {
    const order = ['low', 'medium', 'high'];
    const next = order[(order.indexOf(rc.presetName()) + 1) % 3];
    const p = rc.setPreset(next);
    world.setPreset(p);
    syncQ();
    toast(`Chất lượng đồ họa: ${p.label}`);
  };
  syncQ();

  // ---- Cinematic độ kiếp: tính năng riêng với animation nhiều nhịp ----
  let cinematic = false;
  function runTribulationCine(r) {
    cinematic = true;
    const cine = $('#trib-cine');
    const res = $('#trib-result');
    res.className = 'hidden';
    cine.classList.remove('hidden');
    requestAnimationFrame(() => cine.classList.add('show'));
    const targetRealm = DATA.realms[Math.min(9, state.realmIdx)].name;
    cine.querySelector('.trib-sub').innerHTML =
      `Lôi kiếp <b class="gold-text">${targetRealm}</b> · tỉ lệ vượt qua <b class="trib-odds">${Math.round((r.chance || 0.65) * 100)}%</b>`;
    const strikeOnce = () => {
      world.tribulationFx(!r.failed);
      document.body.classList.add('trib-flash');
      setTimeout(() => document.body.classList.remove('trib-flash'), 380);
    };
    strikeOnce();
    const s2 = setTimeout(strikeOnce, 2100);
    setTimeout(() => {
      clearTimeout(s2);
      res.className = r.failed ? 'lose' : 'win';
      res.innerHTML = r.failed
        ? `ĐỘ KIẾP THẤT BẠI<small>Thiên lôi đánh tan một nửa tu vi.<br>Nâng công pháp, dùng Trúc Cơ Đan rồi thử lại!</small>`
        : `ĐỘ KIẾP THÀNH CÔNG<small>Chúc mừng tiến vào ${targetRealm}!</small>`;
      if (!r.failed) world.combatFx();
      setTimeout(() => {
        cine.classList.remove('show');
        setTimeout(() => cine.classList.add('hidden'), 600);
        cinematic = false;
        renderTechs();
      }, 2400);
    }, 3800);
  }

  $('#btn-bp').onclick = () => {
    if (cinematic) return;
    const r = doBreakthrough(state, DATA);
    if (!r.ok) return;
    saveState(state);
    if (r.tribulation) {
      runTribulationCine(r);
    } else {
      toast(`Đột phá thành công — ${realmName(DATA, state.realmIdx)} tầng ${state.layer}.`);
    }
    renderTechs();
  };

  // ---- Hướng dẫn tân thủ ----
  const TUT_STEPS = [
    { sel: '#tuvi-wrap', title: 'Tu Vi', text: 'Tu vi tự tăng theo thời gian, kể cả khi thoát game (tối đa 8 giờ). Đầy thanh là có thể đột phá.' },
    { sel: '#btn-bp', title: 'Đột Phá', text: 'Bấm nút vàng để đột phá tầng mới. Mỗi 9 tầng sẽ độ kiếp lên đại cảnh giới — có tỉ lệ thất bại, hãy chuẩn bị kỹ!' },
    { sel: '#nav-tech', title: 'Công Pháp', text: 'Học và nâng cấp công pháp để tăng tốc độ tu luyện. Công pháp đúng hệ linh căn đạt hiệu quả 100%.' },
    { sel: '#nav-battle', title: 'Chiến Đấu', text: 'Tự động đánh quái qua ải theo bản đồ. Hạ Boss mỗi 10 ải để rớt pháp bảo tăng sức mạnh.' },
    { sel: '#nav-quest', title: 'Nhiệm Vụ', text: 'Hoàn thành nhiệm vụ chính tuyến, hằng ngày và thành tựu để nhận thưởng lớn. Đừng bỏ lỡ!' },
  ];
  function startTutorial() {
    const tut = $('#tutorial');
    let i = 0;
    const show = () => {
      root.querySelectorAll('.tut-hl').forEach((x) => x.classList.remove('tut-hl'));
      const s = TUT_STEPS[i];
      $('#tut-title').textContent = `${i + 1}. ${s.title}`;
      $('#tut-text').textContent = s.text;
      $('#tut-dots').innerHTML = TUT_STEPS.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
      $('#tut-next').textContent = i === TUT_STEPS.length - 1 ? 'Bắt đầu tu tiên!' : 'Tiếp theo';
      const target = root.querySelector(s.sel);
      if (target) target.classList.add('tut-hl');
      tut.classList.remove('hidden');
    };
    const done = () => {
      tut.classList.add('hidden');
      root.querySelectorAll('.tut-hl').forEach((x) => x.classList.remove('tut-hl'));
      state.flags.tutorialDone = true;
      saveState(state);
    };
    $('#tut-next').onclick = () => { i += 1; if (i >= TUT_STEPS.length) done(); else show(); };
    $('#tut-skip').onclick = done;
    show();
  }

  // Cập nhật số liệu
  let acc = 1;
  function update(dt, rate) {
    const cost = layerCost(state);
    $('#tuvi-fill').style.width = `${Math.min(100, (state.tuVi / cost) * 100)}%`;
    acc += dt;
    if (acc < 0.25) return;
    acc = 0;
    const realm = DATA.realms[state.realmIdx];
    $('#avatar b').textContent = state.name;
    const avSmall = $('#avatar small');
    avSmall.textContent = `${realm.name} · tầng ${state.layer}/9`;
    avSmall.style.color = realm.color;
    $('#tuvi-text').textContent = `${fmtNum(state.tuVi)} / ${fmtNum(cost)} tu vi`;
    $('#c-rate').textContent = `⚡${fmtNum(rate)}/s`;
    $('#c-stone').textContent = `💎${fmtNum(state.linhThach || 0)}`;
    const bp = $('#btn-bp');
    if (isMaxed(state)) {
      bp.textContent = 'ĐÃ PHI THĂNG';
      bp.disabled = true;
      bp.classList.remove('trib');
    } else if (canBreakthrough(state)) {
      bp.disabled = false;
      if (state.layer === 9) {
        bp.textContent = `⚡ ĐỘ KIẾP — ${DATA.realms[Math.min(9, state.realmIdx + 1)].name}`;
        bp.classList.add('trib');
      } else {
        bp.textContent = `ĐỘT PHÁ — TẦNG ${state.layer + 1}`;
        bp.classList.remove('trib');
      }
    } else {
      bp.textContent = `${fmtNum(state.tuVi)}/${fmtNum(cost)}`;
      bp.disabled = true;
      bp.classList.remove('trib');
    }
    if (!panels.battle.classList.contains('hidden')) battleP.update();
  }

  return {
    update, toast, renderTechs, startTutorial,
    battleLog: (msg, cls) => battleP.log(msg, cls),
    setRank: (html) => battleP.setRank(html),
    onRankGo: (fn) => battleP.onRankGo(fn),
  };
}
