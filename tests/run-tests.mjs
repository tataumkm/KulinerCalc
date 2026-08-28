import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const suites = ["engine-test.mjs", "state-test.mjs", "recipe-test.mjs", "menu-test.mjs", "channel-test.mjs", "promo-test.mjs", "pricing-test.mjs", "ui-smoke-test.mjs"];
let allOk = true;

for (const s of suites) {
  process.stdout.write(`\n── ${s} ──\n`);
  const r = spawnSync(process.execPath, [join(__dirname, s)], { stdio: "inherit" });
  if (r.status !== 0) allOk = false;
}

console.log(`\n${allOk ? "ALL SUITES PASSED" : "SOME SUITES FAILED"}`);
process.exit(allOk ? 0 : 1);
