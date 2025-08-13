import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ---- Config ----
const DAILY_CAP = 50;             // hard cap for NEW (unseen) videos per day
const SESSION_SOFT_CAP = 5;       // optional soft cap per open session (keep if already used)
const COOLDOWN_MINUTES = 60;      // optional cooldown length for replay mode

// ---- Storage Keys ----
const LS_KEYS = {
  day: "iac.vq.day",
  dailyCount: "iac.vq.dailyCount",
  sessionCount: "iac.vq.sessionCount",
  cooldownUntil: "iac.vq.cooldownUntil",
};

function todayKey() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function readNumber(key, def = 0) {
  const v = window.localStorage.getItem(key);
  const n = v == null ? NaN : Number(v);
  return Number.isFinite(n) ? n : def;
}

export default function useVideoQuota() {
  const [dailyCount, setDailyCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const tickRef = useRef(null);

  // Hydrate & day-rollover reset
  useEffect(() => {
    const dayKey = todayKey();
    const storedDay = window.localStorage.getItem(LS_KEYS.day);
    if (storedDay !== dayKey) {
      window.localStorage.setItem(LS_KEYS.day, dayKey);
      window.localStorage.setItem(LS_KEYS.dailyCount, "0");
      window.localStorage.setItem(LS_KEYS.sessionCount, "0");
      // keep cooldown; daily reset shouldn't clear cooldown
    }
    setDailyCount(readNumber(LS_KEYS.dailyCount, 0));
    setSessionCount(readNumber(LS_KEYS.sessionCount, 0));
    setCooldownUntil(readNumber(LS_KEYS.cooldownUntil, 0));
  }, []);

  // 1s ticker for countdown labels
  useEffect(() => {
    tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  // Derived state
  const inCooldown = useMemo(() => now < cooldownUntil, [now, cooldownUntil]);
  const remainingMs = Math.max(0, cooldownUntil - now);

  const inDailyCap = useMemo(() => dailyCount >= DAILY_CAP, [dailyCount]);
  const hitSessionSoftCap = useMemo(
    () => sessionCount >= SESSION_SOFT_CAP,
    [sessionCount]
  );

  // Mark that a NEW (unseen) video just started playing
  const markNewVideoStarted = useCallback(() => {
    // If already at or beyond daily cap, do not increment.
    if (inDailyCap) return;

    const nextDaily = dailyCount + 1;
    const nextSession = sessionCount + 1;
    setDailyCount(nextDaily);
    setSessionCount(nextSession);
    window.localStorage.setItem(LS_KEYS.dailyCount, String(nextDaily));
    window.localStorage.setItem(LS_KEYS.sessionCount, String(nextSession));
  }, [dailyCount, sessionCount, inDailyCap]);

  // Begin cooldown (Replay Mode)
  const startCooldown = useCallback(() => {
    const until = Date.now() + COOLDOWN_MINUTES * 60 * 1000;
    setCooldownUntil(until);
    window.localStorage.setItem(LS_KEYS.cooldownUntil, String(until));
  }, []);

  // Optional: reset session (on player close)
  const resetSession = useCallback(() => {
    setSessionCount(0);
    window.localStorage.setItem(LS_KEYS.sessionCount, "0");
  }, []);

  const replayCountdownLabel = useMemo(() => {
    const secs = Math.ceil(remainingMs / 1000);
    const m = Math.floor(secs / 60);
    const s = String(secs % 60).padStart(2, "0");
    return `${m}m ${s}s`;
  }, [remainingMs]);

  return {
    // state
    dailyCount,
    sessionCount,
    inCooldown,
    inDailyCap,
    hitSessionSoftCap,

    // actions
    markNewVideoStarted,
    startCooldown,
    resetSession,

    // labels & config
    replayCountdownLabel,
    DAILY_CAP,
    SESSION_SOFT_CAP,
    COOLDOWN_MINUTES,
  };
}


