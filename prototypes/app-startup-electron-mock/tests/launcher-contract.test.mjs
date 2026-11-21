import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  main,
  resolveNodeToolCommand,
  selectStartupPresentation,
} from "../../../scripts/setup-and-start.mjs";

const testsDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testsDirectory, "..", "..", "..");
const launcherPath = path.join(repositoryRoot, "start-course.cmd");
const presentationPath = path.join(repositoryRoot, "scripts", "startup-first-run.txt");

test("runs npm shims through Node without enabling a shell", () => {
  assert.deepEqual(
    resolveNodeToolCommand(
      "npm",
      ["ci"],
      "C:\\Program Files\\nodejs\\node.exe",
    ),
    {
      command: "C:\\Program Files\\nodejs\\node.exe",
      args: [
        "C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js",
        "ci",
      ],
    },
  );
  assert.deepEqual(
    resolveNodeToolCommand(
      "npx",
      ["--no-install", "install-electron", "--no"],
      "C:\\Program Files\\nodejs\\node.exe",
    ).args[0],
    "C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npx-cli.js",
  );
});

test("root launcher defers the shared first-run presentation until Node is missing", async () => {
  const [source, presentation, setupSource] = await Promise.all([
    readFile(launcherPath, "utf8"),
    readFile(presentationPath, "utf8"),
    readFile(path.join(repositoryRoot, "scripts", "setup-and-start.mjs"), "utf8"),
  ]);

  assert.doesNotMatch(source, /ExecutionPolicy|Bypass/i);
  assert.match(source, /OpenJS\.NodeJS\.LTS/);
  assert.match(source, /winget/);
  assert.match(source, /setup-and-start\.mjs/);
  assert.match(source, /startup-first-run\.txt/);
  assert.match(source, /process\.versions\.node/);
  assert.match(source, /set \/p/i);
  assert.match(source, /%~dp0/);
  assert.doesNotMatch(source, /Welcome to Vibecoding 101!|VIBECODING|THE WORKSHOP IS YOURS/);
  assert.match(presentation, /Welcome to Vibecoding 101!/);
  assert.match(presentation, /VIBECODING/);
  assert.match(presentation, /\[ I D E A S \]/);
  assert.match(presentation, /THE WORKSHOP IS YOURS\./);
  assert.match(presentation, /Idea in\. Working product out\. Let's begin\./);
  assert.match(presentation, /SETUP  \[\.\.\.\.\.\.\.\.\.\.\]/);
  assert.match(presentation, /Nothing will be installed without your approval/);
  assert.ok(
    source.indexOf(":node_missing") < source.indexOf("startup-first-run.txt")
      && source.indexOf("startup-first-run.txt") < source.indexOf("Required: Node.js 22 or newer"),
    "the shared first-run presentation must precede the Node permission path",
  );
  assert.match(setupSource, /Setup complete — opening Course Companion\./);
  assert.match(setupSource, /"course-companion"/);
  assert.doesNotMatch(setupSource, /app-startup-electron-mock/);
  assert.doesNotMatch(
    `${source}\n${presentation}\n${setupSource}`,
    /ChatGPT|access.?token|refresh.?token|api.?key|teaching question/i,
  );
});

function readyReport(overrides = {}) {
  return {
    platformSupported: true,
    nodeCompatible: true,
    npmAvailable: true,
    codexAvailable: true,
    appServerAvailable: true,
    lockMatches: true,
    electronRuntimeAvailable: true,
    ...overrides,
  };
}

test("selectStartupPresentation distinguishes ready return from every recovery case", () => {
  assert.equal(selectStartupPresentation(readyReport(), []), "returning");
  for (const report of [
    readyReport({ lockMatches: false }),
    readyReport({ electronRuntimeAvailable: false }),
    readyReport({ appServerAvailable: false }),
  ]) {
    assert.equal(selectStartupPresentation(report, [{ id: "recovery" }]), "first-run");
  }
  assert.equal(
    selectStartupPresentation(readyReport(), [{ id: "unexpected-install" }]),
    "first-run",
  );
});

test("returning startup prints one line, skips approval, and launches immediately", async () => {
  const writes = [];
  let executeCalls = 0;
  let launchCalls = 0;
  await main({
    detect: async () => readyReport({ privateCredential: "MUST_NOT_PRINT" }),
    buildPlan: () => [],
    execute: async () => { executeCalls += 1; },
    launch: async (options) => {
      launchCalls += 1;
      assert.equal(options.root, path.join(repositoryRoot, "course-companion"));
      return 0;
    },
    output: { write: (value) => writes.push(value) },
    readFirstRun: async () => "FIRST RUN MUST NOT PRINT",
  });

  assert.equal(executeCalls, 0);
  assert.equal(launchCalls, 1);
  assert.equal(writes.join(""), "Setup complete — opening Course Companion.\n");
  assert.doesNotMatch(writes.join(""), /FIRST RUN|credential|MUST_NOT_PRINT/i);
});

test("first-run presentation appears once before a non-empty plan asks approval", async () => {
  const order = [];
  let detections = 0;
  await main({
    detect: async () => {
      detections += 1;
      return readyReport({ lockMatches: detections > 1 });
    },
    buildPlan: () => [{ id: "project-packages" }],
    execute: async () => { order.push("approval"); },
    launch: async () => 0,
    output: { write: (value) => order.push(value) },
    readFirstRun: async () => "FIRST_RUN_PRESENTATION\n",
  });

  assert.equal(order.filter((value) => value === "FIRST_RUN_PRESENTATION\n").length, 1);
  assert.ok(order.indexOf("FIRST_RUN_PRESENTATION\n") < order.indexOf("approval"));
  assert.equal(order.at(-1), "Setup complete — opening Course Companion.\n");
});

test("does not launch when Codex App Server is still unavailable after preparation", async () => {
  let launchCalls = 0;
  await assert.rejects(
    main({
      detect: async () => readyReport({ appServerAvailable: false }),
      buildPlan: () => [{ id: "codex-cli" }],
      execute: async () => undefined,
      launch: async () => {
        launchCalls += 1;
        return 0;
      },
      output: { write: () => undefined },
      readFirstRun: async () => "FIRST RUN\n",
    }),
    (error) => (
      error.code === "INSTALL_FAILED"
      && error.actionId === "codex-cli"
    ),
  );
  assert.equal(launchCalls, 0);
});

test("declining a simulated missing Node install exits without winget", async () => {
  const result = await new Promise((resolve, reject) => {
    const child = spawn(
      process.env.ComSpec ?? "cmd.exe",
      ["/d", "/c", launcherPath],
      {
        cwd: repositoryRoot,
        env: {
          ...process.env,
          COURSE_MOCK_BOOTSTRAP_TEST: "1",
          COURSE_MOCK_FORCE_NODE_MISSING: "1",
        },
        windowsHide: true,
      },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.stdin.end("N\r\n");
    child.once("error", reject);
    child.once("exit", (exitCode) => resolve({
      exitCode,
      output: `${stdout}\n${stderr}`,
    }));
  });

  assert.equal(result.exitCode, 2, result.output);
  assert.match(result.output, /Welcome to Vibecoding 101!/);
  assert.match(result.output, /VIBECODING/);
  assert.match(result.output, /\[ I D E A S \]/);
  assert.match(result.output, /\\  BUILD  \/\s*\n/);
  assert.match(result.output, /\.:  SHIP  :\./);
  assert.match(result.output, /THE WORKSHOP IS YOURS\./);
  assert.match(result.output, /SETUP  \[\.\.\.\.\.\.\.\.\.\.\]\s+TOOLS  pending\s+TEACHER  waiting/);
  assert.ok(
    result.output.indexOf("VIBECODING")
      < result.output.indexOf("Welcome to Vibecoding 101!"),
  );
  assert.match(result.output, /Here's what we'll do:/);
  assert.ok(
    result.output.indexOf("Welcome to Vibecoding 101!")
      < result.output.indexOf("Required: Node.js 22 or newer"),
  );
  assert.match(result.output, /winget install --id OpenJS\.NodeJS\.LTS/);
  assert.match(result.output, /No installation was run/);
  assert.doesNotMatch(result.output, /Successfully installed/i);
});
