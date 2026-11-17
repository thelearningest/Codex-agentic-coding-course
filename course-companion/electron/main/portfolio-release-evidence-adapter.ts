import { createHash } from 'node:crypto'
import { lstat, readFile, realpath } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { portfolioReleaseRecordPath, type PortfolioDeploymentRecord, type PortfolioPlanningArtifactSnapshot, type PortfolioPlanningIssue, type PracticeAdapterEvidenceState } from '../../shared/contracts'
import { applicationSnapshot, containedFile } from './portfolio-build-package-evidence'
import type { PracticeEvidenceAdapter, PracticeEvidenceAdapterContext } from './practice-evidence-adapter'
import { PublicPortfolioUrlVerifier } from './public-portfolio-url'
import { readPortfolioReleaseGit } from './portfolio-release-git'

const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')
const iso = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value))
const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const keys = (value: Record<string, unknown>, expected: string[]) => expected.every((key) => Object.hasOwn(value, key))
const text = (value: unknown, minimum = 1, maximum = 4000): value is string => typeof value === 'string' && value.trim().length >= minimum && value.length <= maximum

function sharingUrl(value: unknown): string {
  if (!text(value, 1, 2048)) throw new Error('Invalid sharing URL')
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || (url.port && url.port !== '443')) throw new Error('Invalid sharing URL')
  return url.href
}

export type PortfolioReleaseContinuation = {
  task: { threadId: string; workspaceRoot: string }
  workspace: { canonicalPath: string }
  sourceCheckpoint: string
}

export function parsePortfolioDeploymentRecord(value: unknown): PortfolioDeploymentRecord {
  if (!object(value) || !keys(value, ['schemaVersion', 'moduleThreeSourceCheckpoint', 'sourceRevision', 'deployment', 'validation', 'publication'])
    || value.schemaVersion !== 1 || !/^sha256:[a-f0-9]{64}$/i.test(String(value.moduleThreeSourceCheckpoint))
    || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(String(value.sourceRevision))) throw new Error('Invalid release identity')
  const deployment = value.deployment
  const validation = value.validation
  const publication = value.publication
  if (!object(deployment) || !keys(deployment, ['url', 'provider', 'deploymentId', 'sourceRevision', 'buildStatus', 'deployedAt'])
    || !text(deployment.url, 1, 2048) || typeof deployment.provider !== 'string' || deployment.provider.trim().toLowerCase() !== 'vercel' || !text(deployment.deploymentId, 1, 200)
    || !/^[a-zA-Z0-9_./:-]+$/.test(deployment.deploymentId)
    || typeof deployment.sourceRevision !== 'string' || deployment.sourceRevision.toLowerCase() !== String(value.sourceRevision).toLowerCase()
    || typeof deployment.buildStatus !== 'string' || deployment.buildStatus.trim().toLowerCase() !== 'ready' || !iso(deployment.deployedAt)) throw new Error('Invalid deployment evidence')
  const url = sharingUrl(deployment.url)
  if (!object(validation) || !keys(validation, ['checkedAt', 'command', 'passed', 'desktop', 'mobile', 'limitations'])
    || !iso(validation.checkedAt) || Date.parse(validation.checkedAt) < Date.parse(deployment.deployedAt)
    || !text(validation.command) || validation.passed !== true
    || !Array.isArray(validation.limitations) || validation.limitations.length > 20 || !validation.limitations.every((item) => text(item, 1, 500))) throw new Error('Invalid validation evidence')
  for (const viewport of [validation.desktop, validation.mobile]) {
    if (!object(viewport) || !keys(viewport, ['url', 'observations']) || sharingUrl(viewport.url) !== url
      || !text(viewport.observations)) throw new Error('Missing concrete browser observations')
  }
  if (!object(publication) || !keys(publication, ['learnerApproved', 'observedPublicAccess'])
    || publication.learnerApproved !== true || publication.observedPublicAccess !== true) throw new Error('Missing reported publication decision')
  // Normalize equivalent identities without mutating the supplied evidence.
  return { ...value,
    moduleThreeSourceCheckpoint: String(value.moduleThreeSourceCheckpoint).toLowerCase(),
    sourceRevision: String(value.sourceRevision).toLowerCase(),
    deployment: { ...deployment, url, provider: 'vercel', buildStatus: 'ready', sourceRevision: deployment.sourceRevision.toLowerCase() },
    validation: { ...validation,
      desktop: { ...(validation.desktop as object), url },
      mobile: { ...(validation.mobile as object), url } }
  } as unknown as PortfolioDeploymentRecord
}

