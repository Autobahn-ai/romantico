// Service worker — handles auth token storage and relay

chrome.runtime.onInstalled.addListener(() => {
  console.log('MailDraft extension installed');
});

// Relay messages between popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_AUTH_TOKEN') {
    chrome.storage.sync.get(['maildraft_token', 'maildraft_user'], (result) => {
      sendResponse({
        token: result.maildraft_token || null,
        user: result.maildraft_user || null,
      });
    });
    return true; // async
  }

  if (message.type === 'SET_AUTH_TOKEN') {
    chrome.storage.sync.set({
      maildraft_token: message.token,
      maildraft_user: message.user,
    }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'CLEAR_AUTH_TOKEN') {
    chrome.storage.sync.remove(['maildraft_token', 'maildraft_user'], () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
