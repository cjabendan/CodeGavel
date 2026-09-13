import { useCallback, useEffect, useRef, useState } from "react";
import { pb } from "@/lib/pocketbase";
import type { ExamSession } from "@/types/exam";

const DEFAULT_C_CODE = `#include <stdio.h>\n\nint main() {\n    printf("Hello, CodeGavel!\\n");\n    return 0;\n}`;
const QUEUE_KEY_PREFIX = "codegavel_pending_strikes_";

// LocalStorage Queue Helpers
const getQueuedStrikeCount = (sessionId: string): number => {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(`${QUEUE_KEY_PREFIX}${sessionId}`);
  return raw ? Number.parseInt(raw, 10) : 0;
};

const setQueuedStrikeCount = (sessionId: string, count: number) => {
  if (typeof window === "undefined") return;
  if (count <= 0) {
    localStorage.removeItem(`${QUEUE_KEY_PREFIX}${sessionId}`);
  } else {
    localStorage.setItem(`${QUEUE_KEY_PREFIX}${sessionId}`, count.toString());
  }
};

export function useExamSession(studentIdParam: string | null, codeParam: string | null) {
  const [session, setSession] = useState<ExamSession | null>(null);
  const sessionRef = useRef<ExamSession | null>(null);

  const [code, setCode] = useState<string>(DEFAULT_C_CODE);
  const [output, setOutput] = useState<string>("Console output will appear here...");
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Sync queued offline strikes with PocketBase
  const flushOfflineQueue = useCallback(async (sessionId: string, baseStrikeCount: number) => {
    const queuedCount = getQueuedStrikeCount(sessionId);
    if (queuedCount <= baseStrikeCount) {
      setQueuedStrikeCount(sessionId, 0);
      return;
    }

    const targetCount = Math.max(baseStrikeCount, queuedCount);
    const targetStatus = targetCount >= 3 ? "locked_strike" : sessionRef.current?.status || "active";

    try {
      const updated = await pb.collection("exam_sessions").update<ExamSession>(
        sessionId,
        {
          strike_count: targetCount,
          status: targetStatus,
        },
        { requestKey: null },
      );

      // Successfully synced with server -> clear queue
      setQueuedStrikeCount(sessionId, 0);
      setSession((prev) => ({
        ...prev,
        ...updated,
        expand: prev?.expand,
      }));
      console.log("[Anti-Cheat Queue] Successfully synced offline strikes with backend.");
    } catch (_err) {
      console.warn("[Anti-Cheat Queue] Backend still unreachable. Keeping queue in localStorage.");
    }
  }, []);

  // Fetch session & initialize realtime SSE subscription
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const fetchAndSubscribe = async () => {
      if (!studentIdParam || !codeParam) {
        setLoading(false);
        return;
      }

      try {
        const student = await pb
          .collection("students")
          .getFirstListItem(`student_id = "${studentIdParam}"`, { requestKey: null });

        const sessionData = await pb
          .collection("exam_sessions")
          .getFirstListItem<ExamSession>(`student_id = "${student.id}" && group_code = "${codeParam}"`, {
            expand: "assigned_problem_id",
            requestKey: null,
          });

        setSession(sessionData);
        if (sessionData.current_code) setCode(sessionData.current_code);
        if (sessionData.terminal_output) setOutput(sessionData.terminal_output);

        // Check if any strikes occurred offline prior to fetch
        await flushOfflineQueue(sessionData.id, sessionData.strike_count || 0);

        unsubscribe = await pb.collection("exam_sessions").subscribe<ExamSession>(sessionData.id, (e) => {
          if (e.action === "update") {
            setSession((prev) => ({
              ...prev,
              ...e.record,
              expand: prev?.expand,
            }));

            if (e.record.terminal_output) {
              setOutput(e.record.terminal_output);
            }
          }
        });
      } catch (err) {
        console.error("Failed to load exam session:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndSubscribe();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [studentIdParam, codeParam, flushOfflineQueue]);

  // Network & Retry Sync Listener
  useEffect(() => {
    const attemptSync = () => {
      const currentSession = sessionRef.current;
      if (currentSession?.id) {
        flushOfflineQueue(currentSession.id, currentSession.strike_count || 0);
      }
    };

    // Retry whenever connection restores or every 10 seconds
    window.addEventListener("online", attemptSync);
    const intervalId = setInterval(attemptSync, 10000);

    return () => {
      window.removeEventListener("online", attemptSync);
      clearInterval(intervalId);
    };
  }, [flushOfflineQueue]);

  // Anti-Cheat Blur & Focus Listener
  useEffect(() => {
    let isWindowFocused = true;

    const triggerStrike = async () => {
      const currentSession = sessionRef.current;

      if (!currentSession?.id) return;
      if (currentSession.status === "locked_strike" || currentSession.status === "submitted") return;

      const baseCount = currentSession.strike_count || 0;
      const queuedCount = getQueuedStrikeCount(currentSession.id);
      const newStrikeCount = Math.max(baseCount, queuedCount) + 1;
      const newStatus = newStrikeCount >= 3 ? "locked_strike" : currentSession.status;

      console.log(`[Anti-Cheat] Strike recorded locally: ${newStrikeCount}`);

      // 1. Immediate local state update (UI updates instantly)
      setSession((prev) =>
        prev
          ? {
              ...prev,
              strike_count: newStrikeCount,
              status: newStatus,
            }
          : null,
      );

      // 2. Immediate localStorage queue update
      setQueuedStrikeCount(currentSession.id, newStrikeCount);

      // 3. Attempt PocketBase Sync
      try {
        const updated = await pb.collection("exam_sessions").update<ExamSession>(
          currentSession.id,
          {
            strike_count: newStrikeCount,
            status: newStatus,
          },
          { requestKey: null },
        );

        // If success, clear queue
        setQueuedStrikeCount(currentSession.id, 0);
        setSession((prev) => ({
          ...prev,
          ...updated,
          expand: prev?.expand,
        }));
      } catch (err) {
        // ADD THIS LINE TO SEE THE REAL POCKETBASE ERROR:
        console.error("[PocketBase Reject Reason]:", err);
        console.warn("[Anti-Cheat] Offline update cached locally. Will sync when reconnected.");
      }
    };

    const handleWindowBlur = (event: FocusEvent) => {
      if (document.activeElement && document.activeElement === event.target) return;

      if (isWindowFocused) {
        isWindowFocused = false;
        triggerStrike();
      }
    };

    const handleWindowFocus = () => {
      isWindowFocused = true;
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isWindowFocused) {
        isWindowFocused = false;
        triggerStrike();
      }
    };

    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleCodeChange = (value: string | undefined) => {
    const updatedCode = value || "";
    setCode(updatedCode);

    if (sessionRef.current?.id) {
      pb.collection("exam_sessions")
        .update(sessionRef.current.id, { current_code: updatedCode }, { requestKey: null })
        .catch(() => {
          /* ignore background sync errors */
        });
    }
  };

  const handleRunCode = async () => {
    if (!sessionRef.current?.id) return;
    setOutput("Compiling and executing code...");
    try {
      await pb
        .collection("exam_sessions")
        .update(sessionRef.current.id, { current_code: code, execution_status: "pending" }, { requestKey: null });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setOutput(`Execution Trigger Error: ${errorMessage}`);
    }
  };

  const handleSubmitExam = async () => {
    if (!sessionRef.current?.id) return;
    setIsSubmitting(true);
    try {
      await pb.collection("exam_sessions").update(
        sessionRef.current.id,
        {
          current_code: code,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        },
        { requestKey: null },
      );
      setOutput("Exam successfully submitted!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setOutput(`Submission Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    session,
    code,
    output,
    loading,
    isSubmitting,
    handleCodeChange,
    handleRunCode,
    handleSubmitExam,
  };
}
