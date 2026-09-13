import type { RecordModel } from "pocketbase";
import { pb } from "@/lib/pocketbase";

export interface JoinExamParams {
  studentId: string;
  groupCode: string;
}

export interface JoinExamResponse {
  sessionId: string;
  studentId: string;
  groupCode: string;
}

export async function joinExamSession({ studentId, groupCode }: JoinExamParams): Promise<JoinExamResponse> {
  const trimmedStudentId = studentId.trim();
  const trimmedGroupCode = groupCode.trim().toUpperCase();

  if (!trimmedStudentId || !trimmedGroupCode) {
    throw new Error("Student ID and Room Code are required.");
  }

  // 1. Verify group
  const group = await pb.collection("groups").getFirstListItem(`code="${trimmedGroupCode}"`);

  if (!group) {
    throw new Error("Invalid Room Code. Please check with your instructor.");
  }

  // 2. Check existing exam session 
  let sessionRecord: RecordModel;
  try {
    sessionRecord = await pb
      .collection("exam_sessions")
      .getFirstListItem(`student_name="${trimmedStudentId}" && group_code="${trimmedGroupCode}"`);
  } catch {
    // 3. Create a new session if none exists
    sessionRecord = await pb.collection("exam_sessions").create({
      student_name: trimmedStudentId,
      group: group.id,
      group_code: trimmedGroupCode,
      status: "waiting",
      strike_count: 0,
      execution_status: "idle",
      time_limit_min: group.default_time_limit_min || 30,
    });
  }

  return {
    sessionId: sessionRecord.id,
    studentId: trimmedStudentId,
    groupCode: trimmedGroupCode,
  };
}
