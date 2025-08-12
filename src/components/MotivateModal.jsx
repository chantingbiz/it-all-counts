import React, { useState, useEffect } from "react";
import VideoPlayer from "./VideoPlayer";
import { useSignedS3Url } from "../hooks/useSignedS3Url";
import VIDEO_GROUPS from "../data/videoGroups";
import HistoryModal from "./HistoryModal";
import { markWatched } from "../lib/userPrefs";

// VideoTopBar Component
function VideoTopBar({ onPrevious, onNext, onFilters, showFilters, loading, poolCount, children }) {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between bg-white px-3 py-2 border-b border-neutral-200">
      {/* Left side - Filters button */}
      <button
        className="h-10 min-h-10 inline-flex items-center justify-center rounded-lg border border-black/10 bg-white/60 backdrop-blur-[6px] leading-none whitespace-nowrap text-sm px-3"
        onClick={onFilters}
      >
        {showFilters ? "Hide Filters" : "Video Filters"}
      </button>

      {/* Right side - Previous and Next buttons */}
      <div className="flex items-center gap-2">
        {/* Previous button - square, icon-only */}
        <button
          onClick={onPrevious}
          disabled={loading}
          className="h-10 min-h-10 w-10 px-0 inline-flex items-center justify-center rounded-lg border border-black/10 bg-black text-white leading-none whitespace-nowrap text-sm"
          aria-label="Previous video"
          title="Previous"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Next button */}
        <button
          onClick={onNext}
          disabled={loading || (poolCount || 0) < 1}
          className="h-10 min-h-10 inline-flex items-center justify-center rounded-lg border border-black/10 bg-black text-white leading-none whitespace-nowrap text-sm px-3"
        >
          Next video
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      
      {/* Additional right buttons passed as children */}
      {children}
    </div>
  );
}

export default function MotivateModal({
  selectedGroupIds, toggleGroup,
  keys, loading, error,
  s3Key,
  isDefaultFunOnly,
  onNext,
  onPrev,
  poolCount,
  onEnded,
  onError,
  onPlayStart,
  onRateLimited,
  onRequestClose
}) {
  const [showFilters, setShowFilters] = useState(false); // hidden by default
  const [showHistory, setShowHistory] = useState(false);
  const { url: videoUrl, error: videoError, loading: videoLoading } = useSignedS3Url(s3Key);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() === "n") { e.preventDefault(); onNext?.(); }
      if (e.key.toLowerCase() === "p") { e.preventDefault(); onPrev?.(); }
      if (e.key.toLowerCase() === "f") { e.preventDefault(); setShowFilters(v => !v); }
      if (e.key.toLowerCase() === "h") { e.preventDefault(); setShowHistory(v => !v); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onNext, onPrev]);

  return (
    <div className="rounded-2xl bg-white text-neutral-900 shadow-xl max-h-[90vh] overflow-y-auto">
      {/* Video Top Bar */}
      <VideoTopBar
        onPrevious={onPrev}
        onNext={onNext}
        onFilters={() => setShowFilters(v => !v)}
        showFilters={showFilters}
        loading={loading}
        poolCount={poolCount}
      />

      {/* Filters section */}
      {showFilters && (
        <div className="p-4 rounded-xl bg-neutral-100 border border-neutral-200 space-y-3">
          <div className="text-base font-medium">Which types of videos to include</div>
          {isDefaultFunOnly && (
            <div className="text-xs">
              <span className="px-2 py-0.5 rounded-full border border-neutral-300 bg-neutral-200 text-neutral-700">
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
                    ${active ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"}`}
                  title={g.mood || ""}
                >
                  {g.label}
                </button>
              );
            })}
          </div>

          {/* Last line: mood summary + pool tally */}
          <div className="text-xs text-neutral-600">
            {loading ? "loading…" : (
              <>
                <span className="opacity-90">
                  {Array.from(selectedGroupIds).map(id => {
                    const g = VIDEO_GROUPS.find(x => x.id === id);
                    return g ? g.mood : null;
                  }).filter(Boolean).join(" • ") || "—"}
                </span>
                <span className="opacity-90"> • Pool: {poolCount} video{poolCount === 1 ? "" : "s"}</span>
                {error ? <span className="text-red-600"> • {error}</span> : null}
              </>
            )}
          </div>
        </div>
      )}

      {/* Video player container with proper spacing */}
      <div className="flex justify-center p-4">
        <VideoPlayer
          videoId={s3Key}
          dataSrc={videoUrl}
          poster={s3Key} // Using videoId as poster for now
          title={s3Key} // Using videoId as title for now
          onEnded={onEnded}
          onError={onError}
          onPlayStart={onPlayStart}
          onRateLimited={onRateLimited}
          onTryNext={onNext}
          onRequestClose={onRequestClose}
          className="w-full rounded-lg"
        />
      </div>
      
      {/* History button below the footer controls */}
      <div className="mt-3 flex justify-end px-4 pb-4">
        <button 
          className="px-3 py-1.5 rounded-xl border border-neutral-300 text-neutral-900 hover:bg-neutral-50" 
          onClick={() => setShowHistory(true)}
        >
          Video History
        </button>
      </div>
      
      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onPlayVideo={(videoId) => { 
          setShowHistory(false); 
          // TODO: Implement playSpecificVideo when available
          console.log("Play specific video:", videoId);
        }}
      />
    </div>
  );
}


