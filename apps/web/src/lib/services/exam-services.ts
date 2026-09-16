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
  time_limit_min: number;
  strike_count: number;
  status: "waiting" | "active" | "paused" | "locked_strike" | "submitted" | "timeout";
  execution_status?: "idle" | "pending" | "running" | "completed" | "passed" | "failed" | "compile_error" | "error";
  terminal_output?: string;
  time_started?: string;
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

      // Handle 404 (Not Found), 400 (Bad Request), or 403 (Forbidden if API rules restrict listing)
      if (pbError?.status === 404 || pbError?.status === 400 || pbError?.status === 403) {
        throw new Error("Invalid Room Code. Please check with your instructor.");
      }
      throw new Error("Unable to verify room code. Please try again.");
    }
  },

  /**
   * Resume session or auto-assign a problem and start exam
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
      const problemsList = await pb.collection("problems").getFullList<Problem>({ requestKey: null });

      if (problemsList.length === 0) {
        throw new Error("No exam problems available in the database yet.");
      }

      const randomProblem = problemsList[Math.floor(Math.random() * problemsList.length)];
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
   * Mark the exam session as timed out and update the status in the database
   *
   **/

  async timeoutExam(sessionId: string): Promise<void> {
    await pb.collection("exam_sessions").update(
      sessionId,
      {
        status: "timeout",
        time_ended: new Date().toISOString(),
      },
      { requestKey: null },
    );
  },

  async getSession(sessionId: string): Promise<ExamSession> {
    return await pb.collection("exam_sessions").getOne<ExamSession>(sessionId, {
      expand: "assigned_problem,group",
      requestKey: null,
    });
  },

  async saveCode(sessionId: string, code: string): Promise<void> {
    await pb.collection("exam_sessions").update(sessionId, { current_code: code }, { requestKey: null });
  },

  async incrementStrike(sessionId: string, currentStrikes: number): Promise<number> {
    const nextStrikes = currentStrikes + 1;
    const isLocked = nextStrikes >= 3;

    await pb.collection("exam_sessions").update(
      sessionId,
      {
        strike_count: nextStrikes,
        ...(isLocked ? { status: "locked_strike" } : {}),
      },
      { requestKey: null },
    );

    return nextStrikes;
  },

  async submitExam(sessionId: string, finalCode: string): Promise<void> {
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

  // Run C code
  async runCode(sessionId: string, code: string): Promise<void> {
    await pb.collection("exam_sessions").update(
      sessionId,
      {
        current_code: code,
        execution_status: "pending",
        terminal_output: "⏳ Execution queued. Waiting for worker...",
      },
      { requestKey: null },
    );
  },
};
