import { useEffect, useRef } from "react";

export function useShuffleBag(items = []) {
  const bagRef = useRef([]);
  useEffect(() => { bagRef.current = []; }, [JSON.stringify(items)]);
  function reshuffle() {
    bagRef.current = items.slice();
    for (let i = bagRef.current.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bagRef.current[i], bagRef.current[j]] = [bagRef.current[j], bagRef.current[i]];
    }
  }
  function next() {
    if (!bagRef.current.length) reshuffle();
    return bagRef.current.shift() || null;
  }
  return { next, reshuffle };
}


