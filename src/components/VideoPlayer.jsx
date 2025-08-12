import { useEffect, useMemo, useRef, useState } from "react";
import { isLiked, isDisliked, setLike, setDislike, markWatched } from "../lib/userPrefs";

export default function VideoPlayer({
  videoId, dataSrc, poster, title,
  onEnded, onError, onPlayStart,
  onRateLimited, onTryNext, onRequestClose,
  videoMaxH, className = ""
}) {
  const videoRef = useRef(null);
  const [srcSet, setSrcSet] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [showUI, setShowUI] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [showEndBar, setShowEndBar] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [pendingUnmute, setPendingUnmute] = useState(false);
  const [showTapToPlay, setShowTapToPlay] = useState(false);
  const hideTimer = useRef(null);
  const stallRef = useRef(null); // stall watchdog
  
  // Like/Dislike state
  const [liked, setLiked] = useState(isLiked(videoId));
  const [disliked, setDisliked] = useState(isDisliked(videoId));
  
  useEffect(() => { 
    setLiked(isLiked(videoId)); 
    setDisliked(isDisliked(videoId)); 
  }, [videoId]);
  
  const onLike = () => { 
    const next = !liked; 
    setLiked(next); 
    setLike(videoId, next); 
    if (next) { setDisliked(false); } 
  };
  
  const onDislike = () => { 
    const next = !disliked; 
    setDisliked(next); 
    setDislike(videoId, next); 
    if (next) { setLiked(false); } 
  };

  // Thumbnail capture function
  async function capturePosterOnce() {
    if (!videoRef.current) return;
    try {
      const v = videoRef.current;
      const canvas = document.createElement("canvas");
      const w = v.videoWidth, h = v.videoHeight;
      if (!w || !h) return;
      const size = 256; // square thumb
      const scale = Math.min(size / w, size / h);
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#000"; ctx.fillRect(0,0,size,size);
      const dw = w * scale, dh = h * scale;
      const dx = (size - dw) / 2, dy = (size - dh) / 2;
      ctx.drawImage(v, dx, dy, dw, dh);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      // persist to history entry
      markWatched({ videoId, title: title || videoId, poster: dataUrl });
    } catch {}
  }

  const fmt = (t) => {
    const s = Math.max(0, Math.floor(t));
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return h === "00" ? `${m}:${sec}` : `${h}:${m}:${sec}`;
  };

  const markPlayStarted = () => {
    onPlayStart && onPlayStart({ videoId, ts: Date.now() });
    // Mark as watched in user preferences
    markWatched({ videoId, title: title || videoId, poster });
    // Capture thumbnail on first play
    capturePosterOnce();
  };

  const ensureSrcThen = async (fn) => {
    const v = videoRef.current;
    if (!v) return;
    if (!srcSet) {
      v.src = dataSrc;
      try {
        await v.load?.();
      } catch {}
      setSrcSet(true);
    }
    await fn?.(v);
  };

  const play = () => ensureSrcThen(async (v) => {
    await v.play();
  });

  const pause = () => {
    const v = videoRef.current;
    v?.pause();
  };

  const togglePlay = () => (isPlaying ? pause() : play());

  const seek = (t) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(t, v.duration || 0));
  };

  const jump = (d) => seek((videoRef.current?.currentTime || 0) + d);

  const showTemporarily = () => {
    setShowUI(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowUI(false), 2500);
  };

  // Gate starting playback via rate limiter (placeholder for now)
  const gateAndPlay = async () => {
    const v = videoRef.current; if (!v || !dataSrc) return;
    
    // TODO: Implement rate limiter when lib is available
    // For now, allow all playback
    try {
      v.src = dataSrc; 
      v.load();
      v.muted = false;
      await v.play();
      setIsPlaying(true); 
      setIsBuffering(false); 
      setShowEndBar(false); 
      markPlayStarted();
    } catch {
      try {
        v.muted = true;
        await v.play();
        setIsPlaying(true); 
        setIsBuffering(false); 
        setShowEndBar(false); 
        setPendingUnmute(true); 
        markPlayStarted();
      } catch (err) {
        setShowTapToPlay(true);
      }
    }
  };

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  // Attach video event listeners
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onPlay = () => {
      setIsPlaying(true);
      showTemporarily();
    };
    const onPause = () => {
      setIsPlaying(false);
      setShowUI(true);
    };
    const onTime = () => {
      setCurrent(v.currentTime || 0);
    };
    const onLoaded = () => {
      setDuration(v.duration || 0);
    };
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => { 
      setIsBuffering(false); 
      setShowEndBar(false); 
      setShowTapToPlay(false);
    };
    const onCanPlay = () => setIsBuffering(false);
    const onEnd = () => { 
      setIsPlaying(false); 
      setShowUI(true); 
      setShowEndBar(true); 
      onEnded && onEnded({ videoId, ts: Date.now() }); 
    };
    const onErr = () => { 
      setShowErrorToast(true); 
      onError && onError({ videoId, ts: Date.now(), details: v?.error }); 
    };

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("canplaythrough", onCanPlay);
    v.addEventListener("ended", onEnd);
    v.addEventListener("error", onErr);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("canplaythrough", onCanPlay);
      v.removeEventListener("ended", onEnd);
      v.removeEventListener("error", onErr);
    };
  }, [onEnded, onError, videoId]);

  // Stall watchdog: if trying to play and current time doesn't advance for 10s → error toast
  useEffect(() => {
    clearInterval(stallRef.current);
    stallRef.current = setInterval(() => {
      const v = videoRef.current; if (!v) return;
      if (isPlaying && (v.readyState < 2)) {
        // likely buffering; handled by spinner
        return;
      }
    }, 2000);
    return () => clearInterval(stallRef.current);
  }, [isPlaying]);

  // Autoplay on mount/dataSrc change (uses gate)
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoId || !dataSrc) return;
    // Hard reset old media to prevent ghost audio/first-frame flash
    try {
      v.pause();
      v.removeAttribute("src");
      v.load();                 // guarantees previous resource is torn down
      setIsPlaying(false);
      setIsBuffering(true);
      setShowEndBar(false);
      setSrcSet(false);
      setShowTapToPlay(false);
    } catch {}
    // Now gate & start the new one
    gateAndPlay();
  }, [videoId, dataSrc]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
  }, [volume]);

  // Global keys
  useEffect(() => {
    const onKey = (e) => {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
      if (e.key === "Escape") { 
        e.preventDefault(); 
        onRequestClose && onRequestClose(); 
        return; 
      }
      if ([" ", "Spacebar"].includes(e.key) || e.code === "Space" || e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowLeft") {
        jump(-5);
      } else if (e.key === "ArrowRight") {
        jump(5);
      } else if (e.key.toLowerCase() === "j") {
        jump(-10);
      } else if (e.key.toLowerCase() === "l") {
        jump(10);
      }
      showTemporarily();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, onRequestClose]);

  // mobile double-tap
  useEffect(() => {
    let lastLeft = 0,
      lastRight = 0;
    const el = videoRef.current?.parentElement;
    if (!el) return;

    const onTouch = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.changedTouches[0].clientX;
      const left = x < rect.left + rect.width / 2;
      const now = Date.now();

      if (left) {
        if (now - lastLeft < 300) jump(-10);
        lastLeft = now;
      } else {
        if (now - lastRight < 300) jump(10);
        lastRight = now;
      }
      showTemporarily();
    };

    el.addEventListener("touchend", onTouch);
    return () => el.removeEventListener("touchend", onTouch);
  }, []);

  return (
    <div className={`select-none ${className}`}>
      <div className="relative w-full max-w-full overflow-hidden" onMouseMove={showTemporarily} onClick={showTemporarily}>
        <video
          ref={videoRef}
          poster={poster}
          preload="metadata"
          playsInline
          webkit-playsinline="true"
          disablePictureInPicture
          controlsList="nodownload noplaybackrate nofullscreen"
          className="w-full h-auto rounded-lg bg-black object-contain
                     max-h-[62vh] sm:max-h-[64vh] md:max-h-[66vh] lg:max-h-[68vh]"
        />
        
        {/* Remove/disable the old absolute scrubber overlay. Keep spinner/toasts/end bar as-is. */}
        {/* Spinner / toasts / end mini-bar remain positioned absolute inside this wrapper */}
        
        {/* Loading spinner */}
        {isBuffering && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/70 border-t-transparent"></div>
          </div>
        )}

        {/* Error toast + Try next */}
        {showErrorToast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded bg-black/60 text-white text-sm shadow flex items-center gap-3">
            <span>Video error. Try next?</span>
            {onTryNext && <button className="px-2 py-0.5 rounded bg-white/10" onClick={onTryNext}>Next</button>}
          </div>
        )}

        {/* Tap to unmute toast */}
        {pendingUnmute && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded bg-black/60 text-white text-sm shadow">
            Tap to unmute
          </div>
        )}

        {/* Tap to play overlay */}
        {showTapToPlay && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="px-4 py-2 rounded bg-black/70 text-white text-sm shadow">
              Tap to play
            </div>
          </div>
        )}

        {/* End mini bar */}
        {showEndBar && (
          <div className="absolute inset-x-0 bottom-16 z-20 flex items-center justify-center">
            <div className="bg-white text-neutral-900 border border-neutral-200 rounded-full shadow px-3 py-1.5 flex gap-2">
              <button className="px-2 py-0.5 rounded bg-neutral-900 text-white hover:bg-neutral-800"
                      onClick={() => { 
                        seek(0); 
                        setShowEndBar(false); 
                        play(); 
                      }}>Replay</button>
              {onRequestClose && (
                <button className="px-2 py-0.5 rounded border border-neutral-300 hover:bg-neutral-50"
                        onClick={onRequestClose}>Close</button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer controls BELOW video */}
      <div className="mt-2">
        <div className="w-full rounded-xl border border-neutral-200 bg-white/90 text-neutral-900 px-3 py-2">
          {/* Row 1: Play + time (left) | Like/Dislike (right) */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="h-8 px-3 rounded-lg bg-neutral-900 text-white text-xs sm:text-sm hover:bg-neutral-800 flex items-center justify-center leading-none"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>

            <div className="text-xs tabular-nums text-neutral-700 whitespace-nowrap">
              {fmt(current)} / {fmt(duration)}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={onLike}
                className={`h-8 px-3 rounded-lg text-xs sm:text-sm border flex items-center justify-center ${
                  liked 
                    ? "bg-green-600 text-white border-green-600 hover:bg-green-700" 
                    : "bg-black text-white border-neutral-300 hover:bg-neutral-800"
                }`}
                title="Like"
              >
                <span className="text-lg sm:text-xl">👍</span>
              </button>
              <button
                onClick={onDislike}
                className={`h-8 px-3 rounded-lg text-xs sm:text-sm border flex items-center justify-center ${
                  disliked 
                    ? "bg-red-600 text-white border-red-600 hover:bg-red-700" 
                    : "bg-black text-white border-neutral-300 hover:bg-neutral-800"
                }`}
                title="Dislike"
              >
                <span className="text-lg sm:text-xl">👎</span>
              </button>
            </div>
          </div>

          {/* Row 2: scrubber */}
          <div className="mt-1">
            <input
              type="range"
              min={0}
              max={Math.max(1, duration)}
              step="0.1"
              value={Math.min(current, duration || 0)}
              onChange={(e)=>seek(Number(e.target.value))}
              className="w-full iac-range"
            />
          </div>


        </div>
      </div>
      
      <style>{`
        /* Hide native controls everywhere (keep) */
        video::-webkit-media-controls { display:none !important; }
        video::-webkit-media-controls-enclosure { display:none !important; }
        /* Slim range styling */
        .iac-range { height: 12px; }
        .iac-range::-webkit-slider-runnable-track { height: 4px; border-radius: 9999px; background: rgba(0,0,0,0.15); }
        .iac-range::-webkit-slider-thumb { -webkit-appearance: none; height: 14px; width: 14px; border-radius: 9999px; background: #2563eb; margin-top: -5px; }
        .iac-range::-moz-range-track { height: 4px; border-radius: 9999px; background: rgba(0,0,0,0.15); }
        .iac-range::-moz-range-thumb { height: 14px; width: 14px; border: 0; border-radius: 9999px; background: #2563eb; }
      `}</style>
    </div>
  );
}
