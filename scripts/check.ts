import { runChecks } from "../src/checkMath.ts";

const failures = runChecks();
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`ok ${failures.length === 0 ? "all identities" : ""}`.trim());
