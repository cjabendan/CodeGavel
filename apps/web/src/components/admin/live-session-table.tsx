"use client";

import { Clock, Eye, Radio, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminService } from "@/lib/services/admin-services";
import type { ExamSession } from "@/lib/services/exam-services";

interface LiveSessionTableProps {
  sessions: ExamSession[];
  roomCode: string;
  onInspect: (session: ExamSession) => void;
  onRefresh?: () => void;
}

export function LiveSessionTable({ sessions, roomCode, onInspect }: LiveSessionTableProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-4 bg-zinc-50/50">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800">Live Session Monitoring</h3>
        </div>
        <div>
          <span className="text-xs font-mono text-zinc-400">Current: {sessions.length} records</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-600">
          <thead className="bg-zinc-50/80 border-b border-zinc-200 font-mono text-[10px] text-zinc-400 uppercase">
            <tr>
              <th className="px-6 py-3">Student Name</th>
              <th className="px-6 py-3">Assigned Problem</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Time Limit</th>
              <th className="px-6 py-3">Strikes</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-400">
                  No students have joined room <span className="font-mono text-zinc-700">{roomCode}</span> yet.
                </td>
              </tr>
            ) : (
              sessions.map((session) => {
                return (
                  <tr key={session.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-zinc-900">{session.student_name}</td>
                    <td className="px-6 py-4 font-mono text-zinc-600">
                      {session.expand?.assigned_problem?.title || session.assigned_problem || "Unassigned"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                          session.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : session.status === "locked_strike"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : session.status === "timeout"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span>{session.time_limit_min} mins</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-mono font-bold ${session.strike_count > 0 ? "text-amber-600" : "text-zinc-400"}`}
                      >
                        {session.strike_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => adminService.addStudentTime(session.id, session.time_limit_min, 5)}
                        className="px-2 text-zinc-600 h-8"
                        title="+5 Minutes"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => adminService.clearStudentStrikes(session.id)}
                        className="px-2 text-zinc-600 h-8"
                        title="Reset Strikes"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onInspect(session)}
                        className="px-2 text-zinc-600 h-8"
                        title="Inspect Code"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => adminService.deleteStudentSession(session.id)}
                        className="px-2 text-red-600 hover:bg-red-50 hover:border-red-200 h-8"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
