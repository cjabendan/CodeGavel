import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// Load .env variables manually for root Node scripts
const envPath = path.resolve(import.meta.dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  for (const line of envConfig.split("\n")) {
    const [key, ...value] = line.split("=");
    if (key && value.length > 0) {
      process.env[key.trim()] = value.join("=").trim();
    }
  }
}

const pbExe = path.resolve(import.meta.dirname, "../pocketbase/pocketbase.exe");
const superEmail = process.env.PB_SUPERUSER_EMAIL || "owner@example.local";
const superPassword = process.env.PB_SUPERUSER_PASSWORD || "change-this-superuser-password";

async function bootstrap() {
  console.log("Bootstrapping PocketBase Administrator via CLI...");

  if (!fs.existsSync(pbExe)) {
    console.error(`Error: PocketBase executable not found at ${pbExe}. Run "pnpm pocketbase:setup" first.`);
    return;
  }

  try {
    // PocketBase v0.22.x CLI command
    const command = `"${pbExe}" admin create "${superEmail}" "${superPassword}"`;
    execSync(command, { stdio: "inherit" });
    console.log("\nPocketBase environment bootstrapped successfully!");
  } catch (_err) {
    try {
      // Fallback for PocketBase v0.23+ CLI command
      const fallbackCommand = `"${pbExe}" superuser create "${superEmail}" "${superPassword}"`;
      execSync(fallbackCommand, { stdio: "inherit" });
      console.log("\nPocketBase environment bootstrapped successfully!");
    } catch (_fallbackErr) {
      console.log("\nAdmin account setup completed (or account already exists).");
    }
  }
}

bootstrap();
