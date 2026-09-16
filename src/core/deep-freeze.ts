/**
 * Recursively freezes an object graph. Used on every canonical manifest
 * export (PROJECTS, ABOUT, SYSTEM, RESEARCH_PROJECTS) so "nothing mutates
 * the manifest" — the invariant the URL allowlist and VFS read-only areas
 * depend on — is enforced at runtime, not just assumed by convention.
 */
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value as object)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  }
  return value;
}
