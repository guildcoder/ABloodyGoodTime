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
    console.log('[BGT] Waiver accepted?', accepted);
    if (accepted) {
      waiver.style.display = 'none';
      startJumpscareLoop();
    } else {
      waiver.style.display = 'flex';
    }
  }

  acceptBtn.addEventListener('click', () => {
    console.log('[BGT] Accept button clicked');
    localStorage.setItem(WAIVER_KEY, '1');
    localStorage.removeItem(SAFE_KEY);
    waiver.style.display = 'none';
    startJumpscareLoop();
  });

  safeBtn.addEventListener('click', () => {
    console.log('[BGT] Safe mode button clicked');
    localStorage.setItem(WAIVER_KEY, '1');
    localStorage.setItem(SAFE_KEY, '1');
    waiver.style.display = 'none';
  });

  leaveBtn.addEventListener('click', () => {
    console.log('[BGT] Leave button clicked');
    waiver.style.display = 'none';
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
    if (isSafeMode()) {
      console.log('[BGT] Safe mode active — not starting jumpscare loop');
      return;
    }
    console.log('[BGT] Starting jumpscare loop');
    scheduleNextScare();
  }

  function scheduleNextScare() {
    clearTimeout(scareTimeoutId);
    if (isSafeMode()) {
      console.log('[BGT] Safe mode active — skipping scheduleNextScare');
      return;
    }

    const ms = Math.floor(Math.random() * 60_000);
    console.log(`[BGT] Scheduling next scare in ${Math.round(ms / 1000)}s`);
    scareTimeoutId = setTimeout(triggerScareIfAble, ms);
  }

  function triggerScareIfAble() {
    if (isSafeMode()) {
      console.log('[BGT] Safe mode — skipping triggerScareIfAble');
      return;
    }
    if (isMediaPlaying()) {
      console.log('[BGT] Media playing — deferring scare by 10s');
      scareTimeoutId = setTimeout(triggerScareIfAble, 10_000);
      return;
    }
    if (scareActive) {
      console.log('[BGT] Scare already active — deferring by 10s');
      scareTimeoutId = setTimeout(triggerScareIfAble, 10_000);
      return;
    }
    triggerScare();
  }

  function triggerScare() {
    if (scareActive) {
      console.log('[BGT] Scare already active — abort triggerScare');
      return;
    }
    scareActive = true;

    const pick = SCARES[Math.floor(Math.random() * SCARES.length)];
    console.log('[BGT] Triggering scare with', pick.img);

    overlay.innerHTML = `<img src="${pick.img}" alt="scare" style="width:100%;height:100%;object-fit:cover;" />`;
    overlay.style.display = 'block';
    overlay.setAttribute('aria-hidden', 'false');

    const sfx = new Audio(pick.sfx);
    sfx.play().catch(e => console.log('[BGT] Error playing audio:', e));

    setTimeout(() => {
      overlay.style.display = 'none';
      overlay.innerHTML = '';
      overlay.setAttribute('aria-hidden', 'true');
      scareActive = false;
      console.log('[BGT] Scare ended');

      scheduleNextScare();
    }, 3000);
  }

  // Pause/resume scheduling when tab visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('[BGT] Tab hidden — clearing scare timeout');
      clearTimeout(scareTimeoutId);
      scareTimeoutId = null;
    } else if (!isSafeMode() && !scareActive) {
      console.log('[BGT] Tab visible — scheduling next scare');
      scheduleNextScare();
    }
  });

  // ---------------- INIT ----------------
  showOrHideWaiver();

})();
