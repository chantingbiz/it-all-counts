import { useEffect, useState } from "react";
import { getVideoUrl } from "../utils/getVideoUrl";

export function useSignedS3Url(key) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!key) { setUrl(""); setError(""); setLoading(false); return; }
    let cancelled = false;
    setLoading(true); setError(""); setUrl("");
    getVideoUrl(key)
      .then(u => { if (!cancelled) setUrl(u); })
      .catch(e => { if (!cancelled) setError(e.message || String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [key]);

  return { url, error, loading };
}




