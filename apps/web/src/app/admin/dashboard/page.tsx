"use client";

import { Layers } from "lucide-react";
import { useState } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { CodeViewerModal } from "@/components/admin/admin-viewModal";
import { CreateGroupModal } from "@/components/admin/create-group-modal";
import { CreateSectionModal } from "@/components/admin/create-section-modal";
import { GroupInfoBanner } from "@/components/admin/group-info-banner";
import { GroupTabStrip } from "@/components/admin/group-tab-strip";
import { LiveSessionTable } from "@/components/admin/live-session-table";
import { SectionControlBar } from "@/components/admin/section-control-bar";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import type { ExamSession } from "@/lib/services/admin-services";

export default function DashboardPage() {
  const {
    sections,
    selectedSection,
    setSelectedSection,
    groups,
    selectedGroup,
    setSelectedGroup,
    sessions,
    createSection,
    createGroup,
    toggleAntiCheat,
    refreshSessions,
  } = useAdminDashboard();

  const [inspectedSession, setInspectedSession] = useState<ExamSession | null>(null);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans">
      <AdminHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <SectionControlBar
          sections={sections}
          selectedSection={selectedSection}
          onSelectSection={setSelectedSection}
          onOpenSectionModal={() => setShowSectionModal(true)}
          onOpenGroupModal={() => setShowGroupModal(true)}
        />

        <GroupTabStrip groups={groups} selectedGroup={selectedGroup} onSelectGroup={setSelectedGroup} />

        {selectedGroup ? (
          <div className="space-y-4">
            <GroupInfoBanner group={selectedGroup} sessionCount={sessions.length} onToggleAntiCheat={toggleAntiCheat} />
            <LiveSessionTable
              sessions={sessions}
              roomCode={selectedGroup.code}
              onInspect={setInspectedSession}
              onRefresh={() => {
                refreshSessions();
              }}
            />
          </div>
        ) : (
          <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-12 text-center text-zinc-400">
            <Layers className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
            <p className="text-xs">No exam group selected. Create or pick a group above to start live monitoring.</p>
          </div>
        )}
      </main>

      <CodeViewerModal session={inspectedSession} onClose={() => setInspectedSession(null)} />
      {showSectionModal && <CreateSectionModal onClose={() => setShowSectionModal(false)} onSubmit={createSection} />}
      {showGroupModal && <CreateGroupModal onClose={() => setShowGroupModal(false)} onSubmit={createGroup} />}
    </div>
  );
}
