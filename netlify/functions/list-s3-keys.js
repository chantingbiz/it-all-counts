import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.IAC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.IAC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.IAC_AWS_SECRET_ACCESS_KEY,
  },
});

export default async (req) => {
  try {
    const url = new URL(req.url);
    const prefix = url.searchParams.get("prefix") || "";
    const rawQ = (url.searchParams.get("q") || "").trim();
    const max = Math.min(parseInt(url.searchParams.get("max") || "500", 10), 1000);
    const terms = rawQ ? rawQ.split(/[|,]/).map(s => s.trim().toLowerCase()).filter(Boolean) : [];

    let ContinuationToken;
    const keys = [];
    do {
      const resp = await s3.send(new ListObjectsV2Command({
        Bucket: process.env.IAC_S3_BUCKET,
        Prefix: prefix,
        ContinuationToken,
        MaxKeys: Math.min(1000, max - keys.length),
      }));
      for (const it of resp.Contents || []) {
        const k = it.Key || "";
        const lk = k.toLowerCase();
        const ok = !terms.length || terms.some(t => lk.includes(t));
        if (ok) keys.push(k);
        if (keys.length >= max) break;
      }
      ContinuationToken = resp.IsTruncated && keys.length < max ? resp.NextContinuationToken : undefined;
    } while (ContinuationToken);

    return new Response(JSON.stringify({ keys }), {
      headers: { "content-type": "application/json" }, status: 200
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "List failed" }), {
      headers: { "content-type": "application/json" }, status: 500
    });
  }
};


