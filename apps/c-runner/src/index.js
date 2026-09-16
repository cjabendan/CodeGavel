import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import PocketBase from "pocketbase";

// Resolve path 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, "../../.env");

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const POLL_INTERVAL_MS = Number.parseInt(process.env.POLL_INTERVAL_MS || "1000", 10);
const GCC_PATH = process.env.GCC_PATH || "C:\\GCC\\bin\\gcc.exe";
const MAX_CONCURRENT_JOBS = Number.parseInt(process.env.RENDER_CONCURRENCY || "5", 10);
const MAX_CODE_SIZE_BYTES = 64 * 1024;

const pb = new PocketBase(PB_URL);
let activeJobs = 0;

function killProcess(child) {
  if (!child?.pid) return;
  if (process.platform === "win32") {
    exec(`taskkill /F /T /PID ${child.pid}`, () => {});
  } else {
    child.kill("SIGKILL");
  }
}

function compileAndRun(code, timeLimitSec = 4) {
  return new Promise((resolve) => {
    if (Buffer.byteLength(code, "utf8") > MAX_CODE_SIZE_BYTES) {
      return resolve({
        status: "error",
        output: "🔴 Error: Code size exceeds maximum limit (64 KB).",
      });
    }

    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const workDir = path.join(process.cwd(), "temp_runner", uniqueId);
    fs.mkdirSync(workDir, { recursive: true });

    const sourcePath = path.join(workDir, "main.c");
    const isWindows = process.platform === "win32";
    const execPath = path.join(workDir, `main${isWindows ? ".exe" : ".out"}`);

    fs.writeFileSync(sourcePath, code);

    const compileProcess = exec(
      `"${GCC_PATH}" "${sourcePath}" -o "${execPath}"`,
      { timeout: 8000 },
      (compileErr, _stdout, stderr) => {
        if (compileErr || stderr) {
          cleanupDir(workDir);
          return resolve({
            status: "compile_error",
            output: stderr || compileErr.message,
          });
        }

        let isTimedOut = false;
        const runProcess = exec(`"${execPath}"`, { timeout: timeLimitSec * 1000 }, (runErr, runStdout, runStderr) => {
          cleanupDir(workDir);

          if (isTimedOut || runErr?.killed) {
            return resolve({
              status: "error",
              output: "Time Limit Exceeded (Infinite loop or execution timeout).",
            });
          }

          if (runErr) {
            return resolve({
              status: "error",
              output: `Runtime Error:\n${runStderr || runErr.message}`,
            });
          }

          resolve({
            status: "completed",
            output: runStdout || runStderr || "Program executed successfully with no output.",
          });
        });

        const timer = setTimeout(
          () => {
            isTimedOut = true;
            killProcess(runProcess);
          },
          timeLimitSec * 1000 + 500,
        );

        runProcess.on("exit", () => clearTimeout(timer));
      },
    );

    compileProcess.on("error", () => cleanupDir(workDir));
  });
}

function cleanupDir(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.warn(`Failed to clean up directory ${dirPath}:`, err.message);
  }
}

async function recoverStaleSessions() {
  try {
    const staleSessions = await pb.collection("exam_sessions").getList(1, 50, {
      filter: "execution_status = 'running'",
      requestKey: null,
    });

    for (const session of staleSessions.items) {
      await pb.collection("exam_sessions").update(
        session.id,
        {
          execution_status: "error",
          terminal_output: "Execution interrupted due to a system restart. Please click 'Run Code' again.",
        },
        { requestKey: null },
      );
    }
    if (staleSessions.items.length > 0) {
      console.log(`Recovered ${staleSessions.items.length} stale session(s).`);
    }
  } catch (err) {
    console.error("Failed to recover stale sessions:", err?.response?.data || err.message);
  }
}

async function pollSubmissions() {
  try {
    const availableSlots = MAX_CONCURRENT_JOBS - activeJobs;

    if (availableSlots > 0) {
      const pendingSessions = await pb.collection("exam_sessions").getList(1, availableSlots, {
        filter: "execution_status = 'pending'",
        sort: "-id",
        requestKey: null,
      });

      for (const session of pendingSessions.items) {
        activeJobs++;
        processSession(session).finally(() => {
          activeJobs--;
        });
      }
    }
  } catch (err) {
    console.warn("Polling error:", err?.message || err?.response?.message || err);
  } finally {
    setTimeout(pollSubmissions, POLL_INTERVAL_MS);
  }
}

async function processSession(session) {
  console.log(`⚡ Processing session: ${session.id} (Active jobs: ${activeJobs}/${MAX_CONCURRENT_JOBS})`);

  try {
    await pb
      .collection("exam_sessions")
      .update(
        session.id,
        { execution_status: "running", terminal_output: "Compiling and running C code..." },
        { requestKey: null },
      );

    if (!session.current_code) {
      await pb
        .collection("exam_sessions")
        .update(
          session.id,
          { execution_status: "error", terminal_output: "Error: Code buffer is empty." },
          { requestKey: null },
        );
      return;
    }

    const result = await compileAndRun(session.current_code, 4);

    let terminalText = "";
    if (result.status === "compile_error") {
      terminalText = `${result.output}`;
    } else if (result.status === "error") {
      terminalText = `${result.output}`;
    } else {
      terminalText = `${result.output}`;
    }

    await pb.collection("exam_sessions").update(
      session.id,
      {
        execution_status: result.status,
        terminal_output: terminalText,
      },
      { requestKey: null },
    );

    console.log(`✅ Session ${session.id} finished with status: ${result.status}`);
  } catch (err) {
    console.error(`Error processing session ${session.id}:`, err.message);
  }
}

async function startWorker() {
  console.log("Starting Fail-Safe C Execution Worker...");
  console.log(`Connecting to PocketBase at ${PB_URL}`);

  const email = process.env.PB_SUPERUSER_EMAIL || process.env.PB_ADMIN_EMAIL;
  const password = process.env.PB_SUPERUSER_PASSWORD || process.env.PB_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("🔴 Error: PB_SUPERUSER_EMAIL and PB_SUPERUSER_PASSWORD must be defined in .env");
    process.exit(1);
  }

  let authenticated = false;

  try {
    await pb.collection("_superusers").authWithPassword(email, password);
    authenticated = true;
    console.log(`🟢 Worker authenticated as Superuser (${email}).`);
  } catch {
    try {
      await pb.admins.authWithPassword(email, password);
      authenticated = true;
      console.log(`🟢 Worker authenticated as Admin (${email}).`);
    } catch {
      console.error("🔴 Superuser login failed. Verify your email and password in .env match http://localhost:8090/_/");
    }
  }

  if (!authenticated) {
    process.exit(1);
  }

  await recoverStaleSessions();
  pollSubmissions();
}

startWorker();
