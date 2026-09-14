import type { ClientResponseError } from "pocketbase";
import { pb } from "@/lib/pocketbase";
import type { ExamSession } from "./exam-services";
import type { Problem } from "./problem-services";

export interface Section {
  id: string;
  section_name: string;
  year_level: string;
  created?: string;
}

export interface Group {
  id: string;
  name: string;
  code: string;
  section: string;
  default_time_limit_min: number;
  anti_cheat_enabled: boolean;
  status: "lobby" | "active" | "ended";
  created?: string;
}

export const adminService = {
  // --- Sections ---
  async getSections(): Promise<Section[]> {
    try {
      return await pb.collection("sections").getFullList<Section>({
        requestKey: null,
      });
    } catch (error: unknown) {
      const pbError = error as ClientResponseError;
      if (pbError?.isAbort) return [];
      console.error("Failed to fetch sections:", pbError?.response || pbError);
      return [];
    }
  },

  async createSection(data: { section_name: string; year_level: string }): Promise<Section> {
    return await pb.collection("sections").create<Section>(data);
  },

  // --- Groups ---
  async getGroups(sectionId?: string): Promise<Group[]> {
    try {
      const filter = sectionId ? `section = "${sectionId}"` : "";
      return await pb.collection("groups").getFullList<Group>({
        filter,
        requestKey: null,
      });
    } catch (error: unknown) {
      const pbError = error as ClientResponseError;
      if (pbError?.isAbort) return [];
      console.error("Failed to fetch groups:", pbError?.response || pbError);
      return [];
    }
  },

  generate6DigitCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  async createGroup(data: {
    name: string;
    sectionId: string;
    defaultTimeLimitMin: number;
    antiCheatEnabled: boolean;
  }): Promise<Group> {
    const code = this.generate6DigitCode();
    return await pb.collection("groups").create<Group>({
      name: data.name,
      section: data.sectionId,
      code,
      default_time_limit_min: data.defaultTimeLimitMin,
      anti_cheat_enabled: data.antiCheatEnabled,
      status: "lobby",
    });
  },

  async toggleGroupAntiCheat(groupId: string, enabled: boolean): Promise<Group> {
    return await pb.collection("groups").update<Group>(groupId, { anti_cheat_enabled: enabled });
  },

  async updateGroupStatus(groupId: string, status: "lobby" | "active" | "ended"): Promise<Group> {
    return await pb.collection("groups").update<Group>(groupId, { status });
  },

  // --- Live Exam Sessions ---
  async getSessionsByGroup(groupId: string): Promise<ExamSession[]> {
    try {
      return await pb.collection("exam_sessions").getFullList<ExamSession>({
        filter: `group = "${groupId}"`,
        expand: "assigned_problem,group",
        requestKey: null,
      });
    } catch (error: unknown) {
      const pbError = error as ClientResponseError;
      if (pbError?.isAbort) return [];
      console.error("Failed to fetch sessions:", pbError?.response || pbError);
      return [];
    }
  },

  subscribeToSessions(groupId: string, callback: () => void) {
    const unsubscribePromise = pb.collection("exam_sessions").subscribe("*", (e) => {
      if (e.record.group === groupId) {
        callback();
      }
    });

    return () => {
      unsubscribePromise.then((unsub) => unsub()).catch(console.error);
    };
  },

  async addStudentTime(sessionId: string, currentMins: number, extraMins: number) {
    return await pb.collection("exam_sessions").update(sessionId, {
      time_limit_min: currentMins + extraMins,
    });
  },

  async clearStudentStrikes(sessionId: string) {
    return await pb.collection("exam_sessions").update(sessionId, {
      strike_count: 0,
      status: "active",
    });
  },

  async deleteStudentSession(sessionId: string) {
    return await pb.collection("exam_sessions").delete(sessionId);
  },

  // --- Problems ---
  async getProblems(): Promise<Problem[]> {
    try {
      return await pb.collection("problems").getFullList<Problem>({
        requestKey: null,
      });
    } catch (error: unknown) {
      const pbError = error as ClientResponseError;
      if (pbError?.isAbort) return [];
      console.error("Failed to fetch problems:", pbError?.response || pbError);
      return [];
    }
  },

  async createProblem(data: Omit<Problem, "id" | "created" | "updated">): Promise<Problem> {
    return await pb.collection("problems").create<Problem>(data);
  },

  async importProblemsBatch(problems: Omit<Problem, "id" | "created" | "updated">[]) {
    const results = [];
    for (const item of problems) {
      const created = await pb.collection("problems").create(item);
      results.push(created);
    }
    return results;
  },

  async deleteProblem(id: string) {
    return await pb.collection("problems").delete(id);
  },
};
