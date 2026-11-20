# Portfolio React baseline — 20 November 2026

- **Status:** Owner approved the wording on 20 November 2026. The Phase 2
  rehearsal passed, Phase 3 applied changes 1–5, and Phase 4 added the
  Module 3 Node.js and Git check (see below).
- **Decision owner:** course owner.
- **Applies to:** the learner portfolio built in Modules 2–4.

## Decision

Every learner portfolio uses one course-chosen stack: **React, TypeScript and
Vite**, kept lean. Learners do not choose or compare technology. The course
states the stack from the start of Module 2, the implementation plan records
it, and Module 3 builds with it.

The owner approved this direction on 20 November 2026 after comparing plain
HTML/CSS, React + TypeScript + Vite and Astro. Reasons:

- The owner already supports React, TypeScript and Vite, so learner build
  problems can be diagnosed quickly.
- The 16 August Vercel rehearsal already passed with this stack, and M3.2
  already describes this scaffold.
- Codex is highly fluent in it, and Course Companion uses the same stack.
- It supports richer portfolio interaction later (animation, case-study views,
  small interactive demos) without a rewrite.

No learner progress needs migration. The owner is the only current user.

## Why Codex currently builds plain HTML

The portfolio `AGENTS.md` that Course Companion writes when the learner picks a
folder (`course-companion/shared/portfolio-agents-template.ts`) tells Codex not
to choose technology in Module 2 (line 111) and to choose its own tools in
Module 3 (line 117). The only design file Codex receives is
`planning/reference/design-prototype.html`, so it plans and builds static
HTML/CSS. `portfolio-build-instructions.ts` calls React/TS/Vite a non-binding
default, and the Module 3 review explicitly accepts static HTML.

## Lean baseline

| Area | Rule |
|---|---|
| Core | Vite + React + TypeScript with `strict` enabled. |
| Styling | Carry over the HTML prototype's CSS. Tailwind or UI libraries only with learner approval. |
| Content | One typed content file (for example `src/content/portfolio.ts`). |
| Pages | Single page by default. Separate project pages (React Router plus a Vercel rewrite in Module 4) only when the PRD requires them and the learner agrees. |
| Sharing | `index.html` contains the page title, description and Open Graph tags. |
| Scripts | `dev`, `typecheck`, `lint` (ESLint), `build`, `preview`; `npm run check` runs typecheck, lint and build in that order. |
| Excluded | No server packages, AI SDKs, API keys or secret environment variables in browser code. |
| Optional | Animation or icon libraries only when the PRD needs them and the learner agrees. |

Do not use `Portfolio-SMU` as the template. It carries unused AI Studio
dependencies (`@google/genai`, `express`, `dotenv`, `tsx`), injects
`GEMINI_API_KEY` through `vite.config.ts`, lacks description and Open Graph
tags, and its `lint` script only runs `tsc`.

## Proposed wording changes

Each change shows the current text and the proposed text. Copy outside these
lines stays verbatim.

### 1. Portfolio `AGENTS.md` template — new section

File: `course-companion/shared/portfolio-agents-template.ts`. Insert after the
"Tài liệu và dữ liệu" section and before "Module 2: gói kế hoạch".

Current: none.

Proposed:

```markdown
## Nền kỹ thuật của portfolio

Khóa học đã chọn sẵn nền kỹ thuật cho portfolio, nên người học không cần chọn hay so sánh công nghệ. Module 2 chỉ ghi nền này vào implementation plan. Module 3 mới tạo ứng dụng.

- Dùng React, TypeScript và Vite. Bật chế độ kiểm tra chặt `strict` của TypeScript.
- Giữ CSS của bản mẫu HTML ở bước 3 khi chuyển giao diện sang React. Chỉ thêm Tailwind hay thư viện giao diện khác khi người học đồng ý.
- Đặt nội dung portfolio trong một tệp dữ liệu có kiểu, ví dụ `src/content/portfolio.ts`.
- Portfolio là một trang. Chỉ tạo trang riêng cho từng dự án khi PRD yêu cầu và người học đồng ý.
- Trong `index.html`, ghi tiêu đề trang, mô tả và thẻ Open Graph để đường link hiện đúng khi chia sẻ.
- Tạo các lệnh `dev`, `typecheck`, `lint`, `build` và `preview`. Lệnh `npm run check` chạy lần lượt typecheck, lint và build.
- Không đưa máy chủ, thư viện gọi AI, khóa API hay biến môi trường bí mật vào mã chạy trên trình duyệt.
- Chỉ thêm thư viện hiệu ứng chuyển động hoặc biểu tượng khi PRD cần và người học đồng ý.
```

### 2. Portfolio `AGENTS.md` template — Module 2, step 5

Current (line 111):

```markdown
- Không chọn công nghệ và không tạo ứng dụng; việc đó thuộc Module 3.
```

Proposed:

```markdown
- Ghi một mục ngắn "Nền kỹ thuật" theo mục "Nền kỹ thuật của portfolio" ở trên. Không hỏi người học chọn công nghệ và không tạo ứng dụng; việc tạo ứng dụng thuộc Module 3.
```

