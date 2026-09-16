/**
 * VFS Permission Model — pure functions, no DOM.
 * ==================================================================
 * Defines which virtual paths are read-only vs writable.
 * Permission is enforced HERE so the command engine can never bypass it.
 */

export const READ_ONLY_TOPS = new Set([
  "system",
  "projects",
  "research",
  "skills",
  "workflows",
]);

/** Root-level generated files are read-only. */
const READ_ONLY_ROOT_FILES = new Set(["README.md", "about.md"]);

/** Is a path under a read-only manifest area or a generated root file? */
export function isReadOnly(absPath: string): boolean {
  const p = absPath.replace(/^\/+/, "");
  if (p === "") return true; // root itself is conceptually read-only for writes
  const top = p.split("/")[0];
  if (READ_ONLY_ROOT_FILES.has(top)) return true;
  return READ_ONLY_TOPS.has(top);
}

/** Is a path under the writable user area (/home/rita)? */
export function isWritable(absPath: string): boolean {
  const p = absPath.replace(/^\/+/, "");
  return p === "home/rita" || p.startsWith("home/rita/");
}

export const READ_ONLY_ERROR = {
  code: "READ_ONLY_FILESYSTEM" as const,
};

export const PERMISSION_DENIED_ERROR = {
  code: "PERMISSION_DENIED" as const,
};
