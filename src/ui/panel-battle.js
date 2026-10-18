// Panel Chiến đấu: art bản đồ, thanh tiến trình ải, yêu thú, log + bảng xếp hạng.
import { enemyStats, playerStats, battleStatus } from '../game/battle.js';
import { fmtNum, el } from './format.js';

export function createBattlePanel({ DATA, state }) {
  const root = el('div', 'panel hidden');
  root.id = 'panel-battle';
  root.innerHTML = `
    <div class="panel-head"><b>⚔️ Chiến đấu</b><button class="btn small" data-close>Đóng</button></div>
    <div id="b-maps"></div>
    <div id="b-art"></div><div id="b-mapname"></div>
    <div id="b-track"><div id="b-trackbar"><div id="b-trackfill"></div></div><div id="b-pos"></div></div>
    <div class="enemy-card">
      <div class="e-head"><b id="b-ename"></b><span id="b-estage" class="muted"></span></div>
      <div class="hpbar"><div id="b-ehp"></div></div>
      <div class="p-line"><span id="b-patk"></span><span id="b-php"></span></div>
      <div class="hpbar thin"><div id="b-phpf"></div></div>
    </div>
    <div id="b-log" class="blog"></div>
    <div class="panel-head"><b>🏆 Bảng xếp hạng</b><button class="btn small" id="b-rankgo">Gửi điểm</button></div>
    <div id="b-rank" class="rank-list"><span class="muted">Máy chủ xếp hạng chưa triển khai.</span></div>`;

  const q = (s) => root.querySelector(s);
  q('[data-close]').onclick = () => {
    root.classList.add('hidden');
    document.querySelectorAll('#navbar .nav-btn').forEach((x) => x.classList.remove('on'));
  };

  // Dấu boss mỗi 10 ải
  const track = q('#b-track');
  for (let k = 1; k <= 10; k++) {
    const mk = el('div', 'b-bossmark', k % 10 === 0 ? '👹' : '💀');
    mk.style.left = `${k * 10}%`;
    mk.dataset.k = k;
    track.appendChild(mk);
  }

  let lastRealm = -1, lastMap = -1;
  function renderMaps() {
    const box = q('#b-maps');
    box.innerHTML = '';
    DATA.maps.forEach((m, i) => {
      const locked = state.realmIdx < m.realmReq;
      const b = el('button', 'map-chip' + (i === state.mapIdx ? ' cur' : ''),
        `<span class="hanzi">${m.hanzi}</span><b>${locked ? '🔒' : ''}${m.name}</b>`);
      b.disabled = locked;
      b.title = locked ? `Cần ${DATA.realms[m.realmReq].name}` : m.desc;
      b.onclick = () => { state.mapIdx = i; state.stage = 1; lastMap = -1; renderMaps(); };
      box.appendChild(b);
    });
    lastRealm = state.realmIdx;
  }
  renderMaps();

  const logs = [];
  function log(msg, cls) {
    logs.unshift({ msg, cls });
    if (logs.length > 8) logs.pop();
    q('#b-log').innerHTML = logs.map((l) => `<div class="bl ${l.cls || ''}">${l.msg}</div>`).join('');
  }
  log('Tự động chiến đấu. Mạnh lên bằng đột phá, công pháp và pháp bảo!');

  function update() {
    if (lastRealm !== state.realmIdx) renderMaps();
    const m = DATA.maps[state.mapIdx];
    if (lastMap !== state.mapIdx) {
      lastMap = state.mapIdx;
      q('#b-art').style.backgroundImage = `url('./assets/maps/${m.id}.jpg')`;
      q('#b-mapname').innerHTML = `<b>${m.name}</b><small>${m.hanzi} · ${m.desc}</small>`;
      renderMaps();
    }
    const pct = Math.min(100, (state.stage / m.stages) * 100);
    q('#b-trackfill').style.width = pct + '%';
    q('#b-pos').style.left = pct + '%';
    track.querySelectorAll('.b-bossmark').forEach((mk) => {
      mk.classList.toggle('done', state.stage > Number(mk.dataset.k) * 10);
    });
    const e = enemyStats(state, DATA);
    const p = playerStats(state, DATA);
    const st = battleStatus();
    q('#b-ename').textContent = (e.isBoss ? '👹 ' : '') + e.name;
    q('#b-estage').textContent = `ải ${state.stage}/${m.stages}`;
    q('#b-ehp').style.width = (st ? (st.hp / st.max) * 100 : 100) + '%';
    q('#b-patk').textContent = `⚔️ ${fmtNum(p.atk)}`;
    q('#b-php').textContent = `❤️ ${fmtNum(st ? st.php : p.hp)}/${fmtNum(p.hp)}`;
    q('#b-phpf').style.width = (st ? (st.php / st.pmax) * 100 : 100) + '%';
  }

  return {
    root, log, update,
    setRank(html) { q('#b-rank').innerHTML = html; },
    onRankGo(fn) { q('#b-rankgo').onclick = fn; },
  };
}
