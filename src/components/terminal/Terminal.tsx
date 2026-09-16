"use client";

/**
 * Terminal — the ONLY UI surface for Rita AI Workbench CLI Edition.
 * ==================================================================
 * Responsibilities (thin layer over the pure engine):
 *   - render CommandResult.output (structured, via OutputRenderer)
 *   - render CommandResult.error
 *   - execute approved OPEN_URL actions (window.open)
 *   - manage session: cwd, command history, theme, crt, sound prefs
 *   - keyboard: blink cursor 1.06s, tab ghost-completion, ↑/↓ history,
 *     help man-page pager (q/Esc to exit)
 *   - mobile shortcut chips above the keyboard
 *
 * The engine does ALL data/permission/resolution work. This component
 * never re-implements project lookup, URL allowlisting or path logic.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { executeCommand } from "@/core/commands/execute-command";
import { parseCommand } from "@/core/commands/parse-command";
import { resolvePath, toPromptPath } from "@/core/resolver/resolve-path";
import { allProjectIds } from "@/core/resolver/resolve-project";
import type { CommandResult, OutputLine } from "@/core/commands/types";
import { OutputRenderer } from "./OutputRenderer";
import { ABOUT, SYSTEM } from "@/data/workbench-manifest";

type Theme = "amber" | "green" | "white";

interface ScreenLine {
  id: number;
  kind: "input" | "output" | "error" | "system";
  cwd?: string;
  command?: string;
  lines?: OutputLine[];
  error?: { code: string; message: string };
}

const THEME_BG: Record<Theme, string> = {
  amber: "#0a0700",
  green: "#000700",
  white: "#000000",
};
const THEME_FG: Record<Theme, string> = {
  amber: "#ffb000",
  green: "#33ff66",
  white: "#e8e8e8",
};

const LS_THEME = "rita-cli:theme";
const LS_CRT = "rita-cli:crt";
const LS_SOUND = "rita-cli:sound";

function loadPref<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(key);
    return (v === null ? fallback : (v as unknown as T));
  } catch {
    return fallback;
  }
}
function loadBoolPref(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(key);
    if (v === null) return fallback;
    return v === "true";
  } catch {
    return fallback;
  }
}
function savePref(key: string, v: string) {
  try {
    window.localStorage.setItem(key, v);
  } catch {
    /* ignore */
  }
}

// Mechanical-keyboard click synthesized via WebAudio (no asset needed).
function playClick(soundOn: boolean) {
  if (!soundOn) return;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 1100 + Math.random() * 200;
    gain.gain.value = 0.018;
    osc.connect(gain).connect(ctx.destination);
    const t = ctx.currentTime;
    osc.start(t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.stop(t + 0.06);
    setTimeout(() => ctx.close(), 120);
  } catch {
    /* ignore */
  }
}

interface Prefs {
  theme: Theme;
  crt: boolean;
  sound: boolean;
}
const DEFAULT_PREFS: Prefs = { theme: "amber", crt: true, sound: false };

function loadPreferences(): Prefs {
  return {
    theme: loadPref<Theme>(LS_THEME, "amber"),
    crt: loadBoolPref(LS_CRT, true),
    sound: loadBoolPref(LS_SOUND, false),
  };
}

function createBootLines(): OutputLine[] {
  return [
    { type: "heading", text: `${SYSTEM.name}`, level: 1 },
    { type: "text", text: SYSTEM.version },
    { type: "text", text: "" },
    { type: "text", text: "AI-assisted tools, workflows and experiments." },
    { type: "text", text: "" },
    { type: "text", text: "System ready." },
    { type: "text", text: "" },
    { type: "text", text: "Try:" },
    { type: "list", items: [
      "projects            browse projects",
      "skills              inspect reusable skills",
      "workflows           view AI workflows",
      "research            browse research",
      "demo yijing         launch a live project",
      "search automation    search the workbench",
      "help                 command reference",
    ] },
    { type: "text", text: "" },
  ];
}

