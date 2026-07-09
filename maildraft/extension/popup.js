const loginSection = document.getElementById('login-section');
const userSection = document.getElementById('user-section');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginStatus = document.getElementById('login-status');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const openDashboardBtn = document.getElementById('open-dashboard-btn');
const appUrlInput = document.getElementById('app-url-input');
const saveUrlBtn = document.getElementById('save-url-btn');

// Load saved app URL
chrome.storage.sync.get(['maildraft_app_url'], (result) => {
  if (result.maildraft_app_url) {
    appUrlInput.value = result.maildraft_app_url;
  }
});

saveUrlBtn.addEventListener('click', () => {
  const url = appUrlInput.value.trim().replace(/\/$/, '');
  if (url) {
    chrome.storage.sync.set({ maildraft_app_url: url }, () => {
      saveUrlBtn.textContent = 'Saved!';
      setTimeout(() => { saveUrlBtn.textContent = 'Save'; }, 1500);
    });
  }
});

// Check current auth state
chrome.runtime.sendMessage({ type: 'GET_AUTH_TOKEN' }, (response) => {
  if (response && response.token) {
    showUserSection(response.user);
  } else {
    showLoginSection();
  }
});

function showLoginSection() {
  loginSection.style.display = 'block';
  userSection.style.display = 'none';
}

function showUserSection(user) {
  loginSection.style.display = 'none';
  userSection.style.display = 'block';
  if (user) {
    userName.textContent = user.name || user.email || 'User';
    userEmail.textContent = user.email || '';
  }
}

loginBtn.addEventListener('click', async () => {
  loginStatus.textContent = 'Opening login...';
  loginBtn.disabled = true;

  chrome.storage.sync.get(['maildraft_app_url'], (result) => {
    const appUrl = result.maildraft_app_url || 'http://localhost:3000';
    chrome.tabs.create({ url: `${appUrl}/login?extension=true` });
    loginStatus.textContent = 'Sign in the opened tab, then return here.';
    loginBtn.disabled = false;
  });
});

logoutBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'CLEAR_AUTH_TOKEN' }, () => {
    showLoginSection();
  });
});

openDashboardBtn.addEventListener('click', () => {
  chrome.storage.sync.get(['maildraft_app_url'], (result) => {
    const appUrl = result.maildraft_app_url || 'http://localhost:3000';
    chrome.tabs.create({ url: `${appUrl}/dashboard` });
  });
});

// Listen for auth token messages from the web app (via content script)
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'AUTH_TOKEN_RECEIVED') {
    showUserSection(message.user);
  }
});
