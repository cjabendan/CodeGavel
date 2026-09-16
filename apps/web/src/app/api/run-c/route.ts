import { exec } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { pb } from "@/lib/pocketbase";

const execAsync = promisify(exec);
const gccPath = `C:\\GCC\\bin\\gcc.exe`;

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const { sessionId, code } = await req.json();

    if (!sessionId || !code) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Generate unique temp filenames
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tempDir = os.tmpdir();
    const sourcePath = path.join(tempDir, `solution_${uniqueId}.c`);
    const isWindows = process.platform === "win32";
    const exePath = path.join(tempDir, `solution_${uniqueId}${isWindows ? ".exe" : ".out"}`);

    // Write code to temporary file
    await fs.writeFile(sourcePath, code, "utf-8");

    // Update status to running
    await pb.collection("exam_sessions").update(sessionId, {
      execution_status: "running",
      terminal_output: "Compiling source code with GCC...",
    });

    // 1. Compile C Code
    try {
     await execAsync(`"${gccPath}" "${sourcePath}" -o "${exePath}"`);
    } catch (compileErr: unknown) {
      const err = compileErr as { stderr?: string };
      const output = err.stderr || "Compilation failed with unknown error.";

      await pb.collection("exam_sessions").update(sessionId, {
        execution_status: "compile_error",
        terminal_output: output,
      });

      return NextResponse.json({ status: "compile_error", output });
    } finally {
      // Cleanup source .c file
      if (await fileExists(sourcePath)) {
        await fs.unlink(sourcePath);
      }
    }

    // 2. Execute Compiled Binary (5-second timeout protection)
    try {
      const { stdout, stderr } = await execAsync(`"${exePath}"`, { timeout: 5000 });
      const finalOutput = stdout || stderr || "Program executed successfully with no output.";

      await pb.collection("exam_sessions").update(sessionId, {
        execution_status: "completed",
        terminal_output: finalOutput,
      });

      return NextResponse.json({ status: "completed", output: finalOutput });
    } catch (execErr: unknown) {
      const err = execErr as { stdout?: string; stderr?: string; killed?: boolean };
      let output = err.stderr || err.stdout || "Runtime error occurred.";

      if (err.killed) {
        output = "Time Limit Exceeded (Infinite loop detected). Execution terminated.";
      }

      await pb.collection("exam_sessions").update(sessionId, {
        execution_status: "error",
        terminal_output: output,
      });

      return NextResponse.json({ status: "error", output });
    } finally {
      // Cleanup executable
      if (await fileExists(exePath)) {
        await fs.unlink(exePath);
      }
    }
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}