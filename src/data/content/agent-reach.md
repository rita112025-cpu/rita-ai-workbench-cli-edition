# Agent Reach capability adapter

A self-contained Python package that gives this project a **capability layer** for
research acquisition. It is additive: nothing under `research/agent-reach/` touches the
static site at the repository root, and the GitHub Pages deployment is unaffected.

## What Agent Reach is used for here

[Agent Reach](https://github.com/Panniantong/Agent-Reach) is, by its own design, a
capability layer rather than a scraper — it selects, installs and health-checks the
most reliable access path per platform, and the calling agent invokes the upstream
tool itself. There is no `agent-reach fetch` subcommand.

This adapter therefore uses it for exactly five things:

| Purpose | How |
| --- | --- |
| capability discovery | `agent-reach doctor --json` |
| backend availability | per-channel `status` / `active_backend` |
| health check | `AgentReachAdapter.is_available()` / `.doctor()` |
| routing metadata | `build_routing_index(report)` |
| controlled CLI execution | `AgentReachAdapter.fetch(url)` |

**Agent Reach is not this project's only or general-purpose crawler.**

## Install

Agent Reach is an *optional external tool*. This package has **no runtime
dependencies** and its unit tests run offline without it.

```bash
python -m venv .venv
.venv/Scripts/pip install -e "research/agent-reach[dev]"
```

To install Agent Reach itself, use the **GitHub archive**, not PyPI:

```bash
pip install "https://github.com/Panniantong/agent-reach/archive/main.zip"
```

---
Source: rita-ai-workbench/research/agent-reach/README.md (excerpt, verbatim)
