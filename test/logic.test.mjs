// Test logic thuần bằng node: npm test
// Chạy được vì src/game/* không đụng DOM/three.js.
import { readFileSync } from 'node:fs';

// Stub localStorage cho môi trường node
globalThis.localStorage = {
  _m: new Map(),
  getItem(k) { return this._m.has(k) ? this._m.get(k) : null; },
  setItem(k, v) { this._m.set(k, String(v)); },
  removeItem(k) { this._m.delete(k); },
};

const { newState, saveState, loadState, applyOffline } = await import('../src/game/state.js');
const C = await import('../src/game/cultivation.js');

const DATA = {};
for (const f of ['realms', 'techniques', 'maps', 'items', 'equipment', 'quests', 'skills', 'companions', 'alchemy']) {
  DATA[f] = JSON.parse(readFileSync(new URL(`../data/${f}.json`, import.meta.url), 'utf8'));
}

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log('PASS', name); }
  else { fail++; console.log('FAIL', name); }
}

// 1. Tốc độ cơ bản
let s = newState('hoa', 'Test');
check('rate cơ bản = 1/s', C.linhKhiPerSec(s, DATA) === 1);

// 2. Học công pháp đúng hệ tăng tốc
s.techs['cuu-duong-than-cong'] = 1;
const t = C.techById(DATA, 'cuu-duong-than-cong');
check('công pháp hệ Hỏa + linh căn Hỏa > 1', C.linhKhiPerSec(s, DATA) > 1);
check('effect đúng hệ = base', C.techniqueEffect(t, 1, 'hoa') === t.base);
check('effect khắc hệ bị giảm', C.techniqueEffect(t, 1, 'thuy') < t.base);

// 3. Tick 1 giờ
const rate = C.linhKhiPerSec(s, DATA);
for (let i = 0; i < 3600; i++) s.tuVi += rate;
check('tick 3600s cộng đúng tu vi', Math.abs(s.tuVi - rate * 3600) < 1e-6);

// 4. Đột phá tầng thường (rng không quan trọng)
s.tuVi = C.layerCost(s) + 10;
const before = s.layer;
const r1 = C.doBreakthrough(s, DATA, () => 0.99);
check('đột phá tầng thường lên 1 tầng', r1.ok && s.layer === before + 1 && !r1.realmUp);

// 5. Độ kiếp thành công (rng=0 luôn qua)
s.layer = 9; s.realmIdx = 0; s.tuVi = C.layerCost(s);
const r2 = C.doBreakthrough(s, DATA, () => 0);
check('độ kiếp qua -> lên Trúc Cơ', r2.ok && r2.realmUp && s.realmIdx === 1 && s.layer === 1);

// 6. Độ kiếp thất bại (rng=0.99 luôn tạch)
s.layer = 9; s.realmIdx = 1; s.tuVi = C.layerCost(s) + 1000;
const tuViBefore = s.tuVi;
const r3 = C.doBreakthrough(s, DATA, () => 0.99);
check('độ kiếp tạch -> ở yên + mất tu vi', r3.ok && r3.failed && s.realmIdx === 1 && s.tuVi < tuViBefore);

// 7. Save/load roundtrip
s.techs['huyen-bang-quyet'] = 3;
saveState(s);
const s2 = loadState();
check('save/load giữ nguyên', s2 && s2.name === 'Test' && s2.techs['huyen-bang-quyet'] === 3);

// 8. Offline progress (giả lập lastSeen 2h trước)
s2.lastSeen = Date.now() - 2 * 3600 * 1000;
const tuVi0 = s2.tuVi;
const off = applyOffline(s2, (st) => C.linhKhiPerSec(st, DATA));
const expect = C.linhKhiPerSec(s2, DATA) * 2 * 3600 * 0.5;
check('offline 2h cộng 50% hiệu suất', Math.abs(off.gain - expect) < 1 && Math.abs(s2.tuVi - tuVi0 - expect) < 1);

// 9. Maxed state
const sm = newState('kim', 'Max'); sm.realmIdx = 9; sm.layer = 9;
check('Phi Thăng tầng 9 là max', C.isMaxed(sm) && !C.canBreakthrough(sm));

// 10. Data đầy đủ
check('10 cảnh giới', DATA.realms.length === 10);
check('có công pháp 5 hệ', ['kim', 'moc', 'thuy', 'hoa', 'tho'].every((el) => DATA.techniques.some((x) => x.element === el)));
check('9 bản đồ', DATA.maps.length === 9);

// ---- FULL GAME: battle / items / quests / companions / rebirth ----
const B = await import('../src/game/battle.js');
const I = await import('../src/game/items.js');
const Q = await import('../src/game/quests.js');
const CP = await import('../src/game/companions.js');
const R = await import('../src/game/rebirth.js');

