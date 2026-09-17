"use client";

import { Clock, Code, Shield, Terminal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExamSession } from "@/lib/services/exam-services";

interface Props {
  session: ExamSession | null;
  onClose: () => void;
}

export function CodeViewerModal({ session, onClose }: Props) {
  if (!session) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="p-3 bg-white border border-zinc-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-1 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 text-white p-2 rounded-lg">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">{session.student_name}</h3>
              <p className="text-xs text-zinc-500 font-mono">
                Room: {session.group_code} • Problem: {session.expand?.assigned_problem?.title || "Assigned"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded">
                <Shield className="w-3 h-3" /> {session.strike_count} Strikes
              </span>
              <span className="flex items-center gap-1 bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-1 rounded">
                <Clock className="w-3 h-3" /> {session.time_limit_min} mins
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 h-auto text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="rounded-lg flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-200 overflow-hidden">
          {/* Code View */}
          <div className="md:col-span-2 p-4 flex flex-col bg-zinc-950 text-zinc-100 font-mono text-xs overflow-auto">
            <div className="text-zinc-500 text-[10px] uppercase mb-2 select-none">Live Code Draft</div>
            <pre className="whitespace-pre-wrap font-mono leading-relaxed">
              {session.current_code || "// No code drafted yet."}
            </pre>
          </div>

          {/* Execution Terminal */}
          <div className="p-4 flex flex-col bg-zinc-900 text-zinc-300 font-mono text-xs overflow-auto">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase mb-2 select-none border-b border-zinc-800 pb-2">
              <Terminal className="w-3 h-3" /> Terminal Execution Output
            </div>
            <pre className="whitespace-pre-wrap font-mono text-emerald-400 text-xs">
              {session.terminal_output || "No runtime output recorded."}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
