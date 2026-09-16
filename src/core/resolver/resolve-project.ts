/**
 * resolve-project — the SINGLE project lookup entry point.
 * ==================================================================
 * Every command (cat, search, demo, github, open, run) resolves a
 * project id through resolveProject(id). No command maintains its own
 * project map.
 *
 * Lookup order:
 *   1. exact id
 *   2. exact repo name
 *   3. exact display name
 *   4. case-insensitive id
 *
 * Returns a discriminated union so callers know whether they got a
 * project, a research project, or nothing.
 */

import { findProjectById, PROJECTS, type Project } from "@/data/workbench-manifest";
import { findResearchById, RESEARCH_PROJECTS, type ResearchProject } from "@/data/research-manifest";

export type ResolvedTarget =
  | { kind: "project"; project: Project }
  | { kind: "research"; research: ResearchProject }
  | { kind: "none" };

export function resolveProject(id: string): ResolvedTarget {
  if (!id || typeof id !== "string") return { kind: "none" };
  const trimmed = id.trim();

  // 1. exact id / repo / name (manifest helpers)
  const byId = findProjectById(trimmed);
  if (byId) return { kind: "project", project: byId };

  const byRepo = PROJECTS.find((p) => p.repo === trimmed);
  if (byRepo) return { kind: "project", project: byRepo };

  const byName = PROJECTS.find((p) => p.name === trimmed);
  if (byName) return { kind: "project", project: byName };

  // research lookup
  const rById = findResearchById(trimmed);
  if (rById) return { kind: "research", research: rById };

  // 4. case-insensitive id (last resort, deterministic)
  const lower = trimmed.toLowerCase();
  const ci = PROJECTS.find((p) => p.id.toLowerCase() === lower);
  if (ci) return { kind: "project", project: ci };

  const ri = RESEARCH_PROJECTS.find((r) => r.id.toLowerCase() === lower);
  if (ri) return { kind: "research", research: ri };

  return { kind: "none" };
}

/** All project ids (used by tab-completion + search). */
export function allProjectIds(): string[] {
  return PROJECTS.map((p) => p.id);
}
