"use client";

import { useEffect, useRef } from "react";
import { examService } from "@/lib/services/exam-services";

interface UseAntiCheatOptions {
  sessionId: string | null;
  enabled: boolean;
  status: string;
  strikeCount: number;
  onStrikeRecorded?: (newStrikeCount: number) => void;
}

export function useAntiCheat({ sessionId, enabled, status, strikeCount, onStrikeRecorded }: UseAntiCheatOptions) {
  const strikeRef = useRef(strikeCount);
  const isProcessingRef = useRef(false);
  const callbackRef = useRef(onStrikeRecorded);

  useEffect(() => {
    strikeRef.current = strikeCount;
    callbackRef.current = onStrikeRecorded;
  }, [strikeCount, onStrikeRecorded]);

  useEffect(() => {
    if (!enabled || !sessionId || status !== "active") return;

    const triggerStrike = async (reason: string) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        console.warn(`[Anti-Cheat Violation]: ${reason}`);
        const newStrikes = await examService.incrementStrike(sessionId, strikeRef.current);
        if (callbackRef.current) {
          callbackRef.current(newStrikes);
        }
      } catch (err) {
        console.error("Failed to record strike:", err);
      } finally {
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 1500);
      }
    };

    // Detect cursor leaving the top of the browser viewport into tabs/address bar
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        triggerStrike("Cursor hovered over browser tabs / address bar");
        return;
      }

      // Cursor exited side/bottom boundaries
      if (!e.relatedTarget) {
        triggerStrike("Cursor exited the exam viewport boundary");
      }
    };

    const handleBlur = () => {
      triggerStrike("Exam window lost focus");
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerStrike("Tab switched or browser minimized");
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerStrike("Right-click context menu opened");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && (e.key === "c" || e.key === "v" || e.key === "x")) {
        e.preventDefault();
        triggerStrike("Copy/Paste attempt detected");
      }
    };

    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sessionId, enabled, status]);
}
