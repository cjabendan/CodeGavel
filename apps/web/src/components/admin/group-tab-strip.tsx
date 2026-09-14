"use client";

import { Button } from "@/components/ui/button";
import type { Group } from "@/lib/services/admin-services";

interface GroupTabStripProps {
  groups: Group[];
  selectedGroup: Group | null;
  onSelectGroup: (group: Group) => void;
}

export function GroupTabStrip({
  groups,
  selectedGroup,
  onSelectGroup,
}: GroupTabStripProps) {
  if (groups.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {groups.map((g) => {
        const isSelected = selectedGroup?.id === g.id;
        return (
          <Button
            key={g.id}
            variant={isSelected ? "primary" : "outline"}
            size="sm"
            onClick={() => onSelectGroup(g)}
            className={`rounded-xl whitespace-nowrap ${
              isSelected ? "" : "text-zinc-600 hover:border-zinc-300"
            }`}
          >
            <span>{g.name}</span>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                isSelected
                  ? "bg-zinc-800 text-zinc-300"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {g.code}
            </span>
          </Button>
        );
      })}
    </div>
  );
}