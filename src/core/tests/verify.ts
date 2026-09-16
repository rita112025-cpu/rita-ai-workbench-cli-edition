/**
 * Core logic verification harness.
 * ==================================================================
 * Proves the invariants the architecture depends on. This is not app
 * test code — it is a build-time invariant check for the reusable
 * Workbench engine. Run with: `bun run src/core/tests/verify.ts`
 *
 * Each case asserts an INVARIANT (shape / permission / identity), not
 * a loose string match. Output is PASS/FAIL per case + a summary.
 *
 * NOTE on environment: VFS writable ops touch localStorage. Under Node
 * there is no localStorage, so the writable tests stub a minimal global.
 * Read-only VFS tests are pure and run anywhere.
 */

// --- minimal localStorage stub for Node verification -----------------
type Store = Record<string, string>;
const store: Store = {};
const memoryStorage = {
  getItem(k: string) {
    return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null;
  },
  setItem(k: string, v: string) {
    store[k] = String(v);
  },
  removeItem(k: string) {
    delete store[k];
  },
  clear() {
    for (const k of Object.keys(store)) delete store[k];
  },
};
if (typeof globalThis.localStorage === "undefined") {
  // @ts-expect-error assign for test runtime only
  globalThis.localStorage = memoryStorage;
}
if (typeof globalThis.window === "undefined") {
  // @ts-expect-error assign for test runtime only
  globalThis.window = { localStorage: memoryStorage };
}

// --- imports under test ----------------------------------------------
import { PROJECTS, MANIFEST_ASSERTIONS, findProjectById } from "@/data/workbench-manifest";
import { RESEARCH_PROJECTS, findResearchById } from "@/data/research-manifest";
import { readPath, mkdir, rm } from "@/core/vfs/build-vfs";
import { isReadOnly, isWritable } from "@/core/vfs/permissions";
import { resolvePath } from "@/core/resolver/resolve-path";
import { resolveProject } from "@/core/resolver/resolve-project";
import { resolveProjectLink, resolveOpenTarget } from "@/core/resolver/resolve-target";
import { parseCommand } from "@/core/commands/parse-command";
import { executeCommand } from "@/core/commands/execute-command";

/* ------------------------------------------------------------------ */
/* Mini assertion lib                                                  */
/* ------------------------------------------------------------------ */

let pass = 0;
let fail = 0;
const failures: string[] = [];

function assert(cond: boolean, name: string, detail = ""): void {
  if (cond) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    failures.push(`${name}${detail ? " — " + detail : ""}`);
    console.log(`  FAIL  ${name}${detail ? " — " + detail : ""}`);
  }
}

function assertEq<T>(actual: T, expected: T, name: string): void {
  const okFlag = Object.is(actual, expected);
  if (!okFlag) {
    console.log(`        expected: ${JSON.stringify(expected)}`);
    console.log(`        actual  : ${JSON.stringify(actual)}`);
  }
  assert(okFlag, name);
}

function assertMatch<T>(actual: T, shape: Partial<T>, name: string): void {
  let okFlag = true;
  for (const k of Object.keys(shape as object)) {
    const av = (actual as Record<string, unknown>)?.[k];
    const sv = (shape as Record<string, unknown>)[k];
    if (!Object.is(av, sv)) {
      okFlag = false;
      console.log(`        field ${k}: expected ${JSON.stringify(sv)}, got ${JSON.stringify(av)}`);
    }
  }
  assert(okFlag, name);
}

const CWD = "/home/rita";

/* ------------------------------------------------------------------ */
/* 1–21 required cases                                                 */
/* ------------------------------------------------------------------ */

console.log("\n[1] manifest invariants");
assert(MANIFEST_ASSERTIONS.matchesExpected, "01 manifest count matches totalTools", `${MANIFEST_ASSERTIONS.totalProjects} vs ${MANIFEST_ASSERTIONS.expectedTotal}`);
assert(MANIFEST_ASSERTIONS.uniqueIds, "02 manifest IDs unique");

