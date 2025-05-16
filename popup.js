// popup.js
const extpay = ExtPay('gumboost');
extpay.start();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'proxyTrialCheck') {
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
    return true;
  }
});

document.addEventListener('DOMContentLoaded', function () {
  const startBtn = document.getElementById('start');
  const stopBtn = document.getElementById('stop');
  const statusEl = document.getElementById('status');

  function setStatus(text) {
    statusEl.textContent = 'Status: ' + text;
  }

  startBtn.addEventListener('click', function () {
    setStatus('Checking payment...');

    extpay.getUser().then(user => {
      if (!user.paid) {
        setStatus('Redirecting to payment...');
        extpay.openPaymentPage('monthly-24-99');
        return;
      }

      setStatus('Sending start...');
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: 'start' },
          function (response) {
            if (chrome.runtime.lastError) {
              console.error('❌ Start error:', chrome.runtime.lastError.message);
              setStatus('Error: make sure you’re on the Gumtree Expired Ads page.');
              return;
            }

            if (!response || !response.started) {
              setStatus('Error: content script not responding.');
              return;
            }

            startBtn.disabled = true;
            stopBtn.disabled = false;
            setStatus('Running');
          }
        );
      });
    });
  });

  stopBtn.addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'stop' },
        function (response) {
          startBtn.disabled = false;
          stopBtn.disabled = true;
          setStatus('Stopped');
        }
      );
    });
  });
});
