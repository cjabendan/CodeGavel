"use client";

import { useEffect, useState } from "react";

interface CountdownOverlayProps {
  onComplete: () => void;
}

export function CountdownOverlay({ onComplete }: CountdownOverlayProps) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setCount((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [count, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md text-white select-none transition-all">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
        <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold">
          Get Ready! Starting in
        </span>
        <div
          key={count}
          className="text-8xl font-black font-mono text-white animate-in zoom-in-50 fade-in duration-300"
        >
          {count > 0 ? count : "GO!"}
        </div>
      </div>
    </div>
  );
}
