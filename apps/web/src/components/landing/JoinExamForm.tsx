"use client";

import { ArrowRight, KeyRound, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { joinExamSession } from "@/lib/services/examService";

export function JoinExamForm() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const session = await joinExamSession({ studentId, groupCode });
      router.push(
        `/exam?studentId=${encodeURIComponent(session.studentId)}&code=${encodeURIComponent(session.groupCode)}`,
      );
    } catch (err) {
      console.error("[Join Error]:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to join room. Verify credentials.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-zinc-900">Join Exam Session</h2>
        <p className="text-sm text-zinc-500 mt-1">Enter your student identity and room code to access the lab.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-medium">{error}</div>
        )}

        <div className="flex flex-col gap-2">
          <label
            htmlFor="studentId"
            className="block text-xs font-mono font-medium text-zinc-700 uppercase tracking-wider mb-1.5"
          >
            Student Identity / ID Number
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              id="studentId"
              type="text"
              placeholder="e.g. 2026-10492"
              value={studentId}
              disabled={isLoading}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-zinc-900 font-mono placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="groupCode"
            className="block text-xs font-mono font-medium text-zinc-700 uppercase tracking-wider mb-1.5"
          >
            6-Digit Room Code
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              id="groupCode"
              type="text"
              placeholder="e.g. E2AW41"
              maxLength={10}
              value={groupCode}
              disabled={isLoading}
              onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-zinc-900 font-mono uppercase tracking-wider placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all disabled:opacity-50"
            />
          </div>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full">
          {isLoading ? (
            <span>Verifying Room Access...</span>
          ) : (
            <>
              <span>Enter Examination Lobby</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
