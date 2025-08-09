import React, { useEffect, useRef, useMemo } from "react";

const TOTAL_CHUNKS = 144; // 24 hours * 6 chunks per hour (10-minute intervals)
const DEG_PER_CHUNK = 360 / TOTAL_CHUNKS; // 2.5 degrees per chunk

const ProgressChart = ({ 
  data = [], // Array of 144 objects with { index, state }
  currentChunkIndex = 0, // Current time segment (0-143)
  currentMode = 'productive' // 'productive' or 'unproductive'
}) => {
  const flashRef = useRef(null);
  const opacityRef = useRef(1);
  const directionRef = useRef(-1);

  // Create SVG path for pie segments
  const createPieSegment = (startAngle, endAngle, radius) => {
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = radius * Math.cos(startRad);
    const y1 = radius * Math.sin(startRad);
    const x2 = radius * Math.cos(endRad);
    const y2 = radius * Math.sin(endRad);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    
    return `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  const getColor = (state) => {
    switch (state) {
      case "productive":
        return "rgba(0, 255, 0, 1)"; // Bright green
      case "unproductive":
        return "rgba(255, 0, 0, 1)"; // Bright red
      case "unused":
      default:
        return "rgba(200, 200, 200, 1)"; // Light gray
    }
  };

  // Generate base segments (excluding current flashing chunk)
  const baseSegments = useMemo(() => {
    const segments = [];
    
    for (let i = 0; i < TOTAL_CHUNKS; i++) {
      // Skip the current flashing chunk
      if (i === currentChunkIndex) continue;

      // Get state from data or use default static data
      let state = "unused";
      if (data[i]) {
        state = data[i].state;
      } else {
        // Default static data for demo
        if (i < 40) state = "productive";
        else if (i < 70) state = "unproductive";
        else state = "unused";
      }

      const startAngle = 90 - i * DEG_PER_CHUNK;
      const endAngle = 90 - (i + 1) * DEG_PER_CHUNK;

      segments.push({
        index: i,
        state,
        startAngle,
        endAngle,
        path: createPieSegment(startAngle, endAngle, 140),
        color: getColor(state),
      });
    }
    return segments;
  }, [data, currentChunkIndex]);

  // Create flashing segment for current time
  const flashSegment = useMemo(() => {
    if (currentChunkIndex < 0 || currentChunkIndex >= TOTAL_CHUNKS) return null;

    const startAngle = 90 - currentChunkIndex * DEG_PER_CHUNK;
    const endAngle = 90 - (currentChunkIndex + 1) * DEG_PER_CHUNK;
    const flashColor = currentMode === 'productive' 
      ? "rgba(0, 255, 100, 1)" // Bright green for productive
      : "rgba(255, 80, 80, 1)"; // Bright red for unproductive

    return {
      index: currentChunkIndex,
      state: currentMode,
      startAngle,
      endAngle,
      path: createPieSegment(startAngle, endAngle, 140),
      color: flashColor,
    };
  }, [currentChunkIndex, currentMode]);

  // Flashing animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      opacityRef.current += directionRef.current * 0.05;
      if (opacityRef.current <= 0.4) {
        opacityRef.current = 0.4;
        directionRef.current = 1;
      }
      if (opacityRef.current >= 1) {
        opacityRef.current = 1;
        directionRef.current = -1;
      }

      if (flashRef.current) {
        flashRef.current.style.opacity = opacityRef.current;
      }
    }, 60);

    return () => clearInterval(interval);
  }, []);

  console.log("ProgressChart rendering:", baseSegments.length, "base segments + 1 flash segment");

  return (
    <div className="w-full h-full aspect-square pointer-events-none">
      {/* Raw SVG Pie Chart - scales with container */}
      <svg
        width="100%"
        height="100%"
        viewBox="-140 -140 280 280"
        style={{
          objectFit: 'contain',
          objectPosition: 'center'
        }}
      >
        {/* Base segments */}
        {baseSegments.map((segment) => (
          <path
            key={`base-${segment.index}`}
            d={segment.path}
            fill={segment.color}
            stroke="none"
          />
        ))}
        
        {/* Flashing current segment */}
        {flashSegment && (
          <path
            key={`flash-${flashSegment.index}`}
            d={flashSegment.path}
            fill={flashSegment.color}
            stroke="none"
            ref={flashRef}
            style={{ opacity: opacityRef.current }}
          />
        )}
      </svg>
    </div>
  );
};

export default ProgressChart;
