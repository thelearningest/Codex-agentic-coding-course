import assert from "node:assert/strict";
import test from "node:test";

import {
  buildInstallPlan,
  detectSetup,
  executeInstallPlan,
  formatInstallPlan,
  packageLockFingerprint,
} from "../../../scripts/setup-core.mjs";

function fakeDeps(overrides = {}) {
  const available = new Set(overrides.available ?? ["npm", "codex"]);
  return {
    platform: "win32",
    nodeVersion: "24.13.0",
    appRoot: "C:\\repo with spaces\\course-companion",
    lockPath: "C:\\repo with spaces\\course-companion\\package-lock.json",
    stampPath: "C:\\repo with spaces\\course-companion\\node_modules\\.course-lock.sha256",
    commandExists: async (command) => available.has(command),
    commandSucceeds: async (command, args) => (
      command === "codex" && args.join(" ") === "app-server --help"
    ),
    fileExists: async () => overrides.electronRuntimeAvailable ?? true,
    electronRuntimePath: "C:\\repo with spaces\\course-companion\\node_modules\\electron\\dist\\electron.exe",
    readFile: async (path) => {
      if (path.endsWith("package-lock.json")) return "lock contents";
      if (path.endsWith(".course-lock.sha256")) {
        return overrides.installedFingerprint ?? "";
      }
      throw Object.assign(new Error("missing"), { code: "ENOENT" });
    },
    ...overrides,
  };
}

test("plans Codex and project installs without executing them", async () => {
  const report = await detectSetup(fakeDeps({
    available: ["npm"],
    commandExists: async (command) => command === "npm",
    commandSucceeds: async () => false,
  }));

  const plan = buildInstallPlan(report);

  assert.deepEqual(
    plan.map((item) => item.id),
    ["codex-cli", "project-packages", "electron-runtime"],
  );
  assert.deepEqual(plan[0].args, ["install", "-g", "@openai/codex@latest"]);
  assert.equal(plan[1].cwd, "C:\\repo with spaces\\course-companion");
  assert.equal(plan[2].command, "node");
  assert.deepEqual(plan[2].args, [
    "node_modules/electron/install.js",
  ]);
});

test("detects compatible prerequisites and a matching lock stamp", async () => {
  const fingerprint = await packageLockFingerprint(
    "C:\\repo with spaces\\course-companion\\package-lock.json",
    { readFile: async () => "lock contents" },
  );
  const report = await detectSetup(fakeDeps({
    installedFingerprint: fingerprint,
  }));

  assert.equal(report.platformSupported, true);
  assert.equal(report.nodeCompatible, true);
  assert.equal(report.npmAvailable, true);
  assert.equal(report.codexAvailable, true);
  assert.equal(report.appServerAvailable, true);
  assert.equal(report.electronRuntimeAvailable, true);
  assert.equal(report.lockMatches, true);
  assert.deepEqual(buildInstallPlan(report), []);
});

test("reinstalls project packages and runtime when the native binary is missing", async () => {
  const fingerprint = await packageLockFingerprint(
    "C:\\repo with spaces\\course-companion\\package-lock.json",
    { readFile: async () => "lock contents" },
  );
  const report = await detectSetup(fakeDeps({
    installedFingerprint: fingerprint,
    electronRuntimeAvailable: false,
  }));

  assert.deepEqual(
    buildInstallPlan(report).map((item) => item.id),
    ["project-packages", "electron-runtime"],
  );
});

test("reports incompatible Node, missing npm, and unavailable App Server", async () => {
  const report = await detectSetup(fakeDeps({
    nodeVersion: "20.18.0",
    available: ["codex"],
    commandExists: async (command) => command === "codex",
    commandSucceeds: async () => false,
  }));

  assert.equal(report.nodeCompatible, false);
  assert.equal(report.npmAvailable, false);
  assert.equal(report.codexAvailable, true);
  assert.equal(report.appServerAvailable, false);

  const earlyNode22 = await detectSetup(fakeDeps({ nodeVersion: "22.11.0" }));
  assert.equal(earlyNode22.nodeCompatible, false);
});