Line 51 stays unchanged: technology the learner mentions still goes to the PRD's
"Để sau" section.

### 3. Portfolio `AGENTS.md` template — Module 3

Current (line 117):

```markdown
- Chọn công cụ và lệnh kiểm tra phù hợp với dự án.
```

Proposed:

```markdown
- Tạo ứng dụng theo mục "Nền kỹ thuật của portfolio" và dùng `npm run check` để kiểm tra kỹ thuật. Nếu implementation plan ghi nền kỹ thuật khác, báo cho người học và đề xuất làm theo nền của khóa học trước khi tạo ứng dụng.
```

Line 116 stays unchanged: the HTML prototype remains the layout reference.

### 4. Module 3 build instruction, sentence 5

File: `course-companion/electron/main/portfolio-build-instructions.ts`.

Current:

```text
Dùng nền kỹ thuật phù hợp với kế hoạch đã duyệt; React, TypeScript và Vite là lựa chọn mặc định, không phải khuôn mẫu bắt buộc. Chuẩn bị cách chạy, xem và kiểm tra ứng dụng; lệnh có thể mang tên hoặc cách ghép khác nhau miễn thực hiện đủ kiểm tra cần thiết. Với ứng dụng dùng TypeScript hoặc bước build, chạy kiểm tra kiểu và build phù hợp; không thêm công cụ chỉ để khớp tên lệnh. Kiểm tra desktop/mobile theo plan; nếu plan chưa nêu, dùng 1440 × 900 và 390 × 844. Kiểm tra nội dung, link, bàn phím/focus, cuộn ngang và console; ghi kết quả thực tế. Không thêm backend, dịch vụ xử lý dữ liệu hoặc triển khai trong Module 3.
```

Proposed:

```text
Dùng nền kỹ thuật trong AGENTS.md của portfolio: React, TypeScript và Vite. Chuẩn bị cách chạy, xem và kiểm tra ứng dụng; npm run check chạy lần lượt kiểm tra kiểu, lint và build. Kiểm tra desktop/mobile theo plan; nếu plan chưa nêu, dùng 1440 × 900 và 390 × 844. Kiểm tra nội dung, link, bàn phím/focus, cuộn ngang và console; ghi kết quả thực tế. Không thêm backend, dịch vụ xử lý dữ liệu hoặc triển khai trong Module 3.
```

The other five sentences stay verbatim.

### 5. Module 3 review criteria

File: `pilot-workspace/course/practices/m3-portfolio-build.json`. These are
English instructions for the AI reviewer, not learner copy. Because Codex now
has a clear rule, the review checks the stack instead of accepting any toolchain.

`technical-checks-acceptance` assertion, current:

```text
Require appropriate checks on the submitted project, with results. Static HTML is acceptable.
```

Proposed:

```text
Require the course baseline (React, TypeScript and Vite) and a current npm run check result covering typecheck, lint and build on the submitted source.
```

`final-validation-current` assertion, replace only this parenthetical. Current:

```text
(equivalent command names, composition and tooling are acceptable; do not impose a Node toolchain on a static site)
```

Proposed:

```text
(use the course React, TypeScript and Vite baseline; equivalent script names are acceptable when they run typecheck, lint and build)
```

If the owner prefers to keep accepting static HTML in review, skip change 5 and
apply only changes 1–4.

## Not changing

- The Module 2 HTML prototype step and its review criterion.
- Module 2 objective, expected outcome and the rule that Module 2 creates no
  application or dependencies.
- Learner-facing scenes, copy prompts and Teacher dialogue.
- Module 4 Practice and its Vercel flow. A Vite build deploys with Vercel's
  Vite preset; a rewrite is only needed if project pages are added.
- The historical v1 scaffold check in `portfolio-build-evidence-adapter.ts`.
- Existing portfolio folders: the template never overwrites an existing
  `AGENTS.md`, so testing needs a fresh folder.

## Open items

- **Node prerequisite (Phase 4).** No course material asks the learner to
  install Node.js, and current Vite needs Node 20.19+ or 22.12+. Decide whether
  Module 1 setup installs it or Module 3 checks and guides first.
- **Practice version.** Changing Module 3 criteria normally bumps
  `m3-portfolio-build` from 2.1.0. Check `isPortfolioBuildPackageVersion` and
  pinned tests before choosing the new version in Phase 3.

## Phase 2 rehearsal result — 20 November 2026

**Setup.** Disposable folder
`tmp/react-baseline-rehearsal-2026-11-20/portfolio/` with its own Git
repository (not part of the course repository). It held:

- an `AGENTS.md` generated from the current template with changes 1–3 applied;
- a fictional, concept-labelled Module 2 package: five planning documents whose
  implementation plan names the stack, and a multi-section HTML prototype.

The prompt was the Module 3 copy prompt plus the continuation instructions,
with change 4 applied. It was run once with
`codex exec -s workspace-write` and network access, using the owner's default
Codex model settings.

**Result: passed.**

