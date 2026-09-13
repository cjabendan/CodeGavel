export interface Problem {
  id: string;
  title: string;
  description: string;
  test_cases: { input: string; expected_output: string }[];
}

export interface ExamSession {
  id: string;
  group_code: string;
  current_code: string;
  strike_count: number;
  status: "active" | "paused" | "locked_strike" | "submitted";
  execution_status?: "idle" | "pending" | "running" | "completed" | "error";
  terminal_output?: string;
  expand?: {
    assigned_problem_id?: Problem;
  };
}