const sourcePath = (path: string) => basename(path) !== '.DS_Store'
  && !/^(?:planning|evidence|node_modules|dist|out|coverage|\.codex|\.agents|\.openai|\.vercel)(?:\/|$)/.test(path)

async function committedReleaseSnapshot(root: string, expectedRevision?: string) {
  const git = (args: string[]) => readPortfolioReleaseGit(root, args)
  const [repository, revisionOutput, status, trackedPaths] = await Promise.all([
    git(['rev-parse', '--show-toplevel']), git(['rev-parse', 'HEAD']),
    git(['status', '--porcelain=v1', '-z', '--untracked-files=all']), git(['ls-files', '--cached', '-z'])
  ])
  if (resolve(repository.trim()) !== root) throw new Error('Wrong repository')
  const revision = revisionOutput.trim()
  const entries = status.split('\0').filter(Boolean)
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index]!
    if (sourcePath(entry.slice(3))) throw new Error('Uncommitted application source')
    if (/[RC]/.test(entry.slice(0, 2)) && sourcePath(entries[++index] ?? '')) throw new Error('Renamed application source')
  }
  if (expectedRevision && revision !== expectedRevision) throw new Error('Wrong source revision')
  const tracked = new Set(trackedPaths.split('\0').filter(Boolean))
  const snapshot = await applicationSnapshot(root, async (files) => {
    if (files.some(({ path }) => !tracked.has(path))) throw new Error('Application files missing from release commit')
  })
  return { ...snapshot, content: `${snapshot.content}\nIndependently verified Git HEAD: ${revision}. Application source is committed, tracked and clean; this does not verify provider or browser results.` }
}

export class PortfolioReleaseEvidenceAdapter implements PracticeEvidenceAdapter {
  readonly evidenceProfile = 'portfolio-release' as const

  constructor(
    private readonly loadContinuation: (context: Readonly<PracticeEvidenceAdapterContext>) => Promise<PortfolioReleaseContinuation | null>,
    private readonly verifier: Pick<PublicPortfolioUrlVerifier, 'verify'> = new PublicPortfolioUrlVerifier(),
    private readonly now: () => Date = () => new Date()
  ) {}