| Check | Evidence |
|---|---|
| Stack without extra prompting | Codex created React 19, TypeScript 5.9 (`strict: true`) and Vite 7.3 in one pass, about 3 minutes. No Tailwind, router, animation or server packages. |
| `npm run check` | Re-run independently: typecheck, ESLint (`--max-warnings=0`) and build all passed. |
| Sharing tags | Built `dist/index.html` has title, description, `og:title`, `og:description`, `og:type` and `og:locale`. |
| Prototype fidelity | Same section and heading order, the same three labels and identical colour values. 1440 × 900: three-column project grid as in the prototype. 390 × 844: single column. No horizontal overflow at either size. |
| Links | Navigation anchors, `mailto:` and LinkedIn in a new tab with `noopener noreferrer`. |
| Scope | Planning documents and `AGENTS.md` unchanged. Codex wrote the three Module 3 records and did not commit, because the learner had not accepted the build. |
| Cost | 76 MB `node_modules`, 0 audit vulnerabilities, 71 kB gzipped JavaScript. |

**Observations.**

- The rehearsal `AGENTS.md` still required a `kind: 'real-work' | 'concept'`
  field, and Codex added it. The owner removed that requirement afterwards, so
  it is no longer part of the baseline or change 1.

- Codex fixed a prototype flaw: on narrow screens the prototype's hero had no
  side margin; the React version kept the 24 px margin. This is an improvement,
  not drift.
- Codex installed packages without asking first. The current Module 3 rules
  allow building in one pass, and the desktop app may still ask the learner to
  allow network access.
- The page is blank with JavaScript turned off. This is expected for a
  single-page React app and is not a PRD requirement.
- The dev server stopped when `codex exec` ended, so the link Codex reported
  was not reachable afterwards. In the desktop app the task keeps running; that
  was not tested here.

**Not proven.** One run with one fictional learner does not measure Codex
variation. It does not cover the Codex desktop app and its approval prompts, a
machine without Node.js, Triết's Module 3 review, or real learner content.

## Phase 3 applied — 20 November 2026

Changes 1–5 are applied as worded above. Two additional decisions:

- **Reviewer prompt.** `electron/main/practice-review-context.ts` told the
  Module 3 reviewer that "framework choices" were acceptable, which contradicted
  change 5. With owner approval, only those two words were removed; the rest of
  that line is unchanged.
- **No Practice version bump.** `m3-portfolio-build` stays at 2.1.0. The
  version gates task continuity and the reviewer prompt, and there are no
  learner runs to invalidate.

`tests/practice-start-prompt.test.ts` now checks the new instruction, the new
`AGENTS.md` section and its heading order, and the updated criteria.

Verification:

- Typecheck, lint, build and the focused tests passed.
- The full unit suite had 807 passes and 92 failures. Without these changes
  (files stashed), it had the same 92 failures and 806 passes. The extra pass
  is the new test, so none of the 92 failures come from this change.
- The Electron smoke stopped at the Module 1 Skills screen. That is an existing
  failure recorded earlier in the ledger, and it stops before Modules 2–3.
- The Teacher chat, Practice guide and review feedback Electron scripts all
  passed.

## Phase 4 applied — 20 November 2026

The owner chose a just-in-time check at the start of Module 3 instead of
changing the frozen Module 1 setup or adding an app screen. The Module 3 section
of the portfolio `AGENTS.md` template now begins its build rules with:

```markdown
- Trước khi tạo ứng dụng, kiểm tra máy đã có Node.js 22.12 trở lên và Git. Nếu thiếu hoặc quá cũ, dừng lại, giải thích ngắn vì sao cần, hướng dẫn người học tải bản cài đặt chính thức theo hệ điều hành của họ, rồi chờ người học cài xong. Không tự tải hay chạy tệp cài đặt thay người học.
```

The root `README.md` already lists Git and Node.js 22 or newer under "Trước
khi bắt đầu", because the course launcher (`scripts/setup-core.mjs`) needs them,
so it was not changed. Most learners will already have both tools. The Module 3
check is a safety net for a missing tool, a shell that cannot find Node.js, or
Node.js 22.0–22.11, which the launcher accepts but current Vite rejects.

Verification: typecheck, lint, build and the focused tests passed. The full
unit suite had the same 92 failures as the baseline, with 807 passes. The
Teacher chat, Practice guide and review feedback Electron scripts passed. A
machine without Node.js or Git has not been tested.

## Next phases

1. **Phase 2 — internal rehearsal.** In a disposable `tmp/` folder, use the
   drafted `AGENTS.md` and a pre-written Module 2 package whose plan names the
   stack, then run the Module 3 prompt with `codex exec` under the learner
   sandbox. Accept when Codex uses the baseline without extra prompting,
   `npm run check` passes, the site matches the prototype at 1440 × 900 and
   390 × 844, and the meta tags are present. Nothing is committed or
   published.
2. **Phase 3 — apply changes 1–5** with pinned-test updates and the full
   Course Companion verification (typecheck, lint, tests, build, Electron).
3. **Phase 4 — Node prerequisite decision.**
