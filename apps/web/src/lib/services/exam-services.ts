import type { ClientResponseError, RecordModel } from "pocketbase";
import { pb } from "@/lib/pocketbase";
import type { Problem } from "./problem-services";

export interface ExamSession {
  id: string;
  student_name: string;
  group: string;
  group_code: string;
  assigned_problem: string;
  current_code: string;
  stdin?: string;
  time_limit_min: number;
  strike_count: number;
  status: "waiting" | "active" | "paused" | "locked_strike" | "submitted" | "timeout";
  execution_status?: "idle" | "pending" | "running" | "completed" | "passed" | "failed" | "compile_error" | "error";
  terminal_output?: string;
  time_started?: string;
  paused_at?: string;
  updated?: string;
  time_ended?: string;
  expand?: {
    assigned_problem?: Problem;
    group?: {
      name: string;
      code: string;
      anti_cheat_enabled: boolean;
    };
  };
}

export const examService = {
  /**
   * Verify group code existence with safe parameter binding
   */
  async verifyGroupCode(groupCode: string): Promise<RecordModel> {
    const trimmedCode = groupCode.trim().toUpperCase();
    if (!trimmedCode) {
      throw new Error("Room Code is required.");
    }

    try {
      return await pb
        .collection("groups")
        .getFirstListItem(pb.filter("code = {:code}", { code: trimmedCode }), { requestKey: null });
    } catch (err: unknown) {
      const pbError = err as ClientResponseError;

      if (pbError?.status === 404 || pbError?.status === 400 || pbError?.status === 403) {
        throw new Error("Invalid Room Code. Please check with your instructor.");
      }
      throw new Error("Unable to verify room code. Please try again.");
    }
  },

  /**
   * Resume session or auto-assign a problem (max 2 uses per problem) and start exam
   */
  async startOrResumeSession(studentName: string, groupCode: string): Promise<ExamSession> {
    const trimmedName = studentName.trim();
    const trimmedCode = groupCode.trim().toUpperCase();

    if (!trimmedName || !trimmedCode) {
      throw new Error("Student name and room code are required.");
    }

    const group = await this.verifyGroupCode(trimmedCode);

    try {
      return await pb
        .collection("exam_sessions")
        .getFirstListItem<ExamSession>(
          pb.filter("student_name = {:name} && group_code = {:code}", { name: trimmedName, code: trimmedCode }),
          { expand: "assigned_problem,group", requestKey: null },
        );
    } catch {
      // 1. Fetch existing sessions for this group to count problem usage
      const existingSessions = await pb.collection("exam_sessions").getFullList<ExamSession>({
        filter: pb.filter("group = {:groupId}", { groupId: group.id }),
        requestKey: null,
      });

      const problemUsageCounts = new Map<string, number>();
      for (const session of existingSessions) {
        if (session.assigned_problem) {
          const currentCount = problemUsageCounts.get(session.assigned_problem) || 0;
          problemUsageCounts.set(session.assigned_problem, currentCount + 1);
        }
      }

      // 2. Fetch all problems in database
      const problemsList = await pb.collection("problems").getFullList<Problem>({ requestKey: null });

      if (problemsList.length === 0) {
        throw new Error("No exam problems available in the database yet.");
      }

      // 3. Filter problems that have been assigned fewer than 2 times in this group
      const eligibleProblems = problemsList.filter((problem) => (problemUsageCounts.get(problem.id) || 0) < 2);

      if (eligibleProblems.length === 0) {
        throw new Error("All available problems have reached their maximum limit of 2 assignments for this room.");
      }

      // 4. Select a random problem from eligible pool
      const randomProblem = eligibleProblems[Math.floor(Math.random() * eligibleProblems.length)];
      const initialCode =
        randomProblem.starter_code ||
        '// Write your C solution here\n#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    return 0;\n}';

      return await pb.collection("exam_sessions").create<ExamSession>(
        {
          student_name: trimmedName,
          group: group.id,
          group_code: trimmedCode,
          assigned_problem: randomProblem.id,
          status: "active",
          strike_count: 0,
          execution_status: "idle",
          time_limit_min: group.default_time_limit_min || 30,
          time_started: new Date().toISOString(),
          current_code: initialCode,
        },
        { expand: "assigned_problem,group", requestKey: null },
      );
    }
  },

  /**
   * Fetch an exam session by ID safely.
   */
  async getSession(sessionId: string): Promise<ExamSession | null> {
    if (!sessionId?.trim()) {
      return null;
    }

    try {
      return await pb.collection("exam_sessions").getOne<ExamSession>(sessionId, {
        expand: "assigned_problem,group",
        requestKey: null,
      });
    } catch (err: unknown) {
      const pbError = err as ClientResponseError;
      if (pbError?.status === 404 || pbError?.status === 400) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Mark the exam session as timed out
   */
  async timeoutExam(sessionId: string): Promise<void> {
    if (!sessionId) return;

    try {
      await pb.collection("exam_sessions").update(
        sessionId,
        {
          status: "timeout",
          time_ended: new Date().toISOString(),
        },
        { requestKey: null },
      );
    } catch (err: unknown) {
      const pbError = err as ClientResponseError;
      if (pbError?.status === 404) return;
      throw err;
    }
  },

  async saveCode(sessionId: string, code: string): Promise<void> {
    if (!sessionId) return;
    await pb.collection("exam_sessions").update(sessionId, { current_code: code }, { requestKey: null });
  },

  async incrementStrike(sessionId: string, currentStrikes: number): Promise<number> {
    if (!sessionId) return currentStrikes;

    const nextStrikes = currentStrikes + 1;
    const isLocked = nextStrikes >= 3;

    await pb.collection("exam_sessions").update(
      sessionId,
      {
        strike_count: nextStrikes,
        ...(isLocked
          ? {
              status: "locked_strike",
              paused_at: new Date().toISOString(),
            }
          : {}),
      },
      { requestKey: null },
    );

    return nextStrikes;
  },

  async submitExam(sessionId: string, finalCode: string): Promise<void> {
    if (!sessionId) return;

    await pb.collection("exam_sessions").update(
      sessionId,
      {
        current_code: finalCode,
        status: "submitted",
        time_ended: new Date().toISOString(),
      },
      { requestKey: null },
    );
  },

  async runCode(sessionId: string, code: string, stdinInput: string = ""): Promise<void> {
    if (!sessionId) return;

    await pb.collection("exam_sessions").update(
      sessionId,
      {
        current_code: code,
        stdin: stdinInput,
        execution_status: "running",
        terminal_output: "Execution queued. Running code...",
      },
      { requestKey: null },
    );
  },

  /**
   * Save complete compiled terminal output to PocketBase
   */
  async saveTerminalOutput(sessionId: string, output: string): Promise<void> {
    if (!sessionId) return;

    try {
      await pb.collection("exam_sessions").update(
        sessionId,
        {
          terminal_output: output,
          execution_status: "completed",
        },
        { requestKey: null },
      );
    } catch (err) {
      console.error("Failed to save terminal output to PocketBase:", err);
    }
  },
};