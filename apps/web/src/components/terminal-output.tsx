"use client";

import { Terminal, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface TerminalOutputProps {
  output?: string;
  executionStatus?: string;
  onClear?: () => void;
}

export function TerminalOutput({ output, onClear }: TerminalOutputProps) {
  const [cleared, setCleared] = useState(false);

  const handleClear = () => {
    setCleared(true);
    if (onClear) {
      onClear();
    }
  };

  const currentOutput = cleared ? "" : output;

  return (
    <div className="h-full flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-sm font-mono text-xs text-zinc-200">
      {/* Top Console Bar */}
      <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-400">
          <Terminal className="w-4 h-4 text-zinc-300" />
          <span className="text-[11px] uppercase tracking-wider font-semibold">Execution Console</span>
        </div>

        {/* Clear Console Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-7 px-2 text-zinc-400 hover:text-white hover:bg-zinc-800"
          title="Clear Console Output"
        >
          <div className="flex items-center gap-2 text-zinc-400 hover:text-white">
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-[11px]">Clear</span>
          </div>
        </Button>
      </div>

      {/* Terminal Logs */}
      <div className="flex-1 p-4 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-zinc-300">
        {currentOutput || "Run code to view output logs."}
      </div>
    </div>
  );
}
