import { isPortfolioBuildPackageVersion } from '../../shared/contracts'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { portfolioBuildRecordPaths, portfolioPackageArtifactPaths, portfolioPackageVersion, portfolioReleaseRecordPath, portfolioReleaseVersion } from '../../shared/contracts'
import type { PortfolioPackageApproval, PracticeAdapterEvidenceState } from '../../shared/contracts'
import type { PracticeRunRecord } from './practice-run-repository'

export const legacyPortfolioPackagePaths = [
  'planning/requirement-validation-map.md',
  'planning/first-bounded-task.md'
] as const

export function isPortfolioPackage(run: { practiceId: string; practiceVersion: string }): boolean {
  return run.practiceId === 'm2-portfolio-planning' && run.practiceVersion === portfolioPackageVersion
}

export function isPortfolioBuildPackage(run: { practiceId: string; practiceVersion: string }): boolean {
  return run.practiceId === 'm3-portfolio-build' && isPortfolioBuildPackageVersion(run.practiceVersion)
}

export function isReviewedPortfolioPackage(run: { practiceId: string; practiceVersion: string }): boolean {
  return isPortfolioPackage(run) || isPortfolioBuildPackage(run) || isPortfolioReleasePackage(run)
}

export function isPortfolioReleasePackage(run: { practiceId: string; practiceVersion: string }): boolean {
  return run.practiceId === 'm4-portfolio-release' && run.practiceVersion === portfolioReleaseVersion
}

export function portfolioPackageEvidence(evidence: PracticeAdapterEvidenceState | null) {
  return evidence?.portfolioPlanning ?? evidence?.portfolioBuild ?? evidence?.portfolioRelease
}

export function portfolioPackageDigests(evidence: PracticeAdapterEvidenceState | null): Record<string, string> {
  return Object.fromEntries((portfolioPackageEvidence(evidence)?.artifacts ?? []).map(({ path, digest }) => [path, digest]))
}

export function portfolioPackageIsReady(run: PracticeRunRecord): boolean {
  const evidence = run.evidence
  const planning = portfolioPackageEvidence(evidence)
  const paths = isPortfolioReleasePackage(run)
    ? [portfolioReleaseRecordPath, 'application/source', 'deployment/public-url'] : isPortfolioBuildPackage(run)
    ? [...portfolioPackageArtifactPaths, ...portfolioBuildRecordPaths, 'application/source'] : portfolioPackageArtifactPaths
  return isReviewedPortfolioPackage(run) && evidence?.freshness === 'fresh'
    && evidence.runId === run.runId && evidence.practiceId === run.practiceId
    && evidence.practiceVersion === run.practiceVersion
    && planning?.workspaceIdentityDigest === createHash('sha256').update(resolve(run.binding.workspaceRoot)).digest('hex')
    && planning.issues.length === 0 && planning.unexpectedPaths.length === 0
    && paths.every((path) => planning.artifacts.some((artifact) =>
      artifact.path === path && Boolean(artifact.content?.trim()) && /^[a-f0-9]{64}$/.test(artifact.digest)))
}

export function currentPortfolioPackageApproval(run: PracticeRunRecord, courseRunId?: string): PortfolioPackageApproval | null {
  const approval = run.packageApproval
  if (!approval || !portfolioPackageIsReady(run)
    || (courseRunId !== undefined && approval.courseRunId !== courseRunId)
    || approval.runId !== run.runId || approval.generation !== run.generation
    || approval.threadId !== run.binding.threadId
    || approval.sourceDigest !== run.evidence?.sourceDigest
    || approval.workspaceIdentityDigest !== portfolioPackageEvidence(run.evidence)?.workspaceIdentityDigest) return null
  const digests = portfolioPackageDigests(run.evidence)
  return Object.keys(digests).length === Object.keys(approval.artifactDigests).length
    && Object.entries(digests).every(([path, digest]) => approval.artifactDigests[path] === digest)
    ? approval : null
}
