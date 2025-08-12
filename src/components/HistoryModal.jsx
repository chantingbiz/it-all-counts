import { useEffect, useMemo, useState } from "react";
import { getHistory, getPrefs, getCacheEstimateMB, setLike, setDislike } from "../lib/userPrefs";

export default function HistoryModal({ isOpen, onClose, onPlayVideo }) {
  const [tab, setTab] = useState("all"); // all | liked | disliked
  const [rows, setRows] = useState([]);
  const [meter, setMeter] = useState({ usedMB: 0, capMB: 300 });

  useEffect(() => { if (!isOpen) return; refresh(); }, [isOpen]);
  async function refresh() {
    const h = getHistory();
    const s = getPrefs();
    const filtered = h.filter(item => {
      if (tab === "liked") return !!s.likes[item.videoId];
      if (tab === "disliked") return !!s.dislikes[item.videoId];
      return true;
    });
    setRows(filtered);
    const est = await getCacheEstimateMB();
    setMeter(est);
  }
  useEffect(() => { isOpen && refresh(); }, [tab]); // refresh on tab change

  const usedPct = Math.min(100, Math.round((meter.usedMB / Math.max(1, meter.capMB)) * 100));

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-3xl mx-4 rounded-2xl bg-white text-neutral-900 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-3 pt-2 pb-2">
          <div className="flex items-center gap-2">
            <button className={`px-2.5 py-1 rounded-lg text-xs ${tab==="all"?"bg-neutral-900 text-white":"border border-neutral-300"}`} onClick={()=>setTab("all")}>All</button>
            <button className={`px-2.5 py-1 rounded-lg text-xs ${tab==="liked"?"bg-neutral-900 text-white":"border border-neutral-300"}`} onClick={()=>setTab("liked")}>Liked</button>
            <button className={`px-2.5 py-1 rounded-lg text-xs ${tab==="disliked"?"bg-neutral-900 text-white":"border border-neutral-300"}`} onClick={()=>setTab("disliked")}>Disliked</button>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs text-neutral-600">Cache: {meter.usedMB} / {meter.capMB} MB</div>
            <div className="w-24 h-2 rounded bg-neutral-200 overflow-hidden">
              <div className="h-2 bg-blue-600" style={{ width: `${usedPct}%` }} />
            </div>
          </div>
        </div>

        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {rows.length === 0 && <div className="text-sm text-neutral-600">No items here yet.</div>}
          {rows.map(item => (
            <div key={item.videoId} className="rounded-xl border border-neutral-200 overflow-hidden bg-white">
              <div className="aspect-square bg-black">
                {item.poster
                  ? <img src={item.poster} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full grid place-items-center text-white/70 text-xs">No image</div>}
              </div>
              <div className="p-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button className={`px-2 py-1 rounded border text-xs ${item.liked ? "bg-green-600 text-white border-green-600":"border-neutral-300"}`} onClick={()=>{ setLike(item.videoId, !item.liked); refresh(); }}>👍</button>
                  <button className={`px-2 py-1 rounded border text-xs ${item.disliked ? "bg-red-600 text-white border-red-600":"border-neutral-300"}`} onClick={()=>{ setDislike(item.videoId, !item.disliked); refresh(); }}>👎</button>
                </div>
                <button className="px-2 py-1 rounded border text-xs border-neutral-300 hover:bg-neutral-50" onClick={()=>onPlayVideo(item.videoId)}>Play</button>
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-4 py-2 text-right">
          <button className="px-3 py-1.5 rounded-xl border border-neutral-300 text-neutral-900 hover:bg-neutral-50" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
