// Netlify Function: List and filter S3 videos
// Node 18+
// Requirements:
// - Env: AWS_REGION, S3_BUCKET, optional S3_PREFIX
// - Query: tokens=(comma or space delimited), mode=(any|all, default any), limit=(default 1000)
// - Filter: video-like extensions mp4|mov|webm|m4v|mkv (case-insensitive)
// - Return: { items: [{ key, url, size, lastModified, tokens: [...] }] }

const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

const VIDEO_EXT_REGEX = /\.(mp4|mov|webm|m4v|mkv)$/i;

function parseTokensParam(value) {
  if (!value) return [];
  // Accept comma or space delimited; split on commas or whitespace
  const parts = String(value)
    .split(/[\s,]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(parts)); // de-dup
}

function extractFilenameTokens(key) {
  // Get filename without prefix and extension, then split by underscore
  const filename = key.split("/").pop() || key;
  const withoutExt = filename.replace(/\.[^.]*$/, "");
  return withoutExt
    .split("_")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

function buildPublicUrl(bucket, region, key) {
  // Public-read URL format (non-accelerate)
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodeURI(key)}`;
}

function passesTokenFilter(fileTokens, requestedTokens, mode) {
  if (!requestedTokens.length) return true;
  const set = new Set(fileTokens);
  if (mode === "all") {
    return requestedTokens.every((t) => set.has(t));
  }
  // any
  return requestedTokens.some((t) => set.has(t));
}

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  try {
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    const AWS_REGION = process.env.AWS_REGION;
    const S3_BUCKET = process.env.S3_BUCKET;
    const S3_PREFIX = process.env.S3_PREFIX || "";

    if (!AWS_REGION || !S3_BUCKET) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing required environment variables" }),
      };
    }

    const url = new URL(event.rawUrl || `https://dummy.local${event.path}?${event.queryStringParameters || ""}`);
    const tokensParam = url.searchParams.get("tokens") || "";
    const mode = (url.searchParams.get("mode") || "any").toLowerCase() === "all" ? "all" : "any";
    const limit = Math.max(1, Math.min(1000, parseInt(url.searchParams.get("limit") || "1000", 10) || 1000));

    const requestedTokens = parseTokensParam(tokensParam);

    const s3 = new S3Client({ region: AWS_REGION });

    let continuationToken = undefined;
    const items = [];

    do {
      const resp = await s3.send(
        new ListObjectsV2Command({
          Bucket: S3_BUCKET,
          Prefix: S3_PREFIX || undefined,
          ContinuationToken: continuationToken,
          MaxKeys: Math.min(1000, limit), // per request
        })
      );

      const contents = resp.Contents || [];
      for (const obj of contents) {
        const key = obj.Key;
        if (!key || !VIDEO_EXT_REGEX.test(key)) continue;

        const fileTokens = extractFilenameTokens(key);
        if (!passesTokenFilter(fileTokens, requestedTokens, mode)) continue;

        items.push({
          key,
          url: buildPublicUrl(S3_BUCKET, AWS_REGION, key),
          size: obj.Size ?? null,
          lastModified: obj.LastModified ? new Date(obj.LastModified).toISOString() : null,
          tokens: fileTokens,
        });

        if (items.length >= limit) break;
      }

      if (items.length >= limit) break;
      continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
    } while (continuationToken);

    // NOTE: If the bucket is not public-read, replace public URL with presigned URL later.
    // TODO: Switch to presigned URLs using @aws-sdk/s3-request-presigner when needed.

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
    };
  } catch (err) {
    console.error("list-videos error", err);
    const status = err.name === "AccessDenied" || err.$metadata?.httpStatusCode === 403 ? 403 : 500;
    return {
      statusCode: status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Failed to list videos" }),
    };
  }
};

