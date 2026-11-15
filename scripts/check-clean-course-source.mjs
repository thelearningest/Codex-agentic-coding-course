#!/usr/bin/env node
// Run after staging and before committing/pushing. No dependencies or file edits.
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', windowsHide: true })
const root = git('rev-parse', '--show-toplevel').trim()
process.chdir(root)
const paths = git('ls-files', '--cached', '-z').split('\0').filter(Boolean)
const cleanExample = 'pilot-workspace/.course/learner-state.example.json'
const sourceDocuments = new Set([cleanExample,
  'prototypes/mvp-0.5-pedagogy-kernel/schemas/learner-state.schema.json'])
const localDirectories = /(^|\/)(?:node_modules|\.superpowers|\.worktrees|\.practice-test-artifacts)(\/|$)/
const temporaryProfiles = /(^|\/)(?:readme-course-demo-|course-companion-electron-|course-teacher-chat-|practice-guide-electron-|portfolio-package-electron-)[^/]*(\/|$)/
const runtimeState = /^(?:learner-state|practice-runs|practice-guide-state|teacher-memory|executor-activity|portfolio-workspaces|companion-state)(?:\.[\w-]+)?\.json(?:\.tmp.*)?$|^(?:teacher-chat|activity-log)(?:\.[\w-]+)?\.jsonl(?:\.tmp.*)?$/i
const learnerOutputs = /^pilot-workspace\/artifacts\/(?:quest-card|codex-setup-checklist|module-1-evidence|PRD|implementation-plan)\.md$/
const forbidden = paths.filter(path => {
  if (sourceDocuments.has(path)) return false
  return localDirectories.test(path) || temporaryProfiles.test(path)
    || /(^|\/)\.course\//.test(path)
    || path.startsWith('course-companion/out/')
    || runtimeState.test(path.split('/').at(-1))
    || learnerOutputs.test(path)
})

if (paths.includes(cleanExample)) {
  const example = JSON.parse(git('show', `:${cleanExample}`))
  if (example.currentLessonId !== 'intro'
    || example.currentBeatId !== 'intro-visual-onboarding'
    || example.completedLessonIds?.length !== 0
    || example.completedCheckpoints?.length !== 0
    || example.updatedAt !== null) forbidden.push(`${cleanExample} (must remain a clean introduction template)`)
}

if (forbidden.length) {
  console.error('Course source contains private learner state or temporary test data:')
  for (const path of forbidden) console.error(`- ${path}`)
  console.error('Unstage/untrack these files while preserving local learner data; keep real test fixtures explicitly named.')
  process.exitCode = 1
} else {
  console.log(`Clean course source: ${paths.length} indexed files checked; no private learner state or temporary profiles.`)
  console.log(`Repository: ${resolve(root)}`)
}
