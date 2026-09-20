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
  /** Call this to programmatically request fullscreen (used by the prompt modal). */
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
  // True only when the student copied/cut text while this window was focused.
  // Reset whenever focus is lost so any subsequent paste is treated as external.
  const copiedInThisWindowRef = useRef(false);

  // Track whether the document is currently in fullscreen.
  const [isFullscreen, setIsFullscreen] = useState<boolean>(
    typeof document !== "undefined" ? !!document.fullscreenElement : false,
  );

  useEffect(() => {
    strikeRef.current = strikeCount;
    callbackRef.current = onStrikeRecorded;
  }, [strikeCount, onStrikeRecorded]);

  // ── Fullscreen state tracker ──────────────────────────────────────────────
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const requestFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {
        /* User denied or browser doesn't support — handled by the modal */
      });
    }
  }, []);

  // ── Anti-cheat event listeners ────────────────────────────────────────────
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

    // ── Fullscreen exit → strike ─────────────────────────────────────────
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        triggerStrike("Exited fullscreen mode during active exam");
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
      // Any text copied after the window loses focus is untrusted.
      copiedInThisWindowRef.current = false;
      triggerStrike("Exam window lost focus");
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab switched — clipboard content is now untrusted.
        copiedInThisWindowRef.current = false;
        triggerStrike("Tab switched or browser minimized");
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerStrike("Right-click context menu opened");
    };

    // ── Clipboard trust tracking ──────────────────────────────────────────────
    // Copy or cut within this window → mark clipboard as "trusted".
    const handleCopy = () => {
      copiedInThisWindowRef.current = true;
    };
    const handleCut = () => {
      copiedInThisWindowRef.current = true;
    };

    // Paste → only allow if content was copied from this same window.
    // This also catches right-click → Paste, not just Ctrl+V.
    const handlePaste = (e: ClipboardEvent) => {
      if (!copiedInThisWindowRef.current) {
        e.preventDefault();
        triggerStrike("Paste from external source detected");
      } else {
        // Consume the trust token — require a fresh copy for the next paste.
        copiedInThisWindowRef.current = false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Block F12 — opens browser DevTools
      if (e.key === "F12") {
        e.preventDefault();
        triggerStrike("DevTools shortcut (F12) pressed");
        return;
      }

      // Block Ctrl+B / Cmd+B — opens browser built-in AI / sidebar
      if (isCmdOrCtrl && e.key === "b") {
        e.preventDefault();
        triggerStrike("Browser AI sidebar shortcut (Ctrl+B) pressed");
        return;
      }
    };

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

  return { isFullscreen, requestFullscreen };
}
