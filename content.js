// Onboarding overlay
chrome.storage.local.get(['onboardingSeen'], (data) => {
  if (!data.onboardingSeen) {
    showOnboardingOverlay();
    chrome.storage.local.set({ onboardingSeen: true });
  }
});

function showOnboardingOverlay() {
  const steps = [
    "Step 1: Click on the Expired Ads section.",
    "Step 2: Click Repost on GumBoost.",
    "💡 Tip: Set Results Per Page to 50 for faster reposting."
  ];

  let step = 0;

  const overlay = document.createElement('div');
  overlay.style = `
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.8);
    color: white;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    z-index: 999999;
    text-align: center;
    padding: 20px;
  `;

  const text = document.createElement('div');
  text.textContent = steps[step];

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.style = 'margin-top: 20px; padding: 10px 20px;';
  nextBtn.onclick = () => {
    step++;
    if (step < steps.length) {
      text.textContent = steps[step];
    } else {
      overlay.remove();
    }
  };

  const skipBtn = document.createElement('button');
  skipBtn.textContent = 'Skip';
  skipBtn.style = 'margin-top: 10px; padding: 6px 20px; background: transparent; color: white; border: 1px solid white;';
  skipBtn.onclick = () => overlay.remove();

  overlay.appendChild(text);
  overlay.appendChild(nextBtn);
  overlay.appendChild(skipBtn);
  document.body.appendChild(overlay);
}

// Repost logic
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'start') {
    const buttons = document.querySelectorAll('.user-ad-vertical-card__content .btn-secondary');
    let index = 0;

    function repostNext() {
      if (index >= buttons.length) return;

      chrome.runtime.sendMessage({ action: 'checkTrialLimit' }, (response) => {
        if (!response.allowed) {
          alert('🔒 Trial limit reached. Subscribe to continue.');
          return;
        }

        const btn = buttons[index];
        if (btn) {
          btn.click();
          console.log(`✅ Reposted ad #${index + 1}`);
          index++;
          setTimeout(repostNext, 1500);
        }
      });
    }

    repostNext();
    sendResponse({ started: true });
  }

  if (message.action === 'stop') {
    sendResponse({ stopped: true });
  }
});
