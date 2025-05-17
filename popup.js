const extpay = ExtPay('gumboost');
extpay.getUser().then(user => {
  document.getElementById('trial-info').textContent = user.paid
    ? 'GumBoost Pro active ✅'
    : `Trial used: ${user.usageThisMonth}/10 ads`;

  if (!user.paid && user.usageThisMonth >= 10) {
    document.getElementById('start').disabled = true;
  }
});

document.getElementById('start').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs.length) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: 'start' });
  });
});

document.getElementById('stop').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs.length) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: 'stop' });
  });
});

document.getElementById('reset').addEventListener('click', () => {
  chrome.storage.sync.set({ adsRepostedThisMonth: 0 });
  location.reload();
});

document.getElementById('toggle-btn').addEventListener('click', () => {
  document.getElementById('gumboost-popup').style.display = 'block';
});

document.getElementById('close-popup').addEventListener('click', () => {
  document.getElementById('gumboost-popup').style.display = 'none';
});
