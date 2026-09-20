"use client";

import { CheckCircle2, Clock, Code, HardDrive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Problem } from "@/lib/services/problem-services";

interface ProblemCardProps {
  problem: Problem;
  onDelete: (id: string) => void;
}

export function ProblemCard({ problem, onDelete }: ProblemCardProps) {
  return (
    <div className="bg-white border border-zinc-200 hover:border-zinc-300 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4 transition-all">
      <div>
        {/* Header Metadata */}
        <div className="flex items-center justify-between mb-3">
          <div className="p-1.5 bg-zinc-100 text-zinc-900 rounded-lg">
            <Code className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded">
            <Clock className="w-3 h-3 text-zinc-400" />
            <span>{problem.time_limit_sec}s</span>
            <span className="text-zinc-300">•</span>
            <HardDrive className="w-3 h-3 text-zinc-400" />
            <span>{problem.memory_limit_mb}MB</span>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-sm font-bold text-zinc-900 leading-snug">{problem.title}</h3>
        <p className="text-xs text-zinc-500 line-clamp-3 mt-1.5 leading-relaxed">
          {problem.description || "No description provided."}
        </p>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-zinc-200 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            {Array.isArray(problem.test_cases)
              ? problem.test_cases.length
              : typeof problem.test_cases === "string"
                ? (() => {
                    try {
                      const parsed = JSON.parse(problem.test_cases);
                      return Array.isArray(parsed) ? parsed.length : 0;
                    } catch {
                      return 0;
                    }
                  })()
                : 0}{" "}
            Test Cases
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(problem.id)}
          className="p-1.5 h-auto text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
          title="Delete Problem"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
