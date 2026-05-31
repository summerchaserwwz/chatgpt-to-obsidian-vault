import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const requiredFiles = [
  "manifest.json",
  "sidepanel.html",
  "options.html",
  "assets/service-worker.js",
  "assets/chatgpt-entry.js",
  "assets/sidepanel.js",
  "assets/options.js",
  "assets/styles.css"
];

const failures = [];

for (const file of requiredFiles) {
  const path = join("dist", file);
  if (!existsSync(path)) {
    failures.push(`Missing dist file: ${file}`);
    continue;
  }
  if (statSync(path).size === 0) {
    failures.push(`Empty dist file: ${file}`);
  }
}

if (existsSync("dist/manifest.json")) {
  const manifest = JSON.parse(readFileSync("dist/manifest.json", "utf8"));
  expect(manifest.manifest_version === 3, "manifest_version must be 3");
  expect(manifest.name === "ChatGPT to Obsidian Vault", "manifest name mismatch");
  expect(manifest.background?.service_worker === "assets/service-worker.js", "service worker path mismatch");
  expect(manifest.side_panel?.default_path === "sidepanel.html", "side panel path mismatch");
  expect(manifest.options_page === "options.html", "options page path mismatch");
  expect(Array.isArray(manifest.content_scripts) && manifest.content_scripts.length > 0, "content script missing");
  expect(manifest.content_scripts[0].js.includes("assets/chatgpt-entry.js"), "content script bundle missing");
  const executableRefs = [
    manifest.background?.service_worker,
    manifest.side_panel?.default_path,
    manifest.options_page,
    ...(manifest.content_scripts ?? []).flatMap((script) => script.js ?? [])
  ].filter(Boolean);
  expect(
    executableRefs.every((ref) => typeof ref === "string" && !/^https?:\/\//.test(ref)),
    "manifest executable paths must be local extension assets"
  );
}

const distText = requiredFiles
  .filter((file) => existsSync(join("dist", file)))
  .map((file) => readFileSync(join("dist", file), "utf8"))
  .join("\n");

expect(!/[\u2600-\u27BF]|\p{Extended_Pictographic}/u.test(distText), "dist contains emoji characters");
expect(!/purple|pink|from-purple|to-pink/i.test(distText), "dist contains forbidden purple or pink gradient tokens");

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Dist verification passed.");

function expect(condition, message) {
  if (!condition) failures.push(message);
}
