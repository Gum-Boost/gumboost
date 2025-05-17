console.log('[content] ✅ GumBoost content script injected');

let running = false;
let index = 0;
let interval = null;
let totalAds = 0;
let limit = 0;

const EXTENSION_ID = 'gumboost';
const PLAN_URL = `https://extensionpay.com/extension/${EXTENSION_ID}/choose-plan/monthly-24-99`;

function injectFakeAds(n = 5) {
  if (document.getElementById('fake-expired-ads')) return;
  const container = document.createElement('div');
  container.id = 'fake-expired-ads';
  for (let i = 1; i <= n; i++) {
    const card = document.createElement('div');
    card.className = 'user-ad-vertical-card__content';
    const btn = document.createElement('button');
    btn.className = 'btn-secondary';
    btn.textContent = 'Repost';
    btn.onclick = () => console.log(`🧪 Fake repost clicked #${i}`);
    card.appendChild(btn);
    document.body.appendChild(card);
  }
}

function getButtons() {
  let btns = [...document.querySelectorAll('.user-ad-vertical-card__content .btn-secondary')];
  if (btns.length === 0) {
    injectFakeAds(5);
    btns = [...document.querySelectorAll('.user-ad-vertical-card__content .btn-secondary')];
  }
  return btns;
}

function injectReopenButton() {
  if (document.getElementById('reopen-gumboost-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'reopen-gumboost-btn';
  btn.textContent = 'Open GumBoost';
  btn.style = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    padding: 10px;
    font-size: 14px;
    background: #00aa00;
    color: white;
    border: none;
    border-radius: 6px;
  `;
  btn.onclick = () => {
    injectPopup();
    btn.style.display = 'none';
  };
  document.body.appendChild(btn);
}

function injectPopup() {
  if (document.getElementById('gumboost-popup')) return;

  const popup = document.createElement('div');
  popup.id = 'gumboost-popup';
  popup.style = `
    position: fixed;
    top: 100px;
    left: 100px;
    width: 280px;
    background: #1e1e1e;
    color: #fff;
    padding: 16px;
    z-index: 999999;
    border-radius: 10px;
    box-shadow: 0 0 10px #000;
    font-family: Arial, sans-serif;
    cursor: move;
  `;

  popup.innerHTML = `
    <div id="gumboost-header" style="font-size: 18px; font-weight: bold; margin-bottom: 10px; display: flex; justify-content: space-between;">
      <span>GumBoost</span>
      <span>
        <button id="toggle-popup" style="background: none; border: none; color: #fff; font-size: 16px;">–</button>
        <button id="close-popup" style="background: none; border: none; color: #fff; font-size: 16px;">×</button>
      </span>
    </div>
    <div id="gumboost-body">
      <div id="expired-count">Detecting expired ads...</div>
      <input id="ads-to-repost" type="number" min="1" style="width: 100%; margin: 5px 0;" placeholder="How many ads to repost?">
      <button id="start-repost" style="width: 100%; margin: 5px 0;">▶ Start</button>
      <button id="stop-repost" style="width: 100%; margin: 5px 0;">■ Stop</button>
      <div id="repost-status">Status: idle</div>
      <div id="upgrade-banner" style="margin-top: 10px; display: none; color: yellow;">
        Upgrade to <b>GumBoost Pro</b> for unlimited reposts!
        <br>
        <a href="${PLAN_URL}" target="_blank" style="color: #00f;">Upgrade Now</a>
      </div>
      <button id="reset-trial" style="margin-top: 5px; font-size: 12px; width: 100%;">Reset Trial (Dev)</button>
    </div>
  `;
  document.body.appendChild(popup);

  // Draggable
  let offsetX, offsetY, isDragging = false;
  popup.addEventListener('mousedown', (e) => {
    if (e.target.id === 'toggle-popup' || e.target.id === 'close-popup') return;
    isDragging = true;
    offsetX = e.clientX - popup.offsetLeft;
    offsetY = e.clientY - popup.offsetTop;
  });
  document.addEventListener('mouseup', () => (isDragging = false));
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      popup.style.left = `${e.clientX - offsetX}px`;
      popup.style.top = `${e.clientY - offsetY}px`;
    }
  });

  // Toggle + Close
  document.getElementById('toggle-popup').onclick = () => {
    const body = document.getElementById('gumboost-body');
    body.style.display = body.style.display === 'none' ? 'block' : 'none';
    document.getElementById('toggle-popup').textContent = body.style.display === 'none' ? '+' : '–';
  };
  document.getElementById('close-popup').onclick = () => {
    popup.remove();
    document.getElementById('reopen-gumboost-btn').style.display = 'block';
  };

  // Actions
  document.getElementById('start-repost').onclick = startReposting;
  document.getElementById('stop-repost').onclick = stopReposting;
  document.getElementById('reset-trial').onclick = () => {
    chrome.storage.sync.set({ usage: [] }, () => {
      alert('Trial reset!');
      updateLimitDisplay();
    });
  };

  updateLimitDisplay();
}

function updateLimitDisplay() {
  chrome.storage.sync.get(['usage'], (data) => {
    const used = (data.usage || []).filter(d => new Date(d).getMonth() === new Date().getMonth()).length;
    totalAds = getButtons().length;
    const left = Math.max(0, 10 - used);
    if (document.getElementById('expired-count'))
      document.getElementById('expired-count').textContent = `Expired ads: ${totalAds} | ${used}/10 used`;
    if (document.getElementById('upgrade-banner'))
      document.getElementById('upgrade-banner').style.display = left <= 0 ? 'block' : 'none';
  });
}

function startReposting() {
  const btns = getButtons();
  if (btns.length === 0) return alert('No ads found');

  chrome.storage.sync.get(['usage'], (data) => {
    const now = new Date();
    let usage = (data.usage || []).filter(d => new Date(d).getMonth() === now.getMonth());
    const allowed = 10 - usage.length;
    const requested = parseInt(document.getElementById('ads-to-repost').value || totalAds);
    limit = Math.min(requested, allowed, btns.length);

    if (limit <= 0) {
      document.getElementById('upgrade-banner').style.display = 'block';
      return;
    }

    index = 0;
    running = true;
    document.getElementById('repost-status').textContent = 'Status: Running...';

    interval = setInterval(() => {
      if (!running || index >= limit || index >= btns.length) {
        clearInterval(interval);
        document.getElementById('repost-status').textContent = 'Status: Complete';
        chrome.storage.sync.set({ usage: [...usage, ...Array(limit).fill(now.toISOString())] });
        updateLimitDisplay();
        return;
      }
      btns[index].click();
      console.log(`[content] Reposting ad ${index + 1}`);
      index++;
    }, 1000);
  });
}

function stopReposting() {
  running = false;
  clearInterval(interval);
  document.getElementById('repost-status').textContent = 'Status: Stopped';
}

// Boot:
injectReopenButton();
setTimeout(() => {
  updateLimitDisplay();
  getButtons();
}, 1500);
