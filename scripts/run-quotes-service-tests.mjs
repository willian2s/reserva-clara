import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve, join } from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const projectRoot = resolve(dirname(new URL(import.meta.url).pathname), "..");
const compiler = require.resolve("typescript/bin/tsc");
const buildDirectory = await mkdtemp(join(tmpdir(), "reserva-clara-quotes-service-"));

try {
  const sourceFiles = [
    "asset.ts",
    "errors.ts",
    "index.ts",
    "quote.ts",
    "value-objects.ts",
  ].map((file) => join(projectRoot, "src", "domain", file));
  sourceFiles.push(
    join(projectRoot, "src/server/quotes/errors.ts"),
    join(projectRoot, "src/server/quotes/brapi-mapping.ts"),
    join(projectRoot, "src/server/quotes/brapi-adapter.ts"),
    join(projectRoot, "src/server/quotes/quote-cache.ts"),
    join(projectRoot, "src/server/quotes/quote-service.ts"),
  );

  const compile = spawnSync(
    process.execPath,
    [
      compiler,
      "--target",
      "ES2020",
      "--lib",
      "ES2020,DOM",
      "--module",
      "commonjs",
      "--moduleResolution",
      "node",
      "--esModuleInterop",
      "--strict",
      "--skipLibCheck",
      "--outDir",
      buildDirectory,
      ...sourceFiles,
    ],
    { cwd: projectRoot, stdio: "inherit" },
  );

  if (compile.status !== 0) {
    process.exitCode = compile.status ?? 1;
  } else {
    const tests = spawnSync(
      process.execPath,
      ["--test", join(projectRoot, "tests/quotes-service.test.mjs")],
      {
        cwd: projectRoot,
        env: { ...process.env, QUOTES_SERVICE_TEST_BUILD: buildDirectory },
        stdio: "inherit",
      },
    );
    process.exitCode = tests.status ?? 1;
  }
} finally {
  await rm(buildDirectory, { recursive: true, force: true });
}
