import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { collectPortfolioPackage } from '../electron/main/portfolio-package-evidence'
import type { PracticeDefinition } from '../shared/contracts'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })))
})

async function temporaryWorkspace(prefix = 'portfolio-package-evidence-'): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), prefix))
  temporaryDirectories.push(directory)
  await mkdir(join(directory, 'planning/reference/screenshots'), { recursive: true })
  return directory
}

function definition(): PracticeDefinition {
  return {
    schemaVersion: 2,
    practiceId: 'm2-portfolio-planning',
    title: 'Portfolio planning',
    version: '2.0.0',
    checkpointId: 'm2-portfolio-planning',
    objective: 'Create a five-document planning package.',
    expectedOutcome: 'A reviewable portfolio package.',
    workspaceKind: 'learner-portfolio',
    taskPolicy: 'safe-workspace-write',
    evidenceProfile: 'portfolio-planning',
    stages: [
      { id: 'portfolio-brief', order: 1, dependsOn: [], requiredArtifactPaths: ['planning/portfolio-brief.md'] },
      { id: 'content-evidence-inventory', order: 2, dependsOn: [], requiredArtifactPaths: ['planning/content-evidence-inventory.md'] },
      { id: 'visual-reference', order: 3, dependsOn: [], requiredArtifactPaths: ['planning/reference/reference.md'] },
      { id: 'portfolio-prd', order: 4, dependsOn: [], requiredArtifactPaths: ['planning/PRD.md'] },
      { id: 'implementation-contract', order: 5, dependsOn: [], requiredArtifactPaths: ['planning/implementation-plan.md'] }
    ],
    checklist: [
      { id: 'portfolio-brief', title: 'Brief', dependsOn: [] },
      { id: 'content-evidence-inventory', title: 'Inventory', dependsOn: [] },
      { id: 'visual-reference', title: 'Reference', dependsOn: [] },
      { id: 'portfolio-prd', title: 'PRD', dependsOn: [] },
      { id: 'implementation-contract', title: 'Plan', dependsOn: [] }
    ],
    criteria: [],
    completionDestination: {
      lessonId: 'module-2',
      checkpointId: 'm2-portfolio-mastery',
      sceneId: 'module-2-portfolio-mastery',
      label: 'Assessment'
    }
  }
}

function context(workspaceRoot: string, allowedLegacyArtifactPaths?: readonly string[]) {
  return {
    definition: definition(),
    runId: 'run-package',
    generation: 2,
    workspaceRoot,
    task: { threadId: 'thread-package', workspaceRoot },
    allowedLegacyArtifactPaths
  }
}

const validDocuments: Record<string, string> = {
  'planning/portfolio-brief.md': [
    '# Portfolio brief',
    '## 1) Audience & decision!',
    'A product lead should decide whether to invite the owner to an interview.',
    '## 2. First-release boundary:',
    'Show two selected projects and a contact route; omit the future blog.'
  ].join('\n\n'),
  'planning/content-evidence-inventory.md': [
    '# Content evidence',
    '## A. Available material',
    'Project Alpha has an owner-authored case study and approved screenshots.',
    '## B — Gaps and restrictions',
    'Conversion metrics and client names remain excluded until permission is confirmed.'
  ].join('\n\n'),
  'planning/reference/reference.md': [
    '# Visual reference',
    '## 1. Direction',
    'Use clear hierarchy and generous spacing as visual characteristics.',
    '## 2) Boundaries',
    'Create an original layout and do not copy branding, text, imagery, or source code.'
  ].join('\n\n'),
  'planning/PRD.md': [
    '# Portfolio PRD',
    '## 1 — Product requirements',
    'REQ-HERO: Introduce the owner and their role before the first project.',
    'REQ-WORK-02: Present two evidence-backed projects on wide and narrow screens.',
    '## 2. Acceptance criteria!',
    'A reviewer can locate the owner, both projects, and the contact route with a keyboard.'
  ].join('\n\n'),
  'planning/implementation-plan.md': [
    '# Implementation plan',
    '## 1) Delivery steps',
    'First establish the page shell for REQ-HERO, then add project cards for REQ-WORK-02.',
    '## 2 — Dependencies and order',
    'The project cards depend on verified inventory content; responsive review follows assembly.',
    '## 3. Checks / validation!',
    'Verify REQ-HERO and REQ-WORK-02 on desktop, mobile, and keyboard navigation.'
  ].join('\n\n')
}

