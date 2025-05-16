const extpay = ExtPay('gumboost');
extpay.start();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkTrialLimit') {
    extpay.getUser().then(user => {
      if (user.paid) {
        sendResponse({ allowed: true, paid: true });
        return;
      }

      chrome.storage.local.get(['repostCount'], (data) => {
        const count = data.repostCount || 0;
        if (count < 10) {
          chrome.storage.local.set({ repostCount: count + 1 }, () => {
            sendResponse({ allowed: true, paid: false });
          });
        } else {
          sendResponse({ allowed: false, paid: false });
        }
      });
    });
    return true; // Keep the message channel open for async response
  }

  if (message.action === 'resetTrial') {
    chrome.storage.local.set({ repostCount: 0 }, () => {
      sendResponse({ reset: true });
    });
    return true;
  }
});
