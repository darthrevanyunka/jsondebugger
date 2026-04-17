import { execSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = resolve(process.cwd());
const tempBuildDir = resolve(rootDir, ".download-build");
const publicDir = resolve(rootDir, "public");
const downloadableZip = resolve(publicDir, "json-debugger-static.zip");

function run(command, cwd = rootDir) {
  execSync(command, { cwd, stdio: "inherit" });
}

try {
  rmSync(tempBuildDir, { recursive: true, force: true });
  rmSync(downloadableZip, { force: true });
  mkdirSync(publicDir, { recursive: true });

  // Build a clean static artifact and zip it for user download.
  run(`vite build --outDir "${tempBuildDir}"`);
  run(`zip -r "${downloadableZip}" .`, tempBuildDir);

  // Build the actual app; Vite copies the zip from public into dist.
  run("vite build");
} finally {
  rmSync(tempBuildDir, { recursive: true, force: true });
}
