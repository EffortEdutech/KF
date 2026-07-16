import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const baseURL = process.env.KF_STUDIO_URL ?? "http://localhost:4700";
const resetToken = process.env.KF_TEST_RESET_TOKEN ?? "kf-local-runtime-reset";
const playwrightCli = require.resolve("@playwright/test/cli");

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) {
        return;
      }
    } catch {
      // Server is still starting.
    }

    await delay(500);
  }

  throw new Error(`Timed out waiting for Studio at ${url}`);
}

function stopProcessTree(processToStop) {
  if (!processToStop.pid) {
    return;
  }

  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(processToStop.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true
    });
    return;
  }

  processToStop.kill("SIGTERM");
}

let server;

let exitCode = 1;

try {
  try {
    await waitForServer(baseURL, 1000);
  } catch {
    server = spawn(process.execPath, ["scripts/runtime-studio-server.mjs"], {
      env: {
        ...process.env,
        KF_ALLOW_DATABASE_TEST_RESET: "1",
        KF_ENABLE_TEST_RESET: "1",
        KF_TEST_RESET_TOKEN: resetToken
      },
      stdio: "inherit",
      windowsHide: true
    });
  }

  await waitForServer(baseURL);

  exitCode = await new Promise((resolve) => {
    const testProcess = spawn(process.execPath, [playwrightCli, "test"], {
      env: {
        ...process.env,
        KF_ALLOW_DATABASE_TEST_RESET: "1",
        KF_ENABLE_TEST_RESET: "1",
        KF_SKIP_PLAYWRIGHT_WEBSERVER: "1",
        KF_STUDIO_URL: baseURL,
        KF_TEST_RESET_TOKEN: resetToken
      },
      stdio: "inherit",
      windowsHide: true
    });

    testProcess.on("exit", (code) => resolve(code ?? 1));
  });
} finally {
  if (server) {
    stopProcessTree(server);
  }
}

process.exit(exitCode);
