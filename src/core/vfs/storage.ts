/**
 * VFS Storage — the ONLY writable area of the filesystem.
 * ==================================================================
 * Backed by localStorage under a single key. All mutating VFS ops go
 * through here. Read-only areas never touch storage.
 *
 * The tree is a flat record keyed by path-relative-to-/home/rita.
 * Directories are implicit (any key with descendants is a dir), but we
 * also store explicit {type:"dir"} markers for mkdir semantics.
 */

const LS_KEY = "rita-workbench:home-rita";

export interface WritableEntry {
  type: "dir" | "file";
  content?: string;
}
export type WritableTree = Record<string, WritableEntry>;

/** SSR-safe load. Returns empty tree outside the browser. */
export function loadWritable(): WritableTree {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as WritableTree) : {};
  } catch {
    return {};
  }
}

/** SSR-safe save. Silently ignores quota/serialization errors. */
export function saveWritable(tree: WritableTree): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(tree));
  } catch {
    /* ignore quota errors */
  }
}

/** Reset the writable tree — used by `clear` of the user space only. */
export function resetWritable(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
}

/** Strip the /home/rita/ prefix → relative key. */
export function relKey(absPath: string): string {
  let p = absPath.replace(/^\/+/, "");
  if (p.startsWith("home/rita/")) p = p.slice("home/rita/".length);
  else if (p === "home/rita" || p === "home") p = "";
  return p;
}
