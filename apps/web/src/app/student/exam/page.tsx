"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, Clock, KeyRound, Lock, Play, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { CodeMirrorEditor } from "@/components/code-editor";
import { CountdownOverlay } from "@/components/countdown-overlay";
import { ExamStatusOverlay } from "@/components/exam-status-overlay";
import { ProblemDescription } from "@/components/problem-description";
import { ExamHeader } from "@/components/student/student-header";
import { TerminalOutput } from "@/components/terminal-output";
import { pb } from "@/lib/pocketbase";
import { type ExamSession, examService } from "@/lib/services/exam-services";

function ExamWorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessionIdParam = searchParams.get("id") || "";
  const groupCodeParam = searchParams.get("code") || "";

  const [session, setSession] = useState<ExamSession | null>(null);
  const [studentName, setStudentName] = useState("");
  const [code, setCode] = useState<string>(
    '// Write your C code solution here\n#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    return 0;\n}',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(!!sessionIdParam);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [showCountdown, setShowCountdown] = useState(false);

  // Overlay Dismissal State
  const [isOverlayDismissed, setIsOverlayDismissed] = useState(false);
  const prevStatusRef = useRef<string | undefined>(undefined);

  const sessionRef = useRef<ExamSession | null>(null);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Re-trigger overlay popup if session status transitions to a new non-active state
  useEffect(() => {
    if (session?.status && session.status !== "active" && session.status !== prevStatusRef.current) {
      setIsOverlayDismissed(false);
    }
    prevStatusRef.current = session?.status;
  }, [session?.status]);

  const loadSession = useCallback(async () => {
    if (!sessionIdParam) {
      setIsLoadingSession(false);
      return;
    }
    try {
      setIsLoadingSession(true);
      const data = await examService.getSession(sessionIdParam);
      setSession(data);
      if (data.current_code) setCode(data.current_code);
    } catch (err) {
      console.error("Failed to fetch session:", err);
    } finally {
      setIsLoadingSession(false);
    }
  }, [sessionIdParam]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Timeout handler 
  const handleTimeout = useCallback(async () => {
    const curSession = sessionRef.current;
    const curId = curSession?.id || sessionIdParam;

    if (!curId || curSession?.status !== "active") return;

    try {
      await examService.timeoutExam(curId);
      setSession((prev) => (prev ? { ...prev, status: "timeout" } : null));
    } catch (err) {
      console.error("Failed to process exam timeout:", err);
    }
  }, [sessionIdParam]);

  // Automated countdown monitor and reload validator
  useEffect(() => {
    if (session?.status !== "active" || !session?.time_started) return;

    const startTime = new Date(session.time_started).getTime();
    const durationMs = session.time_limit_min * 60 * 1000;
    const expirationTime = startTime + durationMs;

    const checkTimer = () => {
      const now = Date.now();
      if (now >= expirationTime) {
        handleTimeout();
      }
    };

    checkTimer();

    const timerInterval = setInterval(checkTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [session, handleTimeout]);

  const handleStartExamClick = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = studentName.trim();
    if (!trimmedName || !groupCodeParam) return;

    setStartError("");
    setShowCountdown(true);
  };

  const handleCountdownComplete = async () => {
    setShowCountdown(false);
    setIsStarting(true);

    try {
      const activeSession = await examService.startOrResumeSession(studentName.trim(), groupCodeParam);
      setSession(activeSession);
      if (activeSession.current_code) setCode(activeSession.current_code);

      router.replace(`/student/exam?id=${activeSession.id}&code=${encodeURIComponent(groupCodeParam)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start exam session.";
      setStartError(msg);
    } finally {
      setIsStarting(false);
    }
  };

  const activeSessionId = session?.id || sessionIdParam;
  useEffect(() => {
    if (!activeSessionId) return;

    const unsub = pb.collection("exam_sessions").subscribe<ExamSession>(activeSessionId, (e) => {
      setSession((prev) => (prev ? { ...prev, ...e.record } : e.record));
    });

    return () => {
      unsub.then((u) => u());
    };
  }, [activeSessionId]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const handleCodeChange = (newCode: string) => {
    if (session?.status !== "active") return;
    setCode(newCode);
    setIsSaving(true);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const curId = sessionRef.current?.id || sessionIdParam;
      if (curId) {
        await examService.saveCode(curId, newCode);
        setIsSaving(false);
      }
    }, 1500);
  };

  const strikeCountRef = useRef(session?.strike_count || 0);
  useEffect(() => {
    strikeCountRef.current = session?.strike_count || 0;
  }, [session?.strike_count]);

  useEffect(() => {
    const handleBlur = async () => {
      const curSession = sessionRef.current;
      if (curSession?.status !== "active" || !curSession?.expand?.group?.anti_cheat_enabled) {
        return;
      }

      const curId = curSession.id;
      if (!curId) return;
      const currentStrikes = curSession.strike_count ?? strikeCountRef.current;
      const newCount = await examService.incrementStrike(curId, currentStrikes);
      setSession((prev) => (prev ? { ...prev, strike_count: newCount } : null));
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, []);

  const handleRunCode = async () => {
    const curId = session?.id || sessionIdParam;
    if (!curId || session?.status !== "active") return;
    setIsExecuting(true);
    await examService.runCode(curId, code);
    setTimeout(() => setIsExecuting(false), 2000);
  };

  const handleSubmitExam = async () => {
    const curId = session?.id || sessionIdParam;
    if (
      !curId ||
      session?.status !== "active" ||
      !window.confirm("Are you sure you want to finalize your submission?")
    ) {
      return;
    }
    await examService.submitExam(curId, code);
    await loadSession();
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-xs text-zinc-400 bg-zinc-900">
        Loading exam workspace...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4">
        {showCountdown && <CountdownOverlay onComplete={handleCountdownComplete} />}

        <div className="bg-white border border-zinc-200 rounded-2xl p-8 max-w-md w-full shadow-sm space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-1 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-md">
              <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
              <span>ROOM CODE: {groupCodeParam || "N/A"}</span>
            </div>
            <h1 className="text-xl font-bold text-zinc-900 mt-4">Start Your Exam</h1>
            <p className="text-xs text-zinc-500 mt-1">
              Enter your full name to begin. Your examination timer will start immediately upon clicking below.
            </p>
          </div>

          <form onSubmit={handleStartExamClick} className="space-y-4">
            {startError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{startError}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="studentName"
                className="block text-xs font-mono uppercase text-zinc-700 font-medium mb-1.5"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  id="studentName"
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={studentName}
                  disabled={isStarting || showCountdown}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-zinc-900 font-mono placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isStarting || showCountdown || !studentName.trim() || !groupCodeParam}
              className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-bold py-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isStarting ? "Assigning Problem..." : "Start Exam Now"}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Helper config for status banner presentation
  const getStatusBannerConfig = () => {
    switch (session.status) {
      case "timeout":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-900",
          badgeBg: "bg-amber-500/20 text-amber-700 border-amber-500/30",
          icon: <Clock className="w-4 h-4 text-amber-600 shrink-0" />,
          title: "Time Expired",
          desc: "Your exam duration limit has ended. Workspace editing is locked.",
        };
      case "locked_strike":
        return {
          bg: "bg-red-500/10 border-red-500/30 text-red-900",
          badgeBg: "bg-red-500/20 text-red-700 border-red-500/30",
          icon: <Lock className="w-4 h-4 text-red-600 shrink-0" />,
          title: "Exam Locked",
          desc: "Session suspended due to anti-cheat violations.",
        };
      case "submitted":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-900",
          badgeBg: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
          title: "Exam Submitted",
          desc: "Your solution has been submitted and recorded successfully.",
        };
      case "paused":
        return {
          bg: "bg-zinc-500/10 border-zinc-500/30 text-zinc-900",
          badgeBg: "bg-zinc-500/20 text-zinc-700 border-zinc-500/30",
          icon: <AlertTriangle className="w-4 h-4 text-zinc-600 shrink-0" />,
          title: "Session Paused",
          desc: "The instructor has temporarily paused this exam session.",
        };
      default:
        return null;
    }
  };

  const bannerConfig = getStatusBannerConfig();

  return (
    <div className="h-screen flex flex-col bg-zinc-100 font-sans overflow-hidden">
      <ExamHeader
        session={session}
        onRunCode={handleRunCode}
        onSubmitExam={handleSubmitExam}
        isSaving={isSaving}
        isExecuting={isExecuting}
      />

      {/* Inline Status Banner */}
      {session.status !== "active" && bannerConfig && (
        <div className="px-4 pt-3">
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${bannerConfig.bg}`}>
            <div className="flex items-center gap-2.5">
              {bannerConfig.icon}
              <span
                className={`font-mono font-bold uppercase text-[10px] px-2 py-0.5 rounded border ${bannerConfig.badgeBg}`}
              >
                {bannerConfig.title}
              </span>
              <span className="font-medium text-zinc-700">{bannerConfig.desc}</span>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 grid grid-cols-12 gap-4 overflow-hidden">
        <div className="col-span-4 h-full overflow-hidden">
          <ProblemDescription problem={session.expand?.assigned_problem} />
        </div>

        <div className="col-span-8 h-full flex flex-col gap-4 overflow-hidden">
          <div className="flex-[65] overflow-hidden">
            <CodeMirrorEditor value={code} onChange={handleCodeChange} readOnly={session.status !== "active"} />
          </div>

          <div className="flex-[35] overflow-hidden">
            <TerminalOutput output={session.terminal_output} executionStatus={session.execution_status} />
          </div>
        </div>
      </main>

      {/* Dismissible Fullscreen Status Overlay */}
      {!isOverlayDismissed && session.status !== "active" && (
        <ExamStatusOverlay status={session.status} onClose={() => setIsOverlayDismissed(true)} />
      )}
    </div>
  );
}

export default function StudentExamPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-mono text-xs text-zinc-400 bg-zinc-900">
          Loading exam workspace...
        </div>
      }
    >
      <ExamWorkspaceContent />
    </Suspense>
  );
}