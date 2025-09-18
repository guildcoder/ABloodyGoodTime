(() => {
  const WAIVER_KEY = 'bgt_waiver_accepted';
  const SAFE_KEY = 'bgt_safe_mode';
  const PLAY_FLAG = 'bgt_media_playing';

  // Elements
  const waiver = document.getElementById('waiver');
  const acceptBtn = document.getElementById('acceptBtn');
  const safeBtn = document.getElementById('safeBtn');
  const leaveBtn = document.getElementById('leaveBtn');
  const overlay = document.getElementById('scare-overlay');

  // Scare assets
  const SCARES = [
    { img: 'assets/scare1.gif', sfx: 'assets/scare1.mp3' },
    { img: 'assets/scare2.gif', sfx: 'assets/scare2.mp3' },
    { img: 'assets/scare3.gif', sfx: 'assets/scare3.mp3' },
    { img: 'assets/scare4.gif', sfx: 'assets/scare4.mp3' }
  ];

  let scareTimeoutId = null;
  let scareActive = false;

  // ---------------- WAIVER ----------------
function showOrHideWaiver() {
  const accepted = localStorage.getItem(WAIVER_KEY) === '1';
  if (accepted) {
    waiver.style.display = 'none';
    startJumpscareLoop();
  } else {
    waiver.style.display = 'flex';
  }
}

acceptBtn.addEventListener('click', () => {
  localStorage.setItem(WAIVER_KEY, '1');
  localStorage.removeItem(SAFE_KEY);
  waiver.style.display = 'none';
  startJumpscareLoop();
});

safeBtn.addEventListener('click', () => {
  localStorage.setItem(WAIVER_KEY, '1');
  localStorage.setItem(SAFE_KEY, '1');
  waiver.style.display = 'none';
});

leaveBtn.addEventListener('click', () => {
  waiver.style.display = 'none';
  // window.location.href = 'about:blank'; // optional redirect
});


  // ---------------- JUMPSCARE ----------------
  function isSafeMode() {
    return localStorage.getItem(SAFE_KEY) === '1';
  }

  function isMediaPlaying() {
    if (sessionStorage.getItem(PLAY_FLAG) === '1') return true;
    const medias = [...document.querySelectorAll('audio, video')];
    return medias.some(m => !m.paused && !m.ended && m.currentTime > 0);
  }

  function startJumpscareLoop() {
    if (isSafeMode()) return;
    scheduleNextScare();
  }

  function scheduleNextScare() {
    clearTimeout(scareTimeoutId);
    if (isSafeMode()) return;

    // Random delay: 0–59s
    const ms = Math.floor(Math.random() * 60_000);
    scareTimeoutId = setTimeout(triggerScareIfAble, ms);
  }

  function triggerScareIfAble() {
    if (isSafeMode()) return;
    if (isMediaPlaying() || scareActive) {
      // Retry in 10s if media playing or scare already active
      scareTimeoutId = setTimeout(triggerScareIfAble, 10_000);
      return;
    }
    triggerScare();
  }

  function triggerScare() {
    if (scareActive) return;
    scareActive = true;

    const pick = SCARES[Math.floor(Math.random() * SCARES.length)];
    overlay.innerHTML = `
      <img src="${pick.img}" alt="scare" style="width:100%;height:100%;object-fit:cover;" />
    `;
    overlay.style.display = 'block';
    overlay.setAttribute('aria-hidden', 'false');

    const sfx = new Audio(pick.sfx);
    sfx.play().catch(() => {});

    // Show for 3s
    setTimeout(() => {
      overlay.style.display = 'none';
      overlay.innerHTML = '';
      overlay.setAttribute('aria-hidden', 'true');
      scareActive = false;

      // Schedule next scare AFTER this one finishes
      scheduleNextScare();
    }, 3000);
  }

  // Pause/resume scheduling when tab visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(scareTimeoutId);
      scareTimeoutId = null;
    } else if (!isSafeMode() && !scareActive) {
      scheduleNextScare();
    }
  });

  // ---------------- INIT ----------------
  showOrHideWaiver();

})();
