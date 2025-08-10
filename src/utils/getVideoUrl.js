export async function getVideoUrl(s3Key) {
  const url = `/.netlify/functions/sign-s3-url?key=${encodeURIComponent(s3Key)}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Expected JSON, got ${ct || "unknown"}: ${text.slice(0,300)}…`);
  }
  const body = await res.json();
  if (!res.ok) throw new Error(`${body?.name || "Error"}: ${body?.error || "Unknown error"}`);
  if (!body?.url) throw new Error("Function responded without a 'url' field.");
  return body.url;
}