const tinyPngBytes = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==',
  'base64'
)
const tinyJpegBytes = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/EH//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/EH//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/EH//2Q==',
  'base64'
)
const tinyWebpBytes = Buffer.from(
  'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEAAUAmJaQAA3AA/vuUAAA=',
  'base64'
).subarray(0, 42)

async function writeValidDocuments(workspace: string, overrides: Record<string, string | Uint8Array> = {}): Promise<void> {
  await Promise.all(Object.entries({ ...validDocuments, ...overrides }).map(async ([path, content]) => {
    await mkdir(join(workspace, path, '..'), { recursive: true })
    await writeFile(join(workspace, path), content)
  }))
}

describe('collectPortfolioPackage', () => {
  it.each(['prose', 'bullets', 'table', 'setext', 'single-heading', 'optional-empty-section'])(
    'collects all five documents in %s format without enforcing a template', async (format) => {
      const workspace = await temporaryWorkspace()
      const bodies: Record<string, string> = {
        prose: 'Giới thiệu bản thân rồi trình bày hai dự án đã được duyệt. Đối chiếu kết quả trên điện thoại và máy tính; dừng để người học xem lại.',
        bullets: '- Giới thiệu: hiện tên và vai trò.\n- Dự án: chỉ dùng tư liệu được phép công bố.\n- Xem lại trên màn hình hẹp, thử liên kết bằng bàn phím.',
        table: '| Việc cần làm | Khi nào | Cách xem kết quả |\n| --- | --- | --- |\n| Giới thiệu | Có nội dung đã duyệt | Đọc tên và vai trò |',
        setext: 'Présentation\n=============\nPrésenter le rôle, puis les projets autorisés. Vérifier la page avant validation.',
        'single-heading': '# Một phiên bản nhỏ\nNội dung, điều kiện thực hiện và cách kiểm chứng được trình bày trong một đoạn văn.',
        'optional-empty-section': '# Kế hoạch\nĐối chiếu yêu cầu Giới thiệu và Dự án, rồi xin duyệt.\n\n## Ghi chú tùy chọn\n'
      }
      await writeValidDocuments(workspace, Object.fromEntries(Object.keys(validDocuments).map((path) => [path, bodies[format]!])))
      const evidence = await collectPortfolioPackage(context(workspace))
      expect(evidence.portfolioPlanning?.issues).toEqual([])
      expect(evidence.portfolioPlanning?.artifacts).toHaveLength(5)
      expect(evidence.portfolioPlanning?.artifacts.every((artifact) => artifact.content === bodies[format])).toBe(true)
    }
  )

  it('rejects whitespace-only documents as empty', async () => {
    const workspace = await temporaryWorkspace()
    await writeValidDocuments(workspace, { 'planning/implementation-plan.md': '\uFEFF \r\n\t' })
    const evidence = await collectPortfolioPackage(context(workspace))
    expect(evidence.portfolioPlanning?.issues).toEqual([
      expect.objectContaining({ path: 'planning/implementation-plan.md', code: 'empty' })
    ])
  })

  it.each([
    '# Kế hoạch\n\n## Giai đoạn 1\nChuẩn bị nội dung cho REQ-HERO.\n\n## Giai đoạn 2\nPhụ thuộc vào việc duyệt giai đoạn 1. Bổ sung REQ-WORK-02.\n\n## Kiểm tra\nĐối chiếu hai yêu cầu trên trang.',
    '# Kế hoạch\n\n## Khởi đầu\nĐầu tiên chuẩn bị REQ-HERO.\n\n## Tiếp tục\nChỉ bổ sung REQ-WORK-02 sau khi người học duyệt phần đầu.\n\n## Kết quả\nĐối chiếu hai yêu cầu trên trang.',
    '# Plan\n\n## Alpha\nFirst prepare REQ-HERO.\n\n## Beta\nOnly after learner approval, add REQ-WORK-02.\n\n## Gamma\nVerify both requirements on the page.'
  ])('accepts plan content without prescribed headings: %s', async (plan) => {
    const workspace = await temporaryWorkspace()
    await writeValidDocuments(workspace, { 'planning/implementation-plan.md': plan })
    const evidence = await collectPortfolioPackage(context(workspace))
    expect(evidence.portfolioPlanning?.issues).toEqual([])
    expect(evidence.portfolioPlanning?.stages.every((stage) => stage.status === 'ready')).toBe(true)
  })

  it.each([
    ['các bước hoặc giai đoạn triển khai', 'REQ-HERO và REQ-WORK-02 phụ thuộc vào nội dung đã duyệt. Kiểm tra hai yêu cầu.'],
    ['phụ thuộc hoặc thứ tự thực hiện', 'Giai đoạn 1: REQ-HERO. Giai đoạn 2: REQ-WORK-02. Kiểm tra hai yêu cầu.'],
    ['kiểm tra hoặc cách xác minh', 'Giai đoạn 1: REQ-HERO. Giai đoạn 2: REQ-WORK-02 phụ thuộc vào việc duyệt giai đoạn 1.']
  ])('leaves missing %s to semantic review', async (_label, body) => {
    const workspace = await temporaryWorkspace()
    await writeValidDocuments(workspace, { 'planning/implementation-plan.md': `# Kế hoạch\n\n## Nội dung\n${body}\n\n## Phạm vi\nChỉ xây portfolio.` })
    const evidence = await collectPortfolioPackage(context(workspace))
    expect(evidence.portfolioPlanning?.issues).toEqual([])
    expect(evidence.portfolioPlanning?.artifacts.find((artifact) => artifact.path === 'planning/implementation-plan.md')?.content).toContain(body)
  })

  it('preserves the original combined plan without counting it as a required or reviewed document', async () => {
    const workspace = await temporaryWorkspace()
    await writeValidDocuments(workspace)
    const baseline = await collectPortfolioPackage(context(workspace))
    const note = join(workspace, 'planning/portfolio-plan.md')
    await writeFile(note, '# Original learner planning notes\n\nKeep the confirmed interview decisions.')

    const evidence = await collectPortfolioPackage(context(workspace))

    expect(evidence.freshness).toBe('fresh')
    expect(evidence.portfolioPlanning?.issues).toEqual([])
    expect(evidence.portfolioPlanning?.unexpectedPaths).toEqual([])
    expect(evidence.portfolioPlanning?.artifacts).toHaveLength(5)
    expect(evidence.portfolioPlanning?.artifacts.some(({ path }) => path === 'planning/portfolio-plan.md')).toBe(false)
    expect(evidence.sourceDigest).toBe(baseline.sourceDigest)
    expect(await readFile(note, 'utf8')).toContain('Keep the confirmed interview decisions.')
  })

  it('still requires all five documents when only the original combined plan exists', async () => {
    const workspace = await temporaryWorkspace()
    await writeFile(join(workspace, 'planning/portfolio-plan.md'), '# One combined plan')

    const evidence = await collectPortfolioPackage(context(workspace))

    expect(evidence.freshness).toBe('unverifiable')
    expect(evidence.portfolioPlanning?.artifacts).toHaveLength(0)
    expect(evidence.portfolioPlanning?.issues.filter(({ code }) => code === 'missing')).toHaveLength(5)
  })

  it.each(['directory', 'junction'])(
    'rejects an original-plan path that is a %s', async (kind) => {
      const workspace = await temporaryWorkspace()
      await writeValidDocuments(workspace)
      const note = join(workspace, 'planning/portfolio-plan.md')
      if (kind === 'directory') await mkdir(note)
      else {
        const outside = await temporaryWorkspace('portfolio-original-plan-target-')
        await symlink(outside, note, process.platform === 'win32' ? 'junction' : 'dir')
      }

      const evidence = await collectPortfolioPackage(context(workspace))

      expect(evidence.freshness).toBe('unverifiable')
      expect(evidence.portfolioPlanning?.unexpectedPaths).toContain('planning/portfolio-plan.md')
    }
  )

  it('does not exempt other unrequested files beside the original combined plan', async () => {
    const workspace = await temporaryWorkspace()
    await writeValidDocuments(workspace)
    await writeFile(join(workspace, 'planning/portfolio-plan.md'), '# Original notes')
    await writeFile(join(workspace, 'planning/other.md'), '# Unrequested document')
    await writeFile(join(workspace, 'package.json'), '{}')

    const evidence = await collectPortfolioPackage(context(workspace))

    expect(evidence.freshness).toBe('unverifiable')
    expect(evidence.portfolioPlanning?.unexpectedPaths).toEqual(['package.json', 'planning/other.md'])
  })

  it('collects exactly five approval-free documents with equivalent Markdown headings', async () => {
    const workspace = await temporaryWorkspace()
    await writeValidDocuments(workspace)

    const evidence = await collectPortfolioPackage(context(workspace), () => new Date('2026-09-11T01:00:00.000Z'))

    expect(evidence.freshness).toBe('fresh')
    expect(evidence.portfolioPlanning?.issues).toEqual([])
    expect(evidence.portfolioPlanning?.artifacts).toHaveLength(5)
    expect(evidence.portfolioPlanning?.artifacts.every((artifact) => typeof artifact.content === 'string')).toBe(true)
    expect(evidence.portfolioPlanning?.stages.map(({ stageId, status }) => [stageId, status])).toEqual([
      ['portfolio-brief', 'ready'],
      ['content-evidence-inventory', 'ready'],
      ['visual-reference', 'ready'],
      ['portfolio-prd', 'ready'],
      ['implementation-contract', 'ready']
    ])
    expect(evidence.portfolioPlanning?.stages.every((stage) => stage.executorReportedChecks.length === 0)).toBe(true)
    expect(evidence.evidence.some((item) => item.kind === 'workspace-confirmed-change')).toBe(true)
  })

  it('reports missing and empty required documents', async () => {
    const workspace = await temporaryWorkspace()
    await writeValidDocuments(workspace, { 'planning/portfolio-brief.md': '' })
    await rm(join(workspace, 'planning/PRD.md'))

    const evidence = await collectPortfolioPackage(context(workspace))

    expect(evidence.freshness).toBe('unverifiable')
    expect(evidence.portfolioPlanning?.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'planning/portfolio-brief.md', code: 'empty' }),
      expect.objectContaining({ path: 'planning/PRD.md', code: 'missing' })
    ]))
  })

  it('ignores regular Finder metadata throughout the allowed workspace without changing the source digest', async () => {
    const workspace = await temporaryWorkspace()
    await writeValidDocuments(workspace)
    const baseline = await collectPortfolioPackage(context(workspace))
    const metadataPaths = [
      '.DS_Store',
      'planning/.DS_Store',
      'planning/reference/.DS_Store',
      'planning/reference/screenshots/.DS_Store'
    ]
    await Promise.all(metadataPaths.map((path) => writeFile(join(workspace, path), 'Finder metadata')))

    const withMetadata = await collectPortfolioPackage(context(workspace))
    await Promise.all(metadataPaths.map((path) => writeFile(join(workspace, path), 'Updated Finder metadata')))
    const withChangedMetadata = await collectPortfolioPackage(context(workspace))

    for (const evidence of [baseline, withMetadata, withChangedMetadata]) {
      expect(evidence.freshness).toBe('fresh')
      expect(evidence.portfolioPlanning?.issues).toEqual([])
      expect(evidence.portfolioPlanning?.unexpectedPaths).toEqual([])
      expect(evidence.portfolioPlanning?.artifacts).toHaveLength(5)
      expect(evidence.sourceDigest).toBe(baseline.sourceDigest)
    }
  })

  it.each(['.DS_Store', 'planning/reference/.DS_Store'])(
    'rejects a directory named %s',
    async (path) => {
      const workspace = await temporaryWorkspace()
      await writeValidDocuments(workspace)
      await mkdir(join(workspace, path))

      const evidence = await collectPortfolioPackage(context(workspace))

      expect(evidence.freshness).toBe('unverifiable')
      expect(evidence.portfolioPlanning?.unexpectedPaths).toContain(path)
    }
  )

  it('does not count regular Finder metadata toward the 500-entry workspace budget', async () => {
    const workspace = await temporaryWorkspace()
    // Five documents, three allowed directories, and 492 screenshots fill the budget.
    const screenshotPaths = Array.from({ length: 492 }, (_, index) =>
      `planning/reference/screenshots/image-${index}.png`)
    await writeValidDocuments(workspace, {
      'planning/reference/reference.md': `${validDocuments['planning/reference/reference.md']}\n\n## Sources\n\n${screenshotPaths.join('\n')}`
    })
    await Promise.all(screenshotPaths.map((path) => writeFile(join(workspace, path), tinyPngBytes)))
    await writeFile(join(workspace, '.DS_Store'), 'Finder metadata')
    await writeFile(join(workspace, 'planning/reference/screenshots/.DS_Store'), 'Finder metadata')

    const evidence = await collectPortfolioPackage(context(workspace))

    expect(evidence.freshness).toBe('fresh')
    expect(evidence.portfolioPlanning?.issues).toEqual([])
    expect(evidence.portfolioPlanning?.unexpectedPaths).toEqual([])
  }, 15_000)

  for (const path of ['.DS_Store', 'planning/reference/.DS_Store']) {
    it(`rejects a symbolic link named ${path}`, async ({ skip }) => {
      const workspace = await temporaryWorkspace()
      const target = await temporaryWorkspace('portfolio-package-metadata-target-')
      await writeValidDocuments(workspace)
      try {
        await symlink(target, join(workspace, path), process.platform === 'win32' ? 'junction' : 'dir')
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EPERM') {
          skip('Windows does not permit symlink creation in this environment.')
          return
        }
        throw error
      }

      const evidence = await collectPortfolioPackage(context(workspace))

      expect(evidence.freshness).toBe('unverifiable')
      expect(evidence.portfolioPlanning?.unexpectedPaths).toContain(path)
    })
  }

  it('still rejects other dotfiles at the root and inside allowed directories', async () => {
    const workspace = await temporaryWorkspace()
    await writeValidDocuments(workspace)
    await writeFile(join(workspace, '.hidden'), 'Unexpected file')
    await writeFile(join(workspace, 'planning/.hidden'), 'Unexpected file')

    const evidence = await collectPortfolioPackage(context(workspace))

    expect(evidence.freshness).toBe('unverifiable')
    expect(evidence.portfolioPlanning?.unexpectedPaths).toEqual(['.hidden', 'planning/.hidden'])
  })

  it('preserves requirement differences for semantic review instead of rejecting identifier spelling', async () => {
    const workspace = await temporaryWorkspace()
    await writeValidDocuments(workspace, {
      'planning/implementation-plan.md': validDocuments['planning/implementation-plan.md']!
        .replaceAll('REQ-HERO', 'REQ-UNKNOWN')
    })

    const evidence = await collectPortfolioPackage(context(workspace))
    expect(evidence.portfolioPlanning?.issues).toEqual([])
    expect(evidence.portfolioPlanning?.artifacts.find((artifact) => artifact.path === 'planning/implementation-plan.md')?.content).toContain('REQ-UNKNOWN')
  })

  it('rejects invalid UTF-8 and text files above 128 KiB', async () => {
    const workspace = await temporaryWorkspace()
    await writeValidDocuments(workspace, {
      'planning/portfolio-brief.md': new Uint8Array([0xc3, 0x28]),
      'planning/content-evidence-inventory.md': 'x'.repeat(128 * 1024 + 1)
    })

    const evidence = await collectPortfolioPackage(context(workspace))

    expect(evidence.portfolioPlanning?.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'planning/portfolio-brief.md', code: 'invalid-utf8' }),
      expect.objectContaining({ path: 'planning/content-evidence-inventory.md', code: 'oversized' })
    ]))
  })

  it('digests referenced screenshots and invalidates the source digest when their bytes change', async () => {
    const workspace = await temporaryWorkspace()
    const screenshotPath = 'planning/reference/screenshots/home.webp'
    await writeValidDocuments(workspace, {
      'planning/reference/reference.md': `${validDocuments['planning/reference/reference.md']}\n\n## 3. Source record\n\n| Image | Observation |\n| --- | --- |\n| ${screenshotPath} | Hierarchy only |`
    })
    await writeFile(join(workspace, screenshotPath), tinyWebpBytes)

    const first = await collectPortfolioPackage(context(workspace))
    const changedWebpBytes = new Uint8Array(tinyWebpBytes)
    const changedByteIndex = changedWebpBytes.length - 1
    changedWebpBytes[changedByteIndex] = (changedWebpBytes[changedByteIndex] ?? 0) ^ 0x01
    await writeFile(join(workspace, screenshotPath), changedWebpBytes)
    const second = await collectPortfolioPackage(context(workspace))

    expect(first.portfolioPlanning?.artifacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: screenshotPath, byteLength: tinyWebpBytes.length })
    ]))
    expect(second.portfolioPlanning?.artifacts.find((item) => item.path === screenshotPath)?.digest)
      .not.toBe(first.portfolioPlanning?.artifacts.find((item) => item.path === screenshotPath)?.digest)
    expect(second.sourceDigest).not.toBe(first.sourceDigest)
  })

  it('accepts real tiny PNG, JPEG, and WebP containers', async () => {
    const workspace = await temporaryWorkspace()
    const fixtures: Record<string, Uint8Array> = {
      'planning/reference/screenshots/tiny.png': tinyPngBytes,
      'planning/reference/screenshots/tiny.jpg': tinyJpegBytes,
      'planning/reference/screenshots/tiny.webp': tinyWebpBytes
    }
    await writeValidDocuments(workspace, {
      'planning/reference/reference.md': `${validDocuments['planning/reference/reference.md']}\n\n## 3. Source records\n\n${Object.keys(fixtures).join('\n')}`
    })
    await Promise.all(Object.entries(fixtures).map(([path, bytes]) => writeFile(join(workspace, path), bytes)))

    const evidence = await collectPortfolioPackage(context(workspace))

    expect(evidence.portfolioPlanning?.issues).toEqual([])
    expect(evidence.portfolioPlanning?.artifacts.filter((item) => Object.hasOwn(fixtures, item.path))).toHaveLength(3)
  })

  it('rejects signature-only, marker-only, and malformed-length image containers', async () => {
    const workspace = await temporaryWorkspace()
    const malformedWebp = new Uint8Array(tinyWebpBytes)
    malformedWebp[4] = 0x04
    malformedWebp[5] = 0x00
    malformedWebp[6] = 0x00
    malformedWebp[7] = 0x00
    const malformed: Record<string, Uint8Array> = {
      'planning/reference/screenshots/signature-only.png': tinyPngBytes.subarray(0, 8),
      'planning/reference/screenshots/marker-only.jpg': new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
      'planning/reference/screenshots/wrong-length.webp': malformedWebp
    }
    await writeValidDocuments(workspace, {
      'planning/reference/reference.md': `${validDocuments['planning/reference/reference.md']}\n\n## 3. Source records\n\n${Object.keys(malformed).join('\n')}`
    })
    await Promise.all(Object.entries(malformed).map(([path, bytes]) => writeFile(join(workspace, path), bytes)))

    const evidence = await collectPortfolioPackage(context(workspace))
    const malformedIssues = evidence.portfolioPlanning?.issues.filter((item) =>
      item.code === 'invalid-evidence-label' && Object.hasOwn(malformed, item.path)) ?? []

    expect(malformedIssues).toHaveLength(3)
    expect(evidence.portfolioPlanning?.artifacts.some((item) => Object.hasOwn(malformed, item.path))).toBe(false)
  })

  it('does not read unreferenced images and reports an escaping image reference', async () => {
    const workspace = await temporaryWorkspace()
    const unreferenced = 'planning/reference/screenshots/unreferenced.png'
    await writeValidDocuments(workspace, {
      'planning/reference/reference.md': `${validDocuments['planning/reference/reference.md']}\n\n## 3. Candidate image\n\n![outside](../../../outside.png)`
    })
    await writeFile(join(workspace, unreferenced), new Uint8Array([8, 9]))

    const evidence = await collectPortfolioPackage(context(workspace))

    expect(evidence.portfolioPlanning?.unexpectedPaths).toContain(unreferenced)
    expect(evidence.portfolioPlanning?.artifacts.some((item) => item.path === unreferenced)).toBe(false)
    expect(evidence.portfolioPlanning?.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'escaping' }),
      expect.objectContaining({ code: 'unexpected-workspace-change', path: unreferenced })
    ]))
  })

  it('rejects a symlinked intermediate planning directory', async ({ skip }) => {
    const workspace = await temporaryWorkspace()
    const target = await temporaryWorkspace('portfolio-package-symlink-target-')
    await writeValidDocuments(target)
    await rm(join(workspace, 'planning'), { recursive: true, force: true })
    try {
      await symlink(join(target, 'planning'), join(workspace, 'planning'), process.platform === 'win32' ? 'junction' : 'dir')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EPERM') {
        skip('Windows does not permit symlink creation in this environment.')
        return
      }
      throw error
    }

    const evidence = await collectPortfolioPackage(context(workspace))

    expect(evidence.portfolioPlanning?.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'planning/portfolio-brief.md', code: 'symlink' })
    ]))
  })

  it('reports application and build output as out of scope', async () => {
    const workspace = await temporaryWorkspace()
    await writeValidDocuments(workspace)
    await writeFile(join(workspace, 'package.json'), '{}\n')
    await mkdir(join(workspace, 'dist'))

    const evidence = await collectPortfolioPackage(context(workspace))

    expect(evidence.portfolioPlanning?.unexpectedPaths).toEqual(expect.arrayContaining(['dist', 'package.json']))
  })

  it('stops workspace traversal at 500 entries', async () => {
    const workspace = await temporaryWorkspace()
    await writeValidDocuments(workspace)
    await Promise.all(Array.from({ length: 500 }, (_, index) =>
      writeFile(join(workspace, `extra-${index.toString().padStart(3, '0')}.txt`), 'out of scope')))

    const evidence = await collectPortfolioPackage(context(workspace))

    expect(evidence.portfolioPlanning?.unexpectedPaths).toContain('<workspace-entry-limit>')
    expect(evidence.portfolioPlanning?.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'unexpected-workspace-change', path: '<workspace-entry-limit>' })
    ]))
  })

  it('enforces the same global 500-entry budget inside nested screenshot directories', async () => {
    const workspace = await temporaryWorkspace()
    await writeValidDocuments(workspace)
    await Promise.all(Array.from({ length: 490 }, (_, index) =>
      writeFile(
        join(workspace, 'planning/reference/screenshots', `extra-${index.toString().padStart(3, '0')}.png`),
        new Uint8Array([1])
      )))
    await Promise.all(Array.from({ length: 3 }, (_, index) =>
      writeFile(join(workspace, `z-extra-${index}.txt`), 'out of scope')))

    const evidence = await collectPortfolioPackage(context(workspace))

    expect(evidence.portfolioPlanning?.unexpectedPaths)
      .toContain('planning/reference/screenshots/<workspace-entry-limit>')
    expect(evidence.portfolioPlanning?.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'unexpected-workspace-change',
        path: 'planning/reference/screenshots/<workspace-entry-limit>'
      })
    ]))
  })

  it('allows only explicitly allowlisted legacy planning documents', async () => {
    const workspace = await temporaryWorkspace()
    await writeValidDocuments(workspace)
    await writeFile(join(workspace, 'planning/requirement-validation-map.md'), '# Historical map\n')
    await writeFile(join(workspace, 'planning/first-bounded-task.md'), '# Historical task\n')

    const withoutAllowlist = await collectPortfolioPackage(context(workspace))
    const withAllowlist = await collectPortfolioPackage(context(workspace, [
      'planning/requirement-validation-map.md',
      'planning/first-bounded-task.md',
      'planning/not-an-old-contract.md'
    ]))

    expect(withoutAllowlist.portfolioPlanning?.unexpectedPaths).toEqual(expect.arrayContaining([
      'planning/requirement-validation-map.md',
      'planning/first-bounded-task.md'
    ]))
    expect(withAllowlist.portfolioPlanning?.unexpectedPaths).toEqual([])
    expect(withAllowlist.portfolioPlanning?.artifacts).toHaveLength(5)
  })

  it('keeps sourceDigest stable when only observation time changes', async () => {
    const workspace = await temporaryWorkspace()
    await writeValidDocuments(workspace)

    const first = await collectPortfolioPackage(context(workspace), () => new Date('2026-09-11T01:00:00.000Z'))
    const second = await collectPortfolioPackage(context(workspace), () => new Date('2026-09-12T04:30:00.000Z'))

    expect(second.observedAt).not.toBe(first.observedAt)
    expect(second.sourceDigest).toBe(first.sourceDigest)
  })
})
