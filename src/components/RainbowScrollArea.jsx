import React, { useEffect, useRef, useState } from "react";

/**
 * RainbowScrollArea
 * - Wide, animated rainbow scrollbar (Chromium/WebKit) + colored FF scrollbar.
 * - Top/Bottom arrow cues that show only when scrolling is possible.
 * - Click arrows to nudge scroll (or hold mouse for continuous scroll).
 *
 * Usage:
 * <RainbowScrollArea className="max-h-[70vh]">
 *   ...your scrollable modal/player content...
 * </RainbowScrollArea>
 */
export default function RainbowScrollArea({ className = "", children }) {
  const ref = useRef(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setAtTop(el.scrollTop <= 0);
      setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  // Scroll helpers
  const nudge = (dir) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ top: dir * 160, behavior: "smooth" });
  };

  // Press-and-hold scrolling
  const holdTimer = useRef(null);
  const holdStart = (dir) => {
    nudge(dir);
    holdTimer.current = setInterval(() => nudge(dir), 120);
  };
  const holdStop = () => {
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Scoped CSS for rainbow scrollbar + arrows */}
      <style>{`
        @keyframes iac-rainbow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        /* Make room for wider scrollbar (Chromium supports this) */
        .iac-scroll {
          scrollbar-gutter: stable; /* helps layout when scrollbar appears */
        }
        /* WebKit/Blink (Chrome/Edge/Safari) */
        .iac-scroll::-webkit-scrollbar {
          width: 16px; /* WIDER */
        }
        .iac-scroll::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.08);
          border-radius: 8px;
        }
        .iac-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg,
            #ff004d, #ff8a00, #ffd300, #3cff00, #00eaff, #7a00ff, #ff00c8, #ff004d);
          background-size: 600% 600%;
          animation: iac-rainbow 2s linear infinite;
          border-radius: 8px;
          border: 3px solid rgba(255,255,255,0.6); /* gives a "track gap" aura */
        }
        .iac-scroll::-webkit-scrollbar-thumb:hover {
          border-color: rgba(255,255,255,0.9);
        }
        /* Firefox */
        .iac-scroll {
          scrollbar-width: auto; /* makes it wider than thin */
          scrollbar-color: #a020f0 rgba(0,0,0,0.08); /* fallback: bright purple + track */
        }

        /* Arrow cue buttons */
        .iac-arrow {
          position: absolute;
          right: 4px;
          z-index: 5;
          width: 28px; height: 28px;
          border-radius: 9999px;
          background: black;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.92;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          cursor: pointer;
          user-select: none;
        }
        .iac-arrow svg { display: block; }
      `}</style>

      {/* Scrollable area */}
      <div
        ref={ref}
        className="iac-scroll overflow-y-auto"
        // Make sure it inherits rounded corners/background from parent if needed
      >
        {children}
      </div>

      {/* Arrow cues (only show when applicable) */}
      {!atTop && (
        <button
          aria-label="Scroll up"
          className="iac-arrow top-2"
          onMouseDown={() => holdStart(-1)}
          onMouseUp={holdStop}
          onMouseLeave={holdStop}
          onClick={() => nudge(-1)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M12 7l-7 7h14z" />
          </svg>
        </button>
      )}
      {!atBottom && (
        <button
          aria-label="Scroll down"
          className="iac-arrow bottom-2"
          onMouseDown={() => holdStart(1)}
          onMouseUp={holdStop}
          onMouseLeave={holdStop}
          onClick={() => nudge(1)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M12 17l7-7H5z" />
          </svg>
        </button>
      )}
    </div>
  );
}

