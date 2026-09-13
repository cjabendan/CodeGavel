import { exec } from "child_process";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import PocketBase from "pocketbase";

dotenv.config();

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || "2000", 10);

const pb = new PocketBase(PB_URL);

/**
 * Compiles and runs C code against test cases using GCC.
 */
function compileAndExecute(code, testCases, timeLimitSec = 2) {
  return new Promise((resolve) => {
    const workDir = path.join(process.cwd(), "temp_runner");
    if (!fs.existsSync(workDir)) {
      fs.mkdirSync(workDir, { recursive: true });
    }

    const sessionHash = Math.random().toString(36).substring(2, 9);
    const sourcePath = path.join(workDir, `code_${sessionHash}.c`);
    const execPath = path.join(workDir, `exec_${sessionHash}.exe`);

    fs.writeFileSync(sourcePath, code);

    // Compile C code using installed GCC
    exec(`gcc "${sourcePath}" -o "${execPath}"`, { timeout: 10000 }, (compileErr, stdout, stderr) => {
      if (compileErr || stderr) {
        // Clean up source file
        if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath);

        return resolve({
          status: "compile_error",
          output: stderr || compileErr.message,
          passedCases: 0,
          totalCases: testCases.length,
          details: [],
        });
      }

      // Execute compiled binary against provided test cases
      let passedCases = 0;
      const details = [];

      const runCase = (index) => {
        if (index >= testCases.length) {
          // Cleanup binaries after execution
          if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath);
          if (fs.existsSync(execPath)) fs.unlinkSync(execPath);

          const allPassed = passedCases === testCases.length;
          return resolve({
            status: allPassed ? "passed" : "failed",
            output: `Passed ${passedCases} / ${testCases.length} test cases.`,
            passedCases,
            totalCases: testCases.length,
            details,
          });
        }

        const tc = testCases[index];
        const child = exec(`"${execPath}"`, { timeout: timeLimitSec * 1000 }, (runErr, runStdout) => {
          let passed = false;
          let actual = runStdout ? runStdout.trim() : "";

          if (runErr) {
            actual = runErr.killed ? "Time Limit Exceeded" : "Runtime Error";
          } else {
            passed = actual === (tc.output || tc.expected || "").trim();
          }

          if (passed) passedCases++;

          details.push({
            input: tc.input || "",
            expected: tc.output || tc.expected || "",
            actual,
            passed,
          });

          runCase(index + 1);
        });

        if (tc.input && child.stdin) {
          child.stdin.write(tc.input + "\n");
          child.stdin.end();
        }
      };

      runCase(0);
    });
  });
}

/**
 * Polls PocketBase for pending execution jobs within active exam sessions.
 */
async function pollSubmissions() {
  try {
    // Search for active exam sessions with pending code executions
    const pendingSessions = await pb.collection("exam_sessions").getList(1, 5, {
      filter: 'status = "active" && execution_status = "pending"',
      expand: "assigned_problem_id",
      requestKey: null,
    });

    for (const session of pendingSessions.items) {
      console.log(`⚡ Running submission for session: ${session.id}...`);

      // Set execution status to 'running'
      await pb.collection("exam_sessions").update(session.id, { execution_status: "running" }, { requestKey: null });

      const problem = session.expand?.assigned_problem_id;
      if (!problem || !session.current_code) {
        await pb.collection("exam_sessions").update(
          session.id,
          {
            execution_status: "error",
            terminal_output: "🔴 Error: Missing problem definition or submission code.",
          },
          { requestKey: null },
        );
        continue;
      }

      const testCases = Array.isArray(problem.test_cases) ? problem.test_cases : [];
      const timeLimit = problem.time_limit_sec || 2;

      const result = await compileAndExecute(session.current_code, testCases, timeLimit);

      // Build terminal output summary
      let terminalText = "";
      if (result.status === "compile_error") {
        terminalText = `🔴 COMPILE ERROR:\n----------------\n${result.output}`;
      } else {
        const isSuccess = result.status === "passed";
        terminalText = `${isSuccess ? "🟢" : "🔴"} STATUS: ${result.status.toUpperCase()}\n`;
        terminalText += `Test Cases Passed: ${result.passedCases} / ${result.totalCases}\n\n`;

        result.details.forEach((tc, idx) => {
          terminalText += `Test Case ${idx + 1}: ${tc.passed ? "PASSED" : "FAILED"}\n`;
          if (!tc.passed) {
            terminalText += `   Input:    ${tc.input || "(none)"}\n`;
            terminalText += `   Expected: ${tc.expected}\n`;
            terminalText += `   Actual:   ${tc.actual}\n`;
          }
        });
      }

      // Save execution output back to PocketBase
      await pb.collection("exam_sessions").update(
        session.id,
        {
          execution_status: result.status,
          terminal_output: terminalText,
        },
        { requestKey: null },
      );

      console.log(`✅ Session ${session.id} finished with status: ${result.status}`);
    }
  } catch (err) {
    console.warn("Polling error:", err?.response?.message || err.message);
  } finally {
    setTimeout(pollSubmissions, POLL_INTERVAL_MS);
  }
}

/**
 * Worker Entry Point
 */
async function startWorker() {
  console.log("Starting CodeGavel Worker...");
  console.log(`Connecting to PocketBase at ${PB_URL}`);

  const superuserEmail = process.env.PB_SUPERUSER_EMAIL || process.env.PB_ADMIN_EMAIL || "owner@example.local";
  const superuserPassword = process.env.PB_SUPERUSER_PASSWORD || process.env.PB_ADMIN_PASSWORD || "";

  try {
    await pb.collection("_superusers").authWithPassword(superuserEmail, superuserPassword);
    console.log(`🟢 Worker successfully authenticated as Superuser (${superuserEmail}).`);
  } catch (err) {
    console.error("🔴 Superuser authentication failed:", err?.response?.message || err.message);
  }

  pollSubmissions();
}

startWorker();
