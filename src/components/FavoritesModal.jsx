import React, { useEffect, useState } from "react";
import { getFavorites } from "../lib/userPrefs";

export default function FavoritesModal({ open, onClose, resolveVideoMeta, onSelect }) {
  const [favIds, setFavIds] = useState([]);

  useEffect(() => {
    if (!open) return;
    const load = () => setFavIds(getFavorites());
    load();
    const handler = () => load();
    window.addEventListener("iac:favorites:update", handler);
    window.addEventListener("storage", handler); // cross-tab
    return () => {
      window.removeEventListener("iac:favorites:update", handler);
      window.removeEventListener("storage", handler);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1500] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-[92%] max-w-md max-h-[80vh] overflow-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="text-lg font-semibold mb-3">Favorites</div>
        {favIds.length === 0 ? (
          <div className="text-sm text-black/70">No favorites yet.</div>
        ) : (
          <ul className="space-y-2">
            {favIds.map((id) => {
              const meta = resolveVideoMeta ? resolveVideoMeta(id) : { id };
              return (
                <li
                  key={id}
                  className="flex items-center gap-3 p-2 rounded-lg border border-black/10 hover:bg-black/[0.03] cursor-pointer"
                  onClick={() => onSelect?.(id)}
                >
                  {meta.thumbUrl ? (
                    <img src={meta.thumbUrl} alt="" className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-black/10 rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{meta.title || id}</div>
                    <div className="text-xs text-black/60">Tap to play</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4">
          <button
            onClick={onClose}
            className="w-full h-10 rounded-lg bg-black text-white inline-flex items-center justify-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
