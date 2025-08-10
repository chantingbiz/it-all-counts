import { useEffect, useState } from "react";

export function useS3Keys({ prefix = "clips/", q = "", max = 500 } = {}) {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true); setError(""); setKeys([]);
      try {
        const qParam = Array.isArray(q) ? q.join(",") : String(q || "");
        const p = new URLSearchParams({ prefix, q: qParam, max: String(max) }).toString();
        const res = await fetch(`/.netlify/functions/list-s3-keys?${p}`, { headers: { accept: "application/json" } });
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) throw new Error("Non-JSON response from list-s3-keys");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "List failed");
        if (!cancelled) setKeys(Array.isArray(data.keys) ? data.keys : []);
      } catch (e) {
        if (!cancelled) setError(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    // re-run when the array contents change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix, Array.isArray(q) ? q.join(",") : q, max]);

  return { keys, loading, error };
}


