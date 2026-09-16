/**
 * Rita AI Workbench — Research Manifest
 * ==================================================================
 * Source: https://github.com/rita112025-cpu/rita-ai-workbench
 * Method:  git clone --depth 1, then read of:
 *            - research/scrapling/README.md
 *            - research/agent-reach/README.md
 *
 * README full text lives in src/data/content/*.md and is loaded lazily
 * by the `cat research/<id>/README.md` command, so it does NOT bloat
 * the main bundle. This manifest only holds metadata + a short summary.
 */

import type { ProvenanceMeta } from "./workbench-manifest";
import { deepFreeze } from "@/core/deep-freeze";

export interface ResearchProject {
  id: string;
  name: string;
  /** path inside the cloned repo */
  path: string;
  summary: string;
  /** key facts transcribed from the README (verbatim wording) */
  highlights: string[];
  /** which content/*.md file holds the full README excerpt */
  contentFile: string;
  _meta: ProvenanceMeta;
}

const META_SCRA: ProvenanceMeta = {
  source: "rita-ai-workbench/research/scrapling/README.md",
  sourceVerified: true,
  githubLinkVerified: false,
  demoLinkVerified: false,
  lastCheckedAt: null,
};

const META_REACH: ProvenanceMeta = {
  source: "rita-ai-workbench/research/agent-reach/README.md",
  sourceVerified: true,
  githubLinkVerified: false,
  demoLinkVerified: false,
  lastCheckedAt: null,
};

export const RESEARCH_PROJECTS: ResearchProject[] = deepFreeze([
  {
    id: "scrapling",
    name: "Scrapling parsing and adaptive extraction layer",
    path: "research/scrapling",
    summary:
      "A self-contained Python package for public web acquisition: fetch, keep the raw evidence, normalize, extract. Additive: nothing under research/scrapling/ touches the static site at the repository root.",
    highlights: [
      "public web acquisition / HTML extraction / structured extraction (named CSS rules)",
      "adaptive selector support (Scrapling element relocation)",
      "optional JavaScript rendering — interface only, no implementation shipped",
      "intended for publicly accessible content; does not override site access controls, robots policies, contractual restrictions, authentication requirements, or rate limits",
    ],
    contentFile: "scrapling.md",
    _meta: META_SCRA,
  },
  {
    id: "agent-reach",
    name: "Agent Reach capability adapter",
    path: "research/agent-reach",
    summary:
      "A self-contained Python package that gives this project a capability layer for research acquisition. Additive: nothing under research/agent-reach/ touches the static site at the repository root, and the GitHub Pages deployment is unaffected.",
    highlights: [
      "Agent Reach is a capability layer, not a scraper — selects, installs and health-checks the most reliable access path per platform",
      "no `agent-reach fetch` subcommand; the calling agent invokes the upstream tool itself",
      "used here for exactly five things: capability discovery, backend availability, health check, routing metadata, controlled CLI execution",
      "optional external tool; this package has no runtime dependencies and its unit tests run offline without it",
    ],
    contentFile: "agent-reach.md",
    _meta: META_REACH,
  },
]);

export function findResearchById(id: string): ResearchProject | undefined {
  return RESEARCH_PROJECTS.find((r) => r.id === id || r.name === id);
}
