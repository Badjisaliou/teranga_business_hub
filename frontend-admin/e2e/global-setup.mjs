import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendURL = process.env.E2E_ADMIN_API_BASE_URL ?? "http://127.0.0.1:8020";
const frontendURL = process.env.E2E_ADMIN_FRONTEND_BASE_URL ?? "http://localhost:3020";
const adminRoot = path.resolve(__dirname, "..");
const backendRoot = path.resolve(adminRoot, "..", "backend");
const databasePath = path.join(adminRoot, ".e2e", "admin-e2e.sqlite");

export default async function globalSetup() {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  fs.closeSync(fs.openSync(databasePath, "a"));

  const backendEnv = {
    ...process.env,
    APP_ENV: "local",
    APP_KEY: process.env.APP_KEY || "base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    DB_CONNECTION: "sqlite",
    DB_DATABASE: databasePath,
    LOG_CHANNEL: "stderr",
    DEXPAY_ENABLED: "false",
    DEXPAY_AUTO_CONFIRM_DEV: "false",
    DEXPAY_WEBHOOK_SECRET: "e2e-dexpay-webhook-secret",
    DEXPAY_SUCCESS_URL: `${frontendURL}/paiement/retour`,
    DEXPAY_FAILURE_URL: `${frontendURL}/paiement/annule`,
    DEXPAY_WEBHOOK_URL: `${backendURL}/api/webhook/dexpay`,
    WHATSAPP_ENABLED: "false",
    FRONTEND_URL: "http://localhost:3010",
    ADMIN_FRONTEND_URL: frontendURL,
  };

  const migrate = spawnSync("php", ["artisan", "migrate:fresh", "--force", "--seed"], {
    cwd: backendRoot,
    env: backendEnv,
    stdio: "inherit",
  });

  if (migrate.status !== 0) {
    throw new Error("La migration E2E admin du backend a echoue.");
  }

  const backend = spawn("php", ["-S", "127.0.0.1:8020", "-t", "public", "public/index.php"], {
    cwd: backendRoot,
    env: backendEnv,
    stdio: "inherit",
  });

  const nextBin = path.join(adminRoot, "node_modules", "next", "dist", "bin", "next");
  const frontend = spawn(process.execPath, [nextBin, "dev", "-p", "3020"], {
    cwd: adminRoot,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_BASE_URL: backendURL,
    },
    stdio: "inherit",
  });

  await Promise.all([waitForURL(`${backendURL}/up`), waitForURL(frontendURL)]);

  return async () => {
    stopProcess(frontend);
    stopProcess(backend);
  };
}

function waitForURL(url, timeoutMs = 120_000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) {
          resolve();
          return;
        }
        retry();
      });

      request.on("error", retry);
      request.setTimeout(30_000, () => {
        request.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error(`Le serveur E2E admin ne repond pas: ${url}`));
        return;
      }

      setTimeout(attempt, 500);
    };

    attempt();
  });
}

function stopProcess(child) {
  if (!child.pid || child.exitCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }

  child.kill("SIGTERM");
}
