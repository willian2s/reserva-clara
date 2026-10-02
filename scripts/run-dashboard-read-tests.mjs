import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const projectRoot = resolve(dirname(new URL(import.meta.url).pathname), "..");
const compiler = require.resolve("typescript/bin/tsc");
const buildDirectory = await mkdtemp(join(tmpdir(), "reserva-clara-dashboard-read-"));
const domainFiles = [
  "allocation.ts",
  "asset.ts",
  "decimal-reducer.ts",
  "errors.ts",
  "index.ts",
  "market-position.ts",
  "portfolio.ts",
  "portfolio-summary.ts",
  "position-engine.ts",
  "quote.ts",
  "transaction.ts",
  "value-objects.ts",
].map((file) => join(projectRoot, "src", "domain", file));

try {
  const compile = spawnSync(
    process.execPath,
    [
      compiler,
      "--target", "ES2020",
      "--module", "commonjs",
      "--moduleResolution", "node",
      "--esModuleInterop",
      "--strict",
      "--skipLibCheck",
      "--rootDir", join(projectRoot, "src"),
      "--outDir", buildDirectory,
      ...domainFiles,
      join(projectRoot, "src", "data", "positions", "portfolio-read.ts"),
      join(projectRoot, "src", "data", "positions", "portfolio-projection.ts"),
      join(projectRoot, "src", "data", "positions", "dashboard-read.ts"),
    ],
    { cwd: projectRoot, stdio: "inherit" },
  );

  if (compile.status !== 0) {
    process.exitCode = compile.status ?? 1;
  } else {
    const tests = spawnSync(
      process.execPath,
      ["--test", join(projectRoot, "tests", "dashboard-read.test.mjs")],
      {
        cwd: projectRoot,
        env: { ...process.env, DASHBOARD_READ_TEST_BUILD: buildDirectory },
        stdio: "inherit",
      },
    );
    process.exitCode = tests.status ?? 1;
  }
} finally {
  await rm(buildDirectory, { recursive: true, force: true });
}
