import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const projectRoot = resolve(dirname(new URL(import.meta.url).pathname), "..");
const compiler = require.resolve("typescript/bin/tsc");
const buildDirectory = await mkdtemp(join(tmpdir(), "reserva-clara-financial-presentation-"));

try {
  const compile = spawnSync(process.execPath, [
    compiler,
    "--target", "ES2020",
    "--module", "commonjs",
    "--moduleResolution", "node",
    "--strict",
    "--skipLibCheck",
    "--rootDir", join(projectRoot, "src"),
    "--outDir", buildDirectory,
    join(projectRoot, "src", "components", "financial", "financial-format.ts"),
    join(projectRoot, "src", "components", "financial", "financial-copy.ts"),
    join(projectRoot, "src", "components", "dashboard", "dashboard-read-state.ts"),
  ], { cwd: projectRoot, stdio: "inherit" });

  if (compile.status !== 0) {
    process.exitCode = compile.status ?? 1;
  } else {
    const tests = spawnSync(process.execPath, ["--test", join(projectRoot, "tests", "financial-presentation.test.mjs")], {
      cwd: projectRoot,
      env: { ...process.env, FINANCIAL_PRESENTATION_TEST_BUILD: buildDirectory },
      stdio: "inherit",
    });
    process.exitCode = tests.status ?? 1;
  }
} finally {
  await rm(buildDirectory, { recursive: true, force: true });
}
