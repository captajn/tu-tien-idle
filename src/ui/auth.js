// Màn hình tài khoản: đăng nhập / đăng ký / khách.
// Frontend-only: tài khoản lưu local, backend đồng bộ cloud làm sau.
import { el } from './format.js';

const ACC_KEY = 'tutien-accounts';
export const LAST_KEY = 'tutien-lastuser';

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function getAccounts() {
  try { return JSON.parse(localStorage.getItem(ACC_KEY) || '{}'); } catch { return {}; }
}
function saveAccounts(a) {
  try { localStorage.setItem(ACC_KEY, JSON.stringify(a)); } catch { /* bỏ qua */ }
}

export function showAuth(onDone) {
  // Ẩn màn hình loading
  const fade = document.getElementById('fade');
  if (fade) { fade.style.opacity = '0'; fade.style.pointerEvents = 'none'; }

  let lastUser = null;
  try { lastUser = localStorage.getItem(LAST_KEY) || null; } catch { /* bỏ qua */ }

  const ov = el('div', 'overlay');
  ov.innerHTML = `
    <div class="card auth-card">
      <div class="auth-logo">☯</div>
      <h1>TU TIÊN IDLE</h1>
      <p class="sub">Con đường trường sinh bắt đầu từ một niệm.</p>
      ${lastUser
        ? `<button id="auth-quick" class="btn gold big">${lastUser === 'guest' ? 'Tiếp tục chơi (Khách)' : `Chào <b>${esc(lastUser)}</b> — Vào game`}</button>
           <div class="auth-div"><span>hoặc dùng tài khoản khác</span></div>`
        : ''}
      <div class="auth-tabs"><button id="tab-login" class="on">Đăng nhập</button><button id="tab-reg">Đăng ký</button></div>
      <input id="auth-user" maxlength="16" placeholder="Tên đăng nhập" autocomplete="username">
      <input id="auth-pass" type="password" maxlength="32" placeholder="Mật khẩu" autocomplete="current-password">
      <input id="auth-pass2" type="password" maxlength="32" placeholder="Nhập lại mật khẩu" autocomplete="new-password" style="display:none">
      <div class="auth-err" id="auth-err"></div>
      <button id="auth-go" class="btn gold big">Vào game</button>
      <div class="auth-div"><span>hoặc</span></div>
      <button id="auth-guest" class="btn big">Chơi ngay (Khách)</button>
      <p class="auth-note">Bản hiện tại lưu nhân vật trên máy này.<br>Đăng nhập đa thiết bị / đồng bộ cloud sẽ mở sau.</p>
    </div>`;
  document.body.appendChild(ov);

  const q = (s) => ov.querySelector(s);
  const errBox = q('#auth-err');
  const err = (m) => { errBox.textContent = m; };
  let mode = 'login';

  const setMode = (m) => {
    mode = m;
    q('#tab-login').classList.toggle('on', m === 'login');
    q('#tab-reg').classList.toggle('on', m === 'reg');
    q('#auth-pass2').style.display = m === 'reg' ? '' : 'none';
    err('');
  };
  q('#tab-login').onclick = () => setMode('login');
  q('#tab-reg').onclick = () => setMode('reg');

  const done = (user) => {
    try { localStorage.setItem(LAST_KEY, user.name || 'guest'); } catch { /* bỏ qua */ }
    ov.remove();
    onDone(user);
  };

  if (lastUser) {
    q('#auth-quick').onclick = () => done(lastUser === 'guest'
      ? { mode: 'guest', name: null }
      : { mode: 'account', name: lastUser });
  }

  q('#auth-go').onclick = () => {
    const name = q('#auth-user').value.trim();
    const pw = q('#auth-pass').value;
    if (name.length < 3 || name.length > 16) return err('Tên đăng nhập 3–16 ký tự.');
    if (pw.length < 4) return err('Mật khẩu tối thiểu 4 ký tự.');
    const accs = getAccounts();
    if (mode === 'reg') {
      if (q('#auth-pass2').value !== pw) return err('Nhập lại mật khẩu chưa khớp.');
      if (accs[name]) return err('Tên này đã có người dùng, hãy đăng nhập.');
      accs[name] = { pw: btoa(unescape(encodeURIComponent(pw))), created: Date.now() };
      saveAccounts(accs);
      done({ mode: 'account', name });
    } else {
      const a = accs[name];
      if (!a) return err('Chưa có tài khoản này — chuyển sang Đăng ký nhé.');
      if (a.pw !== btoa(unescape(encodeURIComponent(pw)))) return err('Sai mật khẩu.');
      done({ mode: 'account', name });
    }
  };
  q('#auth-guest').onclick = () => done({ mode: 'guest', name: null });
  q('#auth-pass2').addEventListener('keydown', (e) => { if (e.key === 'Enter') q('#auth-go').click(); });
  q('#auth-pass').addEventListener('keydown', (e) => { if (e.key === 'Enter') q('#auth-go').click(); });
}
