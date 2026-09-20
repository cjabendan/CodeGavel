"use client";

import { useCallback, useEffect, useState } from "react";
import { adminService, type Group, type Section } from "@/lib/services/admin-services";
import type { ExamSession } from "@/lib/services/exam-services";

function isAbortError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "isAbort" in err && Boolean((err as { isAbort?: boolean }).isAbort);
}

export function useAdminDashboard() {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [sessions, setSessions] = useState<ExamSession[]>([]);

  const loadSections = useCallback(async () => {
    try {
      const list = await adminService.getSections();
      setSections(list);
      setSelectedSection((prev) => (list.length > 0 && !prev ? list[0].id : prev));
      return list;
    } catch (err: unknown) {
      if (!isAbortError(err)) {
        console.error("Error loading sections:", err);
      }
      return [];
    }
  }, []);

  const loadGroups = useCallback(async (sectionId: string) => {
    try {
      const list = await adminService.getGroups(sectionId);
      setGroups(list);
      if (list.length > 0) {
        setSelectedGroup(list[0]);
      } else {
        setSelectedGroup(null);
        setSessions([]);
      }
      return list;
    } catch (err: unknown) {
      if (!isAbortError(err)) {
        console.error("Error loading groups:", err);
      }
      return [];
    }
  }, []);

  const loadSessions = useCallback(async (groupId: string) => {
    try {
      const list = await adminService.getSessionsByGroup(groupId);
      setSessions(list);
      return list;
    } catch (err: unknown) {
      if (!isAbortError(err)) {
        console.error("Error loading sessions:", err);
      }
      return [];
    }
  }, []);

  const refreshSessions = useCallback(async () => {
    if (!selectedGroup) return [];
    return await loadSessions(selectedGroup.id);
  }, [selectedGroup, loadSessions]);

  // Initial Sections Fetch
  useEffect(() => {
    let active = true;

    adminService
      .getSections()
      .then((list) => {
        if (!active) return;
        setSections(list);
        setSelectedSection((prev) => (list.length > 0 && !prev ? list[0].id : prev));
      })
      .catch((err: unknown) => {
        if (active && !isAbortError(err)) {
          console.error("Error loading sections:", err);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Groups Fetch on Section Change
  useEffect(() => {
    if (!selectedSection) return;

    let active = true;

    adminService
      .getGroups(selectedSection)
      .then((list) => {
        if (!active) return;
        setGroups(list);
        if (list.length > 0) {
          setSelectedGroup(list[0]);
        } else {
          setSelectedGroup(null);
          setSessions([]);
        }
      })
      .catch((err: unknown) => {
        if (active && !isAbortError(err)) {
          console.error("Error loading groups:", err);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedSection]);

  // Realtime Sessions Fetch & Subscription on Group Change
  useEffect(() => {
    if (!selectedGroup) return;

    let active = true;

    adminService
      .getSessionsByGroup(selectedGroup.id)
      .then((list) => {
        if (!active) return;
        setSessions(list);
      })
      .catch((err: unknown) => {
        if (active && !isAbortError(err)) {
          console.error("Error loading sessions:", err);
        }
      });

    const unsubscribe = adminService.subscribeToSessions(selectedGroup.id, () => {
      if (!active) return;
      adminService
        .getSessionsByGroup(selectedGroup.id)
        .then((list) => {
          if (active) setSessions(list);
        })
        .catch((err: unknown) => {
          if (active && !isAbortError(err)) {
            console.error("Error reloading sessions on update:", err);
          }
        });
    });

    return () => {
      active = false;
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [selectedGroup]);

  const createSection = async (name: string, yearLevel: string) => {
    const created = await adminService.createSection({
      section_name: name,
      year_level: yearLevel,
    });
    await loadSections();
    setSelectedSection(created.id);
  };

  const createGroup = async (name: string, timeLimit: number) => {
    if (!selectedSection) return;
    const created = await adminService.createGroup({
      name,
      sectionId: selectedSection,
      defaultTimeLimitMin: timeLimit,
      antiCheatEnabled: true,
    });
    await loadGroups(selectedSection);
    setSelectedGroup(created);
  };

  const toggleAntiCheat = async () => {
    if (!selectedGroup) return;
    const updated = await adminService.toggleGroupAntiCheat(selectedGroup.id, !selectedGroup.anti_cheat_enabled);
    setSelectedGroup(updated);
    setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  };

  const addTimeToAll = async (extraMins: number = 5) => {
    if (!selectedGroup) return;
    await adminService.addTimeToAllSessions(selectedGroup.id, extraMins);
    await refreshSessions();
  };

  const clearAllStrikes = async () => {
    if (!selectedGroup) return;
    await adminService.clearAllStrikesInGroup(selectedGroup.id);
    await refreshSessions();
  };

  return {
    sections,
    selectedSection,
    setSelectedSection,
    groups,
    selectedGroup,
    setSelectedGroup,
    sessions,
    loadSessions,
    refreshSessions,
    createSection,
    createGroup,
    toggleAntiCheat,
    addTimeToAll,
    clearAllStrikes,
  };
}
