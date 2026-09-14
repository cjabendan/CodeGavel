"use client";

import { FileCode2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProblemCard } from "@/components/problems/problem-card";
import { CreateProblemModal } from "@/components/problems/problem-create";
import { ProblemHeader } from "@/components/problems/problem-header";
import { ProblemImportModal } from "@/components/problems/problem-import";
import { type Problem, problemService } from "@/lib/services/problem-services";

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadProblems = useCallback(async () => {
    try {
      const list = await problemService.getProblems();
      setProblems(list);
    } catch (err: any) {
      // Ignore autocancelled errors
      if (err?.isAbort) return;
      console.error("Failed to load problems:", err);
    }
  }, []);

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  const handleDeleteProblem = async (id: string) => {
    if (confirm("Are you sure you want to delete this problem record?")) {
      try {
        await problemService.deleteProblem(id);
        await loadProblems();
      } catch (err: any) {
        console.error("Failed to delete problem:", err);
      }
    }
  };

  const filteredProblems = problems.filter(
    (p) =>
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans">
      <AdminHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <ProblemHeader
          totalCount={problems.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCreateModal={() => setIsCreateOpen(true)}
          onOpenImportModal={() => setIsImportOpen(true)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProblems.length === 0 ? (
            <div className="col-span-full border-2 border-dashed border-zinc-200 rounded-2xl p-12 text-center text-zinc-400">
              <FileCode2 className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
              <p className="text-xs">No problems match your current search criteria.</p>
            </div>
          ) : (
            filteredProblems.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} onDelete={handleDeleteProblem} />
            ))
          )}
        </div>
      </main>

      <ProblemImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onSuccess={loadProblems} />
      <CreateProblemModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={loadProblems} />
    </div>
  );
}
