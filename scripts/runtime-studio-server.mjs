import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const studioDir = resolve(repoRoot, "apps", "studio");
const require = createRequire(resolve(studioDir, "package.json"));
const nextBin = require.resolve("next/dist/bin/next");
const port = process.env.PORT ?? "4700";

const child = spawn(process.execPath, [nextBin, "dev", "--turbopack", "--port", port], {
  cwd: studioDir,
  env: process.env,
  stdio: "inherit",
  windowsHide: true
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  if (process.platform === "win32" && child.pid) {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true
    });
    return;
  }

  if (!child.killed) {
    child.kill(signal);
  }

  setTimeout(() => {
    if (!child.killed) {
      child.kill("SIGKILL");
    }
  }, 3000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGHUP", () => shutdown("SIGHUP"));

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