export function Terminal() {
  const [cwd, setCwd] = useState("/home/rita");
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  // boot banner is fixed init content → lazy initializer (no effect, no lint issue)
  const [screen, setScreen] = useState<ScreenLine[]>(() => [
    { id: 1, kind: "output", lines: createBootLines() },
  ]);
  // prefs default to safe SSR values; restored from localStorage after hydration
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [fading, setFading] = useState(false);
  const [pager, setPager] = useState<{ content: OutputLine[] } | null>(null);
  const idRef = useRef(1); // boot line already consumed id 1
  const inputRef = useRef<HTMLInputElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const blinkRef = useRef<HTMLSpanElement>(null);
  const { theme, crt, sound } = prefs;

  // restore persisted browser preferences after mount (single scoped exception).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefs(loadPreferences());
  }, []);

  // stable output helpers — nextId computed inside the setScreen updater
  // so these callbacks have genuinely empty dependency arrays.
  const pushOutput = useCallback((lines: OutputLine[]) => {
    setScreen((s) => [...s, { id: ++idRef.current, kind: "output", lines }]);
  }, []);

  const pushSystem = useCallback((text: string) => {
    setScreen((s) => [...s, { id: ++idRef.current, kind: "system", lines: [{ type: "text", text }] }]);
  }, []);

  // stable id generator (refs only — empty deps)
  const nextId = useCallback(() => ++idRef.current, []);

  // auto-scroll to bottom
  useEffect(() => {
    if (screenRef.current) {
      screenRef.current.scrollTop = screenRef.current.scrollHeight;
    }
  }, [screen, pager]);

  // focus input on mount + on container click
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const focusInput = () => inputRef.current?.focus();

  // cursor blink at 1.06s
  useEffect(() => {
    const el = blinkRef.current;
    if (!el) return;
    let on = true;
    const iv = window.setInterval(() => {
      on = !on;
      el.style.visibility = on ? "visible" : "hidden";
    }, 1060);
    return () => window.clearInterval(iv);
  }, []);

  // completion candidates: commands + project ids + common paths
  const completionCandidates = useMemo(() => {
    const cmds = [
      "help", "ls", "cd", "pwd", "cat", "clear", "projects", "skills",
      "workflows", "research", "search", "demo", "github", "open", "run",
      "status", "logs", "history", "whoami", "neofetch", "theme", "crt",
      "sound", "mkdir", "rm", "about",
    ];
    return [...cmds, ...allProjectIds()];
  }, []);

  // ghost suggestion is derived state, not an effect: compute it directly
  // from `input` so there are no cascading setState calls.
  const ghost = useMemo(() => {
    const v = input.trim();
    if (!v || v.includes(" ")) return "";
    const lower = v.toLowerCase();
    const hit = completionCandidates.find(
      (c) => c.toLowerCase().startsWith(lower) && c.toLowerCase() !== lower
    );
    return hit ? hit.slice(v.length) : "";
  }, [input, completionCandidates]);

  const applyTheme = useCallback((next: Theme) => {
    setFading(true);
    window.setTimeout(() => {
      setPrefs((p) => ({ ...p, theme: next }));
      savePref(LS_THEME, next);
      setFading(false);
    }, 200);
  }, []);

  const runCommand = useCallback(
    (raw: string) => {
      const cmd = raw.trim();
      // echo input line
      setScreen((s) => [
        ...s,
        { id: nextId(), kind: "input", cwd, command: cmd },
      ]);
      if (cmd === "") return;
      setHistory((h) => [...h, cmd]);
      setHistoryIdx(-1);

      const ctx = { cwd, theme, crt, sound };
      const result: CommandResult = executeCommand(cmd, ctx);

      // theme switch
      const themeMatch = cmd.match(/^theme\s+(\w+)/i);
      if (themeMatch) {
        const t = themeMatch[1].toLowerCase();
        if (t === "amber" || t === "green" || t === "white") {
          applyTheme(t);
        }
      }
      const crtMatch = cmd.match(/^crt\s+(\w+)/i);
      if (crtMatch) {
        const v = crtMatch[1].toLowerCase() === "on";
        setPrefs((p) => ({ ...p, crt: v }));
        savePref(LS_CRT, v ? "true" : "false");
      }
      const soundMatch = cmd.match(/^sound\s+(\w+)/i);
      if (soundMatch) {
        const v = soundMatch[1].toLowerCase() === "on";
        setPrefs((p) => ({ ...p, sound: v }));
        savePref(LS_SOUND, v ? "true" : "false");
      }

      if (result.nextState.clearScreen) {
        setScreen([]);
        return;
      }
      if (result.nextState.cwd) {
        setCwd(result.nextState.cwd);
      }
      if (result.nextState.enterPager) {
        setPager({ content: result.output });
        return;
      }
      if (!result.ok && result.error) {
        setScreen((s) => [...s, { id: nextId(), kind: "error", error: result.error! }]);
        return;
      }
      if (result.output.length > 0) {
        setScreen((s) => [...s, { id: nextId(), kind: "output", lines: result.output }]);
      }
      // execute approved action (URL allowlist enforced by engine)
      if (result.action && result.action.type === "OPEN_URL") {
        pushSystem(`↗ opening ${result.action.linkType}: ${result.action.url}`);
        try {
          window.open(result.action.url, "_blank", "noopener,noreferrer");
        } catch {
          pushSystem(`(popup blocked — copy URL manually)`);
        }
      }
    },
    [cwd, theme, crt, sound, applyTheme, pushSystem]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    playClick(sound);

    // pager intercepts keys
    if (pager) {
      if (e.key === "q" || e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        setPager(null);
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      runCommand(input);
      setInput("");
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      if (ghost) {
        setInput((v) => v + ghost);
      }
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const idx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(idx);
      setInput(history[idx]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (history.length === 0 || historyIdx === -1) return;
      const idx = historyIdx + 1;
      if (idx >= history.length) {
        setHistoryIdx(-1);
        setInput("");
      } else {
        setHistoryIdx(idx);
        setInput(history[idx]);
      }
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      setScreen([]);
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === "c") {
      e.preventDefault();
      const cmd = input;
      if (cmd) {
        setScreen((s) => [...s, { id: nextId(), kind: "input", cwd, command: cmd + " ^C" }]);
      }
      setInput("");
      return;
    }
  };

  const promptPath = toPromptPath(cwd);
  const prompt = `rita@workbench:${promptPath}$`;

  const chips = ["projects", "skills", "research", "help", "clear", "status", "neofetch"];

  const handleChip = (c: string) => {
    runCommand(c);
    setInput("");
    focusInput();
  };

  const bg = THEME_BG[theme];
  const fg = THEME_FG[theme];

  return (
    <div
      className="term-root"
      style={{ ["--term-bg" as string]: bg, ["--term-fg" as string]: fg }}
      data-theme={theme}
      data-crt={crt ? "on" : "off"}
      onClick={focusInput}
    >
      {/* CRT scanline overlay */}
      {crt && <div className="term-crt-overlay" aria-hidden="true" />}
      {crt && <div className="term-crt-vignette" aria-hidden="true" />}

      {/* fade layer for theme switch */}
      <div className={`term-fade ${fading ? "term-fade-active" : ""}`} aria-hidden="true" />

      <div className="term-shell">
        {/* top bar */}
        <header className="term-topbar">
          <div className="term-topbar-left">
            <span className="term-dot term-dot-red" />
            <span className="term-dot term-dot-yellow" />
            <span className="term-dot term-dot-green" />
            <span className="term-topbar-title">{SYSTEM.name} — {SYSTEM.version}</span>
          </div>
          <div className="term-topbar-right">
            <span className="term-topbar-tag">theme: {theme}</span>
            <span className="term-topbar-tag">crt: {crt ? "on" : "off"}</span>
            <span className="term-topbar-tag">sound: {sound ? "on" : "off"}</span>
          </div>
        </header>

        {/* screen */}
        <div className="term-screen" ref={screenRef} role="log" aria-live="polite">
          {pager ? (
            <div className="term-pager" role="region" aria-label="help — press q to exit">
              <OutputRenderer lines={pager.content} />
              <div className="term-pager-hint">── press q / Esc / Enter to exit ──</div>
            </div>
          ) : (
            <>
              {screen.map((line) => {
                if (line.kind === "input") {
                  return (
                    <div className="term-input-line" key={line.id}>
                      <span className="term-prompt">{line.cwd ? `rita@workbench:${toPromptPath(line.cwd)}$` : prompt}</span>
                      <span className="term-cmd">{line.command}</span>
                    </div>
                  );
                }
                if (line.kind === "error") {
                  return (
                    <div className="term-error-line" key={line.id}>
                      <span className="term-error-code">[{line.error!.code}]</span>{" "}
                      <span>{line.error!.message}</span>
                    </div>
                  );
                }
                if (line.kind === "system") {
                  return (
                    <div className="term-system-line" key={line.id}>
                      {line.lines?.map((l, i) => (
                        <span key={i}>{l.text}</span>
                      ))}
                    </div>
                  );
                }
                return <OutputRenderer key={line.id} lines={line.lines ?? []} />;
              })}

              {/* active input line with ghost text */}
              <div className="term-input-line term-input-active" id="term-active-line">
                <span className="term-prompt">{prompt}</span>
                <span className="term-input-wrap">
                  <span className="term-typed">{input}</span>
                  <span className="term-ghost">{ghost}</span>
                  <span className="term-cursor" ref={blinkRef} aria-hidden="true">█</span>
                </span>
              </div>
            </>
          )}
        </div>

        {/* mobile shortcut chips */}
        <div className="term-chips" role="toolbar" aria-label="quick commands">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              className="term-chip"
              onClick={(e) => {
                e.stopPropagation();
                handleChip(c);
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* hidden real input that captures keys on mobile + desktop */}
        <input
          ref={inputRef}
          className="term-hidden-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="terminal input"
          inputMode="text"
        />
      </div>

      {/* sticky status footer */}
      <footer className="term-footer" role="contentinfo">
        <span className="term-footer-item">
          <span className="term-footer-k">cwd</span> {promptPath}
        </span>
        <span className="term-footer-item">
          <span className="term-footer-k">projects</span> {ABOUT.totalTools}
        </span>
        <span className="term-footer-item">
          <span className="term-footer-k">theme</span> {theme}
        </span>
        <span className="term-footer-item term-footer-hint">
          tab: complete · ↑↓: history · help · clear
        </span>
      </footer>
    </div>
  );
}
