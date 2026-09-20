"use client";

import { Check, Clock, Code, Copy, Eye, EyeOff, Shield, Terminal, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ExamSession } from "@/lib/services/exam-services";

interface Props {
  session: ExamSession | null;
  onClose: () => void;
}

export function CodeViewerModal({ session, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [showExpectedOutput, setShowExpectedOutput] = useState(false);

  if (!session) return null;

  const assignedProblem = session.expand?.assigned_problem;

  const formatText = (text: string = "") => text.replaceAll("\\n", "\n");

  const handleCopyCode = async () => {
    if (!session.current_code) return;
    try {
      await navigator.clipboard.writeText(session.current_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code: ", err);
    }
  };

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
                Room: {session.group_code} • Problem: {assignedProblem?.title || "Assigned"}
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
            <div className="flex items-center justify-between mb-4 select-none border-b border-zinc-800 pb-2">
              <span className="text-zinc-100 text-[10px] uppercase font-semibold">Live Code Draft</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                disabled={!session.current_code}
                className="h-6 px-2 text-[11px] bg-zinc-400/10 hover:bg-zinc-800 flex items-center gap-1.5 rounded transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-zinc-100" />
                    <span className="text-zinc-100 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-zinc-100" />
                    <span className="text-zinc-100">Copy Code</span>
                  </>
                )}
              </Button>
            </div>
            <pre className="whitespace-pre-wrap font-mono leading-relaxed flex-1">
              {session.current_code || "// No code drafted yet."}
            </pre>
          </div>

          {/* Right Column: Execution Terminal & Expected Output */}
          <div className="p-4 flex flex-col bg-zinc-900 text-zinc-300 font-mono text-xs overflow-auto gap-4">
            {/* Terminal Output */}
            <div className="flex flex-col flex-1 min-h-[140px]">
              <div className="flex items-center gap-1.5 text-zinc-100 text-[11px] uppercase mb-2 select-none border-b border-zinc-800 pb-2 font-semibold">
                <Terminal className="w-4 h-4" /> Terminal Output
              </div>
              <pre className="whitespace-pre-wrap font-mono text-emerald-400 text-xs flex-1 overflow-auto">
                {session.terminal_output || "No runtime output recorded."}
              </pre>
            </div>

            {/* Collapsible Expected Output */}
            <div className="border-t border-zinc-800 pt-3 flex flex-col shrink-0">
              <div className="flex items-center justify-end select-none">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExpectedOutput((prev) => !prev)}
                  className="h-6 px-2 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-100 hover:text-white flex items-center gap-1 rounded transition"
                >
                  {showExpectedOutput ? (
                    <EyeOff className="w-3 h-3 text-zinc-500" />
                  ) : (
                    <Eye className="w-3 h-3 text-zinc-300" />
                  )}
                  <span className={`${showExpectedOutput ? "text-zinc-400" : "text-zinc-300"}`}>
                    {showExpectedOutput ? "Hide Expected Output" : "Show Expected Output"}
                  </span>
                </Button>
              </div>

              {showExpectedOutput && (
                <div className="mt-3 space-y-2 max-h-[180px] overflow-y-auto animate-in fade-in duration-150">
                  {assignedProblem?.test_cases && assignedProblem.test_cases.length > 0 ? (
                    assignedProblem.test_cases.map((tc, index) => (
                      <div
                        key={`tc-${assignedProblem.id || "prob"}-${tc.input}-${tc.output}`}
                        className="bg-black/60 border border-zinc-800 rounded-lg p-2.5 text-[11px]"
                      >
                        {assignedProblem.test_cases.length > 1 && (
                          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block mb-1">
                            Test Case #{index + 1}
                          </span>
                        )}
                        <pre className="whitespace-pre-wrap text-zinc-300 font-mono leading-relaxed">
                          {formatText(tc.output)}
                        </pre>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-500 text-[11px] italic py-1">No expected output specified.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
