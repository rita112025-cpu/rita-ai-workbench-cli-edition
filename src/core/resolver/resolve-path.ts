/**
 * resolve-path — pure path resolution with traversal protection.
 * ==================================================================
 * Guarantees:
 *   - Result always starts with "/" and never escapes the virtual root.
 *   - ".." cannot climb above "/".
 *   - Empty/dot segments dropped.
 *   - Backslash traversal (..\\..\\) is neutralized: backslashes are
 *     treated as path separators, so "..\\..\\projects" parses the same
 *     as "../../projects" and is clamped to "/".
 *   - Percent-encoded traversal (%2e%2e%2f) is decoded first, so the
 *     same clamping applies. Callers that pass already-decoded input
 *     are also safe because the parser is segment-based.
 *   - Never throws.
 */

/** Normalize backslashes to slashes BEFORE splitting, so ..\..\ is handled. */
function unifySeparators(s: string): string {
  return s.replace(/\\+/g, "/");
}

/** Decode percent-encoded chars defensively (so %2e%2e%2f -> ../). */
function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * Resolve `target` against `cwd`, clamped to the virtual root.
 * `target` may be:
 *   - absolute ("/projects")
 *   - relative ("projects", "../projects", "./x")
 *   - backslash or percent-encoded traversal attempts
 */
export function resolvePath(cwd: string, target: string): string {
  if (!target) return cwd || "/";
  const decoded = safeDecode(target);
  const unified = unifySeparators(decoded);
  const base = unified.startsWith("/") ? "/" : cwd || "/";
  const parts = (base + "/" + unified).split("/");
  const out: string[] = [];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      out.pop();
      continue;
    }
    out.push(part);
  }
  return "/" + out.join("/");
}

export function joinPath(a: string, b: string): string {
  return resolvePath(a, b);
}

/** Convert a virtual absolute path into a display prompt path (~/... style). */
export function toPromptPath(absPath: string): string {
  if (absPath === "/home/rita") return "~";
  if (absPath.startsWith("/home/rita/")) return "~" + absPath.slice("/home/rita".length);
  return absPath;
}
