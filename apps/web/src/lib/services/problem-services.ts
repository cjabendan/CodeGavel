import * as XLSX from "xlsx";
import { pb } from "@/lib/pocketbase";

export interface TestCase {
  input: string;
  output: string;
  is_hidden?: boolean;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  starter_code?: string;
  time_limit_sec: number;
  memory_limit_mb: number;
  test_cases: TestCase[];
  created?: string;
  updated?: string;
}

export type CreateProblemInput = Omit<Problem, "id" | "created" | "updated">;

export const problemService = {
  async getProblems(): Promise<Problem[]> {
    try {
      return await pb.collection("problems").getFullList<Problem>({
        sort: "-created",
        requestKey: null,
      });
    } catch (_err) {
      try {
        return await pb.collection("problems").getFullList<Problem>({
          requestKey: null,
        });
      } catch (innerErr) {
        console.error("Failed to fetch problems from PocketBase:", innerErr);
        return [];
      }
    }
  },

  async getProblemById(id: string): Promise<Problem> {
    return await pb.collection("problems").getOne<Problem>(id, {
      requestKey: null,
    });
  },

  async createProblem(data: CreateProblemInput): Promise<Problem> {
    return await pb.collection("problems").create<Problem>(data, {
      requestKey: null,
    });
  },

  async batchImportProblems(problems: CreateProblemInput[]): Promise<Problem[]> {
    const createdProblems: Problem[] = [];
    for (const item of problems) {
      const record = await pb.collection("problems").create<Problem>(item, { requestKey: null });
      createdProblems.push(record);
    }
    return createdProblems;
  },

  async deleteProblem(id: string): Promise<boolean> {
    return await pb.collection("problems").delete(id, { requestKey: null });
  },

  parseXLSXBuffer(binaryString: string): CreateProblemInput[] {
    const workbook = XLSX.read(binaryString, { type: "binary" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);

    return rawData.map((row) => {
      let testCases: TestCase[] = [];

      if (typeof row.test_cases === "string") {
        try {
          testCases = JSON.parse(row.test_cases) as TestCase[];
        } catch {
          testCases = [];
        }
      } else if (Array.isArray(row.test_cases)) {
        testCases = row.test_cases as TestCase[];
      }

      const parsedTitle =
        typeof row.title === "string" || typeof row.title === "number" ? String(row.title).trim() : "Untitled Problem";

      const parsedDescription =
        typeof row.description === "string" || typeof row.description === "number"
          ? String(row.description).trim()
          : "";

      return {
        title: parsedTitle,
        description: parsedDescription,
        starter_code: typeof row.starter_code === "string" ? row.starter_code : undefined,
        time_limit_sec:
          typeof row.time_limit_sec === "number"
            ? row.time_limit_sec
            : Number.parseFloat(String(row.time_limit_sec)) || 2.0,
        memory_limit_mb:
          typeof row.memory_limit_mb === "number"
            ? row.memory_limit_mb
            : Number.parseInt(String(row.memory_limit_mb), 10) || 128,
        test_cases: testCases,
      };
    });
  },
};
