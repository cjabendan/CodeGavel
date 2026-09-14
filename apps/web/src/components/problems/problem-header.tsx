"use client";

import { Code2, FileSpreadsheet, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProblemHeaderProps {
  totalCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCreateModal: () => void;
  onOpenImportModal: () => void;
}

export function ProblemHeader({
  totalCount,
  searchQuery,
  onSearchChange,
  onOpenCreateModal,
  onOpenImportModal,
}: ProblemHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-zinc-900 text-white rounded-xl">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-zinc-900">Problem Collection Bank</h1>
              <span className="font-mono text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-0.5 rounded">
                {totalCount} Total
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Repository of C programming challenges and auto-grading assertions.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button type="button" variant="outline" size="sm" onClick={onOpenImportModal} className="text-zinc-800">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Import .XLSX</span>
          </Button>

          <Button type="button" variant="primary" size="sm" onClick={onOpenCreateModal}>
            <Plus className="w-4 h-4" />
            <span>Create Problem</span>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Filter problem titles or description keywords..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 shadow-sm transition-all font-mono"
        />
      </div>
    </div>
  );
}
