// MailDraft Service Worker — handles auth token storage and relay
// Tokens are stored in chrome.storage.sync (encrypted by Chrome, synced to user's Google account)

chrome.runtime.onInstalled.addListener(() => {
  console.log('MailDraft installed');
});

// ── Allowed app origins (security: only accept messages from known origins) ──
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  // Add your production domain here once deployed, e.g.:
  // 'https://maildraft.app',
];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Only process messages from our own extension pages (popup, sidebar)
  // Content scripts from mail.google.com are allowed for the relay
  const isOwnExtension = !sender.tab; // messages from popup/background have no tab
  const isContentScript = sender.tab && sender.url?.startsWith('https://mail.google.com/');

  if (!isOwnExtension && !isContentScript) {
    console.warn('MailDraft: rejected message from unknown origin', sender.url);
    return false;
  }

  switch (message.type) {
    case 'GET_AUTH_TOKEN':
      chrome.storage.sync.get(['maildraft_token', 'maildraft_user', 'maildraft_token_exp'], (result) => {
        // Check token expiry
        if (result.maildraft_token_exp && Date.now() > result.maildraft_token_exp) {
          // Token expired — clear it
          chrome.storage.sync.remove(['maildraft_token', 'maildraft_user', 'maildraft_token_exp']);
          sendResponse({ token: null, user: null, expired: true });
        } else {
          sendResponse({
            token: result.maildraft_token || null,
            user: result.maildraft_user || null,
          });
        }
      });
      return true; // async

    case 'SET_AUTH_TOKEN':
      // Store token with expiry (Supabase tokens expire in 1 hour by default)
      chrome.storage.sync.set({
        maildraft_token: message.token,
        maildraft_user: message.user,
        // Expire in 55 minutes (5 min before Supabase's 60-min expiry)
        maildraft_token_exp: Date.now() + 55 * 60 * 1000,
      }, () => {
        sendResponse({ success: true });
      });
      return true;

    case 'CLEAR_AUTH_TOKEN':
      chrome.storage.sync.remove(
        ['maildraft_token', 'maildraft_user', 'maildraft_token_exp'],
        () => { sendResponse({ success: true }); }
      );
      return true;

    case 'GET_APP_URL':
      chrome.storage.sync.get(['maildraft_app_url'], (result) => {
        sendResponse({ url: result.maildraft_app_url || null });
      });
      return true;
  }

  return false;
});
