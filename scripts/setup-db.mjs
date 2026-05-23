import { readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const migrationDirs = readdirSync(new URL("../prisma/migrations", import.meta.url), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

function runPrisma(args) {
  if (process.platform === "win32") {
    execFileSync("cmd.exe", ["/d", "/s", "/c", `node_modules\\.bin\\prisma.cmd ${args.join(" ")}`], {
      stdio: "inherit",
    });
    return;
  }

  execFileSync("node_modules/.bin/prisma", args, {
    stdio: "inherit",
  });
}

for (const dir of migrationDirs) {
  const migrationPath = `prisma/migrations/${dir}/migration.sql`;

  console.log(`Applying ${migrationPath}`);
  runPrisma(["db", "execute", "--file", migrationPath, "--schema", "prisma/schema.prisma"]);
}
