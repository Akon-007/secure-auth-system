const apiBase = '';
const appEl = document.getElementById('app');
const tokenKey = 'secureAuthJwt';
const userEmailKey = 'secureAuthEmail';

const state = {
  screen: 'register',
  message: null,
  error: null,
  email: '',
  token: localStorage.getItem(tokenKey) || null
};

function setScreen(screen) {
  state.screen = screen;
  state.message = null;
  state.error = null;
  render();
}

function render() {
  if (state.token) {
    renderDashboard();
    return;
  }

  switch (state.screen) {
    case 'login':
      renderLogin();
      break;
    case 'mfa':
      renderMfa();
      break;
    default:
      renderRegister();
  }
}

function renderRegister() {
  appEl.innerHTML = `
    <div class="space-y-6">
      <div class="space-y-2">
        <h2 class="text-2xl font-semibold">Create your account</h2>
        <p class="text-slate-400">Enter your email and a strong password.</p>
      </div>
      ${renderAlert()}
      <form id="registerForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Email</label>
          <input name="email" type="email" required class="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 focus:outline-none focus:border-cyan-500" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Password</label>
          <input name="password" type="password" required minlength="8" class="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 focus:outline-none focus:border-cyan-500" />
        </div>
        <button type="submit" class="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-400">Register</button>
      </form>
      <p class="text-sm text-slate-400">Already have an account? <button id="toLogin" class="text-cyan-400 underline">Log in</button></p>
    </div>
  `;

  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('toLogin').addEventListener('click', () => setScreen('login'));
}

function renderLogin() {
  appEl.innerHTML = `
    <div class="space-y-6">
      <div class="space-y-2">
        <h2 class="text-2xl font-semibold">Sign in</h2>
        <p class="text-slate-400">Enter your credentials to begin secure authentication.</p>
      </div>
      ${renderAlert()}
      <form id="loginForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Email</label>
          <input name="email" type="email" required class="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 focus:outline-none focus:border-cyan-500" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Password</label>
          <input name="password" type="password" required class="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 focus:outline-none focus:border-cyan-500" />
        </div>
        <button type="submit" class="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-400">Log in</button>
      </form>
      <p class="text-sm text-slate-400">Need an account? <button id="toRegister" class="text-cyan-400 underline">Register</button></p>
    </div>
  `;

  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('toRegister').addEventListener('click', () => setScreen('register'));
}

function renderMfa() {
  appEl.innerHTML = `
    <div class="space-y-6">
      <div class="space-y-2">
        <h2 class="text-2xl font-semibold">MFA Verification</h2>
        <p class="text-slate-400">Enter the 6-digit code provided by the server.</p>
      </div>
      ${renderAlert()}
      <form id="mfaForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">6-digit code</label>
          <input name="token" type="text" pattern="\\d{6}" required maxlength="6" class="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 focus:outline-none focus:border-cyan-500" />
        </div>
        <button type="submit" class="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-400">Verify Code</button>
      </form>
      <button id="backToLogin" class="w-full rounded-2xl border border-slate-700 px-4 py-3 text-slate-200 hover:border-cyan-400">Back to login</button>
    </div>
  `;

  document.getElementById('mfaForm').addEventListener('submit', handleMfa);
  document.getElementById('backToLogin').addEventListener('click', () => setScreen('login'));
}

function renderDashboard() {
  appEl.innerHTML = `
    <div class="space-y-6">
      <div class="space-y-2">
        <h2 class="text-2xl font-semibold">Protected Dashboard</h2>
        <p class="text-slate-400">Your session is active and secured with JWT authentication.</p>
      </div>
      ${renderAlert()}
      <div id="dashboardContent" class="rounded-3xl border border-slate-800 bg-slate-950/80 p-6"></div>
      <button id="logoutBtn" class="w-full rounded-2xl bg-rose-500 px-4 py-3 font-semibold text-white hover:bg-rose-400">Log out</button>
    </div>
  `;

  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  fetchDashboard();
}

function renderAlert() {
  if (state.error) {
    return `<div class="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">${state.error}</div>`;
  }
  if (state.message) {
    return `<div class="rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-cyan-200">${state.message}</div>`;
  }
  return '';
}

async function handleRegister(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const email = form.get('email').trim();
  const password = form.get('password').trim();

  if (password.length < 8) {
    state.error = 'Password must be at least 8 characters.';
    render();
    return;
  }

  try {
    const response = await fetch(`${apiBase}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();

    if (!data.success) {
      state.error = data.error || 'Registration failed.';
      render();
      return;
    }

    state.message = data.message;
    setScreen('login');
  } catch (err) {
    state.error = 'Network error. Please try again.';
    render();
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const email = form.get('email').trim();
  const password = form.get('password').trim();

  try {
    const response = await fetch(`${apiBase}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();

    if (!data.success) {
      state.error = data.error || 'Unable to sign in.';
      render();
      return;
    }

    state.email = email;
    state.message = 'Password verified. Enter your MFA code to continue.';
    setScreen('mfa');
    if (data.mfaCode) {
      alert(`MFA code for demo purposes: ${data.mfaCode}`);
    }
  } catch (err) {
    state.error = 'Network error. Please try again.';
    render();
  }
}

async function handleMfa(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const token = form.get('token').trim();

  try {
    const response = await fetch(`${apiBase}/mfa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: state.email, token })
    });
    const data = await response.json();

    if (!data.success) {
      state.error = data.error || 'MFA verification failed.';
      render();
      return;
    }

    state.token = data.token;
    localStorage.setItem(tokenKey, data.token);
    localStorage.setItem(userEmailKey, state.email);
    state.message = data.message;
    render();
  } catch (err) {
    state.error = 'Network error. Please try again.';
    render();
  }
}

async function fetchDashboard() {
  const content = document.getElementById('dashboardContent');
  content.innerHTML = '<p class="text-slate-400">Verifying your session...</p>';

  try {
    const token = localStorage.getItem(tokenKey);
    const response = await fetch(`${apiBase}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();

    if (!data.success) {
      state.error = data.error || 'Unable to access dashboard.';
      state.token = null;
      localStorage.removeItem(tokenKey);
      render();
      return;
    }

    content.innerHTML = `
      <div class="space-y-4">
        <p class="text-slate-300">${data.message}</p>
        <div class="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-slate-200">
          <p><strong>Email:</strong> ${data.user.email}</p>
          <p><strong>Role:</strong> ${data.user.role}</p>
          <p><strong>Issued at:</strong> ${data.user.issuedAt}</p>
        </div>
      </div>
    `;
  } catch (err) {
    content.innerHTML = '<p class="text-rose-300">Unable to verify session. Please log in again.</p>';
    state.token = null;
    localStorage.removeItem(tokenKey);
  }
}

function handleLogout() {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userEmailKey);
  state.token = null;
  state.email = '';
  state.message = 'You have been logged out successfully.';
  setScreen('login');
}

render();
