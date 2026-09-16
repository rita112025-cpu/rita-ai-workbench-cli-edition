# Rita AI Workbench CLI — Work Log

Shared worklog for all agents on this task.

---
Task ID: 1-6 (core engine)
Agent: main (Z.ai Code)
Task: Build a CLI-first "Rita AI Workbench" terminal OS in the browser, sourced from the real `rita112025-cpu/rita-ai-workbench` repo.

Work Log:
- Cloned https://github.com/rita112025-cpu/rita-ai-workbench.git (depth 1) into /tmp/rita-repo to bypass GitHub API rate limit.
- Read README.md, app.js (the `tools` array — 43 entries), research/scrapling/README.md, research/agent-reach/README.md.
- Created canonical manifest at src/data/workbench-manifest.ts with all 43 projects verbatim from app.js, plus provenance `_meta` (source / sourceVerified / githubLinkVerified / demoLinkVerified / lastCheckedAt). GitHub/Demo URLs use `null` when missing — never "" or "#".
- Created research manifest at src/data/research-manifest.ts with scrapling + agent-reach (summary + sourcePath + contentType:"summary").
- Created content/*.md.ts modules holding verbatim README excerpts (as TS strings to avoid markdown-loader config).
- Built pure, DOM-free core under src/core/:
  - vfs/permissions.ts   — read-only vs writable split, enforced at VFS layer
  - vfs/storage.ts       — localStorage-backed /home/rita tree
  - vfs/build-vfs.ts     — readPath/mkdir/rm/writeFile/isDir; read-only content generated FROM manifest at runtime
  - resolver/resolve-path.ts     — traversal-safe path normalization (handles ../../, %2e%2e%2f, ..\..\)
  - resolver/resolve-project.ts  — single project/research lookup entry point
  - resolver/resolve-target.ts   — OPEN_URL action resolution, arbitrary URLs always denied
  - commands/types.ts            — unified CommandResult schema (output/error/nextState/action, never HTML)
  - commands/parse-command.ts    — deterministic tokenizer (whitespace + quote handling)
  - commands/execute-command.ts  — single dispatcher; all commands route through shared resolvers
- Commands: help ls cd pwd cat clear projects skills workflows research search demo github open run status logs history whoami neofetch theme crt sound mkdir rm about
- `run <id>` returns executable:false + availableActions; never simulates API calls/analysis/deployments/tests.
- `demo/github/open` return OPEN_URL actions taken ONLY from the manifest allowlist; raw http/javascript/file/data URLs are rejected with URL_NOT_ALLOWED.
- mkdir/rm reject read-only areas at the VFS layer with READ_ONLY_FILESYSTEM.
- Wrote verification harness src/core/tests/verify.ts covering 39 invariants (21 required + 6 bonus + extras).

Stage Summary:
- ALL 39 CORE INVARIANTS PASS (bun run verify:core).
- Engine is DOM-free and reusable (could back Web Terminal / Electron / Tauri / a real backend shell).
- No fabricated data, no arbitrary URL execution, no real filesystem mutation, manifest immutable across write attempts.
- Provenance honest: githubLinkVerified/demoLinkVerified = false (links NOT yet live-checked). A separate link-verification phase must flip these.
- Architecture: manifest → research manifest → VFS → shared resolver → command engine → (next: Terminal UI).
- Verified content (43 projects + 2 research sub-projects) sourced from the cloned repo, not invented.

---
Task ID: 7-9 (UI + verification)
Agent: main (Z.ai Code)
Task: Build Terminal UI rendering structured CommandResult output; run final verification (core, lint, tsc, dev HTML, browser E2E golden path + safety + responsive + persistence, link verification).

Work Log:
- Refactored Terminal.tsx: ghost completion → useMemo (derived state, removed setGhost); boot banner → useState lazy initializer (no mount effect); theme/crt/sound → single `prefs` state object with one scoped eslint-disable for hydration.
- OutputRenderer renders structured OutputLine[] as JSX text nodes — no dangerouslySetInnerHTML in any Rita Workbench code (the 1 match is a doc comment; the other is the pre-existing shadcn chart.tsx, unused here).
- window.open is gated exclusively behind `result.action.type === "OPEN_URL"`, which is produced only by resolveProjectLink from the manifest allowlist.
- Verified all gates: lint PASS (0 problems), core invariants 39/39 PASS, TypeScript 0 src errors.
- Dev server (pid 6920) returns HTTP 200 with terminal markup (term-page, term-root, "Rita AI Workbench", "System ready", term-topbar).
- Browser E2E (Agent Browser via preview host) — ALL PASS:
  * Page renders: title "Rita AI Workbench — CLI Edition", topbar, boot banner, term-root ✓
  * Golden path: projects (shows prompt-library/yijing), help pager (q to exit), cat projects/yijing/README.md (易經 content), cat /research/scrapling/README.md (Scrapling), search revit (hit), neofetch (GitHub Pages), cd /projects + ls, whoami (rita) ✓
  * run yijing: shows "executable" field, NO fabricated ✓Running/Connected/Analysis complete ✓
  * Safety: demo javascript:alert(1) → URL_NOT_ALLOWED; open https://evil.example → URL_NOT_ALLOWED; rm /projects → READ_ONLY_FILESYSTEM; mkdir /system/foo → READ_ONLY_FILESYSTEM ✓
  * Tab completion: type 'proj' → ghost 'ects' → Tab → 'projects' ✓
  * History: ↑ navigates to previous commands ✓
  * VFS writable: mkdir/rm /home/rita/test works; dirs persist+list ✓
  * Malformed localStorage → graceful fallback, no white screen ✓
  * Persistence: theme green + crt off survive reload (data-theme/data-crt attrs + localStorage) ✓
  * demo yijing opens real new tab to rita112025-cpu.github.io/yijing/ ✓
  * Theme switch white→amber works ✓
  * Responsive: 320/390/768/1280px all NO horizontal overflow; 7 chips + footer visible at 320px ✓
  * Console: clean (only HMR + React DevTools info); 0 page errors ✓
- Link verification (scripts/verify-links.ts, reads manifest URLs only):
  * GitHub URLs: 43 PASS / 0 FAIL / 0 N/A (all HTTP 200)
  * Demo URLs: 29 PASS / 0 FAIL / 14 N/A (14 projects have links.demo === null — correctly represented, not failures)
- No project status changed due to link results (status stays as the repo's original value).

Stage Summary:
- All V1 verification items actually ran and passed.
- Production build NOT run (project constraint forbids `bun run build`); TypeScript --noEmit used as typecheck proxy (0 src errors).
- The _meta.githubLinkVerified/demoLinkVerified flags remain false in the manifest source (no application-code mutation during verification); the live link-check PASS/FAIL is reported separately in the verification report and could be backfilled in a future pass.
