// popup.js
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔌 Popup loaded');

  const startBtn = document.getElementById('start');
  const stopBtn  = document.getElementById('stop');
  const statusEl = document.getElementById('status');

  function setStatus(text) {
    statusEl.textContent = 'Status: ' + text;
  }

  startBtn.addEventListener('click', function() {
    console.log('▶️ Start clicked');
    setStatus('Sending start…');
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'start' },
        function(response) {
          if (chrome.runtime.lastError) {
            console.error('❌ Start error:', chrome.runtime.lastError.message);
            setStatus('Error: page not ready');
            return;
          }
          console.log('✔️ Start response:', response);
          startBtn.disabled = true;
          stopBtn.disabled  = false;
          setStatus('Running');
        }
      );
    });
  });

  stopBtn.addEventListener('click', function() {
    console.log('⏹️ Stop clicked');
    setStatus('Sending stop…');
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'stop' },
        function(response) {
          if (chrome.runtime.lastError) {
            console.error('❌ Stop error:', chrome.runtime.lastError.message);
            setStatus('Error: page not ready');
            return;
          }
          console.log('✔️ Stop response:', response);
          startBtn.disabled = false;
          stopBtn.disabled  = true;
          setStatus('Stopped');
        }
      );
    });
  });
});
