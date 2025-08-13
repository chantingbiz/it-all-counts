import React from "react";

export default function DailyCapBanner({ show }) {
  if (!show) return null;
  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[50]">
      <div className="px-3 py-1 rounded-full bg-black text-white text-xs">
        Replay Mode — new videos tomorrow
      </div>
    </div>
  );
}

