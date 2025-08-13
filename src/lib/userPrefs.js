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

// --- FAVORITES (persist across days) ---
const FAVS_KEY = "iac.favorites"; // array of videoIds (strings)

function emit(evt) {
  try { window.dispatchEvent(new CustomEvent(evt)); } catch {}
}

export function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isFavorite(videoId) {
  const favs = getFavorites();
  return favs.includes(String(videoId));
}

export function setFavorite(videoId, on) {
  if (!videoId) return;
  const favs = new Set(getFavorites());
  if (on) { favs.add(String(videoId)); } else { favs.delete(String(videoId)); }
  localStorage.setItem(FAVS_KEY, JSON.stringify(Array.from(favs)));
  emit("iac:favorites:update");
}

export function addFavorite(videoId) {
  setFavorite(videoId, true);
}

export function removeFavorite(videoId) {
  setFavorite(videoId, false);
}

export function toggleFavorite(videoId) {
  if (!videoId) return;
  const on = !isFavorite(videoId);
  setFavorite(videoId, on); // will emit update
}

// --- HISTORY DAILY RESET at 4 AM ---
const HIST_KEY = "iac.history"; // assuming you already store an array of seen videoIds
const HIST_LAST_RESET = "iac.hist.lastReset"; // epoch ms of last reset

function next4amEpoch(from = Date.now()) {
  const d = new Date(from);
  // target = today 04:00 local; if past 04:00, target = tomorrow 04:00
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 4, 0, 0, 0);
  if (d.getTime() >= target.getTime()) {
    // tomorrow 4am
    target.setDate(target.getDate() + 1);
  }
  return target.getTime();
}

/**
 * Clears history if we crossed a 4 AM boundary since last reset.
 * Call this on app start and before opening the video player.
 */
export function ensureHistoryRollOver() {
  const now = Date.now();
  const last = Number(localStorage.getItem(HIST_LAST_RESET) || 0);

  // If last reset missing, set next 4am from now and bail
  if (!last) {
    localStorage.setItem(HIST_LAST_RESET, String(next4amEpoch(now)));
    return;
  }

  if (now >= last) {
    // time to reset daily history
    try {
      localStorage.setItem(HIST_KEY, JSON.stringify([]));
    } catch { /* ignore */ }
    // schedule next reset at the next 4 AM
    localStorage.setItem(HIST_LAST_RESET, String(next4amEpoch(now)));
  }
}

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
