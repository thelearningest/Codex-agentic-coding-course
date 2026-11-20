import { isPortfolioBuildPackageVersion } from '../../shared/contracts'
import { createHash } from 'node:crypto'
import { lstat, readFile, realpath } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import {
  portfolioBuildSliceIds,
  type ExecutorActivitySnapshot,
  type PortfolioPackageHandoff,
  type PortfolioBuildSliceId,
  type PortfolioPlanningArtifactSnapshot,
  type PortfolioPlanningIssue,
  type PortfolioPlanningStageEvidence,
  type PracticeAdapterEvidenceState,
  type PracticeAdapterStepState,
  type PracticeEvidenceReference
} from '../../shared/contracts'
import { practiceWorkspaceIdentityDigest } from './practice-run-repository'
import type { PracticeEvidenceAdapter, PracticeEvidenceAdapterContext } from './practice-evidence-adapter'
import { collectPortfolioBuildPackage } from './portfolio-build-package-evidence'

type ActivitySource = { current: () => Promise<ExecutorActivitySnapshot | null> }
type TextArtifact = PortfolioPlanningArtifactSnapshot & { content: string }

const maximumArtifactBytes = 256 * 1024
const buildArtifactPaths = [
  'evidence/module-3/scaffold-report.md',
  'evidence/module-3/design-direction.md',
  'evidence/module-3/build-log.md',
  'evidence/module-3/browser-validation.md',
  'evidence/module-3/revision-record.md',
  'evidence/module-3/debugging-report.md',
  'evidence/module-3/enhancement-plan.md',
  'evidence/module-3/final-change-summary.md'
] as const
const planningInputs = ['planning/PRD.md', 'planning/implementation-plan.md'] as const
const sliceHeadings: Record<PortfolioBuildSliceId, string> = {
  'foundation-hero': 'Phần 1 — Nền trang và Hero',
  'selected-work': 'Phần 2 — Selected Work',
  'about-contact-footer': 'Phần 3 — About, Contact và footer',
  'responsive-accessibility': 'Phần 4 — Tích hợp responsive và accessibility'
}

function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function contained(root: string, candidate: string): boolean {
  const path = relative(root, candidate)
  return path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path))
}

function issue(stageId: string, path: string, code: PortfolioPlanningIssue['code'], message: string): PortfolioPlanningIssue {
  return { stageId, path, code, message }
}

function stageForPath(path: string): string {
  if (path.startsWith('planning/')) return 'scaffold-baseline'
  if (path.endsWith('scaffold-report.md')) return 'scaffold-baseline'
  if (path.endsWith('design-direction.md') || path.endsWith('build-log.md') || path.endsWith('browser-validation.md')) return 'complete-first-version'
  if (path.endsWith('revision-record.md')) return 'whole-page-revision'
  if (path.endsWith('debugging-report.md')) return 'evidence-debugging'
  return 'independent-enhancement'
}

function approved(content: string): boolean {
  return /Quyết định:\s*`(?:đã duyệt|chấp nhận)`/i.test(content)
    && /Người học xác nhận:\s*\S+/i.test(content)
    && !/`chưa duyệt`/i.test(content)
}

function completeChecks(content: string, minimum: number): boolean {
  const checks = content.match(/^- \[[ xX]\]/gm) ?? []
  return checks.length >= minimum && checks.every((check) => /\[[xX]\]/.test(check))
}

function missingHeadings(content: string, headings: readonly string[]): string[] {
  return headings.filter((heading) => !content.includes(`## ${heading}`))
}

function section(content: string, heading: string): string {
  const lines = content.split('\n')
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`)
  if (start < 0) return ''
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => line.startsWith('## '))
  return (end < 0 ? rest : rest.slice(0, end)).join('\n').trim()
}

function artifactHasRealContent(content: string): boolean {
  return content.replace(/^#.*$/gm, '').replace(/^>.*$/gm, '').replace(/[-|:`_\s]/g, '').length > 120
}

function sliceVirtualPath(sliceId: PortfolioBuildSliceId): string {
  return `evidence/module-3/build-log.${sliceId}`
}

export class PortfolioBuildEvidenceAdapter implements PracticeEvidenceAdapter {
  readonly evidenceProfile = 'portfolio-build' as const

  constructor(
    private readonly source?: ActivitySource,
    private readonly now: () => Date = () => new Date(),
    private readonly planningHandoff?: (workspaceRoot: string) => Promise<PortfolioPackageHandoff | null>
  ) {}

