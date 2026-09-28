"use client";

import { Maximize, ShieldAlert } from "lucide-react";

interface FullscreenPromptModalProps {
  isViolation?: boolean;
  onRequestFullscreen: () => Promise<void>;
}

export function FullscreenPromptModal({ isViolation = false, onRequestFullscreen }: FullscreenPromptModalProps) {
  return (
    <div className="fixed inset-0 z-[60] bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-sm p-8 text-center shadow-2xl space-y-5">
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
            isViolation ? "bg-red-100 text-red-600" : "bg-zinc-900 text-white"
          }`}
        >
          {isViolation ? <ShieldAlert className="w-7 h-7" /> : <Maximize className="w-7 h-7" />}
        </div>

        {/* Heading */}
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-zinc-900">
            {isViolation ? "Fullscreen Violation Detected" : "Fullscreen Required"}
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {isViolation
              ? "You exited fullscreen mode. A strike has been recorded. Return to fullscreen immediately to continue your exam."
              : "This exam requires your browser to be in fullscreen mode. Click the button below to continue."}
          </p>
        </div>

        {/* Warning pill */}
        {isViolation && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-[11px] font-mono font-semibold text-red-700 uppercase tracking-wide">
            <ShieldAlert className="w-3.5 h-3.5" />
            Strike Recorded
          </div>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={onRequestFullscreen}
          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 mt-2"
        >
          <Maximize className="w-4 h-4" />
          Enter Fullscreen
        </button>
      </div>
    </div>
  );
}