console.log("\n[2] invalid URLs represented as null");
{
  const yijing = findProjectById("yijing");
  assert(!!yijing, "03 yijing resolved");
  const noDemo = PROJECTS.find((p) => p.links.demo === null);
  assert(!!noDemo, "04 missing demo represented as null", `noDemo=${noDemo?.id}`);
  // every project is itself a GitHub repo, so github is never null here.
  // the invariant we actually assert: every github URL is a non-null http(s) string.
  const allGithubPresent = PROJECTS.every((p) => typeof p.links.github === "string" && /^https?:\/\//.test(p.links.github!));
  assert(allGithubPresent, "05 all github URLs non-null & http(s)", `${PROJECTS.length} projects`);
  // ensure no "#" or empty-string fake URLs
  const badGithub = PROJECTS.find((p) => p.links.github !== null && (p.links.github === "" || p.links.github === "#"));
  const badDemo = PROJECTS.find((p) => p.links.demo !== null && (p.links.demo === "" || p.links.demo === "#"));
  assert(!badGithub, "06 no empty/# github URLs");
  assert(!badDemo, "07 no empty/# demo URLs");
}

console.log("\n[3] filesystem navigation");
{
  const root = readPath("/");
  assert(root.ok && root.kind === "dir", "08 ls /");
  const projDir = readPath("/projects");
  assert(projDir.ok && projDir.kind === "dir", "09 ls /projects");
  // cd ..
  assertEq(resolvePath("/projects", ".."), "/", "10 cd .. from /projects");
  assertEq(resolvePath("/projects/yijing", ".."), "/projects", "10b cd .. from nested");
}

console.log("\n[4] cat");
{
  const r = readPath("/projects/yijing/README.md");
  assert(r.ok && r.kind === "file" && !!r.content, "11 cat valid virtual file");
  const missing = readPath("/projects/does-not-exist/README.md");
  assert(!missing.ok && missing.kind === "notfound", "12 cat missing file -> notfound");
}

console.log("\n[5] search");
{
  const res = executeCommand("search 易經", { cwd: CWD, theme: "amber", crt: true, sound: false });
  assert(res.ok && res.output.length > 0, "13 search existing keyword");
  const none = executeCommand("search zzzzznope", { cwd: CWD, theme: "amber", crt: true, sound: false });
  assert(none.ok && none.output.length === 1, "14 search no result -> single info line");
}

console.log("\n[6] demo / github");
{
  const demo = executeCommand("demo yijing", { cwd: CWD, theme: "amber", crt: true, sound: false });
  assert(!!demo.action && demo.action.type === "OPEN_URL", "15 demo valid project -> OPEN_URL action");
  if (demo.action) {
    assertEq(demo.action.url, findProjectById("yijing")!.links.demo, "15b demo URL == manifest value");
    assertEq(demo.action.projectId, "yijing", "15c action carries projectId");
  }
  const noDemoProj = PROJECTS.find((p) => p.links.demo === null)!;
  const noDemo = executeCommand(`demo ${noDemoProj.id}`, { cwd: CWD, theme: "amber", crt: true, sound: false });
  assert(noDemo.ok && !noDemo.action, "16 demo project without demo URL -> no action", `id=${noDemoProj.id}`);
  const gh = executeCommand("github yijing", { cwd: CWD, theme: "amber", crt: true, sound: false });
  assert(!!gh.action && gh.action.linkType === "github", "17 github valid project");
  const unknown = executeCommand("demo not-a-real-project", { cwd: CWD, theme: "amber", crt: true, sound: false });
  assert(!unknown.ok && unknown.error?.code === "NOT_FOUND", "18 unknown project rejected");
}

console.log("\n[7] permissions");
{
  const rmRo = executeCommand("rm /projects/yijing", { cwd: CWD, theme: "amber", crt: true, sound: false });
  assert(!rmRo.ok && rmRo.error?.code === "READ_ONLY_FILESYSTEM", "19 rm /projects/... rejected");
  const mkdirRo = executeCommand("mkdir /projects/x", { cwd: CWD, theme: "amber", crt: true, sound: false });
  assert(!mkdirRo.ok && mkdirRo.error?.code === "READ_ONLY_FILESYSTEM", "20 mkdir /projects/... rejected");
  const mk = executeCommand("mkdir /home/rita/test", { cwd: CWD, theme: "amber", crt: true, sound: false });
  assert(mk.ok, "21 mkdir /home/rita/test allowed");
  const rmW = executeCommand("rm /home/rita/test", { cwd: CWD, theme: "amber", crt: true, sound: false });
  assert(rmW.ok, "21b rm /home/rita/test allowed");
}

console.log("\n[8] traversal / injection");
{
  // path traversal cannot escape
  assertEq(resolvePath("/projects", "../../../../../../"), "/", "22a ../../ cannot escape root");
  assertEq(resolvePath("/home/rita", "../../projects"), "/projects", "22b relative .. lands inside VFS");
  // javascript: and raw http URLs are NOT opened
  const js = executeCommand("open javascript:alert(1)", { cwd: CWD, theme: "amber", crt: true, sound: false });
  assert(!js.ok && js.error?.code === "URL_NOT_ALLOWED", "23 javascript: URL cannot be opened");
  const http = executeCommand("open https://evil.example", { cwd: CWD, theme: "amber", crt: true, sound: false });
  assert(!http.ok && http.error?.code === "URL_NOT_ALLOWED", "24 arbitrary https URL cannot be opened");
}

console.log("\n[9] run does not fabricate");
{
  const run = executeCommand("run yijing", { cwd: CWD, theme: "amber", crt: true, sound: false });
  assert(run.ok, "25 run returns ok");
  const blob = JSON.stringify(run.output);
  assert(!/✓ (Running|Connected|Analysis complete|Deployed|Tests passed)/.test(blob), "26 run output contains no fabricated success ticks");
  assert(blob.includes("executable") && /false/.test(blob), "26b run marks executable:false");
  assert(!run.action, "26c run produces no side-effect action");
}

/* ------------------------------------------------------------------ */
/* 22–27 bonus cases                                                   */
/* ------------------------------------------------------------------ */

console.log("\n[10] bonus: duplicate id / malformed url / traversal variants");
{
  // duplicate manifest id -> build-time assertion flag
  const ids = PROJECTS.map((p) => p.id);
  const dup = ids.length !== new Set(ids).size;
  assert(!dup, "27 no duplicate manifest IDs");
  // malformed url -> null (none of the source URLs are malformed here, but ensure none are non-http)
  const malformed = PROJECTS.find(
    (p) => (p.links.github && !/^https?:\/\//.test(p.links.github)) || (p.links.demo && !/^https?:\/\//.test(p.links.demo))
  );
  assert(!malformed, "28 all non-null URLs are http(s)://");
  // encoded traversal %2e%2e%2f
  assertEq(resolvePath("/projects", "%2e%2e%2f%2e%2e%2f"), "/", "29 encoded traversal cannot escape");
  // backslash traversal ..\..\
  assertEq(resolvePath("/projects", "..\\..\\projects"), "/projects", "30 backslash traversal clamped inside VFS");
  // excessive whitespace + quotes -> deterministic parse
  const p = parseCommand('   cat    "my   file.md"   ');
  assert(!!p && p.name === "cat" && p.args.length === 1 && p.args[0] === "my   file.md", "31 whitespace/quotes parse deterministically");
  // command handler cannot mutate canonical manifest
  const before = JSON.stringify(findProjectById("yijing"));
  executeCommand("rm /projects/yijing", { cwd: CWD, theme: "amber", crt: true, sound: false });
  executeCommand("mkdir /projects/yijing", { cwd: CWD, theme: "amber", crt: true, sound: false });
  const after = JSON.stringify(findProjectById("yijing"));
  assertEq(after, before, "32 manifest immutable across write attempts");
}

/* ------------------------------------------------------------------ */
/* Summary                                                             */
/* ------------------------------------------------------------------ */

console.log("\n────────────────────────────────────────");
console.log(`  PASS: ${pass}    FAIL: ${fail}`);
if (fail > 0) {
  console.log("  Failures:");
  for (const f of failures) console.log("    - " + f);
  process.exit(1);
} else {
  console.log("  ALL CORE INVARIANTS PASS ✅");
  process.exit(0);
}
