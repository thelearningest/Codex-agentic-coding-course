import { createHash } from "node:crypto";
import { readFile as readFileDefault } from "node:fs/promises";

import { nodeVersionSupported } from "./macos-course-startup-core.mjs";

function majorOf(version) {
  const match = String(version ?? "").match(/^v?(\d+)/);
  return match ? Number(match[1]) : 0;
}

async function readOptional(path, readFile) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export async function packageLockFingerprint(
  lockPath,
  { readFile = readFileDefault } = {},
) {
  const contents = await readFile(lockPath);
  return createHash("sha256").update(contents).digest("hex");
}

export async function detectSetup({
  platform,
  nodeVersion,
  commandExists,
  commandSucceeds,
  checkCodex = true,
  fileExists,
  appRoot,
  lockPath,
  stampPath,
  electronRuntimePath,
  readFile,
}) {
  const nodeMajor = majorOf(nodeVersion);
  const [
    npmAvailable,
    codexAvailable,
    lockFingerprint,
    electronRuntimeAvailable,
  ] = await Promise.all([
    commandExists("npm"),
    checkCodex ? commandExists("codex") : false,
    packageLockFingerprint(lockPath, { readFile }),
    fileExists(electronRuntimePath),
  ]);
  const appServerAvailable = codexAvailable
    ? await commandSucceeds("codex", ["app-server", "--help"])
    : false;
  const installedFingerprint = await readOptional(stampPath, readFile);

  return Object.freeze({
    platformSupported: platform === "win32",
    nodeMajor,
    nodeCompatible: nodeVersionSupported(nodeVersion),
    npmAvailable,
    checkCodex,
    codexAvailable,
    appServerAvailable,
    electronRuntimeAvailable,
    electronRuntimePath,
    lockFingerprint,
    installedFingerprint: installedFingerprint?.trim() ?? null,
    lockMatches: installedFingerprint?.trim() === lockFingerprint,
    appRoot,
    lockPath,
    stampPath,
  });
}

export function buildInstallPlan(report) {
  const actions = [];

  if (report.checkCodex !== false && (!report.codexAvailable || !report.appServerAvailable)) {
    actions.push({
      id: "codex-cli",
      title: "Codex connection tool",
      reason: "Connects the course app to your Codex account.",
      scope: "Installed for your Windows user account",
      command: "npm",
      args: ["install", "-g", "@openai/codex@latest"],
    });
  }

  if (!report.lockMatches || !report.electronRuntimeAvailable) {
    actions.push({
      id: "project-packages",
      title: "Course app files",
      reason: "Adds the files this preview app needs to open.",
      scope: "Stored only inside this course folder",
      command: "npm",
      args: ["ci"],
      cwd: report.appRoot,
    });
    actions.push({
      id: "electron-runtime",
      title: "Electron desktop runtime",
      reason: "Verifies or downloads the pinned Windows runtime used to open Course Companion.",
      scope: "Stored only inside course-companion/node_modules",
      command: "node",
      args: ["node_modules/electron/install.js"],
      cwd: report.appRoot,
      fingerprint: report.lockFingerprint,
      stampPath: report.stampPath,
    });
  }

  return actions;
}

function displayCommand(action) {
  return [action.command, ...action.args].join(" ");
}

export function formatInstallPlan(actions) {
  const lines = ["Proposed installation plan:"];

  for (const action of actions) {
    lines.push(
      "",
      `[${action.title ?? action.id}]`,
      `Why: ${action.reason}`,
      `Scope: ${action.scope}`,
      `Command: ${displayCommand(action)}`,
    );
    if (action.cwd) lines.push(`Directory: ${action.cwd}`);
  }

  return lines.join("\n");
}

export async function executeInstallPlan(
  actions,
  { confirm, run, writeFile = async () => {} },
) {
  if (actions.length === 0) return;

  const approved = await confirm(formatInstallPlan(actions));
  if (!approved) {
    const error = new Error("Installation declined.");
    error.code = "INSTALL_DECLINED";
    throw error;
  }

  for (const action of actions) {
    let result;
    try {
      result = await run(action.command, action.args, {
        cwd: action.cwd,
        stdio: "inherit",
      });
    } catch {
      const error = new Error(`Installation action failed: ${action.id}`);
      error.code = "INSTALL_FAILED";
      error.actionId = action.id;
      throw error;
    }
    const exitCode = typeof result === "number" ? result : result?.exitCode;

    if (exitCode !== 0) {
      const error = new Error(`Installation action failed: ${action.id}`);
      error.code = "INSTALL_FAILED";
      error.actionId = action.id;
      throw error;
    }

    if (
      action.id === "electron-runtime"
      && action.stampPath
      && action.fingerprint
    ) {
      await writeFile(action.stampPath, action.fingerprint, "utf8");
    }
  }
}
