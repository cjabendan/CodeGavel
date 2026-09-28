import "dotenv/config";
import { exec } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import pty from "node-pty";
import { WebSocketServer } from "ws";

const PORT = Number(process.env.WS_PORT) || 8080;
const GCC_PATH = process.env.GCC_PATH || "gcc";
const BASE_TEMP_DIR = path.join(os.tmpdir(), "code_runner_sessions");
const MAX_AGE_MS = 10 * 60 * 1000; // Delete directories older than 10 minutes

// Helper to remove directory and file paths from compilation errors
function sanitizeErrorMessage(rawError, sourcePath, workDir) {
  if (!rawError) return "";
  let cleaned = String(rawError);

  // 1. Remove Node.js child_process shell command failure wrappers
  cleaned = cleaned.replace(/^Command failed:.*?\r?\n/im, "");

  // 2. Replace absolute file path variants (Windows & Posix) with main.c
  if (sourcePath) {
    const normPath = sourcePath.replace(/\\/g, "/");
    const winPath = sourcePath.replace(/\//g, "\\");
    cleaned = cleaned.replaceAll(sourcePath, "main.c");
    cleaned = cleaned.replaceAll(normPath, "main.c");
    cleaned = cleaned.replaceAll(winPath, "main.c"); // Fixed winDir -> winPath
  }

  // 3. Remove working directory paths if any remain
  if (workDir) {
    const normDir = workDir.replace(/\\/g, "/");
    const winDir = workDir.replace(/\//g, "\\");
    cleaned = cleaned.replaceAll(workDir, "");
    cleaned = cleaned.replaceAll(normDir, "");
    cleaned = cleaned.replaceAll(winDir, "");
  }

  // 4. Fix terminal stair-stepping by converting all newlines to CRLF (\r\n)
  cleaned = cleaned.replace(/\r?\n/g, "\r\n");

  return cleaned.trim();
}

// Garbage Collector: Removes orphaned session folders
function pruneStaleDirectories() {
  if (!fs.existsSync(BASE_TEMP_DIR)) return;

  const now = Date.now();
  const entries = fs.readdirSync(BASE_TEMP_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const dirPath = path.join(BASE_TEMP_DIR, entry.name);
      try {
        const stats = fs.statSync(dirPath);
        if (now - stats.mtimeMs > MAX_AGE_MS) {
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
      } catch {}
    }
  }
}

// Run cleanup immediately on worker startup and every 5 minutes
pruneStaleDirectories();
setInterval(pruneStaleDirectories, 5 * 60 * 1000);

const wss = new WebSocketServer({ port: PORT, host: "0.0.0.0" });

wss.on("connection", (ws) => {
  let ptyProcess = null;
  let currentWorkDir = null;

  const cleanup = () => {
    if (ptyProcess) {
      try {
        ptyProcess.kill();
      } catch {}
      ptyProcess = null;
    }
    if (currentWorkDir && fs.existsSync(currentWorkDir)) {
      setTimeout(() => {
        try {
          fs.rmSync(currentWorkDir, { recursive: true, force: true });
        } catch {}
      }, 1000);
    }
  };

  ws.on("message", (message) => {
    try {
      const payload = JSON.parse(message.toString());

      if (payload.type === "run") {
        cleanup();

        currentWorkDir = path.join(BASE_TEMP_DIR, `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
        fs.mkdirSync(currentWorkDir, { recursive: true });

        const sourcePath = path.join(currentWorkDir, "main.c");
        const execPath = path.join(currentWorkDir, process.platform === "win32" ? "main.exe" : "main.out");

        fs.writeFileSync(sourcePath, payload.code || "");

        exec(`"${GCC_PATH}" "${sourcePath}" -o "${execPath}"`, (compileErr, _stdout, stderr) => {
          if (compileErr || stderr) {
            if (ws.readyState === ws.OPEN) {
              const rawError = stderr || compileErr.message;
              const cleanError = sanitizeErrorMessage(rawError, sourcePath, currentWorkDir);

              ws.send(
                JSON.stringify({
                  type: "output",
                  data: `\r\n\x1b[31m${cleanError}\x1b[0m\r\n`,
                }),
              );
              ws.send(JSON.stringify({ type: "exit" }));
            }
            cleanup();
            return;
          }

          ptyProcess = pty.spawn(execPath, [], {
            name: "xterm-color",
            cols: payload.cols || 80,
            rows: payload.rows || 24,
            cwd: currentWorkDir,
            env: process.env,
          });

          ptyProcess.onData((data) => {
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify({ type: "output", data }));
            }
          });

          ptyProcess.onExit(() => {
            if (ws.readyState === ws.OPEN) {
              ws.send(
                JSON.stringify({
                  type: "output",
                  data: "\r\n\x1b[32m[Process exited]\x1b[0m\r\n",
                }),
              );
              ws.send(JSON.stringify({ type: "exit" }));
            }
            cleanup();
          });
        });
      }

      if (payload.type === "input" && ptyProcess) {
        ptyProcess.write(payload.data);
      }
    } catch (err) {
      console.error("WS Message Error:", err);
    }
  });

  ws.on("close", cleanup);
});

// Process signal cleanup on server shutdown
process.on("SIGINT", () => {
  try {
    fs.rmSync(BASE_TEMP_DIR, { recursive: true, force: true });
  } catch {}
  process.exit(0);
});
