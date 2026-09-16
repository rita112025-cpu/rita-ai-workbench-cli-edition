"use client";

/**
 * OutputRenderer — renders structured OutputLine[] from the command engine.
 * ==================================================================
 * Pure JSX. Never uses dangerouslySetInnerHTML. Never injects manifest
 * strings as HTML. All text is rendered as React text nodes, which the
 * framework escapes automatically.
 */

import type { OutputLine } from "@/core/commands/types";

function TableBlock({ rows }: { rows: string[][] }) {
  if (rows.length === 0) return null;
  const cols = Math.max(...rows.map((r) => r.length));
  return (
    <div className="term-table" role="table">
      {rows.map((r, i) => (
        <div className="term-table-row" key={i} role="row">
          {Array.from({ length: cols }).map((_, c) => (
            <span
              className={`term-table-cell ${c === 0 ? "term-table-cell-key" : ""}`}
              key={c}
              role="cell"
            >
              {r[c] ?? ""}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function OutputLineView({ line }: { line: OutputLine }) {
  switch (line.type) {
    case "heading":
      return <div className={`term-heading term-heading-${line.level ?? 1}`}>{line.text}</div>;
    case "divider":
      return <div className="term-divider" aria-hidden="true" />;
    case "kv":
      return (
        <div className="term-kv">
          <span className="term-kv-k">{line.k}</span>
          <span className="term-kv-sep">: </span>
          <span className="term-kv-v">{line.v}</span>
        </div>
      );
    case "list":
      return (
        <ul className="term-list">
          {(line.items ?? []).map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      );
    case "table":
      return <TableBlock rows={line.rows ?? []} />;
    case "raw":
      return <pre className="term-raw">{line.text}</pre>;
    case "text":
    default:
      return <div className="term-text">{line.text}</div>;
  }
}

export function OutputRenderer({ lines }: { lines: OutputLine[] }) {
  return (
    <div className="term-output-block">
      {lines.map((line, i) => (
        <OutputLineView key={i} line={line} />
      ))}
    </div>
  );
}
