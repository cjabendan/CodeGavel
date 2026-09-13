import { pb } from "@/lib/pocketbase";

export interface Section {
  id: string;
  section_name: string;
  year_level: string;
  created: string;
}

export interface Group {
  id: string;
  name: string;
  code: string;
  section: string;
  default_time_limit_min: number;
  anti_cheat_enabled: boolean;
  status: "lobby" | "active" | "ended";
  created: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  time_limit_sec: number;
  memory_limit_mb: number;
  test_cases: { input: string; output: string; is_hidden?: boolean }[];
  created: string;
}

export interface ExamSession {
  id: string;
  student_name: string;
  group: string;
  group_code: string;
  assigned_problem: string;
  expand?: { assigned_problem?: Problem };
  current_code: string;
  time_limit_min: number;
  strike_count: number;
  status: "waiting" | "active" | "paused" | "locked_strike" | "submitted" | "timeout";
  execution_status?: "idle" | "pending" | "running" | "completed" | "passed" | "failed" | "compile_error" | "error";
  terminal_output?: string;
  time_started?: string;
  time_ended?: string;
}

export const adminService = {
  // --- Sections ---
  async getSections(): Promise<Section[]> {
    return await pb.collection("sections").getFullList<Section>({ sort: "-created" });
  },

  async createSection(data: { section_name: string; year_level: string }): Promise<Section> {
    return await pb.collection("sections").create<Section>(data);
  },

  // --- Groups ---
  async getGroups(sectionId?: string): Promise<Group[]> {
    const filter = sectionId ? `section="${sectionId}"` : "";
    return await pb.collection("groups").getFullList<Group>({ filter, sort: "-created" });
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

  // --- Live Exam Sessions (SSE Realtime) ---
  async getSessionsByGroup(groupId: string): Promise<ExamSession[]> {
    return await pb.collection("exam_sessions").getFullList<ExamSession>({
      filter: `group="${groupId}"`,
      expand: "assigned_problem",
      sort: "-created",
    });
  },

  subscribeToSessions(groupId: string, callback: () => void) {
    pb.collection("exam_sessions").subscribe("*", (e) => {
      if (e.record.group === groupId) {
        callback();
      }
    });
    return () => {
      pb.collection("exam_sessions").unsubscribe("*");
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

  // --- Standalone Problems Bank ---
  async getProblems(): Promise<Problem[]> {
    return await pb.collection("problems").getFullList<Problem>({ sort: "-created" });
  },

  async createProblem(data: Omit<Problem, "id" | "created">): Promise<Problem> {
    return await pb.collection("problems").create<Problem>(data);
  },

  async importProblemsBatch(problems: Omit<Problem, "id" | "created">[]) {
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