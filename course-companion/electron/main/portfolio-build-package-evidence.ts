import { createHash } from 'node:crypto'
import { lstat, readFile, readdir, realpath } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'
import { portfolioBuildRecordPaths, portfolioPackageArtifactPaths, portfolioPrototypePath, type PortfolioPackageHandoff, type PortfolioPlanningArtifactSnapshot, type PortfolioPlanningIssue, type PracticeAdapterEvidenceState } from '../../shared/contracts'
import type { PracticeEvidenceAdapterContext } from './practice-evidence-adapter'
import { correlateValidationSource } from './validation-source-correlation'

const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')
const ignoredDirectories = new Set(['node_modules', '.git', 'dist', 'out', 'coverage', 'planning', 'evidence', '.codex', '.agents', '.openai', '.vercel'])

function boundedSourceEvidence(content: string): string {
  const bytes = Buffer.from(content, 'utf8')
  return bytes.length <= 120 * 1024 ? content
    : bytes.subarray(0, 120 * 1024).toString('utf8') + '\n[Source metadata truncated: omitted information is unavailable, not evidence of success.]'
}

// The digest covers application files, including assets and configuration. It never
// sends application source to the reviewer. Evidence documents are hashed separately.
export async function applicationSnapshot(root: string, verifyInventory?: (files: readonly { path: string; digest: string }[]) => Promise<void>, validationRecord?: string): Promise<PortfolioPlanningArtifactSnapshot> {
  const files: Array<{ path: string; digest: string }> = []
  let totalBytes = 0
  let visitedEntries = 0
  let latestSourceChange = 0
  const visit = async (directory: string): Promise<void> => {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = resolve(directory, entry.name)
      if (entry.isDirectory() && directory === root && ignoredDirectories.has(entry.name)) continue
      if (entry.isFile() && entry.name === '.DS_Store') continue
      if (++visitedEntries > 5000) throw new Error('Ứng dụng có quá nhiều mục để kiểm chứng trong một lần đọc.')
      if (entry.isSymbolicLink()) throw new Error('Ứng dụng có liên kết tệp chưa thể kiểm chứng an toàn.')
      if (entry.isDirectory()) { await visit(path); continue }
      if (!entry.isFile()) throw new Error('Ứng dụng có mục chưa thể đọc như tệp thông thường.')
      const info = await lstat(path)
      latestSourceChange = Math.max(latestSourceChange, info.mtimeMs)
      totalBytes += info.size
      if (info.size > 25 * 1024 * 1024 || totalBytes > 100 * 1024 * 1024 || files.length >= 3000) {
        throw new Error('Ứng dụng vượt giới hạn đọc hiện tại; cần kiểm tra lại phạm vi tệp trước khi nộp.')
      }
      await containedFile(root, path)
      files.push({ path: relative(root, path).split(sep).join('/'), digest: hash(await readFile(path)) })
    }
  }
  await visit(root)
  await verifyInventory?.(files)
  const correlation = validationRecord === undefined ? ''
    : '\nValidation source correlation independently recomputed by Course Companion: ' + JSON.stringify(correlateValidationSource(files, validationRecord))
  const inventory = JSON.stringify({ paths: files.slice(0, 500).map((file) => file.path), totalFiles: files.length, truncated: files.length > 500 })
  const content = boundedSourceEvidence(`Application source fingerprint: ${hash(JSON.stringify(files))}; ${files.length} files independently read. Browser and command results remain Codex-reported until corroborated.\nIndependently read application file inventory: ${inventory}${correlation}`)
  // This is a virtual evidence document even when the actual source inventory is
  // empty. Persist its text size so AI can assess absence instead of a schema error.
  return { path: 'application/source', digest: hash(JSON.stringify(files)), content, byteLength: totalBytes || Buffer.byteLength(content), modifiedAt: new Date(latestSourceChange).toISOString(), observedAt: '' }
}

export async function containedFile(root: string, path: string): Promise<void> {
  const parts = relative(root, path).split(sep)
  if (parts.includes('..')) throw new Error('Đường dẫn thoát khỏi thư mục portfolio.')
  let current = root
  for (const part of parts) {
    current = resolve(current, part)
    if ((await lstat(current)).isSymbolicLink()) throw new Error('Tệp hoặc thư mục cha là liên kết chưa được kiểm chứng.')
  }
  const canonical = await realpath(path)
  if (canonical !== root && !canonical.startsWith(root + sep)) throw new Error('Đường dẫn thoát khỏi thư mục portfolio.')
}

