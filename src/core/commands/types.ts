/**
 * Command result schema — the single contract returned by every command.
 * ==================================================================
 * UI layer only needs to: render `output`, render `error`, and execute
 * an approved `action`. No command returns HTML strings.
 */

export interface OutputLine {
  type: "text" | "kv" | "list" | "table" | "heading" | "divider" | "tree" | "raw";
  text?: string;
  k?: string;
  v?: string;
  items?: string[];
  rows?: string[][];
  level?: 1 | 2;
}

export interface CommandError {
  code: string;
  message: string;
}

export interface OpenUrlAction {
  type: "OPEN_URL";
  source: "manifest";
  projectId: string;
  linkType: "demo" | "github";
  url: string;
}

export interface CommandResult {
  ok: boolean;
  output: OutputLine[];
  error: CommandError | null;
  nextState: {
    cwd?: string;
    clearScreen?: boolean;
    enterPager?: boolean;
    pagerContent?: string;
    prefs?: Partial<{ theme: "amber" | "green" | "white"; crt: boolean; sound: boolean }>;
  };
  action: OpenUrlAction | null;
}

export function ok(output: OutputLine[], nextState: CommandResult["nextState"] = {}, action: OpenUrlAction | null = null): CommandResult {
  return { ok: true, output, error: null, nextState, action };
}

export function fail(code: string, message: string): CommandResult {
  return { ok: false, output: [], error: { code, message }, nextState: {}, action: null };
}

export const text = (t: string): OutputLine => ({ type: "text", text: t });
export const heading = (t: string, level: 1 | 2 = 1): OutputLine => ({ type: "heading", text: t, level });
export const divider = (): OutputLine => ({ type: "divider" });
export const kv = (k: string, v: string): OutputLine => ({ type: "kv", k, v });
export const list = (items: string[]): OutputLine => ({ type: "list", items });
export const table = (rows: string[][]): OutputLine => ({ type: "table", rows });
export const raw = (text: string): OutputLine => ({ type: "raw", text });
