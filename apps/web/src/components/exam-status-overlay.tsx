"use client";

import { AlertTriangle, CheckCircle2, Clock, Lock, Pause, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExamStatusOverlayProps {
  status: "waiting" | "active" | "paused" | "locked_strike" | "submitted" | "timeout";
  onClose?: () => void;
  onAction?: () => void;
}

export function ExamStatusOverlay({ status, onClose, onAction }: ExamStatusOverlayProps) {
  if (status === "active") return null;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-6 text-center shadow-2xl space-y-4 relative">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors p-1 rounded-lg hover:bg-zinc-100"
            aria-label="Dismiss overlay"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {status === "waiting" && (
          <>
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Waiting for Instructor</h3>
            <p className="text-xs text-zinc-500">
              The exam lobby is open. Please wait for the instructor to start the session.
            </p>
          </>
        )}

        {status === "paused" && (
          <>
            <div className="w-12 h-12 bg-zinc-100 text-zinc-700 rounded-2xl flex items-center justify-center mx-auto">
              <Pause className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Exam Paused</h3>
            <p className="text-xs text-zinc-500">
              The instructor has temporarily paused the exam session. Please stand by.
            </p>
          </>
        )}

        {status === "locked_strike" && (
          <>
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Exam Locked</h3>
            <p className="text-xs text-zinc-500">
              Your session was locked due to exceeding anti-cheat window switch limits.
            </p>
            {onAction && (
              <div className="pt-2">
                <Button type="button" variant="danger" size="sm" onClick={onAction} className="w-full">
                  Request Unlock
                </Button>
              </div>
            )}
          </>
        )}

        {status === "timeout" && (
          <>
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Time Expired</h3>
            <p className="text-xs text-zinc-500">
              The allocated exam duration has ended. Your final code draft was auto-saved.
            </p>
            {onAction && (
              <div className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={onAction} className="w-full">
                  Return to Dashboard
                </Button>
              </div>
            )}
          </>
        )}

        {status === "submitted" && (
          <>
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Solution Submitted</h3>
            <p className="text-xs text-zinc-500">Your C solution was successfully recorded. You may close this page.</p>
            {onAction && (
              <div className="pt-2">
                <Button type="button" variant="primary" size="sm" onClick={onAction} className="w-full">
                  Exit Exam Session
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
