/**
 * execute-command — the single command dispatcher.
 * ==================================================================
 * Pure, DOM-free. Takes (input, cwd) and returns a CommandResult.
 *
 * Architecture:
 *   parseCommand(input) -> ParsedCommand
 *   dispatch[name](args, cwd) -> CommandResult
 *
 * Every command that needs project/research/path data resolves it
 * through the shared resolver (resolveProject / resolvePath /
 * resolveOpenTarget). No command hard-codes a project map.
 *
 * External side effects (opening a URL) are returned as an OPEN_URL
 * action descriptor; the UI layer is the only thing that calls
 * window.open(). The engine NEVER executes an arbitrary URL.
 */

import { ABOUT, PROJECTS, SYSTEM, MANIFEST_ASSERTIONS, type Project } from "@/data/workbench-manifest";
import { RESEARCH_PROJECTS } from "@/data/research-manifest";
import { readPath, mkdir, rm, isDir, type VfsNode } from "@/core/vfs/build-vfs";
import { resolvePath, toPromptPath } from "@/core/resolver/resolve-path";
import { resolveProject, allProjectIds, type ResolvedTarget } from "@/core/resolver/resolve-project";
import { resolveOpenTarget, resolveProjectLink, type TargetResolution } from "@/core/resolver/resolve-target";
import { parseCommand } from "./parse-command";
import {
  ok,
  fail,
  text,
  heading,
  divider,
  kv,
  list as listLine,
  table as tableLine,
  raw,
  type CommandResult,
  type OutputLine,
} from "./types";

/* ------------------------------------------------------------------ */
/* Dispatch context                                                   */
/* ------------------------------------------------------------------ */

export interface DispatchContext {
  cwd: string;
  theme: "amber" | "green" | "white";
  crt: boolean;
  sound: boolean;
}

type Handler = (args: string[], ctx: DispatchContext) => CommandResult;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function unknownCommand(name: string): CommandResult {
  return fail("UNKNOWN_COMMAND", `command not found: ${name}. type 'help' for available commands.`);
}

function formatEntries(entries: VfsNode[]): OutputLine[] {
  const dirs = entries.filter((e) => e.type === "dir").sort((a, b) => a.name.localeCompare(b.name));
  const files = entries.filter((e) => e.type === "file").sort((a, b) => a.name.localeCompare(b.name));
  const names = [...dirs, ...files].map((e) => e.name + (e.type === "dir" ? "/" : ""));
  return [listLine(names)];
}

function projectToLines(p: Project): OutputLine[] {
  return [
    heading(p.name, 1),
    kv("category", p.category),
    kv("repo", `${p.owner}/${p.repo}`),
    kv("status", p.status),
    kv("tags", p.tags.join(", ")),
    kv("fork", p.fork ? "yes" : "no"),
    text(""),
    heading("description", 2),
    text(p.description),
    text(""),
    heading("detail", 2),
    text(p.detail),
    text(""),
    heading("links", 2),
    kv("github", p.links.github ?? "(none)"),
    kv("demo", p.links.demo ?? "(none)"),
    text(""),
    heading("commands", 2),
    listLine([
      `demo ${p.id}${p.links.demo ? "" : "  (no demo URL published)"}`,
      `github ${p.id}`,
      `cat projects/${p.id}/README.md`,
      `run ${p.id}`,
    ]),
  ];
}

/* ------------------------------------------------------------------ */
/* Handlers                                                            */
/* ------------------------------------------------------------------ */

