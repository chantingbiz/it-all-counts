import { useState, useEffect } from "react";

const MotivateButton = () => {
  const [shouldFlash, setShouldFlash] = useState(true); // set to true for demo

  return (
    <button
      className={`px-6 py-2 text-white font-bold rounded ${
        shouldFlash
          ? "bg-red-500 animate-pulse"
          : "bg-blue-600 hover:bg-blue-700"
      }`}
      onClick={() => alert("🔥 Stay focused! You’ve got this!")}
    >
      Motivate Me
    </button>
  );
};

export default MotivateButton;
