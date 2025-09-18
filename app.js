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
    // Minimal action: send them to an explanation page (or close modal)
    waiver.style.display = 'none';
    // You might optionally redirect them offsite:
    // window.location.href = 'about:blank';
  });

  // Jumpscare engine
  let scareTimeoutId = null;
  let scareActive = false;

  function isSafeMode() {
    return localStorage.getItem(SAFE_KEY) === '1';
  }

  function isMediaPlaying() {
    // 1) sessionStorage flag can be set by other pages (listen/watch) using their players (we set examples in their pages)
    if (sessionStorage.getItem(PLAY_FLAG) === '1') return true;

    // 2) check for native audio/video playing on this page
    const medias = [...document.querySelectorAll('audio, video')];
    const playing = medias.some(m => {
      return !m.paused && !m.ended && m.currentTime > 0;
    });
    if (playing) return true;

    return false;
  }

  function scheduleNextScare() {
    clearTimeout(scareTimeoutId);
    if (isSafeMode()) return;
    // random between 90 and 180 seconds (ms)
    const ms = (90 + Math.random() * 90) * 1000;
    scareTimeoutId = setTimeout(triggerScareIfAble, ms);
    console.log('[BGT] Next scare scheduled in', Math.round(ms/1000), 's');
  }

  function startJumpscareTimer() {
    // start only if not safe mode and waiver accepted
    if (isSafeMode()) {
      console.log('[BGT] Safe mode enabled - jumpscares disabled');
      return;
    }
    scheduleNextScare();
  }

  async function triggerScareIfAble() {
    if (isSafeMode()) return;
    if (isMediaPlaying()) {
      // if media playing, re-schedule shortly later to poll again
      console.log('[BGT] media playing — deferring scare');
      scareTimeoutId = setTimeout(triggerScareIfAble, 15 * 1000); // check again in 15s
      return;
    }

    triggerScare();
    scheduleNextScare();
  }

  function triggerScare() {
    if (scareActive) return;
    scareActive = true;

    // pick random scare
    const pick = SCARES[Math.floor(Math.random() * SCARES.length)];
    // create image and audio
    overlay.innerHTML = '';
    const img = document.createElement('img');
    img.src = pick.img;
    img.alt = 'scare';
    overlay.appendChild(img);

    // preload audio
    const sfx = new Audio(pick.sfx);
    sfx.preload = 'auto';
    sfx.volume = 1.0;

    // show overlay briefly for a heartbeat — configurable
    overlay.classList.add('active');
    // Play sound slightly offset to create impact
    sfx.play().catch(()=>{ /* autoplay might be blocked; still show frame */ });

    // Very short duration: ~150–350ms
    const duration = 150 + Math.random() * 200;
    setTimeout(() => {
      overlay.classList.remove('active');
      overlay.innerHTML = '';
      scareActive = false;
    }, duration);
  }

  // Pause/resume scheduling when media play flags change.
  // We'll poll for the session flag changes, plus listen to visibility change to avoid showing when not visible.
  let pollInterval = setInterval(() => {
    // If user accepted but safe mode not on and no scheduled, ensure there's a schedule
    const accepted = localStorage.getItem(WAIVER_KEY) === '1';
    if (accepted && !isSafeMode() && !scareTimeoutId) scheduleNextScare();
  }, 10_000);

  // Pause scheduling when page is hidden (browser tab not active)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(scareTimeoutId);
      scareTimeoutId = null;
    } else {
      // when tab becomes visible, reschedule a near scare unless safe mode
      if (!isSafeMode()) scheduleNextScare();
    }
  });

  // On load:
  showOrHideWaiver();

  // Expose for debugging
  window.BGT = {
    triggerScare,
    scheduleNextScare,
    isMediaPlaying
  };
})();
