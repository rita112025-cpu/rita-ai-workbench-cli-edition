/**
 * Verbatim README excerpt for research/scrapling.
 * Source: rita-ai-workbench/research/scrapling/README.md (transcribed).
 * Stored as a TS string so no markdown loader / declaration is needed.
 */
export const SCRAPLING_MD = `# Scrapling parsing and adaptive extraction layer

A self-contained Python package for **public web acquisition**: fetch, keep the raw
evidence, normalize, extract. Additive: nothing under \`research/scrapling/\` touches the
static site at the repository root.

## Scope

- public web acquisition
- HTML extraction
- structured extraction (named CSS rules)
- adaptive selector support (Scrapling element relocation)
- optional JavaScript rendering — **interface only, see below**

This integration is intended for publicly accessible content and does not override site
access controls, robots policies, contractual restrictions, authentication requirements,
or rate limits.

## The patchright constraint, and what it changed

Scrapling 0.4.15's \`fetchers\` extra declares **patchright** as a dependency, and
\`scrapling/engines/toolbelt/convertor.py\` imports it at module level. Verified on
2026-09-16: installing \`scrapling\` + \`curl_cffi\` + \`playwright\` **without** patchright
makes \`Fetcher\`, \`DynamicFetcher\` and \`StealthyFetcher\` all fail to import with
\`ModuleNotFoundError: No module named 'patchright'\`. There is no partial path — even the
plain HTTP \`Fetcher\` needs it.

This project does not install or integrate patchright. So:

| Concern | Implementation |
| --- | --- |
| HTML parsing | **Scrapling** \`scrapling.parser.Selector\` |
| adaptive element relocation | **Scrapling** \`Selector(adaptive=True)\` + SQLite element store |
| HTTP transport | standard library, behind the \`Transport\` protocol |
| JavaScript rendering | \`DynamicRenderer\` protocol, **no implementation shipped** |

Scrapling is used for the thing it is uniquely good at. The transport is boring on
purpose and sits behind a seam, so a Scrapling-based transport can replace it later
without touching the collector, the normalized result or the error taxonomy.

---
Source: rita-ai-workbench/research/scrapling/README.md (excerpt, verbatim)
`;
