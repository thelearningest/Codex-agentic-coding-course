import { createHash } from 'node:crypto'
import type { Stats } from 'node:fs'
import { lstat, opendir, readFile, realpath } from 'node:fs/promises'
import { isAbsolute, posix, relative, resolve, sep } from 'node:path'
import { portfolioAgentsFileName } from '../../shared/portfolio-agents-template'
import {
  portfolioPackageArtifactPaths,
  type PortfolioPlanningArtifactSnapshot,
  type PortfolioPlanningIssue,
  type PortfolioPlanningStageEvidence,
  type PracticeAdapterEvidenceState,
  type PracticeAdapterStepState,
  type PracticeEvidenceReference
} from '../../shared/contracts'
import { practiceWorkspaceIdentityDigest } from './practice-run-repository'
import type { PracticeEvidenceAdapterContext } from './practice-evidence-adapter'

type PortfolioPackageContext = Readonly<PracticeEvidenceAdapterContext> & {
  allowedLegacyArtifactPaths?: readonly string[]
}

type TextArtifact = PortfolioPlanningArtifactSnapshot & { content: string }

type SafeEntry = {
  absolutePath: string
  info: Stats
}

type SafeEntryFailure = {
  code: 'missing' | 'symlink' | 'escaping'
}

type ImageReference = {
  source: string
  path: string | null
  problem: 'escaping' | 'unsupported' | null
}

