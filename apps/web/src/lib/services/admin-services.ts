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

  async addTimeToAllSessions(groupId: string, extraMins: number = 5): Promise<void> {
    const sessions = await this.getSessionsByGroup(groupId);
    const activeSessions = sessions.filter(
      (s) => s.status === "active" || s.status === "locked_strike" || s.status === "paused",
    );

    await Promise.all(
      activeSessions.map((session) =>
        pb.collection("exam_sessions").update(session.id, {
          time_limit_min: session.time_limit_min + extraMins,
        }),
      ),
    );
  },

  /***
   *  Clear Student Strikes and Reset Time Started
   */

  async clearStudentStrikes(sessionId: string) {
    // 1. Fetch current session to calculate locked duration
    const session = await pb.collection("exam_sessions").getOne<ExamSession>(sessionId, { requestKey: null });

    let updatedTimeStarted = session.time_started;

    // 2. If session was locked/paused, shift time_started forward by elapsed locked time
    if (
      (session.status === "locked_strike" || session.status === "paused") &&
      session.time_started &&
      session.updated
    ) {
      const lockedAt = new Date(session.updated).getTime();
      const pausedDurationMs = Math.max(0, Date.now() - lockedAt);

      const oldStartMs = new Date(session.time_started).getTime();
      updatedTimeStarted = new Date(oldStartMs + pausedDurationMs).toISOString();
    }

    return await pb.collection("exam_sessions").update(
      sessionId,
      {
        strike_count: 0,
        status: "active",
        time_started: updatedTimeStarted,
      },
      { requestKey: null },
    );
  },

  async clearAllStrikesInGroup(groupId: string): Promise<void> {
  const sessions = await this.getSessionsByGroup(groupId);
  const strikedSessions = sessions.filter((s) => s.strike_count > 0 || s.status === "locked_strike");

  const now = Date.now();

  await Promise.all(
    strikedSessions.map((session) => {
      let updatedTimeStarted = session.time_started;

      if ((session.status === "locked_strike" || session.status === "paused") && session.time_started && session.updated) {
        const lockedAt = new Date(session.updated).getTime();
        const pausedDurationMs = Math.max(0, now - lockedAt);
        const oldStartMs = new Date(session.time_started).getTime();
        updatedTimeStarted = new Date(oldStartMs + pausedDurationMs).toISOString();
      }

      return pb.collection("exam_sessions").update(session.id, {
        strike_count: 0,
        status: session.status === "locked_strike" ? "active" : session.status,
        time_started: updatedTimeStarted,
      }, { requestKey: null });
    }),
  );
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
