import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import manifest from "../package.json" with { type: "json" };

const archive = join("release", `${manifest.name}-${manifest.version}.zip`);

if (!existsSync("dist/manifest.json")) {
  console.error("dist/manifest.json is missing. Run the build first.");
  process.exit(1);
}

mkdirSync(dirname(archive), { recursive: true });
if (existsSync(archive)) {
  rmSync(archive);
}

const ditto = spawnSync("/usr/bin/ditto", ["-c", "-k", "--norsrc", "--noextattr", "dist", archive], { stdio: "inherit" });
if (ditto.status === 0) {
  console.log(`Packaged extension: ${archive}`);
  process.exit(0);
}

const zip = spawnSync("zip", ["-r", archive, "dist"], { stdio: "inherit" });
if (zip.status !== 0) {
  console.error("Unable to create extension archive with ditto or zip.");
  process.exit(zip.status ?? 1);
}

console.log(`Packaged extension: ${archive}`);
