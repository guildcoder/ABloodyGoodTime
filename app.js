/* app.js
  - Waiver modal logic (accept/safe/leave)
  - Jumpscare engine with 3 gifs + 3 sounds
  - Pauses while media is playing (audio/video or when watch/listen pages set session flag)
*/

(() => {
  const WAIVER_KEY = 'bgt_waiver_accepted';
  const SAFE_KEY = 'bgt_safe_mode';
  const PLAY_FLAG = 'bgt_media_playing'; // sessionStorage flag set by other pages or by media events.

  // Elements
  const waiver = document.getElementById('waiver');
  const acceptBtn = document.getElementById('acceptBtn');
  const safeBtn = document.getElementById('safeBtn');
  const leaveBtn = document.getElementById('leaveBtn');
  const overlay = document.getElementById('scare-overlay');

  // Scare assets (drop your files in /assets and update filenames as needed)
  const SCARES = [
    { img: 'assets/scare1.gif', sfx: 'assets/scare1.mp3' },
    { img: 'assets/scare2.gif', sfx: 'assets/scare2.mp3' },
    { img: 'assets/scare3.gif', sfx: 'assets/scare3.mp3' }
  ];

  // Utility: show waiver unless they accepted
  function showOrHideWaiver() {
    const accepted = localStorage.getItem(WAIVER_KEY) === '1';
    if (accepted) {
      waiver.classList.remove('shown');
      waiver.style.display = 'none';
      startJumpscareTimer(); // start engine only after acceptance
    } else {
      waiver.style.display = 'flex';
    }
  }

  acceptBtn.addEventListener('click', () => {
    localStorage.setItem(WAIVER_KEY, '1');
    localStorage.removeItem(SAFE_KEY);
    waiver.style.display = 'none';
    startJumpscareTimer();
  });

  safeBtn.addEventListener('click', () => {
    localStorage.setItem(WAIVER_KEY, '1');
    localStorage.setItem(SAFE_KEY, '1');
    waiver.style.display = 'none';
    // Safe mode: do not start jumpscares
  });

  leaveBtn.addEventListener('click', () => {
    waiver.style.display = 'none';
    // Optional redirect if you want to send them away:
    // window.location.href = 'about:blank';
  });

  // Jumpscare engine
  let scareTimeoutId = null;
  let scareActive = false;

  function isSafeMode() {
    return localStorage.getItem(SAFE_KEY) === '1';
  }

  function isMediaPlaying() {
    // 1) sessionStorage flag can be set by other pages (listen/watch)
    if (sessionStorage.getItem(PLAY_FLAG) === '1') return true;

    // 2) check for native audio/video
    const medias = [...document.querySelectorAll('audio, video')];
    return medias.some(m => !m.paused && !m.ended && m.currentTime > 0);
  }

  function scheduleNextScare() {
    clearTimeout(scareTimeoutId);
    if (isSafeMode()) return;

    // Pick a random time within the next 60 seconds
    const ms = Math.floor(Math.random() * 60_000);
    scareTimeoutId = setTimeout(triggerScareIfAble, ms);

    console.log('[BGT] Next scare scheduled in', Math.round(ms/1000), 's');
  }

  function startJumpscareTimer() {
    if (isSafeMode()) {
      console.log('[BGT] Safe mode enabled - jumpscares disabled');
      return;
    }
    scheduleNextScare();
  }

  async function triggerScareIfAble() {
    if (isSafeMode()) return;
    if (isMediaPlaying()) {
      console.log('[BGT] media playing — deferring scare');
      scareTimeoutId = setTimeout(triggerScareIfAble, 15_000);
      return;
    }

    triggerScare();
    // schedule next scare after current finishes
    scheduleNextScare();
  }

  function triggerScare() {
    if (scareActive) return;
    scareActive = true;

    // pick random scare
    const pick = SCARES[Math.floor(Math.random() * SCARES.length)];

    overlay.innerHTML = '';
    const img = document.createElement('img');
    img.src = pick.img;
    img.alt = 'scare';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    overlay.appendChild(img);

    // play audio
    const sfx = new Audio(pick.sfx);
    sfx.preload = 'auto';
    sfx.volume = 1.0;
    sfx.play().catch(()=>{});

    overlay.classList.add('active');

    // keep for 6 seconds
    setTimeout(() => {
      overlay.classList.remove('active');
      overlay.innerHTML = '';
      scareActive = false;
    }, 6000);
  }

  // Poll to make sure scare timer is always active when it should be
  setInterval(() => {
    const accepted = localStorage.getItem(WAIVER_KEY) === '1';
    if (accepted && !isSafeMode() && !scareTimeoutId) scheduleNextScare();
  }, 10_000);

  // Pause scheduling when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(scareTimeoutId);
      scareTimeoutId = null;
    } else {
      if (!isSafeMode()) scheduleNextScare();
    }
  });

  // Init
  showOrHideWaiver();

  // Debug helpers
  window.BGT = {
    triggerScare,
    scheduleNextScare,
    isMediaPlaying
  };
})();
