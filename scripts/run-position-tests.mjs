import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve, join } from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const projectRoot = resolve(dirname(new URL(import.meta.url).pathname), "..");
const compiler = require.resolve("typescript/bin/tsc");
const buildDirectory = await mkdtemp(join(tmpdir(), "reserva-clara-position-"));

try {
  const compile = spawnSync(
    process.execPath,
    [
      compiler,
      "--target",
      "ES2020",
      "--module",
      "commonjs",
      "--moduleResolution",
      "node",
      "--esModuleInterop",
      "--strict",
      "--skipLibCheck",
      "--outDir",
      buildDirectory,
      ...[
        "asset.ts",
        "allocation.ts",
        "decimal-reducer.ts",
        "errors.ts",
        "index.ts",
        "market-position.ts",
        "portfolio.ts",
        "position-engine.ts",
        "quote.ts",
        "transaction.ts",
        "value-objects.ts",
      ].map((file) => join(projectRoot, "src", "domain", file)),
    ],
    { cwd: projectRoot, stdio: "inherit" },
  );

  if (compile.status !== 0) {
    process.exitCode = compile.status ?? 1;
  } else {
    const tests = spawnSync(
      process.execPath,
      ["--test", join(projectRoot, "tests", "position.test.mjs")],
      {
        cwd: projectRoot,
        env: { ...process.env, POSITION_TEST_BUILD: buildDirectory },
        stdio: "inherit",
      },
    );
    process.exitCode = tests.status ?? 1;
  }
} finally {
  await rm(buildDirectory, { recursive: true, force: true });
}
