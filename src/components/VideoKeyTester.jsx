import React, { useState } from "react";
import { getVideoUrl } from "../utils/getVideoUrl";

export default function VideoKeyTester() {
  const [key, setKey] = useState("");
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    setUrl("");
    try {
      const signed = await getVideoUrl(key.trim());
      setUrl(signed);
      console.log("Signed URL:", signed);
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="e.g., final/Intro.mp4"
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={load} style={{ padding: "8px 12px" }}>
          Load
        </button>
      </div>
      {err && <pre style={{ color: "crimson", marginTop: 8 }}>{err}</pre>}
      {url && (
        <div style={{ marginTop: 8 }}>
          <div style={{ wordBreak: "break-all", fontSize: 12 }}>{url}</div>
          <video src={url} controls style={{ width: 640, maxWidth: "100%", marginTop: 8 }} />
        </div>
      )}
    </div>
  );
}




