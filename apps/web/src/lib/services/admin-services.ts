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

function calculateShiftedTimeStarted(
  session: Pick<ExamSession, "time_started" | "status" | "paused_at" | "time_ended" | "updated" | "time_limit_min">,
  extraMins: number,
  now: number = Date.now(),
): string {
  const oldStartMs = session.time_started ? new Date(session.time_started).getTime() : now;
  const extraMs = extraMins * 60 * 1000;

  let pausedDurationMs = 0;
  if (session.status === "paused" || session.status === "timeout") {
    let pauseTimeMs = now;
    if (session.paused_at) {
      pauseTimeMs = new Date(session.paused_at).getTime();
    } else if (session.time_ended) {
      pauseTimeMs = new Date(session.time_ended).getTime();
      if (session.status === "timeout" && session.time_started && session.time_limit_min) {
        const expirationTime = oldStartMs + session.time_limit_min * 60 * 1000;
        pauseTimeMs = Math.min(pauseTimeMs, expirationTime);
      }
    } else if (session.status === "timeout" && session.time_started && session.time_limit_min) {
      pauseTimeMs = oldStartMs + session.time_limit_min * 60 * 1000;
    } else if (session.updated) {
      pauseTimeMs = new Date(session.updated).getTime();
    }

    pausedDurationMs = Math.max(0, now - pauseTimeMs);
  }

  return new Date(oldStartMs + pausedDurationMs + extraMs).toISOString();
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

  async addStudentTime(sessionId: string, extraMins: number) {
    const session = await pb.collection("exam_sessions").getOne<ExamSession>(sessionId, { requestKey: null });

    // GUARD RULE: If session.status is "submitted" or "locked_strike", IMMEDIATELY return without updating PocketBase.
    if (session.status === "submitted" || session.status === "locked_strike") {
      return;
    }

    if (session.status !== "active" && session.status !== "paused" && session.status !== "timeout") {
      return;
    }

    const updatedTimeStarted = calculateShiftedTimeStarted(session, extraMins);

    return await pb.collection("exam_sessions").update(
      sessionId,
      {
        status: "active",
        time_started: updatedTimeStarted,
        paused_at: null,
        // Clear time_ended in case the session had timed out previously.
        ...(session.status === "timeout" ? { time_ended: null } : {}),
      },
      { requestKey: null },
    );
  },

  async addTimeToAllSessions(groupId: string, extraMins: number = 5): Promise<void> {
    const sessions = await this.getSessionsByGroup(groupId);

    // Filter out ALL sessions with a status of "submitted" or "locked_strike".
    // Only target eligible sessions: "active", "paused", "timeout".
    const targetSessions = sessions.filter(
      (s) =>
        s.status !== "submitted" &&
        s.status !== "locked_strike" &&
        (s.status === "active" || s.status === "paused" || s.status === "timeout"),
    );

    const now = Date.now();

    await Promise.all(
      targetSessions.map((session) => {
        const updatedTimeStarted = calculateShiftedTimeStarted(session, extraMins, now);

        return pb.collection("exam_sessions").update(
          session.id,
          {
            status: "active",
            time_started: updatedTimeStarted,
            paused_at: null,
            ...(session.status === "timeout" ? { time_ended: null } : {}),
          },
          { requestKey: null },
        );
      }),
    );
  },
  /***
   *  Clear Student Strikes and Reset Time Started
   */

  async clearStudentStrikes(sessionId: string) {
    const session = await pb.collection("exam_sessions").getOne<ExamSession>(sessionId, { requestKey: null });

    let updatedTimeStarted = session.time_started;

    if ((session.status === "locked_strike" || session.status === "paused") && session.time_started) {
      const pauseTimeMs = session.paused_at
        ? new Date(session.paused_at).getTime()
        : session.updated
          ? new Date(session.updated).getTime()
          : Date.now();

      const pausedDurationMs = Math.max(0, Date.now() - pauseTimeMs);
      const oldStartMs = new Date(session.time_started).getTime();
      updatedTimeStarted = new Date(oldStartMs + pausedDurationMs).toISOString();
    }

    return await pb.collection("exam_sessions").update(
      sessionId,
      {
        strike_count: 0,
        status: "active",
        time_started: updatedTimeStarted,
        paused_at: null,
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

        if ((session.status === "locked_strike" || session.status === "paused") && session.time_started) {
          const pauseTimeMs = session.paused_at
            ? new Date(session.paused_at).getTime()
            : session.updated
              ? new Date(session.updated).getTime()
              : now;

          const pausedDurationMs = Math.max(0, now - pauseTimeMs);
          const oldStartMs = new Date(session.time_started).getTime();
          updatedTimeStarted = new Date(oldStartMs + pausedDurationMs).toISOString();
        }

        return pb.collection("exam_sessions").update(
          session.id,
          {
            strike_count: 0,
            status: session.status === "locked_strike" ? "active" : session.status,
            time_started: updatedTimeStarted,
            paused_at: null,
          },
          { requestKey: null },
        );
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
