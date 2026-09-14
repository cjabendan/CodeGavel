"use client";

import { KeyRound, Maximize2, Shield, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Group } from "@/lib/services/admin-services";

interface GroupInfoBannerProps {
  group: Group;
  sessionCount: number;
  onToggleAntiCheat: () => Promise<void> | void;
}

export function GroupInfoBanner({ group, sessionCount, onToggleAntiCheat }: GroupInfoBannerProps) {
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    try {
      setIsToggling(true);
      await onToggleAntiCheat();
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-zinc-200 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-zinc-100 p-3 rounded-xl border border-zinc-200">
            <KeyRound className="w-6 h-6 text-zinc-800" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-900">{group.name}</h2>
              <button
                type="button"
                onClick={() => setIsCodeModalOpen(true)}
                className="group flex items-center gap-1.5 font-mono text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white px-2.5 py-1 rounded transition-colors shadow-sm"
                title="Expand Room Code"
              >
                <span>ROOM: {group.code}</span>
                <Maximize2 className="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Default Limit: {group.default_time_limit_min} mins • {sessionCount} Students Joined
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={handleToggle}
            isLoading={isToggling}
            className={`font-mono text-xs font-semibold px-3 py-1.5 transition-all ${
              group.anti_cheat_enabled
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                : "bg-zinc-50 border border-zinc-200 text-zinc-400 hover:bg-zinc-100"
            }`}
          >
            <Shield className="w-3.5 h-3.5 mr-1" />
            Anti-Cheat: {group.anti_cheat_enabled ? "ON" : "OFF"}
          </Button>
        </div>
      </div>

      {/* Room Code Modal */}
      {isCodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative bg-white border border-zinc-200 rounded-2xl p-8 sm:p-12 w-full max-w-2xl shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsCodeModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 font-bold mb-1">{group.name}</p>
              <h3 className="text-lg font-medium text-zinc-700">Room Code</h3>
            </div>

            <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl py-8 px-4">
              <span className="font-mono text-6xl sm:text-8xl font-black tracking-wider text-zinc-900 select-all">
                {group.code}
              </span>
            </div>

            <p className="text-sm text-zinc-500">Students can use this code to join the class session.</p>
          </div>
        </div>
      )}
    </>
  );
}
