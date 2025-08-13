import React from "react";

/** RainbowPanel
 * Wrap any children with the fast rainbow background (same as Replay banner).
 * Add your own sizing/layout with className.
 */
export default function RainbowPanel({ className = "", children }) {
  return (
    <>
      <style>{`
        @keyframes iac-rainbow {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .iac-rainbow {
          background: linear-gradient(90deg,
            #ff004d, #ff8a00, #ffd300, #3cff00, #00eaff, #7a00ff, #ff00c8, #ff004d);
          background-size: 600% 600%;
          animation: iac-rainbow 2s linear infinite;
        }
      `}</style>
      <div className={`iac-rainbow ${className}`}>
        {children}
      </div>
    </>
  );
}