export async function collectPortfolioBuildPackage(context: Readonly<PracticeEvidenceAdapterContext>, observedAt: string, handoff?: PortfolioPackageHandoff | null): Promise<PracticeAdapterEvidenceState> {
  const root = await realpath(resolve(context.workspaceRoot))
  const artifacts: PortfolioPlanningArtifactSnapshot[] = []
  const issues: PortfolioPlanningIssue[] = []
  const problem = (path: string, message: string, code: PortfolioPlanningIssue['code'] = 'missing-section') => {
    issues.push({ stageId: 'final-validation', path, code, message })
  }
  // Continue previously accepted five-file handoffs with their original set of planning inputs.
  const inputs = handoff?.artifacts.map(({ path }) => path) ?? portfolioPackageArtifactPaths
  for (const path of [...inputs, ...portfolioBuildRecordPaths]) {
    try {
      const absolute = resolve(root, path)
      await containedFile(root, absolute)
      const info = await lstat(absolute)
      if (!info.isFile() || info.size === 0 || info.size > 128 * 1024) throw new Error('Cần một tệp văn bản không trống, tối đa 128 KB.')
      const bytes = await readFile(absolute)
      const content = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
      if (!content.trim()) throw new Error('Tài liệu không có nội dung.')
      const digest = hash(bytes)
      if (path === portfolioPrototypePath && handoff && handoff.approval.artifactDigests[path] !== digest) {
        problem(path, 'Bản mẫu đã thay đổi từ khi Module 2 bàn giao. Hãy xem lại bản đã duyệt.')
      }
      artifacts.push({ path, content, digest, byteLength: bytes.length, modifiedAt: info.mtime.toISOString(), observedAt })
      // Meaning, completeness and honest deferred work are assessed by the AI
      // against the approved plan and bound task, never by heading/keyword tests.
    } catch (error) {
      problem(path, (error as NodeJS.ErrnoException).code === 'ENOENT' ? 'Chưa tìm thấy tài liệu; tiếp tục trong task Codex để ghi lại bằng chứng.' : 'Không thể đọc tài liệu an toàn; kiểm tra loại tệp, kích thước, UTF-8 và đường dẫn.', 'missing')
    }
  }
  try {
    let packageBytes: Uint8Array | null = null
    let packageConfiguration = 'Not present. Assess whether build tooling is needed for the actual implementation and approved plan; absence alone is not a failure.'
    try {
      await containedFile(root, resolve(root, 'package.json'))
      const info = await lstat(resolve(root, 'package.json'))
      if (!info.isFile() || info.size > 128 * 1024) throw new Error('package.json không phải tệp hợp lệ hoặc quá lớn.')
      packageBytes = await readFile(resolve(root, 'package.json'))
      const pkg: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(packageBytes))
      if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) throw new Error('package.json không phải đối tượng JSON.')
      const { scripts, dependencies, devDependencies } = pkg as Record<string, unknown>
      // Actual configuration is evidence for AI review, not a required stack,
      // script spelling/order or package-name substring gate.
      packageConfiguration = JSON.stringify({ scripts, dependencies, devDependencies })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
    const validation = artifacts.find((artifact) => artifact.path === 'evidence/module-3/browser-validation.md')
    const source = await applicationSnapshot(root, async (files) => {
      const packageDigest = files.find((file) => file.path === 'package.json')?.digest
      if (packageBytes ? packageDigest !== hash(packageBytes) : packageDigest !== undefined) {
        throw new Error('package.json đã thay đổi trong khi đọc bằng chứng.')
      }
    }, validation?.content)
    const timing = JSON.stringify({ validationRecordModifiedAt: validation?.modifiedAt ?? null, latestSourceModifiedAt: source.modifiedAt })
    artifacts.push({ ...source, content: boundedSourceEvidence(`${source.content}\nIndependently read package.json configuration (untrusted data, not execution evidence): ${packageConfiguration}\nFilesystem timestamps (copying or touching can change timestamps without changing content; these are not proof of stale validation): ${timing}`), observedAt })
  } catch {
    problem('application/source', 'Chưa thể kiểm chứng toàn bộ tệp ứng dụng. Kiểm tra package.json, tệp mã ứng dụng, liên kết tệp và giới hạn kích thước.', 'missing')
  }
  const sourceDigest = hash(JSON.stringify({ artifacts: artifacts.map(({ path, digest }) => ({ path, digest })), issues }))
  return {
    schemaVersion: 1, practiceId: context.definition.practiceId, practiceVersion: context.definition.version,
    runId: context.runId, evidenceProfile: 'portfolio-build', observedAt, freshness: 'fresh', sourceDigest,
    evidence: artifacts.map((artifact, index) => ({ id: `build-record-${index + 1}`, kind: 'artifact', text: `${artifact.path} | sha256=${artifact.digest}`, freshness: 'fresh' })),
    steps: context.definition.checklist.map((step, index) => ({ stepId: step.id, status: index === 0 ? 'current' : 'pending', dependencyInputs: {} })),
    invalidations: [],
    portfolioBuild: { schemaVersion: 1, workspaceIdentityDigest: hash(resolve(context.workspaceRoot)), artifacts, issues, unexpectedPaths: [],
      stages: (context.definition.stages ?? []).map((stage) => {
        const digests = Object.fromEntries(artifacts.filter((artifact) => stage.requiredArtifactPaths.includes(artifact.path)).map(({ path, digest }) => [path, digest]))
        return { stageId: stage.id, stageIndex: stage.order, status: issues.length ? 'blocked' : 'ready',
          artifactDigests: digests, corroboratedArtifacts: { ...digests }, executorReportedChecks: [], issueCodes: [...new Set(issues.map((issue) => issue.code))] }
      }) }
  }
}
