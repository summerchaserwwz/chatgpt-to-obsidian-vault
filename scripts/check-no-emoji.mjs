import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["src", "public", "scripts", "."];
const rootFiles = new Set(["package.json", "tsconfig.json", "vite.config.ts", "sidepanel.html", "options.html"]);
const emojiPattern = /[\u2600-\u27BF]|\p{Extended_Pictographic}/u;
const ignoredDirs = new Set(["node_modules", "dist", ".git", ".super-dev", "output"]);
const failures = [];

function scanFile(path) {
  const text = readFileSync(path, "utf8");
  text.split(/\r?\n/).forEach((line, index) => {
    if (emojiPattern.test(line)) {
      failures.push(`${path}:${index + 1}:${line}`);
    }
  });
}

function walk(path) {
  const stat = statSync(path);
  if (stat.isDirectory()) {
    const name = path.split("/").pop();
    if (ignoredDirs.has(name)) return;
    for (const entry of readdirSync(path)) {
      walk(join(path, entry));
    }
    return;
  }

  if (/\.(ts|tsx|js|jsx|css|html|json|mjs)$/.test(path)) {
    scanFile(path);
  }
}

for (const root of roots) {
  if (root === ".") {
    for (const file of rootFiles) scanFile(file);
  } else {
    walk(root);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("No emoji characters found in UI source.");
