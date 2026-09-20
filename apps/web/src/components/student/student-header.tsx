"use client";

import { Clock, LogOut, Play, Send, ShieldAlert, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ExamSession } from "@/lib/services/exam-services";

interface ExamHeaderProps {
  session: ExamSession;
  onRunCode: () => void;
  onSubmitExam: () => void;
  isSaving: boolean;
  isExecuting: boolean;
}

export function ExamHeader({ session, onRunCode, onSubmitExam, isSaving, isExecuting }: ExamHeaderProps) {
  const router = useRouter();
  const [timeLeftStr, setTimeLeftStr] = useState<string>("--:--");

  useEffect(() => {
    if (!session.time_started) return;

    const startTime = new Date(session.time_started).getTime();
    const durationMs = session.time_limit_min * 60 * 1000;
    const endTime = startTime + durationMs;

    const updateTimer = () => {
      let nowMs = Date.now();
      if (session.status !== "active") {
        if (session.paused_at) {
          nowMs = new Date(session.paused_at).getTime();
        } else if (session.updated) {
          nowMs = new Date(session.updated).getTime();
        }
      }

      const diff = endTime - nowMs;

      if (diff <= 0) {
        setTimeLeftStr("00:00");
        return false;
      }

      const mins = Math.floor(diff / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeftStr(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
      return true;
    };

    updateTimer();

    if (session.status === "active") {
      const interval = setInterval(() => {
        const active = updateTimer();
        if (!active) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [session.time_started, session.time_limit_min, session.status, session.paused_at, session.updated]);

  return (
    <header className="bg-white border-b border-zinc-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
      {/* Student & Session Info */}
      <div className="flex items-center gap-4">
        <div className="p-2 bg-zinc-900 text-white rounded-xl">
          <User className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-xs font-bold text-zinc-900">{session.student_name}</h2>
          <p className="text-[11px] font-mono text-zinc-500">
            Group: <span className="font-semibold text-zinc-800">{session.group_code}</span>
          </p>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="flex items-center gap-3">
        {/* Anti-cheat Strike Counter */}
        {session.expand?.group?.anti_cheat_enabled && (
          <div className="flex items-center gap-1.5 font-mono text-xs px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Strikes: {session.strike_count}/3</span>
          </div>
        )}

        {/* Countdown Timer */}
        <div className="flex items-center gap-1.5 font-mono text-xs px-3 py-1 bg-zinc-100 border border-zinc-200 text-zinc-800 rounded-lg font-bold">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span>{timeLeftStr}</span>
        </div>

        {/* Auto-save Status */}
        <span className="text-[11px] font-mono text-zinc-400">{isSaving ? "Saving..." : "Saved"}</span>
      </div>

      {/* Control Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRunCode}
          isLoading={isExecuting}
          disabled={isExecuting || session.status !== "active"}
          className="text-zinc-800"
        >
          {!isExecuting && <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />}
          <span>Run Tests</span>
        </Button>

        {session.status === "active" ? (
          <Button type="button" variant="primary" size="sm" onClick={onSubmitExam}>
            <Send className="w-3.5 h-3.5" />
            <span>Submit Solution</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/")}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Exam</span>
          </Button>
        )}
      </div>
    </header>
  );
}
