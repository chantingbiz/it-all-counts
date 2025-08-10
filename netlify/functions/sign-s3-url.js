import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.IAC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.IAC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.IAC_AWS_SECRET_ACCESS_KEY,
  },
});

export default async (req) => {
  try {
    const key = new URL(req.url).searchParams.get("key");
    if (!key) {
      return new Response(JSON.stringify({ error: "Missing ?key=" }), { status: 400 });
    }
    const cmd = new GetObjectCommand({ Bucket: process.env.IAC_S3_BUCKET, Key: key });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 900 }); // 15 minutes
    return new Response(JSON.stringify({ url }), { headers: { "content-type": "application/json" }, status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};