const helpHandler: Handler = () => {
  const out: OutputLine[] = [
    heading("Rita AI Workbench — command reference", 1),
    text("man-page style. use ↑/↓ to scroll. press q to exit."),
    divider(),
    heading("Navigation", 2),
    tableLine([
      ["ls [path]", "list directory contents"],
      ["cd <path>", "change directory"],
      ["pwd", "print working directory"],
      ["cat <file>", "print a virtual file"],
      ["clear", "clear the screen"],
    ]),
    heading("Discovery", 2),
    tableLine([
      ["projects", "list all projects (grouped by category)"],
      ["skills", "list skill projects (derived from tags)"],
      ["workflows", "list workflow projects (derived from tags)"],
      ["research", "list research sub-projects"],
      ["search <keyword>", "search projects, tags and descriptions"],
    ]),
    heading("Projects", 2),
    tableLine([
      ["demo <id>", "open a project's published demo URL"],
      ["github <id>", "open a project's GitHub repo"],
      ["open <id>", "alias for demo <id>"],
    ]),
    heading("Workbench", 2),
    tableLine([
      ["run <id>", "inspect project runtime (no execution simulation)"],
      ["status", "show workbench status summary"],
      ["logs", "show recent command history"],
    ]),
    heading("System", 2),
    tableLine([
      ["help", "show this reference"],
      ["history", "show command history"],
      ["whoami", "show current user"],
      ["neofetch", "show system info card"],
      ["theme <amber|green|white>", "switch terminal theme"],
      ["crt <on|off>", "toggle CRT scanline overlay"],
      ["sound <on|off>", "toggle mechanical-keyboard sound"],
    ]),
    heading("Virtual FS (writable only under /home/rita)", 2),
    tableLine([
      ["mkdir <path>", "create a directory under /home/rita"],
      ["rm <path>", "remove a file/dir under /home/rita"],
    ]),
    divider(),
    text("read-only areas: /system /projects /research /skills /workflows"),
    text("writable area : /home/rita (stored in your browser only)"),
  ];
  return ok(out, { enterPager: true, pagerContent: "" });
};

const lsHandler: Handler = (args, ctx) => {
  const target = args[0] ? resolvePath(ctx.cwd, args[0]) : ctx.cwd;
  const r = readPath(target);
  if (!r.ok) {
    if (r.kind === "denied") return fail("PERMISSION_DENIED", r.message ?? "access denied");
    return fail("NOT_FOUND", r.message ?? `ls: cannot access '${args[0] ?? target}'`);
  }
  if (r.kind === "file") {
    return ok([text(target)]);
  }
  return ok(formatEntries(r.entries ?? []));
};

const cdHandler: Handler = (args, ctx) => {
  if (args.length === 0) {
    return ok([], { cwd: "/home/rita" });
  }
  const target = resolvePath(ctx.cwd, args[0]);
  const r = readPath(target);
  if (!r.ok) {
    return fail("NOT_FOUND", `cd: no such file or directory: ${args[0]}`);
  }
  if (r.kind !== "dir") {
    return fail("NOT_A_DIRECTORY", `cd: not a directory: ${args[0]}`);
  }
  return ok([], { cwd: target });
};

const pwdHandler: Handler = (_args, ctx) => ok([text(ctx.cwd)]);

const catHandler: Handler = (args, ctx) => {
  if (args.length === 0) return fail("MISSING_ARG", "cat: missing file operand. usage: cat <file>");
  const target = resolvePath(ctx.cwd, args[0]);
  const r = readPath(target);
  if (!r.ok) {
    return fail("NOT_FOUND", r.message ?? `cat: ${args[0]}: no such file or directory`);
  }
  if (r.kind === "dir") {
    return fail("IS_A_DIRECTORY", `cat: ${args[0]}: is a directory`);
  }
  return ok([raw(r.content ?? "")]);
};

const clearHandler: Handler = () => ok([], { clearScreen: true });

const projectsHandler: Handler = () => {
  const groups = ABOUT.categories
    .map((cat) => ({ cat, items: PROJECTS.filter((p) => p.category === cat) }))
    .filter((g) => g.items.length > 0);
  const out: OutputLine[] = [
    heading(`Projects (${PROJECTS.length} total)`, 1),
    text(`source: rita-ai-workbench/app.js  (sourceVerified: true)`),
    divider(),
  ];
  for (const g of groups) {
    out.push(heading(`${g.cat}  (${g.items.length})`, 2));
    out.push(
      tableLine(
        g.items.map((p) => [p.id, p.status, p.links.demo ? "demo ✓" : "demo —", p.description])
      )
    );
  }
  out.push(divider());
  out.push(text("tip: `cat projects/<id>/README.md` for full detail · `demo <id>` / `github <id>` to open"));
  return ok(out);
};

const skillsHandler: Handler = () => {
  const skills = PROJECTS.filter((p) => p.tags.some((t) => /skill/i.test(t)));
  if (skills.length === 0) {
    return ok([text("skills: (empty — no projects tagged Skill in the manifest)")]);
  }
  const out: OutputLine[] = [
    heading(`Skills (${skills.length} — derived from tag 'Skill')`, 1),
    text("derived view: these are projects whose tags contain 'Skill'."),
    divider(),
    tableLine(skills.map((p) => [p.id, p.category, p.status, p.description])),
    divider(),
    text("browse: `ls /skills` · `cat /skills/<id>/README.md`"),
  ];
  return ok(out);
};