const maximumTextBytes = 128 * 1024
const maximumImageBytes = 12 * 1024 * 1024
const maximumWorkspaceEntries = 500
const legacyArtifactPaths = new Set([
  'planning/requirement-validation-map.md',
  'planning/first-bounded-task.md'
])
const allowedDirectories = new Set([
  'planning',
  'planning/reference',
  'planning/reference/screenshots'
])
const supportedImagePath = /^planning\/reference\/screenshots\/[^/]+\.(?:png|jpe?g|webp)$/i
const commonImageExtension = /\.(?:avif|bmp|gif|jpe?g|png|svg|tiff?|webp)(?:[?#].*)?$/i

const stageDescriptors = [
  { stageId: 'portfolio-brief', stageIndex: 1, path: portfolioPackageArtifactPaths[0] },
  { stageId: 'content-evidence-inventory', stageIndex: 2, path: portfolioPackageArtifactPaths[1] },
  { stageId: 'visual-reference', stageIndex: 3, path: portfolioPackageArtifactPaths[2] },
  { stageId: 'portfolio-prd', stageIndex: 4, path: portfolioPackageArtifactPaths[3] },
  { stageId: 'implementation-contract', stageIndex: 5, path: portfolioPackageArtifactPaths[4] }
] as const

function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function contained(root: string, candidate: string): boolean {
  const fromRoot = relative(root, candidate)
  return fromRoot === '' || (
    fromRoot !== '..'
    && !fromRoot.startsWith(`..${sep}`)
    && !isAbsolute(fromRoot)
  )
}

function issue(
  stageId: string,
  path: string,
  code: PortfolioPlanningIssue['code'],
  message: string
): PortfolioPlanningIssue {
  return { stageId, path, code, message }
}

function stageForPath(path: string): string {
  const descriptor = stageDescriptors.find((stage) => stage.path === path)
  if (descriptor) return descriptor.stageId
  if (path.startsWith('planning/reference/')) return 'visual-reference'
  if (path === 'planning' || path.startsWith('planning/portfolio')) return 'portfolio-brief'
  if (path.startsWith('planning/content')) return 'content-evidence-inventory'
  if (path.startsWith('planning/PRD')) return 'portfolio-prd'
  return 'implementation-contract'
}

function normalizeHeading(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/^\s*\d+(?:\.\d+)*\s*[).:\-–—]*\s*/, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase()
}

function markdownSections(content: string): Array<{ heading: string; body: string }> {
  const headingPattern = /^ {0,3}(#{1,6})[ \t]+(.+?)\s*#*\s*$/gm
  const headings = [...content.matchAll(headingPattern)].map((match) => ({
    level: match[1]!.length,
    heading: match[2]!.trim(),
    bodyStart: (match.index ?? 0) + match[0].length,
    headingStart: match.index ?? 0
  }))
  const candidates = headings.filter((heading) => heading.level >= 2)
  const selected = candidates.length > 0 ? candidates : headings
  return selected.map((heading) => {
    const next = headings.find((candidate) =>
      candidate.headingStart > heading.headingStart && candidate.level <= heading.level)
    return {
      heading: heading.heading,
      body: content.slice(heading.bodyStart, next?.headingStart ?? content.length)
        .replace(/^ {0,3}#{1,6}[ \t]+.*$/gm, '')
        .trim()
    }
  })
}

function structuralDocumentIssues(artifact: TextArtifact): PortfolioPlanningIssue[] {
  const sections = markdownSections(artifact.content)
  if (sections.length < 2) {
    return [issue(
      stageForPath(artifact.path),
      artifact.path,
      'missing-section',
      'Tài liệu cần được tổ chức thành ít nhất hai mục Markdown có nội dung.'
    )]
  }
  const empty = sections.filter((section) => section.body.length === 0)
  if (empty.length === 0) return []
  return [issue(
    stageForPath(artifact.path),
    artifact.path,
    'missing-section',
    `Các mục Markdown sau đang trống: ${empty.map((section) => section.heading).join(', ')}.`
  )]
}

function requirementIds(content: string): string[] {
  return [...new Set(content.match(/\bREQ-[A-Za-z0-9][A-Za-z0-9_-]*\b/g) ?? [])].sort()
}

function requirementIssues(artifacts: Map<string, TextArtifact>): PortfolioPlanningIssue[] {
  const issues: PortfolioPlanningIssue[] = []
  const prd = artifacts.get('planning/PRD.md')
  const plan = artifacts.get('planning/implementation-plan.md')
  if (!prd) return issues

  const prdIds = requirementIds(prd.content)
  const prdHeadings = markdownSections(prd.content).map((section) => normalizeHeading(section.heading))
  const hasAcceptanceCriteria = /\bAC-[A-Za-z0-9][A-Za-z0-9_-]*\b/.test(prd.content)
    || prdHeadings.some((heading) => /(?:acceptance|accept criteria|tieu chi chap nhan|tieu chi nghiem thu|dieu kien chap nhan)/.test(heading))
  if (prdIds.length === 0) {
    issues.push(issue(
      'portfolio-prd',
      prd.path,
      'requirement-coverage',
      'PRD cần có ít nhất một mã yêu cầu ổn định theo dạng REQ-*.'
    ))
  }
  if (!hasAcceptanceCriteria) {
    issues.push(issue(
      'portfolio-prd',
      prd.path,
      'requirement-coverage',
      'PRD cần có tiêu chí chấp nhận nhận diện được bằng mục tương ứng hoặc mã AC-*.'
    ))
  }
  if (!plan) return issues

  const planIds = requirementIds(plan.content)
  const missing = prdIds.filter((id) => !planIds.includes(id))
  const unknown = planIds.filter((id) => !prdIds.includes(id))
  if (missing.length > 0) {
    issues.push(issue(
      'implementation-contract',
      plan.path,
      'requirement-coverage',
      `Kế hoạch chưa tham chiếu các yêu cầu hiện tại: ${missing.join(', ')}.`
    ))
  }
  if (unknown.length > 0) {
    issues.push(issue(
      'implementation-contract',
      plan.path,
      'requirement-coverage',
      `Kế hoạch tham chiếu mã yêu cầu không có trong PRD hiện tại: ${unknown.join(', ')}.`
    ))
  }
  return issues
}

function planSectionIssues(artifacts: Map<string, TextArtifact>): PortfolioPlanningIssue[] {
  const plan = artifacts.get('planning/implementation-plan.md')
  if (!plan) return []
  const headings = markdownSections(plan.content).map((section) => normalizeHeading(section.heading))
  const expected: Array<{ label: string; pattern: RegExp }> = [
    { label: 'các bước hoặc giai đoạn triển khai', pattern: /(?:\bstep\b|\bstage\b|\bphase\b|delivery|implementation sequence|cac buoc|giai doan|trinh tu)/ },
    { label: 'phụ thuộc hoặc thứ tự thực hiện', pattern: /(?:depend|prerequisite|order|sequence|phu thuoc|dieu kien tien quyet|thu tu)/ },
    { label: 'kiểm tra hoặc cách xác minh', pattern: /(?:check|validation|verification|verify|test|kiem tra|kiem chung|xac minh|nghiem thu)/ }
  ]
  return expected.flatMap(({ label, pattern }) => headings.some((heading) => pattern.test(heading))
    ? []
    : [issue(
        'implementation-contract',
        plan.path,
        'missing-section',
        `Kế hoạch cần có mục mô tả ${label}.`
      )])
}

function cleanReferenceTarget(value: string): string {
  const trimmed = value.trim().replace(/^<|>$/g, '')
  const withoutTitle = trimmed.match(/^(\S+)/)?.[1] ?? trimmed
  return withoutTitle.replace(/[?#].*$/, '')
}

function imageTargets(content: string): string[] {
  const targets = new Set<string>()
  const markdownImage = /!\[[^\]\n]*\]\(\s*(<[^>\n]+>|[^\s)]+)(?:\s+[^)]*)?\)/g
  for (const match of content.matchAll(markdownImage)) targets.add(cleanReferenceTarget(match[1]!))

  const writtenPath = /(?:planning[\\/]+reference[\\/]+screenshots[\\/]+|(?:\.{0,2}[\\/]+)?screenshots[\\/]+)[^|\n`<>"')]+?\.(?:avif|bmp|gif|jpe?g|png|svg|tiff?|webp)/gi
  for (const match of content.matchAll(writtenPath)) targets.add(cleanReferenceTarget(match[0]))
  return [...targets].sort()
}

function resolveImageReferences(content: string): ImageReference[] {
  return imageTargets(content).flatMap((source): ImageReference[] => {
    if (/^(?:https?:|data:)/i.test(source)) return []
    let decoded: string
    try {
      decoded = decodeURIComponent(source)
    } catch {
      return [{ source, path: null, problem: 'unsupported' }]
    }
    const portable = decoded.replace(/\\/g, '/')
    if (portable.startsWith('/') || /^[A-Za-z]:\//.test(portable) || portable.startsWith('//')) {
      return [{ source, path: null, problem: 'escaping' }]
    }
    const workspacePath = posix.normalize(portable.startsWith('planning/')
      ? portable
      : posix.join('planning/reference', portable))
    if (workspacePath === '..' || workspacePath.startsWith('../')) {
      return [{ source, path: workspacePath, problem: 'escaping' }]
    }
    if (!supportedImagePath.test(workspacePath) || !commonImageExtension.test(portable)) {
      return [{ source, path: workspacePath, problem: 'unsupported' }]
    }
    return [{ source, path: workspacePath, problem: null }]
  })
}

function uint16BigEndian(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] ?? 0) << 8) | (bytes[offset + 1] ?? 0)
}

function uint32BigEndian(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] ?? 0) * 0x1000000)
    + ((bytes[offset + 1] ?? 0) << 16)
    + ((bytes[offset + 2] ?? 0) << 8)
    + (bytes[offset + 3] ?? 0)
  ) >>> 0
}

function uint32LittleEndian(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] ?? 0)
    + ((bytes[offset + 1] ?? 0) << 8)
    + ((bytes[offset + 2] ?? 0) << 16)
    + ((bytes[offset + 3] ?? 0) * 0x1000000)
  ) >>> 0
}

function asciiAt(bytes: Uint8Array, offset: number, value: string): boolean {
  return [...value].every((character, index) =>
    bytes[offset + index] === character.charCodeAt(0))
}

function crc32(bytes: Uint8Array, start: number, end: number): number {
  let crc = 0xffffffff
  for (let offset = start; offset < end; offset += 1) {
    crc ^= bytes[offset] ?? 0
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function validPng(bytes: Uint8Array): boolean {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (bytes.length < 45 || !signature.every((value, index) => bytes[index] === value)) return false
  let offset = signature.length
  let chunkIndex = 0
  let hasHeader = false
  let hasImageData = false
  while (offset + 12 <= bytes.length) {
    const length = uint32BigEndian(bytes, offset)
    const typeOffset = offset + 4
    const dataOffset = typeOffset + 4
    const dataEnd = dataOffset + length
    const chunkEnd = dataEnd + 4
    if (dataEnd < dataOffset || chunkEnd > bytes.length) return false
    const type = String.fromCharCode(...bytes.subarray(typeOffset, typeOffset + 4))
    if (uint32BigEndian(bytes, dataEnd) !== crc32(bytes, typeOffset, dataEnd)) return false
    if (chunkIndex === 0 && type !== 'IHDR') return false
    if (type === 'IHDR') {
      if (hasHeader || length !== 13) return false
      const width = uint32BigEndian(bytes, dataOffset)
      const height = uint32BigEndian(bytes, dataOffset + 4)
      const bitDepth = bytes[dataOffset + 8] ?? 0
      const colorType = bytes[dataOffset + 9] ?? 0
      const validDepths: Record<number, readonly number[]> = {
        0: [1, 2, 4, 8, 16],
        2: [8, 16],
        3: [1, 2, 4, 8],
        4: [8, 16],
        6: [8, 16]
      }
      if (width === 0 || height === 0
        || !validDepths[colorType]?.includes(bitDepth)
        || bytes[dataOffset + 10] !== 0
        || bytes[dataOffset + 11] !== 0
        || ![0, 1].includes(bytes[dataOffset + 12] ?? -1)) return false
      hasHeader = true
    } else if (type === 'IDAT') {
      if (!hasHeader || length === 0) return false
      hasImageData = true
    } else if (type === 'IEND') {
      return length === 0 && hasHeader && hasImageData && chunkEnd === bytes.length
    }
    offset = chunkEnd
    chunkIndex += 1
  }
  return false
}

function isJpegFrameMarker(marker: number): boolean {
  return (marker >= 0xc0 && marker <= 0xc3)
    || (marker >= 0xc5 && marker <= 0xc7)
    || (marker >= 0xc9 && marker <= 0xcb)
    || (marker >= 0xcd && marker <= 0xcf)
}

function validJpeg(bytes: Uint8Array): boolean {
  if (bytes.length < 14 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return false
  let offset = 2
  let inScan = false
  let hasFrame = false
  let hasScan = false
  let hasImageData = false
  while (offset < bytes.length) {
    if (inScan) {
      if (bytes[offset] !== 0xff) {
        hasImageData = true
        offset += 1
        continue
      }
      const markerStart = offset
      while (offset < bytes.length && bytes[offset] === 0xff) offset += 1
      if (offset >= bytes.length) return false
      const escaped = bytes[offset] ?? 0
      if (escaped === 0x00) {
        hasImageData = true
        offset += 1
        continue
      }
      if (escaped >= 0xd0 && escaped <= 0xd7) {
        offset += 1
        continue
      }
      offset = markerStart
      inScan = false
      continue
    }

    if (bytes[offset] !== 0xff) return false
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1
    if (offset >= bytes.length) return false
    const marker = bytes[offset] ?? 0
    offset += 1
    if (marker === 0xd9) {
      return hasFrame && hasScan && hasImageData && offset === bytes.length
    }
    if (marker === 0x00 || marker === 0xd8) return false
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
    if (offset + 2 > bytes.length) return false
    const segmentLength = uint16BigEndian(bytes, offset)
    if (segmentLength < 2 || offset + segmentLength > bytes.length) return false
    const payloadOffset = offset + 2
    const payloadLength = segmentLength - 2
    const segmentEnd = offset + segmentLength
    if (isJpegFrameMarker(marker)) {
      if (payloadLength < 6) return false
      const components = bytes[payloadOffset + 5] ?? 0
      if (uint16BigEndian(bytes, payloadOffset + 1) === 0
        || uint16BigEndian(bytes, payloadOffset + 3) === 0
        || components === 0
        || payloadLength !== 6 + 3 * components) return false
      hasFrame = true
    }
    if (marker === 0xda) {
      const components = bytes[payloadOffset] ?? 0
      if (!hasFrame || components === 0 || payloadLength !== 4 + 2 * components) return false
      hasScan = true
      inScan = true
    }
    offset = segmentEnd
  }
  return false
}

function validWebp(bytes: Uint8Array): boolean {
  if (bytes.length < 20
    || !asciiAt(bytes, 0, 'RIFF')
    || !asciiAt(bytes, 8, 'WEBP')
    || uint32LittleEndian(bytes, 4) + 8 !== bytes.length) return false
  let offset = 12
  let hasExtendedHeader = false
  let hasImageData = false
  let hasAnimationHeader = false
  while (offset + 8 <= bytes.length) {
    const type = String.fromCharCode(...bytes.subarray(offset, offset + 4))
    const length = uint32LittleEndian(bytes, offset + 4)
    const dataOffset = offset + 8
    const dataEnd = dataOffset + length
    const chunkEnd = dataEnd + (length % 2)
    if (dataEnd < dataOffset || chunkEnd > bytes.length) return false
    if (type === 'VP8 ') {
      if (length < 10
        || (bytes[dataOffset] ?? 1) % 2 !== 0
        || !asciiAt(bytes, dataOffset + 3, String.fromCharCode(0x9d, 0x01, 0x2a))
        || (uint16BigEndian(new Uint8Array([bytes[dataOffset + 7] ?? 0, bytes[dataOffset + 6] ?? 0]), 0) & 0x3fff) === 0
        || (uint16BigEndian(new Uint8Array([bytes[dataOffset + 9] ?? 0, bytes[dataOffset + 8] ?? 0]), 0) & 0x3fff) === 0) return false
      hasImageData = true
    } else if (type === 'VP8L') {
      if (length < 5 || bytes[dataOffset] !== 0x2f || ((bytes[dataOffset + 4] ?? 0) >> 5) !== 0) return false
      hasImageData = true
    } else if (type === 'VP8X') {
      if (hasExtendedHeader || length !== 10
        || ((bytes[dataOffset] ?? 0) & 0xc1) !== 0
        || bytes[dataOffset + 1] !== 0
        || bytes[dataOffset + 2] !== 0
        || bytes[dataOffset + 3] !== 0) return false
      hasExtendedHeader = true
    } else if (type === 'ANIM') {
      if (!hasExtendedHeader || length !== 6) return false
      hasAnimationHeader = true
    } else if (type === 'ANMF') {
      if (!hasExtendedHeader || !hasAnimationHeader || length < 16) return false
      hasImageData = true
    }
    offset = chunkEnd
  }
  return offset === bytes.length && hasImageData
}

function imageBytesMatchPath(path: string, bytes: Uint8Array): boolean {
  const lowerPath = path.toLowerCase()
  if (lowerPath.endsWith('.png')) return validPng(bytes)
  if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) return validJpeg(bytes)
  if (lowerPath.endsWith('.webp')) return validWebp(bytes)
  return false
}

async function safeEntry(root: string, workspacePath: string): Promise<SafeEntry | SafeEntryFailure> {
  const segments = workspacePath.split('/').filter(Boolean)
  let candidate = root
  try {
    for (let index = 0; index < segments.length; index += 1) {
      candidate = resolve(candidate, segments[index]!)
      if (!contained(root, candidate)) return { code: 'escaping' }
      const info = await lstat(candidate)
      if (info.isSymbolicLink()) return { code: 'symlink' }
      if (index < segments.length - 1 && !info.isDirectory()) return { code: 'missing' }
      if (index === segments.length - 1) {
        const canonical = await realpath(candidate)
        if (!contained(root, canonical)) return { code: 'escaping' }
        return { absolutePath: canonical, info }
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { code: 'missing' }
    return { code: 'escaping' }
  }
  return { code: 'missing' }
}

async function inspectTextArtifact(
  root: string,
  path: string,
  observedAt: string
): Promise<{ artifact: TextArtifact } | { issue: PortfolioPlanningIssue }> {
  const stageId = stageForPath(path)
  const entry = await safeEntry(root, path)
  if ('code' in entry) {
    const messages = {
      missing: 'Chưa có tài liệu bắt buộc.',
      symlink: 'Tài liệu hoặc một thư mục cha không được là symlink.',
      escaping: 'Không thể đọc tài liệu an toàn bên trong portfolio workspace.'
    }
    return { issue: issue(stageId, path, entry.code, messages[entry.code]) }
  }
  if (!entry.info.isFile()) {
    return { issue: issue(stageId, path, 'directory', 'Đường dẫn tài liệu bắt buộc phải là tệp Markdown thông thường.') }
  }
  if (entry.info.size === 0) {
    return { issue: issue(stageId, path, 'empty', 'Tài liệu bắt buộc đang trống.') }
  }
  if (entry.info.size > maximumTextBytes) {
    return { issue: issue(stageId, path, 'oversized', 'Tài liệu vượt giới hạn 128 KiB.') }
  }
  const bytes = await readFile(entry.absolutePath)
  let content: string
  try {
    content = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return { issue: issue(stageId, path, 'invalid-utf8', 'Tài liệu không phải UTF-8 hợp lệ.') }
  }
  return {
    artifact: {
      path,
      content,
      digest: sha256(bytes),
      byteLength: bytes.byteLength,
      modifiedAt: entry.info.mtime.toISOString(),
      observedAt
    }
  }
}

async function inspectImageArtifact(
  root: string,
  path: string,
  observedAt: string
): Promise<{ artifact: PortfolioPlanningArtifactSnapshot } | { issue: PortfolioPlanningIssue }> {
  const entry = await safeEntry(root, path)
  if ('code' in entry) {
    if (entry.code === 'missing') {
      return { issue: issue('visual-reference', path, 'missing-reference-screenshot', 'Ảnh được tài liệu tham chiếu nhưng không tồn tại.') }
    }
    return {
      issue: issue(
        'visual-reference',
        path,
        entry.code,
        entry.code === 'symlink'
          ? 'Ảnh hoặc một thư mục cha không được là symlink.'
          : 'Ảnh tham chiếu thoát khỏi portfolio workspace.'
      )
    }
  }
  if (!entry.info.isFile()) {
    return { issue: issue('visual-reference', path, 'directory', 'Đường dẫn ảnh tham chiếu phải là tệp thông thường.') }
  }
  if (entry.info.size === 0) {
    return { issue: issue('visual-reference', path, 'empty', 'Ảnh tham chiếu đang trống.') }
  }
  if (entry.info.size > maximumImageBytes) {
    return { issue: issue('visual-reference', path, 'oversized', 'Ảnh tham chiếu vượt giới hạn 12 MiB.') }
  }
  const bytes = await readFile(entry.absolutePath)
  if (!imageBytesMatchPath(path, bytes)) {
    return {
      issue: issue(
        'visual-reference',
        path,
        'invalid-evidence-label',
        'Nội dung tệp ảnh không khớp định dạng PNG, JPEG hoặc WebP theo phần mở rộng.'
      )
    }
  }
  return {
    artifact: {
      path,
      digest: sha256(bytes),
      byteLength: bytes.byteLength,
      modifiedAt: entry.info.mtime.toISOString(),
      observedAt
    }
  }
}

async function validateAllowedLegacyArtifacts(
  root: string,
  allowedLegacy: ReadonlySet<string>,
  issues: PortfolioPlanningIssue[]
): Promise<void> {
  for (const path of [...allowedLegacy].sort()) {
    const entry = await safeEntry(root, path)
    if ('code' in entry) {
      if (entry.code === 'missing') continue
      issues.push(issue(
        'implementation-contract',
        path,
        entry.code,
        entry.code === 'symlink'
          ? 'Tài liệu cũ được cho phép không được là symlink.'
          : 'Tài liệu cũ được cho phép phải nằm trong portfolio workspace.'
      ))
      continue
    }
    if (!entry.info.isFile()) {
      issues.push(issue(
        'implementation-contract',
        path,
        'directory',
        'Đường dẫn tài liệu cũ được cho phép phải là tệp thông thường.'
      ))
    }
  }
}

async function scanWorkspace(
  root: string,
  referencedImages: ReadonlySet<string>,
  allowedLegacy: ReadonlySet<string>,
  issues: PortfolioPlanningIssue[]
): Promise<string[]> {
  const expectedFiles = new Set<string>([...portfolioPackageArtifactPaths, portfolioAgentsFileName])
  const unexpected = new Set<string>()
  let visitedEntries = 0
  let exhausted = false

  const visit = async (relativeDirectory: string): Promise<void> => {
    if (exhausted) return
    const entries = []
    const directory = await opendir(resolve(root, relativeDirectory))
    for await (const entry of directory) {
      if (entry.name === '.DS_Store' && entry.isFile()) continue
      if (visitedEntries >= maximumWorkspaceEntries) {
        const limitPath = relativeDirectory
          ? `${relativeDirectory}/<workspace-entry-limit>`
          : '<workspace-entry-limit>'
        unexpected.add(limitPath)
        issues.push(issue(
          stageForPath(relativeDirectory),
          limitPath,
          'unexpected-workspace-change',
          'Workspace vượt giới hạn kiểm tra 500 mục; không thể xác nhận toàn bộ phạm vi.'
        ))
        exhausted = true
        break
      }
      visitedEntries += 1
      entries.push(entry)
    }
    entries.sort((left, right) => left.name.localeCompare(right.name, 'en'))
    for (const entry of entries) {
      const path = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name
      if (entry.isSymbolicLink()) {
        unexpected.add(path)
        continue
      }
      if (entry.isDirectory()) {
        if (path === '.git') continue
        if (allowedDirectories.has(path) && !exhausted) await visit(path)
        else unexpected.add(path)
        continue
      }
      if (!entry.isFile()
        || (!expectedFiles.has(path) && !referencedImages.has(path) && !allowedLegacy.has(path))) {
        unexpected.add(path)
      }
    }
  }

  try {
    await visit('')
  } catch {
    issues.push(issue(
      'portfolio-brief',
      'planning',
      'missing',
      'Không thể kiểm tra an toàn cấu trúc portfolio workspace.'
    ))
  }
  return [...unexpected].sort()
}

function sortedIssues(issues: readonly PortfolioPlanningIssue[]): PortfolioPlanningIssue[] {
  const unique = new Map<string, PortfolioPlanningIssue>()
  for (const item of issues) {
    unique.set(`${item.stageId}\0${item.path}\0${item.code}\0${item.message}`, item)
  }
  return [...unique.values()].sort((left, right) =>
    `${left.stageId}\0${left.path}\0${left.code}\0${left.message}`
      .localeCompare(`${right.stageId}\0${right.path}\0${right.code}\0${right.message}`, 'en'))
}

export async function collectPortfolioPackage(
  context: PortfolioPackageContext,
  now: () => Date = () => new Date()
): Promise<PracticeAdapterEvidenceState> {
  const observedAt = now().toISOString()
  const canonicalRoot = await realpath(resolve(context.workspaceRoot))
  const artifacts = new Map<string, TextArtifact>()
  let issues: PortfolioPlanningIssue[] = []

  for (const path of portfolioPackageArtifactPaths) {
    const inspected = await inspectTextArtifact(canonicalRoot, path, observedAt)
    if ('issue' in inspected) issues.push(inspected.issue)
    else artifacts.set(path, inspected.artifact)
  }
  for (const artifact of artifacts.values()) issues.push(...structuralDocumentIssues(artifact))
  issues.push(...requirementIssues(artifacts), ...planSectionIssues(artifacts))

  const reference = artifacts.get('planning/reference/reference.md')
  const imageReferences = reference ? resolveImageReferences(reference.content) : []
  for (const reference of imageReferences.filter((item) => item.problem !== null)) {
    issues.push(issue(
      'visual-reference',
      reference.source,
      reference.problem === 'escaping' ? 'escaping' : 'missing-reference-screenshot',
      reference.problem === 'escaping'
        ? 'Đường dẫn ảnh được tham chiếu thoát khỏi portfolio workspace.'
        : 'Đường dẫn ảnh được tham chiếu không dùng định dạng hoặc vị trí được hỗ trợ.'
    ))
  }
  const referencedImagePaths = new Set(imageReferences.flatMap((reference) =>
    reference.problem === null && reference.path ? [reference.path] : []))
  const imageArtifacts: PortfolioPlanningArtifactSnapshot[] = []
  for (const path of [...referencedImagePaths].sort()) {
    const inspected = await inspectImageArtifact(canonicalRoot, path, observedAt)
    if ('issue' in inspected) issues.push(inspected.issue)
    else imageArtifacts.push(inspected.artifact)
  }

  // The earlier interview prompt produced this combined plan. Preserve it as
  // background notes; it never substitutes for or enters the five-file review.
  const allowedLegacy = new Set([
    'planning/portfolio-plan.md',
    ...(context.allowedLegacyArtifactPaths ?? []).filter((path) => legacyArtifactPaths.has(path))
  ])
  await validateAllowedLegacyArtifacts(canonicalRoot, allowedLegacy, issues)
  const unexpectedPaths = await scanWorkspace(canonicalRoot, referencedImagePaths, allowedLegacy, issues)
  for (const path of unexpectedPaths) {
    issues.push(issue(
      stageForPath(path),
      path,
      'unexpected-workspace-change',
      'Đường dẫn nằm ngoài phạm vi bằng chứng được phép của Practice.'
    ))
  }

  issues = sortedIssues(issues)
  const snapshots: PortfolioPlanningArtifactSnapshot[] = [
    ...artifacts.values(),
    ...imageArtifacts
  ].sort((left, right) => left.path.localeCompare(right.path, 'en'))
  const stageEvidence: PortfolioPlanningStageEvidence[] = stageDescriptors.map((stage) => {
    const stageArtifacts = snapshots.filter((artifact) =>
      artifact.path === stage.path
      || (stage.stageId === 'visual-reference' && referencedImagePaths.has(artifact.path)))
    const stageIssues = issues.filter((item) => item.stageId === stage.stageId)
    const artifactDigests = Object.fromEntries(stageArtifacts.map((artifact) => [artifact.path, artifact.digest]))
    return {
      stageId: stage.stageId,
      stageIndex: stage.stageIndex,
      status: stageIssues.length === 0 && artifactDigests[stage.path] ? 'ready' : 'blocked',
      artifactDigests,
      executorReportedChecks: [],
      corroboratedArtifacts: { ...artifactDigests },
      issueCodes: [...new Set(stageIssues.map((item) => item.code))]
    }
  })
  const steps: PracticeAdapterStepState[] = stageEvidence.map((stage) => ({
    stepId: stage.stageId,
    status: stage.status === 'ready' ? 'completed' : 'current',
    dependencyInputs: {}
  }))
  const evidence: PracticeEvidenceReference[] = [
    ...snapshots.map((artifact) => ({
      id: `portfolio-package-artifact-${sha256(artifact.path).slice(0, 12)}`,
      kind: 'planning-artifact' as const,
      text: artifact.content === undefined
        ? `${artifact.path} | sha256=${artifact.digest} | bytes=${artifact.byteLength} | referenced-by=planning/reference/reference.md | source-metadata-in=reference-document`
        : `${artifact.path} | sha256=${artifact.digest} | bytes=${artifact.byteLength}`,
      freshness: 'fresh' as const
    })),
    {
      id: 'portfolio-package-workspace-scope',
      kind: 'workspace-confirmed-change',
      text: `Đã kiểm tra độc lập phạm vi workspace: tài liệu bắt buộc=${artifacts.size}/5; ảnh được tham chiếu=${referencedImagePaths.size}; đường dẫn ngoài phạm vi=${unexpectedPaths.length}.`,
      freshness: 'fresh'
    }
  ]
  const sourceDigest = sha256(JSON.stringify({
    artifacts: snapshots.map(({ path, digest, byteLength }) => ({ path, digest, byteLength })),
    issues: issues.map(({ stageId, path, code, message }) => ({ stageId, path, code, message })),
    unexpectedPaths
  }))

  return {
    schemaVersion: 1,
    practiceId: context.definition.practiceId,
    practiceVersion: context.definition.version,
    runId: context.runId,
    evidenceProfile: 'portfolio-planning',
    observedAt,
    freshness: issues.length === 0 ? 'fresh' : 'unverifiable',
    sourceDigest,
    evidence,
    steps,
    invalidations: [],
    portfolioPlanning: {
      schemaVersion: 1,
      workspaceIdentityDigest: practiceWorkspaceIdentityDigest(canonicalRoot),
      artifacts: snapshots,
      issues,
      unexpectedPaths,
      stages: stageEvidence
    }
  }
}
