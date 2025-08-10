import React, { useState, useEffect } from "react";
import S3VideoPlayer from "./S3VideoPlayer";
import VIDEO_GROUPS from "../data/videoGroups";

export default function MotivateModal({
  selectedGroupIds, toggleGroup,
  keys, loading, error,
  s3Key,
  isDefaultFunOnly,
  onNext,
  poolCount
}) {
  const [showFilters, setShowFilters] = useState(false); // hidden by default

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() === "n") { e.preventDefault(); onNext?.(); }
      if (e.key.toLowerCase() === "f") { e.preventDefault(); setShowFilters(v => !v); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onNext]);

  return (
    <div className="space-y-4 text-white">
      {/* Header row with centered buttons */}
      <div className="flex justify-center gap-4 mt-2">
        <button
          className="px-3 py-1 rounded bg-white/10 border border-white/30 text-sm"
          onClick={() => setShowFilters(v => !v)}
        >
          {showFilters ? "Hide Filters" : "Video Filters"}
        </button>
        <button
          className="px-3 py-1 rounded bg-white text-black text-sm"
          onClick={onNext}
          disabled={loading || (poolCount || 0) < 1}
          title="Play another random video from the current pool"
        >
          Next video
        </button>
      </div>

      {showFilters && (
        <div className="p-4 rounded-xl bg-black/60 border border-white/20 space-y-3">
          <div className="text-base font-medium">Which types of videos to include</div>
          {isDefaultFunOnly && (
            <div className="text-xs">
              <span className="px-2 py-0.5 rounded-full border border-white/30 bg-white/10">
                Default: Fun
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {VIDEO_GROUPS.map(g => {
              const active = selectedGroupIds.has(g.id);
              return (
                <button
                  key={g.id}
                  onClick={() => toggleGroup(g.id)}
                  className={`px-3 py-1 rounded-full border text-sm
                    ${active ? "bg-white text-black border-white" : "bg-black/40 text-white border-white/40"}`}
                  title={g.mood || ""}
                >
                  {g.label}
                </button>
              );
            })}
          </div>

          {/* Last line: mood summary + pool tally */}
          <div className="text-xs">
            {loading ? "loading…" : (
              <>
                <span className="opacity-90">
                  {Array.from(selectedGroupIds).map(id => {
                    const g = VIDEO_GROUPS.find(x => x.id === id);
                    return g ? g.mood : null;
                  }).filter(Boolean).join(" • ") || "—"}
                </span>
                <span className="opacity-90"> • Pool: {poolCount} video{poolCount === 1 ? "" : "s"}</span>
                {error ? <span className="text-red-300"> • {error}</span> : null}
              </>
            )}
          </div>
        </div>
      )}

      <S3VideoPlayer s3Key={s3Key} />
    </div>
  );
}


