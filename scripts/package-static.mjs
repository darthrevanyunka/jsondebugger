import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = resolve(process.cwd());
const outputZip = resolve(rootDir, "json-debugger-static.zip");

try {
  rmSync(outputZip, { force: true });
  execSync("npm run build", { stdio: "inherit" });
  execSync("zip -r ../json-debugger-static.zip .", {
    cwd: resolve(rootDir, "dist"),
    stdio: "inherit",
  });
  console.log(`\nCreated static package: ${outputZip}`);
} catch (error) {
  console.error("\nFailed to create static package.");
  throw error;
}
