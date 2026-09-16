/**
 * resolve-target — resolve an "open target" request to an action.
 * ==================================================================
 * demo / github / open all funnel here. The URL returned is taken ONLY
 * from the canonical manifest allowlist. Arbitrary user-supplied URLs
 * are NEVER returned as an OPEN_URL action.
 *
 * Returns an OPEN_URL action descriptor, or an explicit "denied"/"none"
 * result so the command engine can render the right message.
 */

import type { Project } from "@/data/workbench-manifest";
import type { ResearchProject } from "@/data/research-manifest";

export type LinkType = "demo" | "github";

export interface OpenUrlAction {
  type: "OPEN_URL";
  source: "manifest";
  projectId: string;
  linkType: LinkType;
  url: string;
}

export type TargetResolution =
  | { kind: "ok"; action: OpenUrlAction }
  | { kind: "no_link"; projectId: string; linkType: LinkType }
  | { kind: "not_found"; input: string }
  | { kind: "denied"; reason: string; input: string };

/**
 * Build an OPEN_URL action for a project, but ONLY if its manifest link
 * is non-null. If the link is null, return no_link so the engine can
 * tell the user there is no published URL.
 */
export function resolveProjectLink(
  project: Project,
  linkType: LinkType
): TargetResolution {
  const url = project.links[linkType];
  if (!url) {
    return { kind: "no_link", projectId: project.id, linkType };
  }
  return {
    kind: "ok",
    action: {
      type: "OPEN_URL",
      source: "manifest",
      projectId: project.id,
      linkType,
      url,
    },
  };
}

/**
 * Reject arbitrary user-supplied URLs. The CLI `open <something>` only
 * accepts a manifest project id; it NEVER opens a raw URL.
 */
export function resolveArbitraryUrl(input: string): TargetResolution {
  // block anything that is not a known manifest id — by design we do not
  // even look at the shape of the input.
  return {
    kind: "denied",
    reason: "open: only manifest project ids are accepted (arbitrary URLs are blocked)",
    input,
  };
}

/** Resolve an "open <id>" style request — id must be a manifest project. */
export function resolveOpenTarget(
  resolved: { kind: "project"; project: Project } | { kind: "research"; research: ResearchProject } | { kind: "none" },
  linkType: LinkType,
  rawInput: string
): TargetResolution {
  if (resolved.kind === "project") {
    return resolveProjectLink(resolved.project, linkType);
  }
  if (resolved.kind === "research") {
    // research projects don't carry demo/github links in the manifest
    return { kind: "no_link", projectId: resolved.research.id, linkType };
  }
  // If the input looks like a URL, it's explicitly denied (not "not found").
  if (/^https?:\/\//i.test(rawInput) || /^javascript:/i.test(rawInput)) {
    return resolveArbitraryUrl(rawInput);
  }
  return { kind: "not_found", input: rawInput };
}
