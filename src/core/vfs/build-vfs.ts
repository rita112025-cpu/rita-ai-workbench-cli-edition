/**
 * VFS Builder — reads virtual paths and enforces the read-only/writable
 * split. Read-only content is generated FROM the canonical manifest at
 * runtime (no second hand-written copy). Writable ops go through storage.
 * ==================================================================
 * Public API (pure, DOM-free except for localStorage in storage.ts):
 *   readPath(absPath)   -> ReadResult
 *   mkdir(absPath)      -> WriteResult   (only /home/rita)
 *   writeFile(...)      -> WriteResult   (only /home/rita) [future]
 *   rm(absPath)         -> WriteResult   (only /home/rita)
 *   isDir(absPath)      -> boolean
 *   listRootEntries()   -> VfsNode[]
 *
 * Path traversal is blocked at normalizePath (in resolver). Here we
 * additionally trust nothing: even if a raw path slips in, read/write
 * are scoped by top-level area.
 */

import {
  ABOUT,
  PROJECTS,
  SYSTEM,
  findProjectById,
  skillProjects,
  workflowProjects,
  type Project,
} from "@/data/workbench-manifest";
import {
  RESEARCH_PROJECTS,
  findResearchById,
  type ResearchProject,
} from "@/data/research-manifest";
import { SCRAPLING_MD, AGENT_REACH_MD } from "@/data/content/content-loader";
import { isReadOnly, isWritable, READ_ONLY_ERROR } from "./permissions";
import { loadWritable, saveWritable, relKey } from "./storage";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type VfsNodeType = "dir" | "file";

export interface VfsNode {
  name: string;
  type: VfsNodeType;
  path: string;
  synthetic?: boolean;
  linkTarget?: string;
}

export interface ReadResult {
  ok: boolean;
  kind: "file" | "dir" | "notfound" | "denied";
  content?: string;
  entries?: VfsNode[];
  message?: string;
}

export interface WriteResult {
  ok: boolean;
  message: string;
  code?: string;
}

/* ------------------------------------------------------------------ */
/* Manifest → generated file content                                  */
/* ------------------------------------------------------------------ */

function projectReadme(p: Project): string {
  return [
    `# ${p.name}`,
    ``,
    `category  : ${p.category}`,
    `repo      : ${p.owner}/${p.repo}`,
    `status    : ${p.status}`,
    `tags      : ${p.tags.join(", ")}`,
    p.fork ? `fork      : yes (upstream area: ${p.owner})` : `fork      : no`,
    ``,
    `## description`,
    ``,
    p.description,
    ``,
    `## detail`,
    ``,
    p.detail,
    ``,
    `## links`,
    ``,
    `github : ${p.links.github ?? "(none)"}`,
    `demo   : ${p.links.demo ?? "(none)"}`,
    ``,
    `## provenance`,
    ``,
    `source            : ${p._meta.source}`,
    `sourceVerified    : ${p._meta.sourceVerified}`,
    `githubLinkChecked : ${p._meta.githubLinkVerified}`,
    `demoLinkChecked   : ${p._meta.demoLinkVerified}`,
    `lastCheckedAt     : ${p._meta.lastCheckedAt ?? "(pending)"}`,
  ].join("\n");
}

function projectMeta(p: Project): string {
  return JSON.stringify(
    {
      id: p.id,
      name: p.name,
      repo: p.repo,
      owner: p.owner,
      category: p.category,
      status: p.status,
      tags: p.tags,
      fork: !!p.fork,
      links: p.links,
      _meta: p._meta,
    },
    null,
    2
  );
}

function researchReadme(r: ResearchProject): string {
  const md = r.id === "scrapling" ? SCRAPLING_MD : r.id === "agent-reach" ? AGENT_REACH_MD : null;
  return md ?? `(no README excerpt available for ${r.id})`;
}

function researchMeta(r: ResearchProject): string {
  return JSON.stringify(
    {
      id: r.id,
      name: r.name,
      path: r.path,
      summary: r.summary,
      highlights: r.highlights,
      contentType: "summary",
      _meta: r._meta,
    },
    null,
    2
  );
}