  async collect(context: Readonly<PracticeEvidenceAdapterContext>): Promise<PracticeAdapterEvidenceState> {
    const observedAt = this.now().toISOString()
    const root = await realpath(resolve(context.workspaceRoot))
    const artifacts: PortfolioPlanningArtifactSnapshot[] = []
    const issues: PortfolioPlanningIssue[] = []
    let deployment: Awaited<ReturnType<PublicPortfolioUrlVerifier['verify']>> | undefined
    const problem = (path: string, message: string) => issues.push({ stageId: 'release-source', path, code: 'missing', message })
    let record: PortfolioDeploymentRecord | undefined
    let verifiedContinuation: PortfolioReleaseContinuation | undefined
    try {
      await containedFile(root, resolve(root, portfolioReleaseRecordPath))
      const info = await lstat(resolve(root, portfolioReleaseRecordPath))
      if (!info.isFile() || info.size === 0 || info.size > 64 * 1024) throw new Error('Invalid record file')
      const bytes = await readFile(resolve(root, portfolioReleaseRecordPath))
      record = parsePortfolioDeploymentRecord(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)))
      if (Date.parse(record.validation.checkedAt) > Date.parse(observedAt) + 5 * 60_000) throw new Error('Future evidence')
      artifacts.push({ path: portfolioReleaseRecordPath, digest: hash(bytes), content: JSON.stringify(record), byteLength: bytes.length, modifiedAt: info.mtime.toISOString(), observedAt })
    } catch {
      problem(portfolioReleaseRecordPath, 'Codex cần ghi hồ sơ triển khai hiện tại, mã nguồn đã phát hành và kiểm tra thực tế trên máy tính, điện thoại; không dùng kết quả mẫu.')
    }
    try {
      const continuation = await this.loadContinuation(context)
      if (!continuation || !context.task || continuation.task.threadId !== context.task.threadId
        || resolve(context.task.workspaceRoot) !== root
        || resolve(continuation.task.workspaceRoot) !== root || resolve(continuation.workspace.canonicalPath) !== root
        || (record && record.moduleThreeSourceCheckpoint !== continuation.sourceCheckpoint)) throw new Error('Wrong Module 3 handoff')
      verifiedContinuation = continuation
    } catch {
      problem('module-3/handoff', 'Chưa xác nhận được portfolio và task đã hoàn thành Module 3. Hãy kết nối lại đúng task; lịch sử vẫn được giữ.')
    }
    try {
      const source = await committedReleaseSnapshot(root, record?.sourceRevision)
      artifacts.push({ ...source, content: source.content + (verifiedContinuation
        ? `\nIndependently verified Module 3 v2 handoff for bound task ${verifiedContinuation.task.threadId}; accepted starting source checkpoint: ${verifiedContinuation.sourceCheckpoint}.`
        : ''), observedAt })
    } catch {
      problem('application/source', 'Codex cần lưu phiên bản mã nguồn phát hành bằng commit, kiểm tra lại và đối chiếu đúng mã phiên bản đã triển khai.')
    }
    if (record && issues.length === 0) {
      deployment = await this.verifier.verify(record.deployment.url)
      if (!deployment.reachable || !deployment.finalUrl || deployment.status !== 200) {
        problem('deployment/public-url', 'Chưa mở được đường link công khai mà không cần đăng nhập. Hãy kiểm tra địa chỉ và quyền truy cập rồi thử lại.')
      }
      const content = JSON.stringify({ url: deployment.url, finalUrl: deployment.finalUrl, reachable: deployment.reachable,
        status: deployment.status, title: deployment.title ?? '', textExcerpt: deployment.textExcerpt ?? '', error: deployment.error ?? '' })
      artifacts.push({ path: 'deployment/public-url', digest: hash(content), content, byteLength: Buffer.byteLength(content), modifiedAt: observedAt, observedAt })
      try {
        // Network verification can take seconds. A concurrent save must not be
        // approved using source/record bytes read before that request began.
        await containedFile(root, resolve(root, portfolioReleaseRecordPath))
        const info = await lstat(resolve(root, portfolioReleaseRecordPath))
        if (!info.isFile() || info.size > 64 * 1024) throw new Error('Record changed')
        const latestRecord = await readFile(resolve(root, portfolioReleaseRecordPath))
        const latestSource = await committedReleaseSnapshot(root, record.sourceRevision)
        if (hash(latestRecord) !== artifacts.find((artifact) => artifact.path === portfolioReleaseRecordPath)?.digest
          || latestSource.digest !== artifacts.find((artifact) => artifact.path === 'application/source')?.digest) throw new Error('Source changed')
      } catch {
        problem('application/source', 'Tệp hoặc phiên bản nguồn vừa thay đổi khi kiểm tra đường link. Hãy cập nhật hồ sơ và kiểm tra lại trước khi nộp.')
      }
    }
    const sourceDigest = hash(JSON.stringify({ artifacts: artifacts.map(({ path, digest }) => ({ path, digest })), issues }))
    return {
      schemaVersion: 1, practiceId: context.definition.practiceId, practiceVersion: context.definition.version,
      runId: context.runId, evidenceProfile: this.evidenceProfile, observedAt, freshness: 'fresh', sourceDigest,
      evidence: artifacts.map((artifact, index) => ({ id: `release-evidence-${index + 1}`, kind: 'artifact', text: `${artifact.path} | sha256=${artifact.digest}`, freshness: 'fresh' })),
      steps: context.definition.checklist.map((step, index) => ({ stepId: step.id, status: index === 0 ? 'current' : 'pending', dependencyInputs: {} })),
      invalidations: [], portfolioRelease: { schemaVersion: 1, workspaceIdentityDigest: hash(root), artifacts, issues, unexpectedPaths: [],
        stages: (context.definition.stages ?? []).map((stage) => ({ stageId: stage.id, stageIndex: stage.order,
          status: issues.length ? 'blocked' : 'ready', artifactDigests: Object.fromEntries(artifacts.filter((artifact) => stage.requiredArtifactPaths.includes(artifact.path)).map(({ path, digest }) => [path, digest])),
          corroboratedArtifacts: Object.fromEntries(artifacts.filter((artifact) => stage.requiredArtifactPaths.includes(artifact.path)).map(({ path, digest }) => [path, digest])),
          executorReportedChecks: [], issueCodes: issues.map((issue) => issue.code) })), ...(deployment ? { deployment } : {}) }
    }
  }
}
