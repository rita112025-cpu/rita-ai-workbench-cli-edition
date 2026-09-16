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
