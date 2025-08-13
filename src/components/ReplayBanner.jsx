import React from "react";
import RainbowPanel from "./RainbowPanel";

/**
 * ReplayBanner
 * - Renders as a full-width bar UNDER the scrubber row.
 * - Animated rainbow background to make "replay mode" obvious.
 * - Parent should render this directly BELOW the scrubber container.
 *
 * Props:
 *  show: boolean
 *  countdown: string (e.g., "57m 16s")
 */
export default function ReplayBanner({ show, countdown }) {
  if (!show) return null;
  return (
    <RainbowPanel className="w-full mt-0 rounded-lg text-white text-sm font-medium px-3 py-2">
      <div className="flex flex-col items-center justify-center text-center gap-0.5">
        {/* Line 1: static label */}
        <span className="font-semibold">
          Replay Mode — new videos in
        </span>
        {/* Line 2: the countdown value */}
        <span className="font-semibold tabular-nums">
          {countdown}
        </span>
      </div>
    </RainbowPanel>
  );
}
