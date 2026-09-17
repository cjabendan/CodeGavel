import "dotenv/config";
import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import pty from "node-pty";
import { WebSocketServer } from "ws";

const PORT = Number(process.env.WS_PORT) || 8080;
const GCC_PATH = process.env.GCC_PATH || "gcc";

const wss = new WebSocketServer({ port: PORT, host: "0.0.0.0" });

wss.on("connection", (ws) => {
  let ptyProcess = null;
  let currentWorkDir = null;

  const cleanup = () => {
    if (ptyProcess) {
      try { ptyProcess.kill(); } catch {}
      ptyProcess = null;
    }
    if (currentWorkDir && fs.existsSync(currentWorkDir)) {
      setTimeout(() => {
        try { fs.rmSync(currentWorkDir, { recursive: true, force: true }); } catch {}
      }, 500);
    }
  };

  ws.on("message", (message) => {
    try {
      const payload = JSON.parse(message.toString());

      if (payload.type === "run") {
        cleanup();

        currentWorkDir = path.join(
          process.cwd(),
          "temp_runner",
          `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        );
        fs.mkdirSync(currentWorkDir, { recursive: true });

        const sourcePath = path.join(currentWorkDir, "main.c");
        const execPath = path.join(
          currentWorkDir,
          process.platform === "win32" ? "main.exe" : "main.out"
        );

        fs.writeFileSync(sourcePath, payload.code || "");

        exec(`"${GCC_PATH}" "${sourcePath}" -o "${execPath}"`, (compileErr, _stdout, stderr) => {
          if (compileErr || stderr) {
            if (ws.readyState === ws.OPEN) {
              ws.send(
                JSON.stringify({
                  type: "output",
                  data: `\r\n\x1b[31m${stderr || compileErr.message}\x1b[0m\r\n`,
                })
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
                })
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