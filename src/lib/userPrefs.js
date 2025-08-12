// src/lib/userPrefs.js
const LS_KEY = "iac-user-prefs-v1";
const DEFAULTS = {
  likes: {},        // { [videoId]: true }
  dislikes: {},     // { [videoId]: true }
  history: [],      // [{ videoId, title, poster, ts /* ms epoch UTC */, liked: bool|null, disliked: bool|null }]
  avgVideoMB: 8,    // default estimate for cache meter
  cacheCapMB: 300,  // configurable cap for meter (no SW here, just awareness)
  lastHistoryDay: null, // "YYYY-MM-DD" local day we last normalized
};

const load = () => {
  try { return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(LS_KEY)) || {}) }; }
  catch { return { ...DEFAULTS }; }
};
const save = (state) => { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {} };

export function getPrefs() { normalizeHistoryDay(); return load(); }
export function setPrefs(next) { save(next); }

function localDayStr(d = new Date()) {
  // Local midnight YYYY-MM-DD
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

export function normalizeHistoryDay() {
  const s = load();
  const today = localDayStr();
  if (s.lastHistoryDay === today) return;
  // keep only last 24h based on local midnight: drop entries before today's 00:00 local
  const startOfToday = new Date(today + "T00:00:00").getTime();
  s.history = (s.history || []).filter(h => h.ts >= startOfToday);
  s.lastHistoryDay = today;
  save(s);
}

export function markWatched({ videoId, title, poster }) {
  const s = getPrefs();
  const now = Date.now(); // ms UTC
  // Upsert entry for today
  const idx = s.history.findIndex(h => h.videoId === videoId);
  const liked = !!s.likes[videoId];
  const disliked = !!s.dislikes[videoId];
  if (idx >= 0) {
    // Preserve existing poster if new one is null/undefined
    const existingPoster = s.history[idx].poster;
    const finalPoster = poster || existingPoster;
    s.history[idx] = { ...s.history[idx], ts: now, liked, disliked, title, poster: finalPoster };
  } else {
    s.history.unshift({ videoId, title, poster, ts: now, liked, disliked });
    // cap history list to a reasonable length
    if (s.history.length > 500) s.history.length = 500;
  }
  save(s);
}

export function setLike(videoId, on) {
  const s = getPrefs();
  if (on) { s.likes[videoId] = true; delete s.dislikes[videoId]; }
  else { delete s.likes[videoId]; }
  // reflect in history sentiment
  s.history = s.history.map(h => h.videoId === videoId ? { ...h, liked: !!on, disliked: !!s.dislikes[videoId] } : h);
  save(s);
}

export function setDislike(videoId, on) {
  const s = getPrefs();
  if (on) { s.dislikes[videoId] = true; delete s.likes[videoId]; }
  else { delete s.dislikes[videoId]; }
  // reflect in history sentiment
  s.history = s.history.map(h => h.videoId === videoId ? { ...h, disliked: !!on, liked: !!s.likes[videoId] } : h);
  save(s);
}

export function isLiked(videoId)   { return !!getPrefs().likes[videoId]; }
export function isDisliked(videoId){ return !!getPrefs().dislikes[videoId]; }
export function getHistory()       { return getPrefs().history || []; }

export async function getCacheEstimateMB() {
  try {
    if ('storage' in navigator && navigator.storage.estimate) {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      // We only "allocate" a virtual cap for awareness, not real reservation.
      const s = getPrefs();
      const capMB = Math.min(s.cacheCapMB, Math.max(100, Math.floor(quota / (1024*1024*20)) * 20)); // rounds to 20MB steps
      const usedMB = Math.round((usage || 0) / (1024*1024));
      return { usedMB, capMB };
    }
  } catch {}
  const s = getPrefs();
  // Fallback: estimate used by liked count * avg size
  const usedMB = (Object.keys(s.likes).length) * (s.avgVideoMB || 8);
  const capMB = s.cacheCapMB || 300;
  return { usedMB, capMB };
}
