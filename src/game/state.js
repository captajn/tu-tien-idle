// Save/load + offline progress + migrate save cũ. Không import module khác.

const KEY = 'tutien-idle-save-v1';
const V = 2;
const OFFLINE_CAP = 8 * 3600; // tối đa 8h offline
const OFFLINE_EFF = 0.5; // hiệu suất offline 50%

// Tài khoản hiện tại (null = khách). Mỗi tài khoản một save riêng.
let saveUser = null;
export function setSaveUser(name) { saveUser = name || null; }
function key() { return saveUser ? `${KEY}:${saveUser}` : KEY; }

function defaults() {
  return {
    v: V,
    linhThach: 0,
    linhThao: 0,
    mapIdx: 0,
    stage: 1,
    inventory: {},
    equipment: { 'vu-khi': null, 'phap-y': null, 'phu-kien': null },
    buffs: {},
    companions: {},
    quests: { claimedMain: [], ach: [], dailyDate: '', daily: { prog: {}, claimed: [] } },
    rebirths: 0,
    stats: { kills: 0, breakthroughs: 0, tribWins: 0 },
  };
}

export function newState(linhCan, name) {
  return {
    name: name || 'Vô Danh Tiểu Tu',
    linhCan, // 'kim' | 'moc' | 'thuy' | 'hoa' | 'tho'
    tuVi: 0,
    realmIdx: 0,
    layer: 1,
    techs: {}, // { techId: level }
    lastSeen: Date.now(),
    ...defaults(),
  };
}

function migrate(s) {
  if (!s || typeof s !== 'object') return null;
  if (s.v === 1) {
    // save bản đầu: giữ nguyên field cũ, thêm field mới
    Object.assign(s, defaults(), { v: V });
  }
  if (s.v !== V) return null;
  const d = defaults();
  for (const k of Object.keys(d)) {
    if (s[k] === undefined) s[k] = d[k];
  }
  return s;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(key());
    if (!raw) return null;
    return migrate(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveState(s) {
  try {
    s.lastSeen = Date.now();
    localStorage.setItem(key(), JSON.stringify(s));
  } catch {
    /* bộ nhớ đầy / chế độ riêng tư: bỏ qua */
  }
}

// Tính tu vi tích lũy lúc offline. rateFn(state) do main truyền vào để tránh
// state.js phải import cultivation.js.
export function applyOffline(s, rateFn) {
  const now = Date.now();
  const dt = Math.min(Math.max(0, (now - (s.lastSeen || now)) / 1000), OFFLINE_CAP);
  const gain = rateFn(s) * dt * OFFLINE_EFF;
  s.tuVi += gain;
  return { seconds: dt, gain };
}
