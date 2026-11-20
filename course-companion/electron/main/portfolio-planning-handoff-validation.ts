import { isAbsolute, resolve } from 'node:path'
import {
  portfolioPackageArtifactPaths,
  portfolioPlanningDocumentPaths,
  portfolioPrototypePath,
  type PortfolioPackageHandoff,
  type PracticeAdapterEvidenceState
} from '../../shared/contracts'
import { practiceWorkspaceIdentityDigest } from './practice-run-repository'

const digestPattern = /^[a-f0-9]{64}$/
const referenceScreenshot = /^planning\/reference\/screenshots\/[^/]+\.(?:png|jpe?g|webp)$/i

function sameDigests(left: Record<string, string>, right: Record<string, string>): boolean {
  const paths = Object.keys(left)
  return paths.length === Object.keys(right).length
    && paths.every((path) => digestPattern.test(left[path]!) && left[path] === right[path])
}

/** Validate approved planning inputs during continuation after the workspace has grown.
 * Evidence must come from the independent planning collector, never Executor reports.
 * Module 2 submission still uses its stricter whole-workspace freshness check.
 */
export function portfolioPlanningHandoffIsCurrent(
  handoff: PortfolioPackageHandoff,
  evidence: PracticeAdapterEvidenceState
): boolean {
  const planning = evidence.portfolioPlanning
  const { workspace, approval, submission, task } = handoff
  if (handoff.schemaVersion !== 2 || !planning || evidence.evidenceProfile !== 'portfolio-planning'
    || evidence.practiceId !== 'm2-portfolio-planning' || evidence.runId !== task.runId
    || !isAbsolute(workspace.canonicalPath)
    || workspace.identityDigest !== practiceWorkspaceIdentityDigest(workspace.canonicalPath)
    || planning.workspaceIdentityDigest !== workspace.identityDigest
    || approval.workspaceIdentityDigest !== workspace.identityDigest
    || resolve(task.workspaceRoot) !== resolve(workspace.canonicalPath)
    || resolve(handoff.moduleThreeInput.workspacePath) !== resolve(workspace.canonicalPath)
    || !task.threadId.trim() || approval.threadId !== task.threadId
    || approval.runId !== task.runId || submission.runId !== task.runId
    || approval.generation !== submission.generation
    || !Number.isSafeInteger(approval.generation) || approval.generation < 1
    || !digestPattern.test(approval.sourceDigest) || submission.sourceDigest !== approval.sourceDigest) return false

  // Only later app/build files outside planning are exempt from the Module 2 scope rule.
  // All source validation failures (including symlinks and invalid images) remain fatal.
  const historical = handoff.artifacts.length === portfolioPlanningDocumentPaths.length
    && !Object.hasOwn(approval.artifactDigests, portfolioPrototypePath)
  const paths = historical ? portfolioPlanningDocumentPaths : portfolioPackageArtifactPaths
  if (planning.issues.some((issue) => {
    if (historical && issue.path === portfolioPrototypePath && issue.code === 'missing') return false
    return issue.code !== 'unexpected-workspace-change' || issue.path === 'planning' || issue.path.startsWith('planning/')
  })
    || planning.unexpectedPaths.some((path) => path === 'planning' || path.startsWith('planning/'))) return false

  const requiredPaths = new Set<string>(paths)
  const current: Record<string, string> = {}
  for (const artifact of planning.artifacts) {
    const document = requiredPaths.has(artifact.path)
    if ((!document && !referenceScreenshot.test(artifact.path))
      || Object.hasOwn(current, artifact.path)
      || !digestPattern.test(artifact.digest)
      || !Number.isSafeInteger(artifact.byteLength) || artifact.byteLength <= 0
      || artifact.byteLength > (document ? 128 * 1024 : 12 * 1024 * 1024)
      || (document && (typeof artifact.content !== 'string' || !artifact.content.trim()))) return false
    current[artifact.path] = artifact.digest
  }
  if (!paths.every((path) => Object.hasOwn(current, path))
    || !sameDigests(current, approval.artifactDigests)) return false

  const expectedDocuments = Object.fromEntries(paths.map((path) => [path, current[path]!]))
  for (const references of [handoff.artifacts, handoff.moduleThreeInput.artifactReferences]) {
    if (references.length !== paths.length
      || new Set(references.map(({ path }) => path)).size !== references.length
      || !sameDigests(Object.fromEntries(references.map(({ path, digest }) => [path, digest])), expectedDocuments)) return false
  }
  return true
}
