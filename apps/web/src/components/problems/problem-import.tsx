"use client";

import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { type CreateProblemInput, problemService } from "@/lib/services/problem-services";

interface ProblemImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProblemImportModal({ isOpen, onClose, onSuccess }: ProblemImportModalProps) {
  const [parsedItems, setParsedItems] = useState<CreateProblemInput[]>([]);
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const binaryStr = evt.target?.result as string;
        const items = problemService.parseXLSXBuffer(binaryStr);
        setParsedItems(items);
      } catch (err) {
        console.error(err);
        setError(
          "Failed to parse XLSX file. Verify columns: title, description, time_limit_sec, memory_limit_mb, test_cases.",
        );
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (parsedItems.length === 0) return;
    setIsUploading(true);
    try {
      await problemService.batchImportProblems(parsedItems);
      onSuccess();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save parsed problems to database.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-zinc-900" />
            <h3 className="font-bold text-zinc-900 text-base">Batch Import Problems</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 h-auto text-zinc-500 hover:bg-zinc-100"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="my-6">
          <label className="border-2 border-dashed border-zinc-200 hover:border-zinc-400 bg-zinc-50 hover:bg-white rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all">
            <Upload className="w-8 h-8 text-zinc-400 mb-2" />
            <span className="text-xs font-semibold text-zinc-700">Upload Spreadsheet (.xlsx, .xls)</span>
            <span className="text-[11px] text-zinc-400 mt-0.5 font-mono">
              Required headers: title, description, test_cases
            </span>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {parsedItems.length > 0 && (
          <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg flex items-center justify-between text-xs font-mono mb-6">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Parsed {parsedItems.length} problems from {fileName}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-zinc-600"
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleImport}
            isLoading={isUploading}
            disabled={parsedItems.length === 0 || isUploading}
          >
            Import Collection
          </Button>
        </div>
      </div>
    </div>
  );
}
