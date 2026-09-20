"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, Clock, KeyRound, Lock, Pause, Play, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { CodeMirrorEditor } from "@/components/code-editor";
import { CountdownOverlay } from "@/components/countdown-overlay";
import { ExamStatusOverlay } from "@/components/exam-status-overlay";
import { FullscreenPromptModal } from "@/components/fullscreen-prompt-modal";
import { ProblemDescription } from "@/components/problem-description";
import { ExamHeader } from "@/components/student/student-header";
import { TerminalOutput, type TerminalOutputRef } from "@/components/terminal-output"; // <-- Updated import
import { useAntiCheat } from "@/hooks/use-anti-cheat";
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
    '// Write your C code solution here\n#include <stdio.h>\n\nint main() {\n    int num;\n    printf("Enter number: ");\n    scanf("%d", &num);\n    printf("You entered: %d\\n", num);\n    return 0;\n}',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(!!sessionIdParam);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [showCountdown, setShowCountdown] = useState(false);
  const [isOverlayDismissed, setIsOverlayDismissed] = useState(false);

  const workspaceBoxRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<TerminalOutputRef>(null); // <-- Added Terminal Ref

  const sessionRef = useRef<ExamSession | null>(null);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Reset overlay dismissal when session status updates
  useEffect(() => {
    if (session?.status) {
      setIsOverlayDismissed(false);
    }
  }, [session?.status]);

  const loadSession = useCallback(async () => {
    if (!sessionIdParam) {
      setIsLoadingSession(false);
      return;
    }

    try {
      setIsLoadingSession(true);
      const data = await examService.getSession(sessionIdParam);

      if (!data) {
        window.location.href = "/";
        return;
      }

      setSession(data);

      if (data?.current_code) {
        setCode(data.current_code);
      }
    } catch (err) {
      console.error("Failed to fetch session or session deleted:", err);
      window.location.href = "/";
    } finally {
      setIsLoadingSession(false);
    }
  }, [sessionIdParam]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const antiCheatEnabled = !!session?.expand?.group?.anti_cheat_enabled;

  const { isFullscreen, requestFullscreen } = useAntiCheat({
    sessionId: session?.id || sessionIdParam,
    enabled: antiCheatEnabled,
    status: session?.status || "",
    strikeCount: session?.strike_count || 0,
    onStrikeRecorded: (newStrikeCount) => {
      setSession((prev) => (prev ? { ...prev, strike_count: newStrikeCount } : null));
    },
  });

  // Show the fullscreen prompt whenever anti-cheat is on, the session is
  // active, and the browser is not in fullscreen (initial entry or violation).
  const showFullscreenPrompt = antiCheatEnabled && session?.status === "active" && !isFullscreen;

  // Whether this is a re-entry prompt (student already entered FS once and left).
  const isFullscreenViolation = showFullscreenPrompt && session !== null;

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
      if (e.action === "delete") {
        window.location.href = "/";
        return;
      }
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

  // Updated Run Code Handler to trigger WS Interactive execution
  const handleRunCode = async () => {
    const curId = session?.id || sessionIdParam;
    if (!curId || session?.status !== "active") return;
    setIsExecuting(true);

    terminalRef.current?.runCode();

    setTimeout(() => setIsExecuting(false), 1000);
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

  const renderStatusBanner = () => {
    if (!session || session.status === "active") return null;

    const statusConfigs = {
      waiting: {
        bg: "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400",
        icon: <Clock className="w-4 h-4 text-amber-500 shrink-0" />,
        text: "Exam Lobby Open — Waiting for instructor to start.",
      },
      paused: {
        bg: "bg-zinc-500/10 border-zinc-500/20 text-zinc-700 dark:text-zinc-300",
        icon: <Pause className="w-4 h-4 text-zinc-500 shrink-0" />,
        text: "Exam Paused — The instructor has temporarily paused this session.",
      },
      locked_strike: {
        bg: "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400",
        icon: <Lock className="w-4 h-4 text-red-500 shrink-0" />,
        text: "Exam Locked — Anti-cheat limit exceeded. Your session is locked.",
      },
      timeout: {
        bg: "bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-400",
        icon: <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />,
        text: "Time Expired — The allocated time has ended. Code is read-only.",
      },
      submitted: {
        bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400",
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
        text: "Solution Submitted — Your code was finalized and recorded.",
      },
    };

    const config = statusConfigs[session.status];
    if (!config) return null;

    return (
      <div
        className={`px-4 py-3.5 border-b text-xs font-mono flex items-center justify-between transition-all ${config.bg}`}
      >
        <div className="flex items-center gap-2.5">
          {config.icon}
          <span className="font-medium">{config.text}</span>
        </div>
      </div>
    );
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
                  placeholder="e.g. DOE, JOHN"
                  value={studentName}
                  disabled={isStarting || showCountdown}
                  onChange={(e) => setStudentName(e.target.value.toUpperCase())}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-zinc-900 font-mono placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isStarting || showCountdown || !studentName.trim() || !groupCodeParam}
              className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-bold py-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isStarting ? "Assigning Problem..." : "Start Exam Now"}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div ref={workspaceBoxRef} className="h-screen flex flex-col bg-zinc-100 font-sans overflow-hidden">
      <ExamHeader
        session={session}
        onRunCode={handleRunCode}
        onSubmitExam={handleSubmitExam}
        isSaving={isSaving}
        isExecuting={isExecuting}
      />

      {isOverlayDismissed && renderStatusBanner()}

      <main className="flex-1 p-4 grid grid-cols-12 gap-2 overflow-hidden">
        <div className="col-span-4 h-full overflow-hidden">
          <ProblemDescription problem={session.expand?.assigned_problem} />
        </div>

        <div className="col-span-8 h-full flex flex-col gap-2 overflow-hidden">
          <div className="flex-[65] overflow-hidden">
            <CodeMirrorEditor value={code} onChange={handleCodeChange} readOnly={session.status !== "active"} />
          </div>

          <div className="flex-[35] overflow-hidden">
            <TerminalOutput ref={terminalRef} code={code} />
          </div>
        </div>
      </main>

      {!isOverlayDismissed && <ExamStatusOverlay status={session.status} onClose={() => setIsOverlayDismissed(true)} />}

      {/* Fullscreen enforcement — rendered on top of everything else (z-[60]) */}
      {showFullscreenPrompt && (
        <FullscreenPromptModal isViolation={isFullscreenViolation} onRequestFullscreen={requestFullscreen} />
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
