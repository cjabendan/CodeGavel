"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CreateGroupModalProps {
  onClose: () => void;
  onSubmit: (name: string, timeLimit: number) => Promise<void>;
}

export function CreateGroupModal({
  onClose,
  onSubmit,
}: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(name.trim(), timeLimit);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-zinc-200 rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4"
      >
        <h3 className="font-bold text-zinc-900 text-base">
          Create Exam Group
        </h3>
        <div>
          <label
            htmlFor="create-group-name"
            className="block text-xs font-mono uppercase text-zinc-500 mb-1"
          >
            Group Name
          </label>
          <input
            id="create-group-name"
            type="text"
            placeholder="e.g. Midterm Lab Group A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-900"
          />
        </div>
        <div>
          <label
            htmlFor="create-group-time-limit"
            className="block text-xs font-mono uppercase text-zinc-500 mb-1"
          >
            Default Time Limit (Mins)
          </label>
          <input
            id="create-group-time-limit"
            type="number"
            value={timeLimit}
            onChange={(e) =>
              setTimeLimit(Number.parseInt(e.target.value, 10) || 30)
            }
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-900"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-zinc-600"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Generating..." : "Generate Room"}
          </Button>
        </div>
      </form>
    </div>
  );
}