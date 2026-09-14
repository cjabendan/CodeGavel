"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CreateSectionModalProps {
  onClose: () => void;
  onSubmit: (name: string, yearLevel: string) => Promise<void>;
}

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export function CreateSectionModal({ onClose, onSubmit }: CreateSectionModalProps) {
  const [name, setName] = useState("");
  const [yearLevel, setYearLevel] = useState("1st Year");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(name.trim(), yearLevel);
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
        <h3 className="font-bold text-zinc-900 text-base">Create Class Section</h3>
        <div>
          <label htmlFor="create-section-name" className="block text-xs font-mono uppercase text-zinc-500 mb-1">
            Section Name
          </label>
          <input
            id="create-section-name"
            type="text"
            placeholder="e.g. BSCS-3A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-900"
          />
        </div>
        <div>
          <label htmlFor="create-year-level" className="block text-xs font-mono uppercase text-zinc-500 mb-1">
            Year Level
          </label>
          <select
            id="create-year-level"
            value={yearLevel}
            onChange={(e) => setYearLevel(e.target.value)}
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-zinc-900 cursor-pointer"
          >
            {YEAR_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
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
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Section"}
          </Button>
        </div>
      </form>
    </div>
  );
}
