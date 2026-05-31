import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const isWindows = process.platform === "win32";
const bin = (name) => `node_modules/.bin/${name}${isWindows ? ".cmd" : ""}`;

const steps = [
  ["no-emoji", process.execPath, ["scripts/check-no-emoji.mjs"]],
  ["typecheck", bin("tsc"), ["--noEmit"]],
  ["test", bin("vitest"), ["run", "--config", "vitest.config.ts"]],
  ["build", bin("vite"), ["build"]],
  ["verify-dist", process.execPath, ["scripts/verify-dist.mjs"]]
];

for (const [name, command, args] of steps) {
  if (command.includes("node_modules") && !existsSync(command)) {
    console.error(`Missing executable for ${name}: ${command}`);
    process.exit(1);
  }

  console.log(`\n[quality] ${name}`);
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
