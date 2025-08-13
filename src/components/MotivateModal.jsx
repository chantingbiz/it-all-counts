import React, { useState, useEffect, useRef } from "react";
import { flushSync as _flushSync } from "react-dom";
import VideoPlayer from "./VideoPlayer";
import { useSignedS3Url } from "../hooks/useSignedS3Url";
import VIDEO_GROUPS from "../data/videoGroups";
import HistoryModal from "./HistoryModal";
import FavoritesModal from "./FavoritesModal";
import ReplayBanner from "./ReplayBanner";
import { markWatched } from "../lib/userPrefs";
import usePlaybackPrefs from "../hooks/usePlaybackPrefs";

// VideoTopBar Component
function VideoTopBar({ onPrevious, onNext, onFilters, showFilters, loading, poolCount, children, onVideoSwitch }) {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between bg-white px-3 py-2 border-b border-neutral-200">
      {/* Left side - Filters button */}
      <button
        className="h-8 px-2 text-xs md:h-10 md:px-3 md:text-sm inline-flex items-center justify-center rounded-lg border border-black/10 bg-white/60 backdrop-blur-[6px] leading-none whitespace-nowrap"
        onClick={onFilters}
      >
        {showFilters ? "Hide Filters" : "Video Filters"}
      </button>

      {/* Right side - Previous and Next buttons */}
      <div className="flex items-center gap-2">
        {/* Previous button - square, icon-only */}
        <button
          onClick={() => {
            onPrevious?.();
            // Handle video switching if callback provided
            if (onVideoSwitch) {
              // Get previous video URL - this would need to be implemented based on your video source logic
              // For now, just call the handler
              onVideoSwitch();
            }
          }}
          disabled={loading}
          className="h-8 w-8 md:h-10 md:w-10 px-0 inline-flex items-center justify-center rounded-lg border border-black/10 bg-black text-white leading-none whitespace-nowrap text-sm"
          aria-label="Previous video"
          title="Previous"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Next button */}
        <button
          onClick={() => {
            onNext?.();
            // Handle video switching if callback provided
            if (onVideoSwitch) {
              // Get next video URL - this would need to be implemented based on your video source logic
              // For now, just call the handler
              onVideoSwitch();
            }
          }}
          disabled={loading || (poolCount || 0) < 1}
          className="h-8 px-2 text-xs md:h-10 md:px-3 md:text-sm inline-flex items-center justify-center rounded-lg border border-black/10 bg-black text-white leading-none whitespace-nowrap"
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
  onRequestClose,
  inCooldown,
  inDailyCap,
  replayCountdownLabel
}) {
  const [showFilters, setShowFilters] = useState(false); // hidden by default
  const [showHistory, setShowHistory] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const { url: videoUrl, error: videoError, loading: videoLoading } = useSignedS3Url(s3Key);
  const { onlyFavorites, setOnlyFavorites } = usePlaybackPrefs();
  const videoRef = useRef(null);
  
  // Track audio state from VideoPlayer
  const [audioState, setAudioState] = useState({ audioUnlocked: false, userMuted: false });
  
  // Safe flushSync wrapper
  const flush = typeof _flushSync === 'function' ? _flushSync : (fn) => fn();
  
  // Audio unlock helper
  let audioUnlocked = false, audioCtx = null;
  async function unlockAudioOnce() {
    if (audioUnlocked) return true;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) { audioUnlocked = true; return true; }
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state !== 'running') { try { await audioCtx.resume(); } catch(e){} }
    audioUnlocked = (audioCtx.state === 'running'); return audioUnlocked;
  }

  // Handle video opening with audio unlock
  useEffect(() => {
    if (videoUrl && videoRef.current) {
      // Use safe flush wrapper to open modal, then immediately unlock audio and start unmuted
      flush(() => {
        // Modal is now open
      });
      
      // Immediately try to unlock audio and start unmuted
      const startUnmuted = async () => {
        try {
          const v = videoRef?.current;
          if (v) {
            await unlockAudioOnce?.();
            v.muted = false;
            try { 
              await v.play(); 
            } catch { 
              v.muted = true; 
              try { 
                await v.play(); 
              } catch {} 
            }
          } else {
            // Fallback if ref not ready synchronously
            setTimeout(async () => {
              const vv = videoRef?.current;
              if (!vv) return;
              try {
                await unlockAudioOnce?.();
                vv.muted = false;
                try { 
                  await vv.play(); 
                } catch { 
                  vv.muted = true; 
                  try { 
                    await vv.play(); 
                  } catch {} 
                }
              } catch (e) {
                console.warn("Fallback audio unlock failed:", e);
              }
            }, 0);
          }
        } catch (e) {
          console.warn("Audio unlock failed:", e);
        }
      };
      
      startUnmuted();
    }
  }, [videoUrl]);

  // Handle video switching (next/prev) - reuse same video element
  const handleVideoSwitch = async (nextUrl) => {
    try {
      if (!videoRef.current) return;
      
      const v = videoRef.current;
      v.pause();
      v.src = nextUrl;
      v.load();
      
      const preferUnmuted = audioState.audioUnlocked && !audioState.userMuted;
      v.muted = !preferUnmuted;
      
      try {
        await v.play();
      } catch {
        // Fallback ONLY if we attempted unmuted
        if (preferUnmuted) {
          v.muted = true;
          try { await v.play(); } catch {}
        }
      }
    } catch (e) {
      console.warn("Video switch failed:", e);
    }
  };

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
    <div className="rounded-2xl bg-white text-neutral-900 shadow-xl max-h-[90vh] flex flex-col min-h-0 pb-5 sm:pb-6">
      {/* Video Top Bar */}
      <VideoTopBar
        onPrevious={onPrev}
        onNext={onNext}
        onFilters={() => setShowFilters(v => !v)}
        showFilters={showFilters}
        loading={loading}
        poolCount={poolCount}
        onVideoSwitch={handleVideoSwitch}
      />

      {/* Scrollable content area */}
      <div 
        className="overflow-y-auto max-h-[80vh] md:max-h-[85vh] min-h-0 flex-1 iac-video-popup-scroll"
        style={{ scrollbarGutter: 'stable both-edges' }}
      >
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
        <div className="flex justify-center px-4 pt-4 pb-0">
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
            videoRef={videoRef}
            onAudioStateChange={setAudioState}
          />
        </div>

        {/* BELOW the video frame; this wraps the three blocks */}
        <div id="player-controls-stack" className="flex flex-col space-y-3 sm:space-y-4 px-4">
          {/* 1) Play/Scrubber block (unchanged content, just ensure no mt/mb here) */}
          <div id="play-scrubber-block" className="mt-0 mb-0 pb-0">
            {/* REPLAY BANNER BELOW SCRUBBER */}
            <ReplayBanner show={inCooldown && !inDailyCap} countdown={replayCountdownLabel} />
          </div>

          {/* 2) History / Favorites buttons row */}
          <div id="history-favorites-row" className="flex justify-center gap-3 mt-0 mb-0">
            <button 
              className="px-4 py-1.5 rounded-lg bg-white text-black border border-black/10 inline-flex items-center justify-center font-medium hover:bg-gray-50 text-sm md:text-base" 
              onClick={() => setShowHistory(true)}
            >
              History
            </button>

            <button 
              className="px-4 py-1.5 rounded-lg bg-white text-black border border-black/10 inline-flex items-center justify-center font-medium hover:bg-gray-50 text-sm md:text-base" 
              onClick={() => setShowFavorites(true)}
            >
              Favorites
            </button>
          </div>

          {/* 3) Toggle row */}
          <div id="favorites-toggle-row" className="flex items-center justify-center gap-3 sm:gap-4 text-center mt-0 mb-0">
            <span className="text-sm md:text-base whitespace-nowrap">Only play videos from Favorites</span>

            <button
              type="button"
              aria-pressed={onlyFavorites}
              onClick={() => {
                setOnlyFavorites(prev => {
                  const next = !prev;
                  // call your filter/applyFavorites(next) here if you have it
                  return next;
                });
              }}
              className={[
                "shrink-0",                     // don't let it grow apart from the label
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none",
                onlyFavorites ? "bg-green-500" : "bg-red-500"
              ].join(" ")}
            >
              <span className="sr-only">Only play videos from Favorites</span>
              {/* inner track padding to keep knob inset */}
              <span className="absolute inset-0 rounded-full p-0.5">
                <span
                  className={[
                    "block h-5 w-5 rounded-full bg-white transition-transform duration-200",
                    // LEFT when off, RIGHT when on — these distances keep the knob fully inside the 44px track
                    onlyFavorites ? "translate-x-5" : "translate-x-0"
                  ].join(" ")}
                />
              </span>
            </button>
          </div>
        </div>
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

      <FavoritesModal
        open={showFavorites}
        onClose={() => setShowFavorites(false)}
        resolveVideoMeta={(videoId) => {
          // For now, just return basic info. You can enhance this later
          return { id: videoId, title: videoId, thumbUrl: null };
        }}
        onSelect={(videoId) => {
          // load & play that specific video
          // TODO: Implement playSpecificVideo when available
          console.log("Play specific video:", videoId);
        }}
      />
      
      {/* Charcoal gray scrollbar styling for video popup only */}
      <style>{`
        /* Charcoal gray, thicker scrollbar styling */
        .iac-video-popup-scroll::-webkit-scrollbar {
          width: 20px; /* thicker for visibility */
        }

        .iac-video-popup-scroll::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05); /* subtle track */
          border-radius: 10px;
        }

        .iac-video-popup-scroll::-webkit-scrollbar-thumb {
          background: #444; /* charcoal gray */
          border-radius: 10px;
        }

        .iac-video-popup-scroll::-webkit-scrollbar-thumb:hover {
          background: #333; /* slightly darker on hover */
        }

        /* Scrollbar arrows */
        .iac-video-popup-scroll::-webkit-scrollbar-button {
          background: #444; /* same charcoal gray as thumb */
          display: block;
          height: 20px;
        }

        .iac-video-popup-scroll::-webkit-scrollbar-button:hover {
          background: #333; /* slightly darker on hover */
        }

        /* Firefox fallback */
        .iac-video-popup-scroll {
          scrollbar-width: auto;
          scrollbar-color: #444 rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  );
}


