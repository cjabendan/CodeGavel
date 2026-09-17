"use client";

import { Clock, FileText, HardDrive, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Problem } from "@/lib/services/problem-services";

interface ProblemDescriptionProps {
  problem?: Problem;
  onRefresh?: () => void;
}

export function ProblemDescription({ problem, onRefresh }: ProblemDescriptionProps) {
  if (!problem) {
    return (
      <div className="p-6 text-xs text-zinc-400 font-mono text-center flex flex-col items-center gap-3">
        <span>No problem statement loaded.</span>
        {onRefresh && (
          <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-3.5 h-3.5" /> Reload Problem
          </Button>
        )}
      </div>
    );
  }

  // Helper to ensure literal "\n" strings convert into real line breaks
  const formatText = (text: string = "") => text.replaceAll("\\n", "\n");

  return (
    <div className="h-full flex flex-col bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-zinc-700" />
          <h3 className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">Problem Specification</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500 bg-white border border-zinc-200 px-2 py-0.5 rounded">
            <Clock className="w-3 h-3 text-zinc-400" />
            <span>{problem.time_limit_sec}s</span>
            <span className="text-zinc-300">•</span>
            <HardDrive className="w-3 h-3 text-zinc-400" />
            <span>{problem.memory_limit_mb}MB</span>
          </div>
          {onRefresh && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="p-1 h-7 w-7 text-zinc-500 hover:text-zinc-900"
              title="Refresh problem statement"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 p-5 overflow-y-auto space-y-5 font-sans text-xs leading-relaxed text-zinc-700">
        <div>
          <h1 className="text-base font-bold text-zinc-900 mb-2">{problem.title}</h1>
          <p className="whitespace-pre-wrap text-zinc-600">{formatText(problem.description)}</p>
        </div>

        {/* Public Test Cases (Output Only) */}
        <div className="space-y-3 pt-2">
          <h4 className="font-mono uppercase font-bold text-[11px] text-zinc-900 flex items-center gap-1.5">
            Expected Output
          </h4>
          {problem.test_cases?.map((tc, index) => (
            <div
              key={`tc-${problem.id || "prob"}-${tc.output || index}`}
              className="bg-black text-white border border-zinc-800 rounded-lg p-3 font-mono text-[11px] shadow-inner"
            >
              <pre className="whitespace-pre-wrap font-mono leading-relaxed">{formatText(tc.output)}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