  async collect(context: Readonly<PracticeEvidenceAdapterContext>): Promise<PracticeAdapterEvidenceState> {
    const observedAt = this.now().toISOString()
    if (isPortfolioBuildPackageVersion(context.definition.version)) {
      return collectPortfolioBuildPackage(context, observedAt, await this.planningHandoff?.(context.workspaceRoot))
    }
    const root = await realpath(resolve(context.workspaceRoot))
    const artifacts = new Map<string, TextArtifact>()
    const issues: PortfolioPlanningIssue[] = []
    for (const path of [...planningInputs, ...buildArtifactPaths]) {
      const result = await this.inspect(root, path, observedAt)
      if ('issue' in result) issues.push(result.issue)
      else artifacts.set(path, result.artifact)
    }
    this.validateArtifacts(artifacts, issues)
    await this.validateApplication(root, issues)

    const activity = await this.source?.current() ?? null
    const matches = Boolean(activity
      && activity.runId === context.runId
      && activity.threadId === context.task?.threadId
      && resolve(context.task.workspaceRoot) === resolve(context.workspaceRoot))
    const reportedChecks = matches
      ? (activity?.reportedVerificationEvidence ?? []).slice(-30).map((item) => item.slice(0, 500))
      : []
    if (!reportedChecks.some((item) => /npm run check/i.test(item))) {
      issues.push(issue('independent-enhancement', 'package.json', 'missing-approval', 'Chưa có kết quả npm run check hiện tại do Codex báo cáo.'))
    }

    const buildLog = artifacts.get('evidence/module-3/build-log.md')
    const virtualSlices = buildLog
      ? portfolioBuildSliceIds.map((sliceId) => ({
          path: sliceVirtualPath(sliceId),
          digest: sha256(section(buildLog.content, sliceHeadings[sliceId])),
          byteLength: Buffer.byteLength(section(buildLog.content, sliceHeadings[sliceId])),
          modifiedAt: buildLog.modifiedAt,
          observedAt
        }))
      : []
    const snapshots = [...artifacts.values()].map((artifact) => ({
      path: artifact.path,
      digest: artifact.digest,
      byteLength: artifact.byteLength,
      modifiedAt: artifact.modifiedAt,
      observedAt: artifact.observedAt
    }))
    const allSnapshots = [...snapshots, ...virtualSlices]
    const stageEvidence: PortfolioPlanningStageEvidence[] = (context.definition.stages ?? []).map((stage) => {
      const dependencyPaths = stage.order >= 2 ? [...planningInputs] : [...planningInputs]
      const paths = [...new Set([...dependencyPaths, ...stage.requiredArtifactPaths])]
      const stageIssues = issues.filter((item) => item.stageId === stage.id)
      const artifactDigests = Object.fromEntries(paths.flatMap((path) => {
        const artifact = allSnapshots.find((item) => item.path === path)
        return artifact ? [[path, artifact.digest]] : []
      }))
      return {
        stageId: stage.id,
        stageIndex: stage.order,
        status: stageIssues.length === 0 && paths.every((path) => artifactDigests[path]) ? 'ready' : 'blocked',
        artifactDigests,
        executorReportedChecks: [...reportedChecks],
        corroboratedArtifacts: { ...artifactDigests },
        issueCodes: [...new Set(stageIssues.map((item) => item.code))]
      }
    })
    const evidence: PracticeEvidenceReference[] = [
      ...allSnapshots.map((artifact) => ({
        id: `build-artifact-${sha256(artifact.path).slice(0, 12)}`,
        kind: 'artifact' as const,
        text: `${artifact.path} | sha256=${artifact.digest} | bytes=${artifact.byteLength}`,
        freshness: 'fresh' as const
      })),
      ...reportedChecks.map((check, index) => ({
        id: `executor-reported-build-check-${index + 1}`,
        kind: 'executor-reported-verification' as const,
        text: check,
        freshness: 'fresh' as const
      }))
    ]
    const steps: PracticeAdapterStepState[] = (context.definition.stages ?? []).map((stage, index) => ({
      stepId: stage.id,
      status: index === 0 ? 'current' : 'pending',
      dependencyInputs: {}
    }))
    const sourceDigest = sha256(JSON.stringify({
      artifacts: allSnapshots.map(({ path, digest }) => ({ path, digest })),
      issues: issues.map(({ stageId, path, code }) => ({ stageId, path, code })),
      reportedChecks
    }))
    return {
      schemaVersion: 1,
      practiceId: context.definition.practiceId,
      practiceVersion: context.definition.version,
      runId: context.runId,
      evidenceProfile: this.evidenceProfile,
      observedAt,
      freshness: 'fresh',
      sourceDigest,
      evidence,
      steps,
      invalidations: [],
      portfolioBuild: {
        schemaVersion: 1,
        workspaceIdentityDigest: practiceWorkspaceIdentityDigest(root),
        artifacts: allSnapshots,
        issues,
        unexpectedPaths: [],
        stages: stageEvidence
      }
    }
  }