const workflowsHandler: Handler = () => {
  const wfs = PROJECTS.filter((p) => p.tags.some((t) => /工作流|workflow/i.test(t)));
  if (wfs.length === 0) {
    return ok([text("workflows: (empty — no projects tagged 工作流/Workflow in the manifest)")]);
  }
  const out: OutputLine[] = [
    heading(`Workflows (${wfs.length} — derived from tag '工作流/Workflow')`, 1),
    text("derived view: these are projects whose tags contain '工作流' or 'Workflow'."),
    divider(),
    tableLine(wfs.map((p) => [p.id, p.category, p.status, p.description])),
  ];
  return ok(out);
};

const researchHandler: Handler = () => {
  const out: OutputLine[] = [
    heading(`Research (${RESEARCH_PROJECTS.length})`, 1),
    text("source: rita-ai-workbench/research/**/README.md (contentType: summary)"),
    divider(),
  ];
  for (const r of RESEARCH_PROJECTS) {
    out.push(heading(`${r.id} — ${r.name}`, 2));
    out.push(kv("path", r.path));
    out.push(text(r.summary));
    out.push(listLine(r.highlights));
    out.push(text(""));
  }
  out.push(text("browse: `ls /research` · `cat /research/<id>/README.md`"));
  return ok(out);
};

const searchHandler: Handler = (args) => {
  if (args.length === 0) return fail("MISSING_ARG", "search: missing keyword. usage: search <keyword>");
  const q = args.join(" ").toLowerCase();
  const hits = PROJECTS.filter((p) => {
    const hay = [p.id, p.name, p.description, p.detail, p.category, ...p.tags].join(" ").toLowerCase();
    return hay.includes(q);
  });
  const researchHits = RESEARCH_PROJECTS.filter((r) => {
    const hay = [r.id, r.name, r.summary, ...r.highlights].join(" ").toLowerCase();
    return hay.includes(q);
  });
  if (hits.length === 0 && researchHits.length === 0) {
    return ok([text(`search: no results for '${q}'`)]);
  }
  const out: OutputLine[] = [heading(`search '${q}' — ${hits.length + researchHits.length} result(s)`, 1), divider()];
  if (hits.length > 0) {
    out.push(heading(`projects (${hits.length})`, 2));
    out.push(tableLine(hits.map((p) => [p.id, p.category, p.status, p.description])));
  }
  if (researchHits.length > 0) {
    out.push(heading(`research (${researchHits.length})`, 2));
    out.push(tableLine(researchHits.map((r) => [r.id, r.name, r.summary])));
  }
  return ok(out);
};

function openLink(args: string[], ctx: DispatchContext, linkType: "demo" | "github"): CommandResult {
  if (args.length === 0) {
    return fail("MISSING_ARG", `${linkType}: missing project id. usage: ${linkType} <id>`);
  }
  const input = args[0];
  // Block raw URLs explicitly (defence in depth; resolveOpenTarget also guards).
  if (/^(https?:|javascript:|file:|data:)/i.test(input)) {
    const res = resolveOpenTarget({ kind: "none" }, linkType, input);
    return fail("URL_NOT_ALLOWED", (res as { reason: string }).reason);
  }
  const resolved = resolveProject(input);
  const res: TargetResolution = resolveOpenTarget(resolved, linkType, input);
  if (res.kind === "ok") {
    return ok(
      [
        text(`opening ${res.action.linkType} for ${res.action.projectId}…`),
        kv("url", res.action.url),
        text("(manifest allowlist — link verified: pending)"),
      ],
      {},
      res.action
    );
  }
  if (res.kind === "no_link") {
    const label = res.linkType === "demo" ? "demo URL" : "GitHub URL";
    return ok([text(`${res.projectId}: no ${label} published in the manifest`), text(`try: ${res.linkType === "demo" ? "github" : "demo"} ${res.projectId}`)]);
  }
  if (res.kind === "denied") {
    return fail("URL_NOT_ALLOWED", res.reason);
  }
  return fail("NOT_FOUND", `${linkType}: unknown project '${input}'. try 'projects' to list.`);
}

const demoHandler: Handler = (args, ctx) => openLink(args, ctx, "demo");
const githubHandler: Handler = (args, ctx) => openLink(args, ctx, "github");
const openHandler: Handler = (args, ctx) => openLink(args, ctx, "demo");

