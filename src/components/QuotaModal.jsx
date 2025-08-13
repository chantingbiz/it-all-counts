import React from "react";

export default function QuotaModal({ open, title, body, onClose }) {
  if (!open) return null;
  return (
    // Lift this well above any player/modal stacks
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      {/* Backdrop also at high z so it intercepts clicks */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      {/* Content above backdrop */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[2001] w-[92%] max-w-sm rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="text-lg font-semibold mb-2">{title}</div>
        <div className="text-sm text-black/80 mb-4">{body}</div>
        <button
          onClick={onClose}
          className="w-full h-10 rounded-lg bg-black text-white inline-flex items-center justify-center"
        >
          Close
        </button>
      </div>
    </div>
  );
}

