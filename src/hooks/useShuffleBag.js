import { useEffect, useRef } from "react";

export function useShuffleBag(items = []) {
  const bagRef = useRef([]);
  const historyRef = useRef([]);
  const currentIndexRef = useRef(-1);
  
  useEffect(() => { 
    bagRef.current = []; 
    historyRef.current = [];
    currentIndexRef.current = -1;
  }, [JSON.stringify(items)]);
  
  function reshuffle() {
    bagRef.current = items.slice();
    for (let i = bagRef.current.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bagRef.current[i], bagRef.current[j]] = [bagRef.current[j], bagRef.current[i]];
    }
  }
  
  function next() {
    if (!bagRef.current.length) reshuffle();
    const item = bagRef.current.shift() || null;
    if (item) {
      historyRef.current.push(item);
      currentIndexRef.current = historyRef.current.length - 1;
    }
    return item;
  }
  
  function prev() {
    if (currentIndexRef.current > 0) {
      currentIndexRef.current--;
      return historyRef.current[currentIndexRef.current];
    }
    return null;
  }
  
  return { next, prev, reshuffle };
}


