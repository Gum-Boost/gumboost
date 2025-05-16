const extpay = ExtPay('gumboost');
extpay.start();

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start');
  const stopBtn  = document.getElementById('stop');
  const statusEl = document.getElementById('status');
  const trialInfo = document.getElementById('trial-info');
  const upgradeBtn = document.getElementById('upgrade');
  const resetBtn = document.getElementById('reset');

  let userId = null;
  let repostsUsed = 0;

  function setStatus(msg) {
    statusEl.textContent = 'Status: ' + msg;
  }

  extpay.getUser().then(user => {
    userId = user.id;
    const trialKey = `trial_used_${userId}`;
    const countKey = `trial_count_${userId}`;

    chrome.storage.sync.get([trialKey, countKey], (data) => {
      repostsUsed = data[countKey] || 0;

      if (!user.paid) {
        trialInfo.textContent = `Trial usage: ${repostsUsed}/10`;
        upgradeBtn.style.display = 'block';
      } else {
        trialInfo.textContent = `License: ✅ Active`;
        upgradeBtn.style.display = 'none';
      }
    });
  });

  startBtn.addEventListener('click', () => {
    setStatus('Checking payment...');

    extpay.getUser().then(user => {
      if (!user.paid) {
        setStatus('Redirecting to payment...');
        extpay.openPaymentPage('monthly-24-99');
        return;
      }

      setStatus('Sending start...');
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'start' }, function (response) {
          if (chrome.runtime.lastError) {
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
        });
      });
    });
  });

  stopBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'stop' }, function () {
        startBtn.disabled = false;
        stopBtn.disabled = true;
        setStatus('Stopped');
      });
    });
  });

  upgradeBtn.onclick = () => {
    extpay.openPaymentPage('monthly-24-99');
  };

  resetBtn.onclick = () => {
    if (userId) {
      const trialKey = `trial_used_${userId}`;
      const countKey = `trial_count_${userId}`;
      chrome.storage.sync.remove([trialKey, countKey], () => {
        alert("Trial has been reset.");
        location.reload();
      });
    }
  };

  // Handle trial check from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'proxyTrialCheck') {
      extpay.getUser().then(user => {
        if (user.paid) {
          sendResponse({ allowed: true, paid: true });
          return;
        }

        const trialKey = `trial_used_${user.id}`;
        const countKey = `trial_count_${user.id}`;

        chrome.storage.sync.get([trialKey, countKey], (data) => {
          let count = data[countKey] || 0;

          if (count >= 10) {
            sendResponse({ allowed: false, paid: false });
          } else {
            chrome.storage.sync.set({
              [trialKey]: true,
              [countKey]: count + 1
            }, () => {
              sendResponse({ allowed: true, paid: false });
            });
          }
        });
      });
      return true;
    }
  });
});