test("formats the full plan before asking once for permission", async () => {
  const prompts = [];
  const calls = [];
  const writes = [];
  const actions = [
    {
      id: "codex-cli",
      reason: "Managed login needs Codex.",
      scope: "user-level",
      command: "npm",
      args: ["install", "-g", "@openai/codex@latest"],
    },
    {
      id: "project-packages",
      reason: "Locked Electron packages are missing.",
      scope: "project-local",
      command: "npm",
      args: ["ci"],
      cwd: "C:\\repo\\mock",
    },
    {
      id: "electron-runtime",
      reason: "The native Electron runtime is missing.",
      scope: "project-local cache",
      command: "npx",
      args: ["--no-install", "install-electron", "--no"],
      cwd: "C:\\repo\\mock",
      fingerprint: "abc123",
      stampPath: "C:\\repo\\mock\\node_modules\\.course-lock.sha256",
    },
  ];

  await executeInstallPlan(actions, {
    confirm: async (prompt) => {
      prompts.push(prompt);
      assert.match(prompt, /codex-cli/);
      assert.match(prompt, /project-packages/);
      assert.match(prompt, /electron-runtime/);
      assert.match(prompt, /npm install -g @openai\/codex@latest/);
      assert.match(prompt, /npx --no-install install-electron --no/);
      return true;
    },
    run: async (command, args, options) => {
      calls.push({ command, args, options });
      return { exitCode: 0 };
    },
    writeFile: async (...args) => writes.push(args),
  });

  assert.equal(prompts.length, 1);
  assert.deepEqual(
    calls.map((call) => call.command),
    ["npm", "npm", "npx"],
  );
  assert.deepEqual(writes, [[actions[2].stampPath, "abc123", "utf8"]]);
});

test("decline executes no installation command", async () => {
  const calls = [];

  await assert.rejects(
    executeInstallPlan(
      [{
        id: "codex-cli",
        reason: "Required.",
        scope: "user-level",
        command: "npm",
        args: ["install"],
      }],
      {
        confirm: async () => false,
        run: async (...args) => calls.push(args),
      },
    ),
    { code: "INSTALL_DECLINED" },
  );

  assert.deepEqual(calls, []);
});

test("a failed command names its install action and stops execution", async () => {
  const calls = [];

  await assert.rejects(
    executeInstallPlan(
      [
        {
          id: "codex-cli",
          reason: "Required.",
          scope: "user-level",
          command: "npm",
          args: ["install"],
        },
        {
          id: "project-packages",
          reason: "Required.",
          scope: "project-local",
          command: "npm",
          args: ["ci"],
        },
      ],
      {
        confirm: async () => true,
        run: async (...args) => {
          calls.push(args);
          return { exitCode: 7 };
        },
      },
    ),
    (error) => error.actionId === "codex-cli",
  );

  assert.equal(calls.length, 1);
});

test("a spawn error is sanitized and names its install action", async () => {
  await assert.rejects(
    executeInstallPlan(
      [{
        id: "project-packages",
        reason: "Required.",
        scope: "project-local",
        command: "npm",
        args: ["ci"],
      }],
      {
        confirm: async () => true,
        run: async () => {
          throw new Error("spawn npm ENOENT with unsafe child details");
        },
      },
    ),
    (error) => (
      error.code === "INSTALL_FAILED"
      && error.actionId === "project-packages"
      && !error.message.includes("unsafe child details")
    ),
  );
});

test("formatInstallPlan includes reason, scope, and exact command", () => {
  const output = formatInstallPlan([{
    id: "project-packages",
    reason: "Install locked dependencies.",
    scope: "project-local",
    command: "npm",
    args: ["ci"],
    cwd: "C:\\repo\\mock",
  }]);

  assert.match(output, /Install locked dependencies/);
  assert.match(output, /project-local/);
  assert.match(output, /npm ci/);
  assert.match(output, /C:\\repo\\mock/);
});