  private async inspect(root: string, path: string, observedAt: string): Promise<{ artifact: TextArtifact } | { issue: PortfolioPlanningIssue }> {
    const stageId = stageForPath(path)
    try {
      const candidate = resolve(root, path)
      const info = await lstat(candidate)
      if (info.isSymbolicLink()) return { issue: issue(stageId, path, 'symlink', 'Artifact không được là symlink.') }
      if (!info.isFile()) return { issue: issue(stageId, path, 'directory', 'Artifact phải là tệp.') }
      if (info.size === 0) return { issue: issue(stageId, path, 'empty', 'Artifact đang trống.') }
      if (info.size > maximumArtifactBytes) return { issue: issue(stageId, path, 'oversized', 'Artifact vượt giới hạn kích thước an toàn.') }
      const canonical = await realpath(candidate)
      if (!contained(root, canonical)) return { issue: issue(stageId, path, 'escaping', 'Artifact thoát khỏi portfolio workspace.') }
      const bytes = await readFile(canonical)
      let content = ''
      try { content = new TextDecoder('utf-8', { fatal: true }).decode(bytes) } catch {
        return { issue: issue(stageId, path, 'invalid-utf8', 'Artifact không phải UTF-8 hợp lệ.') }
      }
      return { artifact: { path, content, digest: sha256(bytes), byteLength: bytes.length, modifiedAt: info.mtime.toISOString(), observedAt } }
    } catch {
      return { issue: issue(stageId, path, 'missing', 'Chưa tìm thấy artifact bắt buộc.') }
    }
  }

  private validateArtifacts(artifacts: Map<string, TextArtifact>, issues: PortfolioPlanningIssue[]): void {
    const expected: Record<string, readonly string[]> = {
      'evidence/module-3/scaffold-report.md': ['Hợp đồng đầu vào', 'Đề xuất trước khi tạo', 'Phạm vi được phép', 'Ngoài phạm vi', 'Kết quả thực tế', 'Điểm khôi phục', 'Phê duyệt phiên bản hiện tại'],
      'evidence/module-3/design-direction.md': ['Hợp đồng đầu vào', 'Điều quan sát được từ tham chiếu', 'Giữ lại, điều chỉnh, đơn giản hóa hoặc loại bỏ', 'Cách chuyển sang màn hình mobile', 'Bốn phần xây dựng', 'Ngoài phạm vi', 'Phê duyệt phiên bản hiện tại'],
      'evidence/module-3/build-log.md': ['Hợp đồng đầu vào', ...Object.values(sliceHeadings), 'Kiểm tra tính toàn vẹn', 'Phê duyệt phiên bản hiện tại'],
      'evidence/module-3/browser-validation.md': ['Phiên bản được kiểm chứng', 'Desktop — 1440 × 900', 'Mobile — 390 × 844', 'Kiểm tra trực tiếp', 'Giới hạn hoặc bằng chứng còn thiếu', 'Phê duyệt phiên bản hiện tại'],
      'evidence/module-3/revision-record.md': ['Bằng chứng trước khi sửa', 'Phản hồi bằng lời của người học', 'Đề xuất sửa có giới hạn', 'Kết quả sau khi sửa', 'Phê duyệt phiên bản hiện tại'],
      'evidence/module-3/debugging-report.md': ['Phạm vi lỗi', 'Tái hiện', 'Một giả thuyết', 'Thay đổi nhỏ nhất có lý', 'Kiểm chứng sau khi sửa', 'Giải thích của người học', 'Phê duyệt phiên bản hiện tại'],
      'evidence/module-3/enhancement-plan.md': ['Lựa chọn của người học', 'Mục tiêu và tiêu chí chấp nhận', 'Kế hoạch nhỏ', 'Cửa an toàn', 'Kết quả và bằng chứng chấp nhận', 'Phê duyệt phiên bản hiện tại'],
      'evidence/module-3/final-change-summary.md': ['Phiên bản được tóm tắt', '1. Điều đã thay đổi', '2. Điều người học nên chú ý trong website', '3. Điều chủ động giữ nguyên', '4. Kiểm tra và kết quả', '5. Rủi ro, giới hạn hoặc quyết định còn lại', 'Phê duyệt phiên bản hiện tại']
    }
    for (const [path, headings] of Object.entries(expected)) {
      const artifact = artifacts.get(path)
      if (!artifact) continue
      for (const heading of missingHeadings(artifact.content, headings)) issues.push(issue(stageForPath(path), path, 'missing-section', `Thiếu mục bắt buộc: ${heading}.`))
      if (!artifactHasRealContent(artifact.content)) issues.push(issue(stageForPath(path), path, 'placeholder', 'Artifact chưa có đủ nội dung thực tế.'))
      if (!approved(artifact.content)) issues.push(issue(stageForPath(path), path, 'missing-approval', 'Artifact chưa có lời duyệt hiện tại của người học.'))
    }
    const buildLog = artifacts.get('evidence/module-3/build-log.md')
    if (buildLog) {
      for (const [sliceId, heading] of Object.entries(sliceHeadings) as Array<[PortfolioBuildSliceId, string]>) {
        const value = section(buildLog.content, heading)
        if (!/Quyết định:\s*`(?:đã duyệt|chấp nhận)`/i.test(value) || !/Checkpoint cục bộ:\s*\S+/i.test(value) || !/Tóm tắt năm phần:\s*\S+/i.test(value)) {
          issues.push(issue('complete-first-version', sliceVirtualPath(sliceId), 'missing-approval', `Phần ${heading} chưa có quyết định, tóm tắt và checkpoint riêng.`))
        }
      }
      if (!completeChecks(buildLog.content, 4)) issues.push(issue('complete-first-version', buildLog.path, 'placeholder', 'Kiểm tra toàn vẹn bốn phần chưa hoàn tất.'))
    }
    const browser = artifacts.get('evidence/module-3/browser-validation.md')
    if (browser && (!completeChecks(browser.content, 5)
      || !/Desktop — 1440 × 900/.test(browser.content)
      || !/Mobile — 390 × 844/.test(browser.content)
      || /Cuộn ngang:\s*`chưa kiểm tra`/i.test(browser.content))) {
      issues.push(issue('complete-first-version', browser.path, 'placeholder', 'Bằng chứng trình duyệt chưa hoàn tất ở đúng hai viewport.'))
    }
    const debugging = artifacts.get('evidence/module-3/debugging-report.md')
    if (debugging && !/(mong đợi|expected)/i.test(debugging.content)) issues.push(issue('evidence-debugging', debugging.path, 'missing-section', 'Báo cáo cần ghi mong đợi và thực tế của lỗi.'))
    const enhancement = artifacts.get('evidence/module-3/enhancement-plan.md')
    if (enhancement && /(backend|database|analytics|authentication|payment)/i.test(section(enhancement.content, 'Lựa chọn của người học'))) {
      issues.push(issue('independent-enhancement', enhancement.path, 'invalid-plan-boundary', 'Cải tiến có xử lý dữ liệu cần một phạm vi bảo mật riêng.'))
    }
  }

