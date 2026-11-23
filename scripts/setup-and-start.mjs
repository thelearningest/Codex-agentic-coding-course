import { agentInstallConsent, openCourseWindow } from "./agent-launch.mjs";
import { spawn } from "node:child_process";
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  buildInstallPlan,
  detectSetup,
  executeInstallPlan,
} from "./setup-core.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const appRoot = path.join(repositoryRoot, "course-companion");
const firstRunPresentationPath = path.join(
  repositoryRoot,
  "scripts",
  "startup-first-run.txt",
);

export function resolveNodeToolCommand(
  command,
  args,
  nodeExecutable = process.execPath,
) {
  if (command !== "npm" && command !== "npx") {
    return { command, args };
  }
  const cliName = command === "npm" ? "npm-cli.js" : "npx-cli.js";
  return {
    command: nodeExecutable,
    args: [
      path.join(
        path.dirname(nodeExecutable),
        "node_modules",
        "npm",
        "bin",
        cliName,
      ),
      ...args,
    ],
  };
}

function runProcess(command, args, { cwd, stdio = "ignore", env } = {}) {
  return new Promise((resolve, reject) => {
    const invocation = resolveNodeToolCommand(command, args);
    const child = spawn(invocation.command, invocation.args, {
      cwd,
      env: env ?? process.env,
      shell: false,
      stdio,
      windowsHide: true,
    });
    child.once("error", reject);
    child.once("exit", (exitCode) => resolve({ exitCode: exitCode ?? 1 }));
  });
}

async function commandExists(command) {
  const result = await runProcess("where.exe", [command]);
  return result.exitCode === 0;
}

async function commandSucceeds(command, args) {
  try {
    const result = await runProcess(command, args);
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

async function fileExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function confirmInstall(formattedPlan) {
  const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    process.stdout.write(`${formattedPlan}\n\n`);
    const answer = await terminal.question("Run this exact plan? [y/N] ");
    return /^(y|yes)$/i.test(answer.trim());
  } finally {
    terminal.close();
  }
}

export async function launchElectron({
  root = appRoot,
  run = runProcess,
  agent = process.argv.includes("--agent"),
  openWindow = openCourseWindow,
} = {}) {
  if (agent) {
    const build = await run("npm", ["run", "build"], { cwd: root, stdio: "inherit" });
    if (build.exitCode !== 0) return build.exitCode;
    const runtime = path.join(root, "node_modules", "electron", "dist", "electron.exe");
    try {
      return await openWindow(runtime, root);
    } catch (error) {
      throw Object.assign(error, { code: "ELECTRON_FAILED", layer: "Electron" });
    }
  }
  const result = await run("npm", ["start"], {
    cwd: root,
    stdio: "inherit",
  });
  return result.exitCode;
}

export function selectStartupPresentation(report, installPlan) {
  const ready = Array.isArray(installPlan)
    && installPlan.length === 0
    && report?.platformSupported === true
    && report.nodeCompatible === true
    && report.npmAvailable === true
    && report.codexAvailable === true
    && report.appServerAvailable === true
    && report.lockMatches === true
    && report.electronRuntimeAvailable === true;
  return ready ? "returning" : "first-run";
}

export async function main({
  detect = detectSetup,
  buildPlan = buildInstallPlan,
  execute = executeInstallPlan,
  launch = launchElectron,
  output = process.stdout,
  readFirstRun = () => readFile(firstRunPresentationPath, "utf8"),
  dependencyOverrides = {},
} = {}) {
  const lockPath = path.join(appRoot, "package-lock.json");
  const stampPath = path.join(
    appRoot,
    "node_modules",
    ".course-lock.sha256",
  );
  const electronRuntimePath = path.join(
    appRoot,
    "node_modules",
    "electron",
    "dist",
    "electron.exe",
  );
  // Codex Desktop can supply a native CLI even when it is absent from PATH.
  const inheritedCli = process.env.CODEX_APP_RUNTIME_CLI_PATH;
  const desktopCli = inheritedCli && await fileExists(inheritedCli) ? inheritedCli : null;
  const deps = {
    platform: process.platform,
    nodeVersion: process.versions.node,
    commandExists: (name) => name === "codex" && desktopCli ? true : commandExists(name),
    commandSucceeds: (name, args) => commandSucceeds(name === "codex" && desktopCli ? desktopCli : name, args),
    fileExists,
    appRoot,
    lockPath,
    stampPath,
    electronRuntimePath,
    readFile,
    confirm: process.argv.includes("--agent") ? agentInstallConsent : confirmInstall,
    run: runProcess,
    writeFile,
    ...dependencyOverrides,
  };

  const report = await detect(deps);
  if (!report.platformSupported) {
    throw Object.assign(new Error("This prototype currently supports Windows."), {
      code: "UNSUPPORTED_PLATFORM",
      layer: "bootstrap",
    });
  }
  if (!report.nodeCompatible || !report.npmAvailable) {
    throw Object.assign(new Error("Node.js 22.12+ with npm is required."), {
      code: "PREREQUISITE_MISSING",
      layer: "prerequisite",
    });
  }

  const plan = buildPlan(report);
  if (selectStartupPresentation(report, plan) === "first-run") {
    const presentation = await readFirstRun();
    output.write(presentation.endsWith("\n") ? presentation : `${presentation}\n`);
  }
  if (plan.length > 0) await execute(plan, deps);

  const finalReport = await detect(deps);
  if (!finalReport.codexAvailable || !finalReport.appServerAvailable) {
    throw Object.assign(new Error("Codex App Server is still unavailable."), {
      code: "INSTALL_FAILED",
      actionId: "codex-cli",
    });
  }
  if (!finalReport.lockMatches) {
    throw Object.assign(new Error("Course Companion packages do not match the lockfile."), {
      code: "INSTALL_FAILED",
      actionId: "project-packages",
    });
  }
  if (!finalReport.electronRuntimeAvailable) {
    throw Object.assign(new Error("The Electron runtime is still unavailable."), {
      code: "INSTALL_FAILED",
      actionId: "electron-runtime",
    });
  }

  output.write("Setup complete — opening Course Companion.\n");
  const exitCode = await launch({
    root: appRoot,
  });
  if (exitCode !== 0) {
    throw Object.assign(new Error("Electron exited unexpectedly."), {
      code: "ELECTRON_FAILED",
      layer: "Electron",
    });
  }
}

function safeFailure(error) {
  const layer = error?.layer ?? (
    error?.code === "INSTALL_DECLINED"
      ? "prerequisite"
      : error?.actionId === "project-packages"
        ? "project packages"
        : "prerequisite"
  );
  const recovery = error?.code === "INSTALL_DECLINED"
    ? "Rerun the command and approve the displayed plan, or run its commands manually."
    : "Correct the named layer, then rerun .\\start-course.cmd.";
  return { layer, recovery };
}

const isDirect = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirect) {
  main().catch((error) => {
    const failure = safeFailure(error);
    process.stderr.write(
      `Startup failed in ${failure.layer}.\n${error.message}\nRecovery: ${failure.recovery}\n`,
    );
    if (error?.code === "INSTALL_DECLINED") {
      process.exitCode = 2;
    } else if (
      error?.actionId === "project-packages"
      || error?.actionId === "electron-runtime"
    ) {
      process.exitCode = 4;
    } else if (error?.code === "ELECTRON_FAILED") {
      process.exitCode = 5;
    } else {
      process.exitCode = 3;
    }
  });
}
