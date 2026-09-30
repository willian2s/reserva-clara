import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve, join } from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const projectRoot = resolve(dirname(new URL(import.meta.url).pathname), "..");
const compiler = require.resolve("typescript/bin/tsc");
const buildDirectory = await mkdtemp(join(tmpdir(), "reserva-clara-quotes-route-"));

try {
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
      join(projectRoot, "src/server/quotes/route-handler.ts"),
      join(projectRoot, "src/server/data/asset-reader.ts"),
      join(projectRoot, "src/server/firebase-admin.ts"),
      join(projectRoot, "src/proxy.ts"),
      join(projectRoot, "src/lib/host-routing.ts"),
      join(projectRoot, "src/domain/errors.ts"),
      join(projectRoot, "src/domain/value-objects.ts"),
      join(projectRoot, "src/domain/asset.ts"),
      join(projectRoot, "src/data/firestore/paths.ts"),
    ],
    { cwd: projectRoot, stdio: "inherit" },
  );

  if (compile.status !== 0) {
    process.exitCode = compile.status ?? 1;
  } else {
    const tests = spawnSync(
      process.execPath,
      ["--test", join(projectRoot, "tests/quotes-route.test.mjs")],
      {
        cwd: projectRoot,
        env: {
          ...process.env,
          NODE_PATH: join(projectRoot, "node_modules"),
          QUOTES_ROUTE_TEST_BUILD: buildDirectory,
        },
        stdio: "inherit",
      },
    );
    process.exitCode = tests.status ?? 1;
  }
} finally {
  await rm(buildDirectory, { recursive: true, force: true });
}
