"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { problemService, type TestCase } from "@/lib/services/problem-services";

interface FormTestCase extends TestCase {
  id: string;
}

interface CreateProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function CreateProblemModal({ isOpen, onClose, onSuccess }: CreateProblemModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState(2.0);
  const [memoryLimit, setMemoryLimit] = useState(128);
  const [testCases, setTestCases] = useState<FormTestCase[]>([
    { id: generateId(), input: "", output: "", is_hidden: false },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const addTestCase = () => {
    setTestCases((prev) => [...prev, { id: generateId(), input: "", output: "", is_hidden: false }]);
  };

  const removeTestCase = (id: string) => {
    setTestCases((prev) => prev.filter((tc) => tc.id !== id));
  };

  const updateTestCase = <K extends keyof TestCase>(id: string, key: K, value: TestCase[K]) => {
    setTestCases((prev) => prev.map((tc) => (tc.id === id ? { ...tc, [key]: value } : tc)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Problem title is required.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Strip out the internal 'id' before submitting payload
      const payloadTestCases = testCases.map(({ id, ...tc }) => tc);

      await problemService.createProblem({
        title: title.trim(),
        description: description.trim(),
        time_limit_sec: timeLimit,
        memory_limit_mb: memoryLimit,
        test_cases: payloadTestCases,
      });
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create problem.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-zinc-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <h3 className="font-bold text-zinc-900 text-base">Create C Challenge</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 h-auto hover:bg-zinc-100 text-zinc-500"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="problem-title" className="block text-xs font-mono uppercase text-zinc-700 mb-1">
              Problem Title
            </label>
            <input
              id="problem-title"
              type="text"
              placeholder="e.g. Find Prime Numbers in Array"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-900 font-sans"
            />
          </div>

          <div>
            <label htmlFor="problem-description" className="block text-xs font-mono uppercase text-zinc-700 mb-1">
              Description & Problem Statement
            </label>
            <textarea
              id="problem-description"
              rows={3}
              placeholder="Write problem specification..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-900 font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="problem-time-limit" className="block text-xs font-mono uppercase text-zinc-700 mb-1">
                Time Limit (Seconds)
              </label>
              <input
                id="problem-time-limit"
                type="number"
                step="0.5"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number.parseFloat(e.target.value) || 2.0)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-zinc-900"
              />
            </div>
            <div>
              <label htmlFor="problem-memory-limit" className="block text-xs font-mono uppercase text-zinc-700 mb-1">
                Memory Limit (MB)
              </label>
              <input
                id="problem-memory-limit"
                type="number"
                value={memoryLimit}
                onChange={(e) => setMemoryLimit(Number.parseInt(e.target.value, 10) || 128)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-zinc-900"
              />
            </div>
          </div>

          {/* Test Cases Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase text-zinc-700">Test Cases Assertions</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTestCase}
                className="text-xs text-zinc-600 hover:text-zinc-900 flex items-center gap-1 border border-zinc-200 px-2 py-1 h-auto"
              >
                <Plus className="w-3 h-3" /> Add Case
              </Button>
            </div>

            <div className="space-y-3">
              {testCases.map((tc, idx) => (
                <div key={tc.id} className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Input"
                    aria-label={`Test case ${idx + 1} input`}
                    value={tc.input}
                    onChange={(e) => updateTestCase(tc.id, "input", e.target.value)}
                    className="flex-1 bg-white border border-zinc-200 rounded px-2.5 py-1.5 text-xs font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Expected Output"
                    aria-label={`Test case ${idx + 1} expected output`}
                    value={tc.output}
                    onChange={(e) => updateTestCase(tc.id, "output", e.target.value)}
                    className="flex-1 bg-white border border-zinc-200 rounded px-2.5 py-1.5 text-xs font-mono"
                  />
                  {testCases.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTestCase(tc.id)}
                      className="p-1 h-auto text-zinc-400 hover:text-red-600 hover:bg-transparent"
                      aria-label="Remove test case"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 flex items-center justify-end gap-2 bg-zinc-50/50">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-zinc-600">
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading} disabled={isLoading}>
            Save Problem
          </Button>
        </div>
      </form>
    </div>
  );
}
