"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { examService } from "@/lib/services/exam-services";

interface UseAntiCheatOptions {
  sessionId: string | null;
  enabled: boolean;
  status: string;
  strikeCount: number;
  onStrikeRecorded?: (newStrikeCount: number) => void;
}

interface UseAntiCheatReturn {
  /** True when the browser is currently in fullscreen mode. */
  isFullscreen: boolean;
  /** True if the student has entered fullscreen at least once during this session. */
  hasEnteredFullscreen: boolean;
  /** Call this to programmatically request fullscreen. */
  requestFullscreen: () => Promise<void>;
}

export function useAntiCheat({
  sessionId,
  enabled,
  status,
  strikeCount,
  onStrikeRecorded,
}: UseAntiCheatOptions): UseAntiCheatReturn {
  const strikeRef = useRef(strikeCount);
  const isProcessingRef = useRef(false);
  const callbackRef = useRef(onStrikeRecorded);
  const copiedInThisWindowRef = useRef(false);

  // Track whether the document is currently in fullscreen.
  const [isFullscreen, setIsFullscreen] = useState<boolean>(
    typeof document !== "undefined" ? !!document.fullscreenElement : false,
  );

  // Track if fullscreen was ever entered during this session.
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState<boolean>(false);
  const hasEnteredFullscreenRef = useRef<boolean>(false);

  useEffect(() => {
    strikeRef.current = strikeCount;
    callbackRef.current = onStrikeRecorded;
  }, [strikeCount, onStrikeRecorded]);

  const requestFullscreen = useCallback(async () => {
    if (typeof document !== "undefined" && !document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      } catch (err) {
        console.warn("Fullscreen request rejected or failed:", err);
      }
    }
  }, []);

  // ── Always sync fullscreen status with browser state ─────────────────────
  useEffect(() => {
    const handleFsChange = () => {
      const inFs = typeof document !== "undefined" && !!document.fullscreenElement;
      setIsFullscreen(inFs);

      if (inFs) {
        hasEnteredFullscreenRef.current = true;
        setHasEnteredFullscreen(true);
      }
    };

    if (typeof document !== "undefined") {
      setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener("fullscreenchange", handleFsChange);
      return () => {
        document.removeEventListener("fullscreenchange", handleFsChange);
      };
    }
  }, []);

  // ── Anti-cheat event listeners (Active during active session) ────────────
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

    // Fullscreen exit strike
    const handleFullscreenChange = () => {
      const inFs = !!document.fullscreenElement;
      setIsFullscreen(inFs);

      if (inFs) {
        hasEnteredFullscreenRef.current = true;
        setHasEnteredFullscreen(true);
      } else {
        if (hasEnteredFullscreenRef.current) {
          triggerStrike("Exited fullscreen mode during active exam");
        }
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (!document.fullscreenElement) return;

      if (e.clientY <= 0) {
        triggerStrike("Cursor hovered over browser tabs / address bar");
        return;
      }

      if (!e.relatedTarget) {
        triggerStrike("Cursor exited the exam viewport boundary");
      }
    };

    const handleBlur = () => {
      if (!document.fullscreenElement) return;

      copiedInThisWindowRef.current = false;
      triggerStrike("Exam window lost focus");
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (!document.fullscreenElement) return;

        copiedInThisWindowRef.current = false;
        triggerStrike("Tab switched or browser minimized");
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (!document.fullscreenElement) return;

      e.preventDefault();
      triggerStrike("Right-click context menu opened");
    };

    const handleCopy = () => {
      copiedInThisWindowRef.current = true;
    };

    const handleCut = () => {
      copiedInThisWindowRef.current = true;
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (!document.fullscreenElement) return;

      if (!copiedInThisWindowRef.current) {
        e.preventDefault();
        triggerStrike("Paste from external source detected");
      } else {
        copiedInThisWindowRef.current = false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!document.fullscreenElement) return;

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (e.key === "F12") {
        e.preventDefault();
        triggerStrike("DevTools shortcut (F12) pressed");
        return;
      }

      if (isCmdOrCtrl && e.key === "b") {
        e.preventDefault();
        triggerStrike("Browser AI sidebar shortcut (Ctrl+B) pressed");
        return;
      }
    };

    if (document.fullscreenElement) {
      hasEnteredFullscreenRef.current = true;
      setHasEnteredFullscreen(true);
      setIsFullscreen(true);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);
    document.addEventListener("paste", handlePaste);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("paste", handlePaste);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sessionId, enabled, status]);

  return { isFullscreen, hasEnteredFullscreen, requestFullscreen };
}