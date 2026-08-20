import { spawnSync } from "node:child_process";
import { join } from "node:path";

const retryDelaysMs = [0, 5_000, 15_000, 30_000];
const prismaCli = join(process.cwd(), "node_modules", "prisma", "build", "index.js");

for (const [index, delayMs] of retryDelaysMs.entries()) {
  if (delayMs > 0) {
    console.warn(`Migration lock is busy. Retrying in ${delayMs / 1_000} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  const result = spawnSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    encoding: "utf8",
    env: {
      ...process.env,
      DATABASE_URL: process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL,
    },
  });

  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");

  if (result.status === 0) {
    process.exit(0);
  }

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const lockTimedOut = /P1002|advisory lock/i.test(output);
  const hasMoreAttempts = index < retryDelaysMs.length - 1;

  if (!lockTimedOut || !hasMoreAttempts) {
    process.exit(result.status ?? 1);
  }
}
