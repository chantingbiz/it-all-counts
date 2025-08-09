import React, { useEffect, useRef } from "react";
import { useSignedS3Url } from "../hooks/useSignedS3Url";

export default function S3VideoPlayer({ s3Key }) {
  const { url, error, loading } = useSignedS3Url(s3Key);
  const videoRef = useRef(null);

  useEffect(() => {
    return () => { try { videoRef.current?.pause(); } catch {} };
  }, [s3Key]);

  if (!s3Key) return <p className="text-white">No video selected.</p>;
  if (loading) return <p className="text-white">Loading video…</p>;
  if (error) return <pre className="text-red-400 whitespace-pre-wrap">{error}</pre>;
  if (!url) return null;

  return (
    <video
      ref={videoRef}
      src={url}
      controls
      className="w-full rounded-lg"
      playsInline
      autoPlay
    />
  );
}


