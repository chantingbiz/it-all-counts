import React, { useEffect, useRef, useState } from "react";

export default function Modal({ open, onClose, onCloseStart, closeEventName, children }) {
  const cardRef = useRef(null);
  const [capPx, setCapPx] = useState(720); // sensible default

  useEffect(() => {
    const contentEl = document.querySelector("[data-app-content]");
    const updateWidth = () => {
      if (contentEl) setCapPx(Math.round(contentEl.getBoundingClientRect().width));
    };
    updateWidth();
    
    const roW = new ResizeObserver(updateWidth);
    contentEl && roW.observe(contentEl);
    window.addEventListener("resize", updateWidth);
    
    return () => { 
      roW.disconnect(); 
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        onCloseStart?.();
        if (closeEventName) {
          try { document.dispatchEvent(new CustomEvent(closeEventName)); } catch {}
        }
        onClose?.();
      }
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = prev;
      };
    }
  }, [open, onClose, onCloseStart, closeEventName]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => {
          onCloseStart?.();
          if (closeEventName) {
            try { document.dispatchEvent(new CustomEvent(closeEventName)); } catch {}
          }
          onClose?.();
        }}
        aria-hidden="true"
      />
      <div 
        ref={cardRef}
        style={{ maxWidth: capPx ? `${capPx}px` : undefined }}
        className="relative z-[1001] w-[92vw] bg-black rounded-2xl shadow-xl p-3 sm:p-4"
      >
        <button
          onClick={() => {
            onCloseStart?.();
            if (closeEventName) {
              try { document.dispatchEvent(new CustomEvent(closeEventName)); } catch {}
            }
            onClose?.();
          }}
          aria-label="Close"
          className="absolute -top-3 -right-3 bg-white text-black rounded-full px-3 py-1 text-sm shadow"
        >
          ✕
        </button>
        
        {children}
      </div>
    </div>
  );
}




