import { loadData } from './game/data.js';
import { newState, loadState, saveState, applyOffline, setSaveUser } from './game/state.js';
import { linhKhiPerSec } from './game/cultivation.js';
import { battleTick } from './game/battle.js';
import { ensureDaily } from './game/quests.js';
import { itemName } from './game/items.js';
import { submitScore, fetchTop, powerOf, relayUrl } from './net/leaderboard.js';

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
import { createRenderer } from './core/renderer.js';
import { startLoop } from './core/loop.js';
import { buildWorld } from './world/scene.js';
import { showCreation, createHUD, fmtNum, fmtTime } from './ui/hud.js';
import { showAuth } from './ui/auth.js';
import { createAudio } from './audio/ambient.js';

function bootError(err) {
  console.error(err);
  const box = document.getElementById('boot-error');
  box.style.display = 'block';
  box.textContent = 'Lỗi khởi động: ' + (err && err.message ? err.message : err);
}

async function boot() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const setLoad = (pct, status) => {
    const bar = document.getElementById('loadbar');
    const st = document.getElementById('loadstatus');
    if (bar) bar.style.width = pct + '%';
    if (st && status) st.textContent = status;
  };
  // Mẹo xoay vòng lúc loading
  const TIPS = [
    '<b>Mẹo:</b> công pháp đúng hệ linh căn đạt hiệu quả 100%.',
    'Mỗi 10 ải có <b>Boss</b> — hạ Boss rớt pháp bảo.',
    '<b>Trúc Cơ Đan</b> tăng 15% tỉ lệ vượt thiên kiếp.',
    '<b>Độ Ách Đan</b> miễn tổn thất khi độ kiếp thất bại.',
    'Tu vi vẫn tăng khi thoát game <b>(tối đa 8 giờ)</b>.',
    'Nhiệm vụ hằng ngày <b>reset lúc 5h sáng</b>.',
  ];
  const tipEl = document.getElementById('loadtip');
  if (tipEl) tipEl.innerHTML = TIPS[0];
  let tipI = 0;
  const tipTimer = setInterval(() => {
    const t = document.getElementById('loadtip');
    if (!t) { clearInterval(tipTimer); return; }
    tipI = (tipI + 1) % TIPS.length;
    t.innerHTML = TIPS[tipI];
  }, 2200);

  setLoad(12, 'Đang tải dữ liệu tu tiên…');
  const DATA = await loadData();
  setLoad(42, 'Đang dựng tiên cảnh…');
  const rc = createRenderer(document.getElementById('app'));
  const world = buildWorld(rc);
  world.setPreset(rc.setPreset(rc.presetName()));
  const audio = createAudio();
  setLoad(78, 'Đang dẫn khí nhập thể…');
  await sleep(800);
  setLoad(100, 'Hoàn tất!');
  await sleep(450);
  clearInterval(tipTimer);

  // Màn hình tài khoản (frontend-only, backend sau)
  showAuth((user) => {
    setSaveUser(user.name);
    let state = loadState();
    if (state) {
      const off = applyOffline(state, (s) => linhKhiPerSec(s, DATA));
      startGame(state, off.gain > 1 ? off : null);
    } else {
      showCreation((linhCan, name) => {
        audio.unlock();
        const s = newState(linhCan, name);
        saveState(s);
        startGame(s, null);
      });
    }
  });

  function startGame(s, off) {
    world.setElement(s.linhCan);
    const hud = createHUD({ DATA, state: s, world, audio, rc });
    if (off) {
      hud.toast(`Offline ${fmtTime(off.seconds)}: +${fmtNum(off.gain)} tu vi`);
    }
    // Tân thủ chưa xem hướng dẫn: hiện sau 1.2s
    if (!s.flags.tutorialDone) setTimeout(() => hud.startTutorial(), 1200);
    // Bảng xếp hạng online (best-effort)
    hud.onRankGo(async () => {
      if (!relayUrl()) {
        hud.setRank('<span class="muted">Chưa cấu hình relay. Xem server/README.md để deploy.</span>');
        return;
      }
      try {
        await submitScore(s);
        const top = await fetchTop();
        hud.setRank(
          top.map((t, i) => `
            <div class="rank-row ${t.name === s.name ? 'me' : ''}">
              <span>${i + 1}. ${esc(t.name)}</span>
              <span>${esc(DATA.realms[t.realm] ? DATA.realms[t.realm].name : '')} ${t.layer} · ${fmtNum(t.power)}</span>
            </div>`).join('') || '<span class="muted">Chưa có ai trên bảng.</span>'
        );
        hud.toast('Đã gửi điểm lên bảng xếp hạng!');
      } catch (e) {
        hud.setRank('<span class="muted">Không kết nối được máy chủ xếp hạng.</span>');
      }
    });

    // Mở màn
    const fade = document.getElementById('fade');
    fade.style.opacity = '0';
    fade.style.pointerEvents = 'none';

    let saveT = 0;
    startLoop({
      update(dt) {
        const rate = linhKhiPerSec(s, DATA);
        s.tuVi += rate * dt;
        ensureDaily(s);
        s.quests.daily.prog.earnTuVi = (s.quests.daily.prog.earnTuVi || 0) + rate * dt;

        // Auto-battle
        for (const ev of battleTick(s, DATA, dt)) {
          if (ev.type === 'kill') {
            hud.battleLog(`Hạ ${ev.enemy} <span class="muted">+${fmtNum(ev.tuviGain)} tu vi</span>`);
            world.combatFx();
          } else if (ev.type === 'bossKill') {
            world.combatFx();
            hud.battleLog(`👹 <b>Hạ Boss ${ev.enemy}!</b>`, 'boss');
            for (const d of ev.drops) {
              hud.battleLog(`&nbsp;&nbsp;✨ Nhận: <b>${itemName(DATA, d.id)}</b>${d.n > 1 ? ' ×' + d.n : ''}`, 'drop');
            }
            hud.toast(`Hạ Boss ${ev.enemy}!`);
          } else if (ev.type === 'defeat') {
            hud.battleLog(`Thua ${ev.enemy} — điều tức hồi phục…`, 'bad');
          } else if (ev.type === 'heal') {
            hud.battleLog('Tự dùng Hồi Xuân Đan!');
          } else if (ev.type === 'mapUp') {
            hud.toast(`Mở bản đồ mới: ${ev.map}!`);
            hud.battleLog(`🗺️ Tiến vào <b>${ev.map}</b>!`, 'boss');
          }
        }

        world.update(dt, rate);
        hud.update(dt, rate);
        // Đổi form nhân vật khi lên nhóm cảnh giới mới
        if (world.setRealm(s.realmIdx)) {
          hud.toast('🎆 Tiên thể lột xác — diện mạo mới!');
        }
        saveT += dt;
        if (saveT > 10) { saveT = 0; saveState(s); }
      },
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) saveState(s);
    });
  }
}

window.addEventListener('error', (e) => { if (!document.getElementById('hud')) bootError(e.message || e.error); });
boot().catch(bootError);