  private async validateApplication(root: string, issues: PortfolioPlanningIssue[]): Promise<void> {
    try {
      const packagePath = resolve(root, 'package.json')
      const canonical = await realpath(packagePath)
      if (!contained(root, canonical)) throw new Error('escaping')
      const pkg = JSON.parse(await readFile(canonical, 'utf8')) as { scripts?: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
      const scripts = pkg.scripts ?? {}
      for (const name of ['dev', 'typecheck', 'lint', 'build', 'preview', 'check']) {
        if (!scripts[name]) issues.push(issue('scaffold-baseline', 'package.json', 'missing-section', `Thiếu script npm: ${name}.`))
      }
      if (!/typecheck/.test(scripts.check ?? '') || !/lint/.test(scripts.check ?? '') || !/build/.test(scripts.check ?? '')) {
        issues.push(issue('scaffold-baseline', 'package.json', 'invalid-plan-boundary', 'npm run check phải chạy typecheck, lint và build theo thứ tự rõ ràng.'))
      }
      const dependencies = Object.keys({ ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) })
      if (!dependencies.some((name) => name === 'react') || !dependencies.some((name) => name === 'vite') || !dependencies.some((name) => name === 'typescript')) {
        issues.push(issue('scaffold-baseline', 'package.json', 'invalid-plan-boundary', 'Scaffold phải dùng React, TypeScript và Vite.'))
      }
      if (dependencies.some((name) => /firebase|supabase|prisma|mongoose|stripe|auth0|analytics/i.test(name))) {
        issues.push(issue('independent-enhancement', 'package.json', 'invalid-plan-boundary', 'Phát hiện dependency backend, dữ liệu hoặc analytics ngoài phạm vi Module 3.'))
      }
    } catch {
      issues.push(issue('scaffold-baseline', 'package.json', 'missing', 'Không đọc được package.json hợp lệ của ứng dụng.'))
    }
  }
}
