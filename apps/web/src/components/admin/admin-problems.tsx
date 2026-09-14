"use client";

import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { useState } from "react";
// import * as XLSX from "xlsx";
import { adminService, type Problem } from "@/lib/services/admin-services";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProblemImportModal({ isOpen, onClose, onSuccess }: Props) {
  const [parsedItems, setParsedItems] = useState<Omit<Problem, "id" | "created">[]>([]);
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
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        const formatted: Omit<Problem, "id" | "created">[] = rawData.map((row) => {
          let testCases = [];
          if (typeof row.test_cases === "string") {
            try {
              testCases = JSON.parse(row.test_cases);
            } catch {
              testCases = [];
            }
          } else if (Array.isArray(row.test_cases)) {
            testCases = row.test_cases;
          }

          return {
            title: row.title || "Untitled Problem",
            description: row.description || "",
            time_limit_sec: parseFloat(row.time_limit_sec) || 2.0,
            memory_limit_mb: parseInt(row.memory_limit_mb) || 128,
            test_cases: testCases,
          };
        });

        setParsedItems(formatted);
      } catch (err) {
        console.error(err);
        setError("Failed to parse XLSX file. Ensure columns match requirements.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (parsedItems.length === 0) return;
    setIsUploading(true);
    try {
      await adminService.importProblemsBatch(parsedItems);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save problems to database.");
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
            <h3 className="font-bold text-zinc-900 text-base">Import Problems (.xlsx)</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-lg text-zinc-500">
            <X className="w-5 h-5" />
          </button>
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
            <span className="text-xs font-semibold text-zinc-700">Click to upload spreadsheet</span>
            <span className="text-[11px] text-zinc-400 mt-0.5">
              Supports .xlsx with columns: title, description, test_cases
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
          <button
            onClick={onClose}
            className="px-4 py-2 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={parsedItems.length === 0 || isUploading}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-2 shadow-sm"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import Collection"}
          </button>
        </div>
      </div>
    </div>
  );
}
