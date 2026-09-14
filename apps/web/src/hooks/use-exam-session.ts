"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { type ExamSession, examService } from "@/lib/services/exam-services";

const DEFAULT_C_CODE = `#include <stdio.h>\n\nint main() {\n    printf("Hello, CodeGavel!\\n");\n    return 0;\n}`;

export function useExamSession(studentNameParam: string | null, groupCodeParam: string | null) {
  const [session, setSession] = useState<ExamSession | null>(null);
  const sessionRef = useRef<ExamSession | null>(null);

  const [code, setCode] = useState<string>(DEFAULT_C_CODE);
  const [output, setOutput] = useState<string>("Console output will appear here...");
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Initialize or Resume Exam Session & Realtime Subscription
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const fetchAndSubscribe = async () => {
      if (!studentNameParam || !groupCodeParam) {
        setLoading(false);
        return;
      }

      try {
        const sessionData = await examService.startOrResumeSession(studentNameParam, groupCodeParam);

        setSession(sessionData);
        if (sessionData.current_code) setCode(sessionData.current_code);
        if (sessionData.terminal_output) setOutput(sessionData.terminal_output);

        // Realtime SSE subscription for exam status and terminal execution feedback
        const unsub = await pb.collection("exam_sessions").subscribe<ExamSession>(sessionData.id, (e) => {
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

        unsubscribe = () => {
          unsub();
        };
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
  }, [studentNameParam, groupCodeParam]);

  const handleCodeChange = (value: string | undefined) => {
    const updatedCode = value || "";
    setCode(updatedCode);

    if (sessionRef.current?.id) {
      examService.saveCode(sessionRef.current.id, updatedCode).catch(() => {
        /* Ignore background auto-save network errors */
      });
    }
  };

  const handleRunCode = async () => {
    if (!sessionRef.current?.id) return;
    setOutput("Compiling and executing code...");
    try {
      await examService.runCode(sessionRef.current.id, code);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setOutput(`Execution Trigger Error: ${errorMessage}`);
    }
  };

  const handleSubmitExam = async () => {
    if (!sessionRef.current?.id) return;
    setIsSubmitting(true);
    try {
      await examService.submitExam(sessionRef.current.id, code);
      setOutput("Exam successfully submitted!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setOutput(`Submission Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStrikeRecorded = useCallback((newStrikeCount: number) => {
    setSession((prev) =>
      prev
        ? {
            ...prev,
            strike_count: newStrikeCount,
            status: newStrikeCount >= 3 ? "locked_strike" : prev.status,
          }
        : null,
    );
  }, []);

  return {
    session,
    code,
    output,
    loading,
    isSubmitting,
    handleCodeChange,
    handleRunCode,
    handleSubmitExam,
    handleStrikeRecorded,
  };
}