// 11. Battle 120s: có kills, qua ải, rớt linh thạch
let sb = newState('hoa', 'War');
sb.techs['cuu-duong-than-cong'] = 3;
const kills0 = sb.stats.kills;
for (let i = 0; i < 120; i++) B.battleTick(sb, DATA, 1, () => 0.5);
check('battle 120s có hạ yêu thú', sb.stats.kills > kills0);
check('battle tiến ải', sb.stage > 1 || sb.mapIdx > 0);
check('battle rớt linh thạch', (sb.linhThach || 0) > 0);

// 12. Defeat: địch quá mạnh thì thua, đứng yên ải
let sd = newState('hoa', 'Weak');
sd.mapIdx = 5; sd.stage = 50;
const evts = [];
for (let i = 0; i < 60; i++) evts.push(...B.battleTick(sd, DATA, 1, () => 0.99));
check('đánh không lại thì thua', evts.some((e) => e.type === 'defeat'));
check('thua thì đứng yên ải', sd.stage === 50 && sd.mapIdx === 5);

// 13. Boss ải 10 rớt pháp bảo
let se = newState('kim', 'Boss');
se.techs['canh-kim-kiem-dien'] = 9;
se.stage = 10;
for (let i = 0; i < 600 && se.stage === 10; i++) B.battleTick(se, DATA, 1, () => 0.01);
const hasSword = (se.inventory['thanh-phong-kiem'] || 0) > 0 || Object.values(se.equipment).includes('thanh-phong-kiem');
check('hạ boss ải 10 rớt Thanh Phong Kiếm', hasSword && se.stage === 11);

// 14. Mặc pháp bảo tăng công
const p0 = B.playerStats(se, DATA).atk;
if (!se.equipment['vu-khi']) I.equipItem(se, DATA, 'thanh-phong-kiem');
const p1 = B.playerStats(se, DATA).atk;
check('mặc pháp bảo tăng công', p1 > p0 && se.equipment['vu-khi'] === 'thanh-phong-kiem');

// 15. Luyện đan + dùng đan buff
let sc = newState('thuy', 'Dan');
sc.linhThao = 10; sc.linhThach = 100;
const cr = I.craft(sc, DATA, 'tu-linh-dan');
check('luyện đan thành công', cr.ok && sc.inventory['tu-linh-dan'] === 1);
const rateBefore = C.linhKhiPerSec(sc, DATA);
const ur = I.useItem(sc, DATA, 'tu-linh-dan');
check('dùng Tụ Linh Đan có buff', ur.ok && sc.buffs.tuLinhUntil > Date.now());
check('buff tăng 50% linh khí', Math.abs(C.linhKhiPerSec(sc, DATA) - rateBefore * 1.5) < 1e-6);

// 16. Nhiệm vụ chính tuyến nhận 1 lần
let sq = newState('moc', 'Nv');
sq.realmIdx = 1;
const cl = Q.claimQuest(sq, DATA, 'main', 'nv-truc-co');
check('nhận nhiệm vụ chính tuyến', cl.ok && sq.tuVi >= 500 && sq.linhThach >= 150);
check('không nhận 2 lần', !Q.claimQuest(sq, DATA, 'main', 'nv-truc-co').ok);

// 17. Đồng hành tăng tốc độ
let sp = newState('hoa', 'Pet');
sp.linhThach = 1000;
const up = CP.upgradeCompanion(sp, DATA, 'hoa-van-ho');
check('thu phục linh thú', up.ok && sp.companions['hoa-van-ho'] === 1);
check('linh thú tăng linh khí', C.linhKhiPerSec(sp, DATA) > 1);

// 18. Chuyển thế
let sr = newState('kim', 'Re');
sr.realmIdx = 9; sr.layer = 9; sr.techs = { 'canh-kim-kiem-dien': 5 };
check('đủ điều kiện chuyển thế', R.canRebirth(sr));
R.doRebirth(sr);
check('chuyển thế reset về Luyện Khí', sr.realmIdx === 0 && sr.layer === 1 && sr.rebirths === 1);
check('chuyển thế +50% vĩnh viễn', Math.abs(C.linhKhiPerSec(sr, DATA) - 1.5) < 1e-6);

// 19. Migrate save v1 -> v2
localStorage.setItem('tutien-idle-save-v1', JSON.stringify({ v: 1, name: 'Cu', linhCan: 'hoa', tuVi: 123, realmIdx: 0, layer: 2, techs: {}, lastSeen: Date.now() }));
const sm2 = loadState();
check('migrate v1->v2 giữ tu vi', sm2 && sm2.v === 2 && sm2.tuVi === 123 && sm2.mapIdx === 0 && Array.isArray(sm2.quests.claimedMain));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
