"use client";

import { ArrowRight, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { examService } from "@/lib/services/exam-services";

export function JoinExamForm() {
  const router = useRouter();
  const [groupCode, setGroupCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError("");

    const cleanCode = groupCode.trim().toUpperCase();
    if (!cleanCode) {
      setError("Please enter a room code.");
      return;
    }

    setIsLoading(true);

    try {
      await examService.verifyGroupCode(cleanCode);
      router.push(`/student/exam?code=${encodeURIComponent(cleanCode)}`);
    } catch {
      setError("Room code not found. Please double-check the code with your instructor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-zinc-900">CodeGavel Examination Lab</h2>
        <p className="text-sm text-zinc-500 mt-1">Please enter the 6-digit room code provided by your instructor.</p>
      </div>

      <form onSubmit={handleSubmit} action="#" className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-medium">{error}</div>
        )}

        <div className="flex flex-col gap-2">
          <label
            htmlFor="groupCode"
            className="block text-xs font-mono font-medium text-zinc-700 uppercase tracking-wider mb-1.5"
          >
            Room Code
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              id="groupCode"
              name="groupCode"
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
            <span>Verifying Room Code...</span>
          ) : (
            <>
              <span>Join Lab</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
