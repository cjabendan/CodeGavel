"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ProblemsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Problem Bank Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="p-3 bg-red-50 text-red-600 rounded-2xl mb-4 border border-red-100">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-base font-bold text-zinc-900 mb-1">Failed to load Problem Bank</h2>
      <p className="text-xs text-zinc-500 max-w-md mb-6 leading-relaxed">
        {error?.message || "An unexpected error occurred while loading problems."}
      </p>
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => reset()}>
          Try Again
        </Button>
        <Link
          href="/admin/dashboard"
          className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-zinc-800 transition"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
