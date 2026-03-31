(function() {
  'use strict';

  const CONFIG = window.VimeoAnalyticsConfig || {};
  const ENDPOINT = CONFIG.endpoint || '/api/events';
  const IFRAME_SELECTOR = CONFIG.iframeSelector || 'iframe[src*="vimeo.com"]';
  const TIMEUPDATE_INTERVAL = 5; // seconds

  // Generate fingerprint from browser signals
  function generateFingerprint() {
    const signals = [
      navigator.userAgent,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.platform,
      navigator.hardwareConcurrency || 'unknown',
      navigator.language,
    ].join('|');
    let hash = 0;
    for (let i = 0; i < signals.length; i++) {
      const char = signals.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'fp_' + Math.abs(hash).toString(36);
  }

  // Get or create fingerprint (persist in storage)
  function getFingerprint() {
    let fp = sessionStorage.getItem('vda_fingerprint') || localStorage.getItem('vda_fingerprint');
    if (!fp) {
      fp = generateFingerprint();
    }
    sessionStorage.setItem('vda_fingerprint', fp);
    localStorage.setItem('vda_fingerprint', fp);
    return fp;
  }

  const SESSION_ID = crypto.randomUUID();
  const FINGERPRINT_ID = getFingerprint();
  let VIDEO_ID = null;
  let VIDEO_DURATION = null;
  let lastTimeupdateSent = 0;
  let lastKnownPlayhead = 0; // Cache for beforeunload

  function getViewerId() {
    if (window.VimeoAnalyticsConfig?.viewerId) {
      return window.VimeoAnalyticsConfig.viewerId;
    }
    try {
      const stored = localStorage.getItem('vidharbor_viewer');
      if (stored) {
        const { email, expires } = JSON.parse(stored);
        if (email && (!expires || Date.now() < expires)) {
          return email;
        }
      }
    } catch {
      // ignore parse errors
    }
    return null;
  }

  function sendEvent(eventType, payload) {
    lastKnownPlayhead = payload.seconds || lastKnownPlayhead; // Update cache on any event with playhead
    const data = {
      session_id: SESSION_ID,
      fingerprint_id: FINGERPRINT_ID,
      video_id: VIDEO_ID,
      viewer_id: getViewerId(),
      embed_url: window.location.href,
      event_type: eventType,
      playhead: payload.seconds || 0,
      timestamp: new Date().toISOString(),
      video_duration: VIDEO_DURATION,
      is_live: !!CONFIG.isLive,
      payload: payload,
    };

    // Use sendBeacon for reliability, fall back to fetch
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    if (!navigator.sendBeacon(ENDPOINT, blob)) {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(() => {});
    }
  }

  // Find first Vimeo iframe
  const iframe = document.querySelector(IFRAME_SELECTOR);
  if (!iframe) {
    console.warn('[VimeoDeepAnalytics] No Vimeo iframe found');
    return;
  }

  const player = new Vimeo.Player(iframe);

  // Get video metadata
  Promise.all([player.getVideoId(), player.getDuration()]).then(([id, dur]) => {
    VIDEO_ID = String(id);
    VIDEO_DURATION = dur;
  });

  // Event listeners
  player.on('play', (data) => {
    sendEvent('play', { seconds: data.seconds, duration: data.duration, percent: data.percent });
  });

  player.on('pause', (data) => {
    sendEvent('pause', { seconds: data.seconds, duration: data.duration, percent: data.percent });
  });

  player.on('ended', (data) => {
    sendEvent('ended', { seconds: data.seconds, duration: data.duration, percent: data.percent });
  });

  player.on('seeked', (data) => {
    sendEvent('seeked', { seconds: data.seconds, duration: data.duration, percent: data.percent });
  });

  player.on('timeupdate', (data) => {
    lastKnownPlayhead = data.seconds; // Always cache latest playhead
    const now = data.seconds;
    if (now - lastTimeupdateSent >= TIMEUPDATE_INTERVAL) {
      lastTimeupdateSent = now;
      sendEvent('timeupdate', { seconds: data.seconds, duration: data.duration, percent: data.percent });
    }
  });

  player.on('qualitychange', (data) => {
    sendEvent('qualitychange', { quality: data.quality });
  });

  player.on('texttrackchange', (data) => {
    sendEvent('texttrackchange', { kind: data.kind, label: data.label, language: data.language });
  });

  player.on('volumechange', (data) => {
    sendEvent('volumechange', { volume: data.volume });
  });

  player.on('bufferstart', () => {
    player.getCurrentTime().then(seconds => {
      sendEvent('bufferstart', { seconds });
    });
  });

  player.on('bufferend', () => {
    player.getCurrentTime().then(seconds => {
      sendEvent('bufferend', { seconds });
    });
  });

  // Session end on page unload — use cached playhead to avoid async race condition
  window.addEventListener('beforeunload', () => {
    const data = {
      session_id: SESSION_ID,
      fingerprint_id: FINGERPRINT_ID,
      video_id: VIDEO_ID,
      viewer_id: getViewerId(),
      embed_url: window.location.href,
      event_type: 'session_end',
      playhead: lastKnownPlayhead,
      timestamp: new Date().toISOString(),
      video_duration: VIDEO_DURATION,
      is_live: !!CONFIG.isLive,
      payload: { seconds: lastKnownPlayhead },
    };
    navigator.sendBeacon(ENDPOINT, new Blob([JSON.stringify(data)], { type: 'application/json' }));
  });
})();
