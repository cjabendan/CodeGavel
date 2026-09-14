"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Section } from "@/lib/services/admin-services";

interface SectionControlBarProps {
  sections: Section[];
  selectedSection: string;
  onSelectSection: (sectionId: string) => void;
  onOpenSectionModal: () => void;
  onOpenGroupModal: () => void;
}

export function SectionControlBar({
  sections,
  selectedSection,
  onSelectSection,
  onOpenSectionModal,
  onOpenGroupModal,
}: SectionControlBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
      <div className="flex items-center gap-4">
        <div>
          <label
            htmlFor="section-select"
            className="block text-[10px] font-mono font-bold uppercase text-zinc-400 mb-1"
          >
            Class Section
          </label>
          <select
            id="section-select"
            value={selectedSection}
            onChange={(e) => onSelectSection(e.target.value)}
            className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-zinc-900"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.section_name} ({s.year_level})
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenSectionModal}
          className="mt-4 text-zinc-600 hover:text-zinc-900"
        >
          <Plus className="w-3.5 h-3.5" /> New Section
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenGroupModal}
          disabled={!selectedSection}
        >
          <Plus className="w-3.5 h-3.5" /> Create Exam Group
        </Button>
      </div>
    </div>
  );
}