function readmeRoot(): string {
  return [
    `# ${ABOUT.title}`,
    ``,
    ABOUT.blurb.join("\n"),
    ``,
    `## categories`,
    ``,
    ...ABOUT.categories.map((c) => `- ${c}`),
    ``,
    `total tools : ${ABOUT.totalTools}`,
    `owner       : ${ABOUT.owner}`,
    `repo        : ${ABOUT.links.github ?? "(none)"}`,
    ``,
    `---`,
    `Source: rita-ai-workbench/README.md (excerpt)`,
  ].join("\n");
}

function aboutMd(): string {
  return [
    `# ${ABOUT.title}`,
    `${ABOUT.subtitle}`,
    ``,
    ...ABOUT.blurb,
    ``,
    `## stack`,
    ``,
    ...ABOUT.stack.map((s) => `- ${s}`),
    ``,
    `## categories (${ABOUT.categories.length})`,
    ``,
    ...ABOUT.categories.map((c) => `- ${c}`),
    ``,
    `total tools : ${ABOUT.totalTools}`,
  ].join("\n");
}

function systemInfo(): string {
  return [
    `name              : ${SYSTEM.name}`,
    `version           : ${SYSTEM.version}`,
    `filesystemVersion : ${SYSTEM.filesystemVersion}`,
    `sourceRepo        : ${SYSTEM.sourceRepo}`,
    ``,
    `_meta.source              : ${SYSTEM._meta.source}`,
    `_meta.sourceVerified      : ${SYSTEM._meta.sourceVerified}`,
    `_meta.githubLinkVerified  : ${SYSTEM._meta.githubLinkVerified}`,
    `_meta.lastCheckedAt       : ${SYSTEM._meta.lastCheckedAt ?? "(pending)"}`,
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/* Root entries                                                       */
/* ------------------------------------------------------------------ */

export function listRootEntries(): VfsNode[] {
  return [
    { name: "README.md", type: "file", path: "/README.md" },
    { name: "about.md", type: "file", path: "/about.md" },
    { name: "system", type: "dir", path: "/system" },
    { name: "projects", type: "dir", path: "/projects" },
    { name: "skills", type: "dir", path: "/skills" },
    { name: "workflows", type: "dir", path: "/workflows" },
    { name: "research", type: "dir", path: "/research" },
    { name: "home", type: "dir", path: "/home" },
  ];
}

/* ------------------------------------------------------------------ */
/* Writable tree listing                                              */
/* ------------------------------------------------------------------ */

function listWritableEntries(tree: ReturnType<typeof loadWritable>, dirAbs: string): VfsNode[] {
  const dir = dirAbs.replace(/\/$/, "");
  const prefix = dir === "/home/rita" ? "" : dir.replace(/^\/home\/rita\/?/, "");
  const seen = new Set<string>();
  const entries: VfsNode[] = [];
  for (const k of Object.keys(tree)) {
    if (prefix && !k.startsWith(prefix + "/")) continue;
    if (!prefix && !k.includes("/")) {
      if (seen.has(k)) continue;
      seen.add(k);
      const e = tree[k];
      entries.push({ name: k, type: e.type, path: `/home/rita/${k}` });
      continue;
    }
    const rel = prefix ? k.slice(prefix.length + 1) : k;
    const first = rel.split("/")[0];
    if (first && !seen.has(first)) {
      seen.add(first);
      const childKey = prefix ? `${prefix}/${first}` : first;
      const childEntry = tree[childKey];
      const type = childEntry?.type ?? "dir";
      entries.push({ name: first, type, path: `${dir}/${first}` });
    }
  }
  return entries;
}

/* ------------------------------------------------------------------ */
/* Public read API                                                    */
/* ------------------------------------------------------------------ */

export function readPath(absPath: string): ReadResult {
  const path = absPath === "" ? "/" : absPath;
  const parts = path.replace(/^\/+/, "").split("/").filter(Boolean);

  if (parts.length === 0) {
    return { ok: true, kind: "dir", entries: listRootEntries() };
  }

  const [top, ...rest] = parts;

  if (rest.length === 0) {
    if (top === "README.md") return { ok: true, kind: "file", content: readmeRoot() };
    if (top === "about.md") return { ok: true, kind: "file", content: aboutMd() };
  }

  // /system
  if (top === "system") {
    if (rest.length === 0)
      return { ok: true, kind: "dir", entries: [{ name: "info.txt", type: "file", path: "/system/info.txt" }] };
    if (rest.length === 1 && rest[0] === "info.txt")
      return { ok: true, kind: "file", content: systemInfo() };
    return { ok: false, kind: "notfound", message: `no such file: ${path}` };
  }

  // /projects
  if (top === "projects") {
    if (rest.length === 0)
      return { ok: true, kind: "dir", entries: PROJECTS.map((p) => ({ name: p.id, type: "dir" as const, path: `/projects/${p.id}` })) };
    const pid = rest[0];
    const proj = findProjectById(pid);
    if (!proj) return { ok: false, kind: "notfound", message: `no such project: ${pid}` };
    if (rest.length === 1) {
      return {
        ok: true,
        kind: "dir",
        entries: [
          { name: "README.md", type: "file", path: `/projects/${pid}/README.md` },
          { name: "meta.json", type: "file", path: `/projects/${pid}/meta.json` },
        ],
      };
    }
    if (rest.length === 2 && rest[1] === "README.md") return { ok: true, kind: "file", content: projectReadme(proj) };
    if (rest.length === 2 && rest[1] === "meta.json") return { ok: true, kind: "file", content: projectMeta(proj) };
    return { ok: false, kind: "notfound", message: `no such file: ${path}` };
  }

  // /skills
  if (top === "skills") {
    const skills = skillProjects();
    if (rest.length === 0) {
      return {
        ok: true,
        kind: "dir",
        entries: skills.map((p) => ({
          name: `${p.id} -> projects/${p.id}`,
          type: "dir" as const,
          path: `/skills/${p.id}`,
          synthetic: true,
          linkTarget: p.id,
        })),
      };
    }
    const pid = rest[0];
    const proj = findProjectById(pid);
    if (proj && skills.includes(proj)) {
      if (rest.length === 1) {
        return {
          ok: true,
          kind: "dir",
          entries: [
            { name: "README.md", type: "file", path: `/projects/${pid}/README.md` },
            { name: "meta.json", type: "file", path: `/projects/${pid}/meta.json` },
          ],
        };
      }
      if (rest.length === 2 && rest[1] === "README.md") return { ok: true, kind: "file", content: projectReadme(proj) };
      if (rest.length === 2 && rest[1] === "meta.json") return { ok: true, kind: "file", content: projectMeta(proj) };
    }
    return { ok: false, kind: "notfound", message: `no such skill: ${pid}` };
  }

  // /workflows
  if (top === "workflows") {
    const wfs = workflowProjects();
    if (rest.length === 0) {
      return {
        ok: true,
        kind: "dir",
        entries: wfs.map((p) => ({
          name: `${p.id} -> projects/${p.id}`,
          type: "dir" as const,
          path: `/workflows/${p.id}`,
          synthetic: true,
          linkTarget: p.id,
        })),
      };
    }
    const pid = rest[0];
    const proj = findProjectById(pid);
    if (proj && wfs.includes(proj)) {
      if (rest.length === 1) {
        return {
          ok: true,
          kind: "dir",
          entries: [
            { name: "README.md", type: "file", path: `/projects/${pid}/README.md` },
            { name: "meta.json", type: "file", path: `/projects/${pid}/meta.json` },
          ],
        };
      }
      if (rest.length === 2 && rest[1] === "README.md") return { ok: true, kind: "file", content: projectReadme(proj) };
      if (rest.length === 2 && rest[1] === "meta.json") return { ok: true, kind: "file", content: projectMeta(proj) };
    }
    return { ok: false, kind: "notfound", message: `no such workflow: ${pid}` };
  }

  // /research
  if (top === "research") {
    if (rest.length === 0)
      return { ok: true, kind: "dir", entries: RESEARCH_PROJECTS.map((r) => ({ name: r.id, type: "dir" as const, path: `/research/${r.id}` })) };
    const rid = rest[0];
    const rp = findResearchById(rid);
    if (!rp) return { ok: false, kind: "notfound", message: `no such research project: ${rid}` };
    if (rest.length === 1) {
      return {
        ok: true,
        kind: "dir",
        entries: [
          { name: "README.md", type: "file", path: `/research/${rid}/README.md` },
          { name: "meta.json", type: "file", path: `/research/${rid}/meta.json` },
        ],
      };
    }
    if (rest.length === 2 && rest[1] === "README.md") return { ok: true, kind: "file", content: researchReadme(rp) };
    if (rest.length === 2 && rest[1] === "meta.json") return { ok: true, kind: "file", content: researchMeta(rp) };
    return { ok: false, kind: "notfound", message: `no such file: ${path}` };
  }

  // /home/rita — writable
  if (top === "home" && rest[0] === "rita") {
    const tree = loadWritable();
    const sub = rest.slice(1);
    if (sub.length === 0) {
      return { ok: true, kind: "dir", entries: listWritableEntries(tree, "/home/rita") };
    }
    const key = sub.join("/");
    const entry = tree[key];
    if (entry && entry.type === "file") {
      return { ok: true, kind: "file", content: entry.content ?? "" };
    }
    const dirPrefix = key.endsWith("/") ? key : key + "/";
    const hasChild = Object.keys(tree).some((k) => k.startsWith(dirPrefix) && k !== key);
    const isDir = entry?.type === "dir" || hasChild;
    if (isDir) {
      return { ok: true, kind: "dir", entries: listWritableEntries(tree, `/home/rita/${key}`) };
    }
    return { ok: false, kind: "notfound", message: `no such file or directory: ${path}` };
  }

  return { ok: false, kind: "notfound", message: `no such file or directory: ${path}` };
}

export function isDir(absPath: string): boolean {
  const r = readPath(absPath);
  return r.ok && r.kind === "dir";
}

/* ------------------------------------------------------------------ */
/* Public write API — restricted to /home/rita                         */
/* ------------------------------------------------------------------ */

export function mkdir(absPath: string): WriteResult {
  if (!isWritable(absPath)) {
    return {
      ok: false,
      message: `mkdir: ${absPath}: read-only filesystem`,
      code: READ_ONLY_ERROR.code,
    };
  }
  const tree = loadWritable();
  const key = relKey(absPath);
  if (!key) return { ok: false, message: `mkdir: cannot create root`, code: "INVALID_PATH" };
  if (tree[key]) {
    return { ok: false, message: `mkdir: cannot create directory '${key}': file exists`, code: "ALREADY_EXISTS" };
  }
  tree[key] = { type: "dir" };
  // ensure ancestor dirs
  const segs = key.split("/");
  for (let i = 1; i < segs.length; i++) {
    const ancestor = segs.slice(0, i).join("/");
    if (!tree[ancestor]) tree[ancestor] = { type: "dir" };
  }
  saveWritable(tree);
  return { ok: true, message: "" };
}

export function rm(absPath: string): WriteResult {
  if (!isWritable(absPath)) {
    return {
      ok: false,
      message: `rm: ${absPath}: read-only filesystem`,
      code: READ_ONLY_ERROR.code,
    };
  }
  if (absPath.replace(/\/+$/, "") === "/home/rita") {
    return { ok: false, message: `rm: refusing to remove /home/rita root`, code: "INVALID_PATH" };
  }
  const tree = loadWritable();
  const key = relKey(absPath);
  if (!key) return { ok: false, message: `rm: cannot remove root`, code: "INVALID_PATH" };
  const existed = key in tree;
  const prefix = key + "/";
  let removedCount = 0;
  for (const k of Object.keys(tree)) {
    if (k === key || k.startsWith(prefix)) {
      delete tree[k];
      removedCount++;
    }
  }
  saveWritable(tree);
  if (!existed && removedCount === 0) {
    return { ok: false, message: `rm: cannot remove '${key}': no such file or directory`, code: "NOT_FOUND" };
  }
  return { ok: true, message: "" };
}

/** Write a plain-text file under /home/rita. Used by a future `echo > file`. */
export function writeFile(absPath: string, content: string): WriteResult {
  if (!isWritable(absPath)) {
    return { ok: false, message: `write: ${absPath}: read-only filesystem`, code: READ_ONLY_ERROR.code };
  }
  const tree = loadWritable();
  const key = relKey(absPath);
  if (!key) return { ok: false, message: `write: cannot write root`, code: "INVALID_PATH" };
  tree[key] = { type: "file", content };
  const segs = key.split("/");
  for (let i = 1; i < segs.length; i++) {
    const ancestor = segs.slice(0, i).join("/");
    if (!tree[ancestor]) tree[ancestor] = { type: "dir" };
  }
  saveWritable(tree);
  return { ok: true, message: "" };
}

// silence unused import lint for isReadOnly (kept for external consumers)
void isReadOnly;
