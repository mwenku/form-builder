import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const specPath = join(root, "docs/api/openapi.yaml");
const outputPath = join(root, "docs/api/index.html");
const publicDir = join(root, "apps/web/public/api-docs");
const publicPath = join(publicDir, "index.html");

mkdirSync(dirname(outputPath), { recursive: true });
mkdirSync(publicDir, { recursive: true });

execSync(`redocly build-docs "${specPath}" --output "${outputPath}"`, {
  cwd: root,
  stdio: "inherit",
});

const html = readFileSync(outputPath, "utf8").replaceAll("\u2014", "-");
writeFileSync(outputPath, html);
writeFileSync(publicPath, html);
console.log("Generated docs/api/index.html and apps/web/public/api-docs/index.html");
