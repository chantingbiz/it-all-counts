import { useEffect, useState, useCallback } from "react";

const LS_KEY = "iac.pref.onlyFavorites";

export default function usePlaybackPrefs() {
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(LS_KEY);
      if (v === "true") setOnlyFavorites(true);
    } catch {}
  }, []);

  const setPref = useCallback((on) => {
    setOnlyFavorites(!!on);
    try { localStorage.setItem(LS_KEY, on ? "true" : "false"); } catch {}
  }, []);

  return { onlyFavorites, setOnlyFavorites: setPref };
}
