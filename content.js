// First-Time Onboarding Overlay
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
    color: #fff;
    font-size: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    padding: 30px;
    text-align: center;
  `;

  const text = document.createElement('div');
  text.textContent = steps[step];

  const nextBtn = document.createElement('button');
  nextBtn.textContent = "Next";
  nextBtn.style = "margin-top: 20px; padding: 10px 20px;";
  nextBtn.onclick = () => {
    step++;
    if (step < steps.length) {
      text.textContent = steps[step];
    } else {
      overlay.remove();
    }
  };

  const skipBtn = document.createElement('button');
  skipBtn.textContent = "Skip";
  skipBtn.style = "margin-top: 10px; padding: 6px 20px; background: transparent; color: white; border: 1px solid white;";
  skipBtn.onclick = () => overlay.remove();

  overlay.appendChild(text);
  overlay.appendChild(nextBtn);
  overlay.appendChild(skipBtn);
  document.body.appendChild(overlay);
}

// GumBoost trial repost logic
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'start') {
    const repostButtons = document.querySelectorAll('.user-ad-vertical-card__content .btn-secondary');

    let index = 0;

    function clickNext() {
      if (index >= repostButtons.length) return;

      chrome.runtime.sendMessage({ action: 'checkTrialLimit' }, (response) => {
        if (!response.allowed) {
          alert('🔒 Trial limit reached. Subscribe to keep using GumBoost.');
          return;
        }

        const btn = repostButtons[index];
        if (btn) {
          btn.click();
          console.log(`Reposted ad #${index + 1}`);
          index++;
          setTimeout(clickNext, 1500); // delay between reposts
        }
      });
    }

    clickNext();
    sendResponse({ started: true });
  }

  if (message.action === 'stop') {
    // Not implemented yet – add if needed later
    sendResponse({ stopped: true });
  }
});