const runHandler: Handler = (args) => {
  if (args.length === 0) return fail("MISSING_ARG", "run: missing tool id. usage: run <id>");
  const resolved = resolveProject(args[0]);
  if (resolved.kind === "none") {
    return fail("NOT_FOUND", `run: unknown tool '${args[0]}'. try 'projects' to list.`);
  }
  if (resolved.kind === "research") {
    const r = resolved.research;
    return ok([
      heading(`run ${r.id}`, 1),
      text("Loading project manifest…"),
      kv("type", "research project"),
      kv("runtime", "external (research package, not executable from this terminal)"),
      kv("status", r._meta.sourceVerified ? "source-verified" : "unknown"),
      text(""),
      heading("availableActions", 2),
      listLine([`cat /research/${r.id}/README.md`, `cat /research/${r.id}/meta.json`]),
      text(""),
      text("note: no execution adapter registered — this terminal does not simulate runs."),
    ]);
  }
  const p = resolved.project;
  const actions: string[] = [];
  if (p.links.demo) actions.push(`demo ${p.id}`);
  if (p.links.github) actions.push(`github ${p.id}`);
  actions.push(`cat projects/${p.id}/README.md`);
  return ok([
    heading(`run ${p.id}`, 1),
    text("Loading project manifest…"),
    kv("project", p.name),
    kv("category", p.category),
    kv("status", p.status),
    kv("executable", "false"),
    kv("runtime", "external application (not executed from this terminal)"),
    text(""),
    heading("availableActions", 2),
    listLine(actions),
    text(""),
    text("note: no execution adapter is registered. this command inspects the"),
    text("project manifest only — it never simulates API calls, analysis,"),
    text("deployments or tests that did not actually run."),
  ]);
};

const statusHandler: Handler = () => {
  const withDemo = PROJECTS.filter((p) => p.links.demo).length;
  const withGithub = PROJECTS.filter((p) => p.links.github).length;
  const forks = PROJECTS.filter((p) => p.fork).length;
  return ok([
    heading("Rita AI Workbench — status", 1),
    kv("version", SYSTEM.version),
    kv("filesystemVersion", String(SYSTEM.filesystemVersion)),
    kv("sourceRepo", SYSTEM.sourceRepo),
    divider(),
    kv("projects", String(PROJECTS.length)),
    kv("research", String(RESEARCH_PROJECTS.length)),
    kv("with demo URL", `${withDemo} / ${PROJECTS.length}`),
    kv("with github URL", `${withGithub} / ${PROJECTS.length}`),
    kv("forks", String(forks)),
    kv("categories", String(ABOUT.categories.length)),
    divider(),
    kv("manifest assertions", MANIFEST_ASSERTIONS.matchesExpected ? "PASS (count matches totalTools)" : "MISMATCH"),
    kv("unique ids", MANIFEST_ASSERTIONS.uniqueIds ? "PASS" : "FAIL (duplicate ids)"),
  ]);
};

const logsHandler: Handler = () => {
  // the UI owns history; the engine returns a hint so logs reads from UI state.
  return ok([
    heading("logs", 1),
    text("command history is held by the terminal session. use `history` to view it."),
    text("(this command is reserved for future system logs once an execution adapter exists.)"),
  ]);
};

const historyHandler: Handler = () => {
  return ok([text("history is rendered by the terminal session (use ↑/↓ to navigate).")]);
};

const whoamiHandler: Handler = () => ok([text("rita")]);

const neofetchHandler: Handler = (_args, ctx) => {
  const logo = [
    "                 ██████",
    "              ███      ███",
    "            ██            ██",
    "           ██   RITA AI    ██",
    "           ██  WORKBENCH   ██",
    "            ██            ██",
    "              ███      ███",
    "                 ██████",
  ];
  const withDemo = PROJECTS.filter((p) => p.links.demo).length;
  return ok([
    raw(logo.join("\n")),
    text(""),
    kv("OS", SYSTEM.name),
    kv("version", SYSTEM.version),
    kv("shell", "rita-cli"),
    kv("theme", ctx.theme),
    kv("crt", ctx.crt ? "on" : "off"),
    kv("sound", ctx.sound ? "on" : "off"),
    kv("projects", String(PROJECTS.length)),
    kv("research", String(RESEARCH_PROJECTS.length)),
    kv("with-demo", `${withDemo}/${PROJECTS.length}`),
    kv("mode", "portfolio"),
    kv("runtime", "browser"),
    kv("storage", "local"),
  ]);
};

