chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkTrialLimit') {
    chrome.runtime.sendMessage({ action: 'proxyTrialCheck' }, (response) => {
      sendResponse(response);
    });
    return true;
  }
});