const themeHandler: Handler = (args) => {
  const t = (args[0] ?? "").toLowerCase();
  if (t !== "amber" && t !== "green" && t !== "white") {
    return fail("INVALID_THEME", `theme: invalid value '${args[0] ?? ""}'. usage: theme <amber|green|white>`);
  }
  // theme application is a UI concern; engine returns the chosen value via nextState.prefs.
  return ok([text(`theme: switching to ${t} (200ms fade)…`), kv("theme", t)], { prefs: { theme: t } });
};

const crtHandler: Handler = (args) => {
  const v = (args[0] ?? "").toLowerCase();
  if (v !== "on" && v !== "off") {
    return fail("INVALID_ARG", `crt: invalid value '${args[0] ?? ""}'. usage: crt <on|off>`);
  }
  return ok([kv("crt", v)], { prefs: { crt: v === "on" } });
};

const soundHandler: Handler = (args) => {
  const v = (args[0] ?? "").toLowerCase();
  if (v !== "on" && v !== "off") {
    return fail("INVALID_ARG", `sound: invalid value '${args[0] ?? ""}'. usage: sound <on|off>`);
  }
  return ok([kv("sound", v)], { prefs: { sound: v === "on" } });
};

const mkdirHandler: Handler = (args, ctx) => {
  if (args.length === 0) return fail("MISSING_ARG", "mkdir: missing operand. usage: mkdir <path>");
  const target = resolvePath(ctx.cwd, args[0]);
  const r = mkdir(target);
  if (!r.ok) {
    return fail(r.code ?? "WRITE_FAILED", r.message || `mkdir: failed`);
  }
  return ok([text(`created: ${target}`)]);
};

const rmHandler: Handler = (args, ctx) => {
  if (args.length === 0) return fail("MISSING_ARG", "rm: missing operand. usage: rm <path>");
  const target = resolvePath(ctx.cwd, args[0]);
  const r = rm(target);
  if (!r.ok) {
    return fail(r.code ?? "WRITE_FAILED", r.message || `rm: failed`);
  }
  return ok([text(`removed: ${target}`)]);
};

const aboutHandler: Handler = () => {
  return ok([
    heading(ABOUT.title, 1),
    text(ABOUT.subtitle),
    text(""),
    ...ABOUT.blurb.map((b) => text(b)),
    text(""),
    heading("stack", 2),
    listLine(ABOUT.stack),
    heading("categories", 2),
    listLine(ABOUT.categories),
    text(""),
    kv("owner", ABOUT.owner),
    kv("repo", ABOUT.links.github ?? "(none)"),
    kv("total tools", String(ABOUT.totalTools)),
  ]);
};

/* ------------------------------------------------------------------ */
/* Registry + dispatch                                                */
/* ------------------------------------------------------------------ */

const HANDLERS: Record<string, Handler> = Object.assign(Object.create(null), {
  help: helpHandler,
  ls: lsHandler,
  cd: cdHandler,
  pwd: pwdHandler,
  cat: catHandler,
  clear: clearHandler,
  projects: projectsHandler,
  skills: skillsHandler,
  workflows: workflowsHandler,
  research: researchHandler,
  search: searchHandler,
  demo: demoHandler,
  github: githubHandler,
  open: openHandler,
  run: runHandler,
  status: statusHandler,
  logs: logsHandler,
  history: historyHandler,
  whoami: whoamiHandler,
  neofetch: neofetchHandler,
  theme: themeHandler,
  crt: crtHandler,
  sound: soundHandler,
  mkdir: mkdirHandler,
  rm: rmHandler,
  about: aboutHandler,
});

export function executeCommand(input: string, ctx: DispatchContext): CommandResult {
  const parsed = parseCommand(input);
  if (!parsed) return ok([]); // empty input is a no-op
  const handler = HANDLERS[parsed.name.toLowerCase()];
  if (!handler) return unknownCommand(parsed.name);
  try {
    return handler(parsed.args, ctx);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return fail("INTERNAL_ERROR", `internal error: ${msg}`);
  }
}

/* ------------------------------------------------------------------ */
/* Re-exports for UI convenience                                       */
/* ------------------------------------------------------------------ */

export { parseCommand, resolvePath, toPromptPath, resolveProject, allProjectIds, resolveProjectLink };
export type { ResolvedTarget };
