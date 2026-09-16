/**
 * Rita AI Workbench — Canonical Content Manifest
 * ==================================================================
 * Source:  https://github.com/rita112025-cpu/rita-ai-workbench
 * Method:  `git clone --depth 1` then read of:
 *            - README.md
 *            - app.js   (the `tools` array — 43 entries)
 *
 * Provenance (_meta):
 *   source              file inside the repo the value came from
 *   sourceVerified      true  => transcribed verbatim from the cloned repo
 *   githubLinkVerified  false => live GitHub URL NOT checked yet
 *   demoLinkVerified    false => live Demo URL NOT checked yet
 *   lastCheckedAt       null  => no verification run yet
 *
 * A separate link-verification phase later flips the two *LinkVerified
 * flags to true/false based on actual HTTP checks and stamps lastCheckedAt.
 *
 * Constraints honoured:
 *   - Original repo values preserved exactly (description / status / tags).
 *   - Missing GitHub/Demo URL => null  (never "" / "#" / a fake URL).
 *   - id is unique & stable — VFS, search, demo/github/open/cat/run all
 *     resolve through projectResolver(id) against this single source.
 *   - Verification state never mixed into the original `status`.
 *   - Skills / Workflows views are DERIVED from project tags, not fabricated.
 */

export type ToolStatus = "常用" | "可用" | "整理中" | "研究中";

export interface ProvenanceMeta {
  source: string;
  sourceVerified: boolean;
  githubLinkVerified: boolean;
  demoLinkVerified: boolean;
  lastCheckedAt: string | null;
}

export interface ProjectLinks {
  github: string | null;
  demo: string | null;
}

export interface Project {
  /** canonical stable id; used by demo/github/open/cat/search/run resolvers */
  id: string;
  /** display name (matches repo `name`) */
  name: string;
  /** actual repo name on GitHub (may differ from display) */
  repo: string;
  owner: string;
  /** Chinese category, exactly as in source */
  category: string;
  description: string;
  detail: string;
  tags: string[];
  status: ToolStatus;
  links: ProjectLinks;
  /** true when forked from upstream */
  fork?: boolean;
  _meta: ProvenanceMeta;
}

export interface AboutInfo {
  title: string;
  subtitle: string;
  owner: string;
  blurb: string[];
  stack: string[];
  categories: string[];
  totalTools: number;
  links: ProjectLinks;
  _meta: ProvenanceMeta;
}

export interface SystemInfo {
  name: string;
  version: string;
  filesystemVersion: number;
  sourceRepo: string;
  _meta: ProvenanceMeta;
}

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

export const OWNER = "rita112025-cpu";

const META_TOOL: ProvenanceMeta = {
  source: "rita-ai-workbench/app.js",
  sourceVerified: true,
  githubLinkVerified: false,
  demoLinkVerified: false,
  lastCheckedAt: null,
};

const META_README: ProvenanceMeta = {
  source: "rita-ai-workbench/README.md",
  sourceVerified: true,
  githubLinkVerified: false,
  demoLinkVerified: false,
  lastCheckedAt: null,
};

/* ------------------------------------------------------------------ */
/* System & About                                                     */
/* ------------------------------------------------------------------ */

export const SYSTEM: SystemInfo = {
  name: "Rita AI Workbench",
  version: "CLI Edition v1.0",
  filesystemVersion: 1,
  sourceRepo: "https://github.com/rita112025-cpu/rita-ai-workbench",
  _meta: META_README,
};

export const ABOUT: AboutInfo = {
  title: "Rita AI 工作台",
  subtitle: "CLI Edition v1.0",
  owner: OWNER,
  blurb: [
    "一頁式導航網站：整理 Codex、Claude Code、Prompt、工作自動化與工程工具。",
    "本 CLI Edition 把同一批工具重新包裝成終端機介面，作為入口與能力索引。",
    "資料來源為真實 repository manifest（非模擬資料）。",
  ],
  stack: ["HTML", "CSS", "JavaScript", "GitHub Pages", "GitHub API (read-only)"],
  categories: [
    "常用 Prompt",
    "Codex 工具",
    "Claude Code 分工",
    "工作自動化工具",
    "AI 實驗 / Demo",
    "工程 / 報價工具",
    "學習與資源",
    "生活 / 其他",
  ],
  totalTools: 43,
  links: {
    github: "https://github.com/rita112025-cpu/rita-ai-workbench",
    demo: null,
  },
  _meta: META_README,
};

/* ------------------------------------------------------------------ */
/* Projects (43 — verbatim from repo app.js `tools` array)            */
/* ------------------------------------------------------------------ */

export const PROJECTS: Project[] = [
  { id: "prompt-library", name: "PROMPT-LIBRARY", repo: "PROMPT-LIBRARY", owner: "rita112025-cpu", category: "常用 Prompt", description: "集中管理常用 Prompt。", detail: "放置可重複使用的 Prompt，例如工作分析、報告整理、程式審查、工具規劃等。", tags: ["Prompt", "Library", "AI 工作流"], status: "常用", links: { github: "https://github.com/rita112025-cpu/PROMPT-LIBRARY", demo: "https://rita112025-cpu.github.io/PROMPT-LIBRARY/" }, _meta: META_TOOL },
  { id: "gpt6-astra-prompts", name: "gpt6-astra-prompts", repo: "gpt6-astra-prompts", owner: "rita112025-cpu", category: "常用 Prompt", description: "Astra / GPT-6 相關提示詞整理。", detail: "整理 GPT-6 Astra 使用場景、工具連接、工作流程與進階 Prompt。", tags: ["GPT-6", "Astra", "Prompt"], status: "可用", links: { github: "https://github.com/rita112025-cpu/gpt6-astra-prompts", demo: "https://rita112025-cpu.github.io/gpt6-astra-prompts/" }, _meta: META_TOOL },
  { id: "ai-prompt-deck", name: "ai-prompt-deck", repo: "ai-prompt-deck", owner: "rita112025-cpu", category: "常用 Prompt", description: "AI Prompt 簡報與教材素材。", detail: "適合整理成教學、簡報或內部分享內容。", tags: ["Prompt", "Deck", "教材"], status: "可用", links: { github: "https://github.com/rita112025-cpu/ai-prompt-deck", demo: "https://rita112025-cpu.github.io/ai-prompt-deck/" }, _meta: META_TOOL },
  { id: "work-prompts", name: "work-prompts", repo: "work-prompts", owner: "rita112025-cpu", category: "常用 Prompt", description: "工作用 AI 提示詞範本庫。", detail: "日常工作場景的提示詞範本，例如信件、報告、會議紀錄與交辦整理。", tags: ["Prompt", "工作", "範本"], status: "常用", links: { github: "https://github.com/rita112025-cpu/work-prompts", demo: null }, _meta: META_TOOL },
  { id: "ai-web-design-cheatsheet", name: "ai-web-design-cheatsheet", repo: "ai-web-design-cheatsheet", owner: "rita112025-cpu", category: "常用 Prompt", description: "AI 網頁設計快速參考手冊。", detail: "8 大靈感庫對照表，附可直接貼給 Codex / Claude / Cursor 的通用 Prompt，讓 AI 依規則改現有網站。", tags: ["網頁設計", "Prompt", "工作流"], status: "可用", links: { github: "https://github.com/rita112025-cpu/ai-web-design-cheatsheet", demo: "https://rita112025-cpu.github.io/ai-web-design-cheatsheet/" }, _meta: META_TOOL },

  { id: "codex-skills-hub", name: "codex-skills-hub", repo: "codex-skills-hub", owner: "rita112025-cpu", category: "Codex 工具", description: "Codex Skills 入口。", detail: "整理可用的 Codex skills、使用情境、安裝與應用方向。", tags: ["Codex", "Skills", "AI 工具"], status: "常用", links: { github: "https://github.com/rita112025-cpu/codex-skills-hub", demo: "https://rita112025-cpu.github.io/codex-skills-hub/" }, _meta: META_TOOL },
  { id: "local-workspace-mcp", name: "local-workspace-mcp", repo: "local-workspace-mcp", owner: "arumwu", category: "Codex 工具", description: "讓 AI 透過 MCP 存取本機檔案、終端程序、Office 文件與多台裝置。", detail: "⚠️ 原生 Windows 不建議使用（含 Unix 專用依賴）；安全性與相容性評估中。Alpha 研究用，勿裝進正式環境；來源為 upstream。", tags: ["MCP", "本機工作區", "Alpha"], status: "研究中", links: { github: "https://github.com/arumwu/local-workspace-mcp", demo: null }, fork: true, _meta: META_TOOL },
  { id: "rita-codex-skills", name: "rita-codex-skills", repo: "rita-codex-skills", owner: "rita112025-cpu", category: "Codex 工具", description: "個人 Codex Skills 集合。", detail: "集中管理、備份與跨電腦安裝常用 Skills，目前含 security（安全審查）、retro（回顧復盤）與 Windows 一鍵安裝腳本。", tags: ["Codex", "Skills", "備份"], status: "常用", links: { github: "https://github.com/rita112025-cpu/rita-codex-skills", demo: "https://rita112025-cpu.github.io/rita-codex-skills/" }, _meta: META_TOOL },
  { id: "vibe-coding-work-db", name: "vibe-coding-work-db", repo: "vibe-coding-work-db", owner: "rita112025-cpu", category: "Codex 工具", description: "實用 Skills 與 MCP 篩選清單。", detail: "從 mcpservers.org 篩出真正能放進日常開發流程的 Skills 與 MCP，拒絕玩具型工具。", tags: ["MCP", "Skills", "篩選"], status: "可用", links: { github: "https://github.com/rita112025-cpu/vibe-coding-work-db", demo: "https://rita112025-cpu.github.io/vibe-coding-work-db/" }, _meta: META_TOOL },
  { id: "dsh-starter", name: "dsh-starter", repo: "dsh-starter", owner: "rita112025-cpu", category: "Codex 工具", description: "DeepSeek Harness 入門模板。", detail: "下載、填入 API Key、雙擊啟動，幾分鐘內就能使用並試用「文件摘要」技能。", tags: ["DeepSeek", "模板", "入門"], status: "可用", links: { github: "https://github.com/rita112025-cpu/dsh-starter", demo: "https://rita112025-cpu.github.io/dsh-starter/" }, _meta: META_TOOL },

  { id: "claude-dual-session-prompts", name: "claude-dual-session-prompts", repo: "claude-dual-session-prompts", owner: "rita112025-cpu", category: "Claude Code 分工", description: "Claude Code 多視窗分工 Prompt。", detail: "支援不同 Claude Code 視窗分別負責讀程式、改程式、驗收、整合報告。", tags: ["Claude Code", "分工", "Prompt"], status: "常用", links: { github: "https://github.com/rita112025-cpu/claude-dual-session-prompts", demo: "https://rita112025-cpu.github.io/claude-dual-session-prompts/" }, _meta: META_TOOL },
  { id: "claude-skill-deck", name: "claude-skill-deck", repo: "claude-skill-deck", owner: "rita112025-cpu", category: "Claude Code 分工", description: "Claude Skill 教材與簡報。", detail: "適合整理 Claude Skills 的概念、應用方式與展示內容。", tags: ["Claude", "Skill", "Deck"], status: "可用", links: { github: "https://github.com/rita112025-cpu/claude-skill-deck", demo: "https://rita112025-cpu.github.io/claude-skill-deck/" }, _meta: META_TOOL },
  { id: "claude-guide-presbyopia-friendly", name: "claude-guide-presbyopia-friendly", repo: "Claude-Guide-Presbyopia-Friendly", owner: "rita112025-cpu", category: "Claude Code 分工", description: "Claude 使用指南。", detail: "整理 Claude 使用方式、分工模式與實務操作說明，適合長時間閱讀。", tags: ["Claude", "Guide", "Workflow"], status: "可用", links: { github: "https://github.com/rita112025-cpu/Claude-Guide-Presbyopia-Friendly", demo: "https://rita112025-cpu.github.io/Claude-Guide-Presbyopia-Friendly/" }, _meta: META_TOOL },
  { id: "six-skills-dashboard", name: "Six-Skills-Dashboard", repo: "Six-Skills-Dashboard", owner: "rita112025-cpu", category: "Claude Code 分工", description: "Agent Skill 總覽儀表板。", detail: "16 個 skill（6 核心 + 10 堆疊）集中管理，含階段篩選、互動評分、一鍵複製安裝路徑與 7 步工作流程圖。單檔 HTML、零依賴。", tags: ["Skill", "Dashboard", "Agent"], status: "常用", links: { github: "https://github.com/rita112025-cpu/Six-Skills-Dashboard", demo: "https://rita112025-cpu.github.io/Six-Skills-Dashboard/" }, _meta: META_TOOL },
  { id: "i-have-adhd", name: "i-have-adhd", repo: "i-have-adhd", owner: "rita112025-cpu", category: "Claude Code 分工", description: "ADHD 友善輸出 Skill。", detail: "fork 自上游，讓 coding agent 不要把答案埋在長篇說明裡：先給下一步動作、步驟編號、結尾一個具體行動。", tags: ["Skill", "輸出", "ADHD"], status: "常用", links: { github: "https://github.com/rita112025-cpu/i-have-adhd", demo: null }, _meta: META_TOOL },
  { id: "fable5-agent-battle", name: "fable5-agent-battle", repo: "fable5-agent-battle", owner: "rita112025-cpu", category: "Claude Code 分工", description: "AI Agent 對比驗收工作流。", detail: "獨立提案、隔離實作、共同驗收與證據裁決，用來比較多個 agent 的解法並留下可稽核的決策紀錄。", tags: ["Agent", "驗收", "工作流"], status: "研究中", links: { github: "https://github.com/rita112025-cpu/fable5-agent-battle", demo: null }, _meta: META_TOOL },

  { id: "daily-report-viewer", name: "daily-report-viewer", repo: "daily-report-viewer", owner: "rita112025-cpu", category: "工作自動化工具", description: "日報查看器。", detail: "用於查看、整理或展示工作日報與進度資料。", tags: ["日報", "Viewer", "工作追蹤"], status: "常用", links: { github: "https://github.com/rita112025-cpu/daily-report-viewer", demo: "https://rita112025-cpu.github.io/daily-report-viewer/" }, _meta: META_TOOL },
  { id: "line-summary-docx", name: "line-summary-docx", repo: "line-summary-docx", owner: "rita112025-cpu", category: "工作自動化工具", description: "LINE 對話摘要轉文件。", detail: "將 LINE 對話或文字紀錄整理成文件格式，適合做會議紀錄、工作摘要或交辦追蹤。", tags: ["LINE", "DOCX", "摘要"], status: "可用", links: { github: "https://github.com/rita112025-cpu/line-summary-docx", demo: null }, _meta: META_TOOL },
  { id: "subtitle-burner", name: "subtitle_burner", repo: "subtitle_burner", owner: "rita112025-cpu", category: "工作自動化工具", description: "字幕工具。", detail: "處理字幕、逐字稿或影音文字內容，支援燒錄與格式轉換。", tags: ["字幕", "逐字稿", "影音"], status: "可用", links: { github: "https://github.com/rita112025-cpu/subtitle_burner", demo: null }, _meta: META_TOOL },

  { id: "zsgc-store", name: "zsgc-store", repo: "zsgc-store", owner: "rita112025-cpu", category: "AI 實驗 / Demo", description: "全端電商示範站。", detail: "Next.js 16 + React 19 + Prisma + PostgreSQL，含商品目錄、購物車、願望清單、結帳、禮物卡、點數與後台。可當全端專案參考實作。", tags: ["Next.js", "全端", "電商"], status: "可用", links: { github: "https://github.com/rita112025-cpu/zsgc-store", demo: "https://zsgc-store.vercel.app" }, _meta: META_TOOL },
  { id: "tradingagents", name: "TradingAgents", repo: "TradingAgents", owner: "rita112025-cpu", category: "AI 實驗 / Demo", description: "多 Agent LLM 金融交易框架。", detail: "研究用 fork，觀察多 Agent 分工（分析、研究、交易、風控）如何協作。僅供研究，非投資建議。", tags: ["Multi-Agent", "LLM", "研究"], status: "研究中", links: { github: "https://github.com/rita112025-cpu/TradingAgents", demo: null }, fork: true, _meta: META_TOOL },
  { id: "longcat-avatar-cloud", name: "LongCat-Avatar-Cloud", repo: "LongCat-Avatar-Cloud", owner: "rita112025-cpu", category: "AI 實驗 / Demo", description: "雲端 GPU 數位人 Demo。", detail: "LongCat-Video-Avatar 1.5 talking-head 示範，支援 Colab / RunPod / Docker，權重由 Hugging Face 下載。需要 GPU 環境。", tags: ["Avatar", "GPU", "Hugging Face"], status: "研究中", links: { github: "https://github.com/rita112025-cpu/LongCat-Avatar-Cloud", demo: null }, _meta: META_TOOL },
  { id: "gods-eye-view", name: "gods-eye-view", repo: "gods-eye-view", owner: "rita112025-cpu", category: "AI 實驗 / Demo", description: "3D 地球開源情報視覺化。", detail: "fork 自上游，在瀏覽器裡用真實公開資料呈現衛星模擬視角，適合當地理資料視覺化的參考。", tags: ["3D", "OSINT", "視覺化"], status: "研究中", links: { github: "https://github.com/rita112025-cpu/gods-eye-view", demo: null }, fork: true, _meta: META_TOOL },

  { id: "construction-quote-tools", name: "taiwan-construction-quote-tools", repo: "construction-quote-tools", owner: "rita112025-cpu", category: "工程 / 報價工具", description: "台灣工程報價工具。", detail: "用於工程報價、材料項目、估價資料整理與比對。", tags: ["工程", "報價", "台灣"], status: "常用", links: { github: "https://github.com/rita112025-cpu/construction-quote-tools", demo: null }, _meta: META_TOOL },
  { id: "tw-construction-quote-parser", name: "tw-construction-quote-parser", repo: "tw-construction-quote-parser", owner: "rita112025-cpu", category: "工程 / 報價工具", description: "工程報價解析器。", detail: "解析工程報價資料，適合搭配 BOQ、標單或廠商報價整理。", tags: ["工程", "Parser", "BOQ"], status: "可用", links: { github: "https://github.com/rita112025-cpu/tw-construction-quote-parser", demo: null }, _meta: META_TOOL },
  { id: "boq-quote-cleaner", name: "boq-quote-cleaner", repo: "boq-quote-cleaner", owner: "rita112025-cpu", category: "工程 / 報價工具", description: "BOQ 報價清理工具。", detail: "清理 BOQ、報價表、材料項目與格式混亂的工程資料。", tags: ["BOQ", "報價", "清理"], status: "常用", links: { github: "https://github.com/rita112025-cpu/boq-quote-cleaner", demo: null }, _meta: META_TOOL },
  { id: "mep-boq-toolkit", name: "mep-boq-toolkit", repo: "mep-boq-toolkit", owner: "rita112025-cpu", category: "工程 / 報價工具", description: "機電標單工具組。", detail: "機電標單清整、預算覆核、系統別造價分析與 SAP 對帳的 Python 工具，含 Tkinter GUI。", tags: ["機電", "標單", "Python"], status: "可用", links: { github: "https://github.com/rita112025-cpu/mep-boq-toolkit", demo: null }, _meta: META_TOOL },

  { id: "revit-low-voltage-learning-guide", name: "revit-low-voltage-learning-guide", repo: "revit-low-voltage-learning-guide", owner: "rita112025-cpu", category: "學習與資源", description: "Revit 弱電學習指南。", detail: "整理 Revit 弱電系統學習內容，適合工程與 BIM 學習，已有線上展示。", tags: ["Revit", "弱電", "學習"], status: "常用", links: { github: "https://github.com/rita112025-cpu/revit-low-voltage-learning-guide", demo: "https://rita112025-cpu.github.io/revit-low-voltage-learning-guide/" }, _meta: META_TOOL },
  { id: "revit-low-voltage-learning-guide-literary-edition", name: "revit-low-voltage-learning-guide-Literary-Edition", repo: "revit-low-voltage-learning-guide-Literary-Edition", owner: "rita112025-cpu", category: "學習與資源", description: "Revit 弱電學習指南・文學版。", detail: "同一套 Revit 弱電教材的改寫版本，敘事與排版重新設計，適合長時間閱讀與自學。", tags: ["Revit", "弱電", "教材"], status: "可用", links: { github: "https://github.com/rita112025-cpu/revit-low-voltage-learning-guide-Literary-Edition", demo: "https://rita112025-cpu.github.io/revit-low-voltage-learning-guide-Literary-Edition/" }, _meta: META_TOOL },
  { id: "revit-weak-guide", name: "revit-weak-guide", repo: "revit-weak-guide", owner: "rita112025-cpu", category: "學習與資源", description: "Revit 弱電教材。", detail: "Revit 弱電相關補充教材與學習內容。", tags: ["Revit", "BIM", "教材"], status: "可用", links: { github: "https://github.com/rita112025-cpu/revit-weak-guide", demo: "https://rita112025-cpu.github.io/revit-weak-guide/" }, _meta: META_TOOL },
  { id: "astra-3d-resource-hub", name: "astra-3d-resource-hub", repo: "astra-3d-resource-hub", owner: "rita112025-cpu", category: "學習與資源", description: "Astra 3D 資源站。", detail: "整理 Astra、3D、AutoCAD、Revit 或相關 AI 工具資源，已有線上展示。", tags: ["Astra", "3D", "資源"], status: "可用", links: { github: "https://github.com/rita112025-cpu/astra-3d-resource-hub", demo: "https://rita112025-cpu.github.io/astra-3d-resource-hub/" }, _meta: META_TOOL },
  { id: "taiwan-learning-hub", name: "taiwan-learning-hub", repo: "taiwan-learning-hub", owner: "rita112025-cpu", category: "學習與資源", description: "台灣學習資源入口。", detail: "整理學習資源、工具、教材或技能路線。", tags: ["學習", "Hub", "台灣"], status: "整理中", links: { github: "https://github.com/rita112025-cpu/taiwan-learning-hub", demo: null }, _meta: META_TOOL },
  { id: "stock-prompt-lab", name: "stock-prompt-lab", repo: "stock-prompt-lab", owner: "rita112025-cpu", category: "學習與資源", description: "股票 Prompt 實驗工具。", detail: "用於股票分析 Prompt、投資研究流程與資料整理。", tags: ["股票", "Prompt", "Research"], status: "可用", links: { github: "https://github.com/rita112025-cpu/stock-prompt-lab", demo: "https://rita112025-cpu.github.io/stock-prompt-lab/" }, _meta: META_TOOL },
  { id: "stock-public", name: "stock_public", repo: "stock_public", owner: "rita112025-cpu", category: "學習與資源", description: "台股個股技術分析工作台。", detail: "單一 HTML 檔、零依賴、瀏覽器本機執行。支援 CSV/Big5 匯入，MA/KD/RSI/MACD/布林通道與互動式 K 線圖。", tags: ["台股", "技術分析", "單檔 HTML"], status: "可用", links: { github: "https://github.com/rita112025-cpu/stock_public", demo: "https://rita112025-cpu.github.io/stock_public/tw-stock-analyzer.html" }, _meta: META_TOOL },
  { id: "ai-resource-hub", name: "ai-resource-hub", repo: "ai-resource-hub", owner: "rita112025-cpu", category: "學習與資源", description: "AI 資源整合入口。", detail: "把 Astra 3D Resource Hub 與 Codex Skills Hub 整併成同一套視覺、同一個導覽列與搜尋入口。", tags: ["資源", "Hub", "3D"], status: "可用", links: { github: "https://github.com/rita112025-cpu/ai-resource-hub", demo: "https://rita112025-cpu.github.io/ai-resource-hub/" }, _meta: META_TOOL },
  { id: "fullstack-blueprint", name: "fullstack-blueprint", repo: "fullstack-blueprint", owner: "rita112025-cpu", category: "學習與資源", description: "全端自學藍圖。", detail: "全端進階學習藍圖、Git 協作 Checklist 與 SQL 練習台，三份離線可用的自學資料。", tags: ["全端", "學習", "SQL"], status: "可用", links: { github: "https://github.com/rita112025-cpu/fullstack-blueprint", demo: "https://rita112025-cpu.github.io/fullstack-blueprint/" }, _meta: META_TOOL },
  { id: "markdown-upgrade-guide", name: "markdown-upgrade-guide", repo: "markdown-upgrade-guide", owner: "rita112025-cpu", category: "學習與資源", description: "Markdown 教學網站。", detail: "適合初學者學習、可直接部署 GitHub Pages 的一頁式教學網站。", tags: ["Markdown", "教學", "Pages"], status: "可用", links: { github: "https://github.com/rita112025-cpu/markdown-upgrade-guide", demo: "https://rita112025-cpu.github.io/markdown-upgrade-guide/" }, _meta: META_TOOL },
  { id: "ssdc-glossary-v5", name: "Ssdc-Glossary-V5-Final-Unfrozen_-", repo: "Ssdc-Glossary-V5-Final-Unfrozen_-", owner: "rita112025-cpu", category: "學習與資源", description: "技術名詞對照表。", detail: "通用軟體工程術語表，附大字版互動頁，適合查詢與內部溝通對齊用語。", tags: ["術語", "對照表", "軟體工程"], status: "可用", links: { github: "https://github.com/rita112025-cpu/Ssdc-Glossary-V5-Final-Unfrozen_-", demo: "https://rita112025-cpu.github.io/Ssdc-Glossary-V5-Final-Unfrozen_-/" }, _meta: META_TOOL },

  { id: "tainan-trip", name: "tainan-trip", repo: "tainan-trip", owner: "rita112025-cpu", category: "生活 / 其他", description: "台南行程 PWA・藍晒圖版。", detail: "工程藍圖紙風格大字版，支援離線、地圖導航、加入主畫面，行程住宿交通一鍵查看。", tags: ["PWA", "旅遊", "離線"], status: "可用", links: { github: "https://github.com/rita112025-cpu/tainan-trip", demo: "https://rita112025-cpu.github.io/tainan-trip/" }, _meta: META_TOOL },
  { id: "tainan-trip-meta", name: "tainan-trip_meta", repo: "tainan-trip_meta", owner: "rita112025-cpu", category: "生活 / 其他", description: "台南行程 PWA・溫暖版。", detail: "同一份台南行程的大字溫暖版配色，支援離線、地圖導航與加入主畫面。", tags: ["PWA", "旅遊", "大字版"], status: "可用", links: { github: "https://github.com/rita112025-cpu/tainan-trip_meta", demo: "https://rita112025-cpu.github.io/tainan-trip_meta/" }, _meta: META_TOOL },
  { id: "japan-travel", name: "japan_travel", repo: "japan_travel", owner: "rita112025-cpu", category: "生活 / 其他", description: "沖繩自駕行程 PWA。", detail: "沖繩南國自駕慢遊行程表，離線可用、可加入手機主畫面。", tags: ["PWA", "沖繩", "自駕"], status: "可用", links: { github: "https://github.com/rita112025-cpu/japan_travel", demo: "https://rita112025-cpu.github.io/japan_travel/" }, _meta: META_TOOL },
  { id: "japan-travel-meta", name: "japan_travel_meta", repo: "japan_travel_meta", owner: "rita112025-cpu", category: "生活 / 其他", description: "沖繩自駕行程 PWA・可愛版。", detail: "同一份沖繩行程的可愛版視覺，離線可用、可加入手機主畫面。", tags: ["PWA", "沖繩", "改版"], status: "可用", links: { github: "https://github.com/rita112025-cpu/japan_travel_meta", demo: "https://rita112025-cpu.github.io/japan_travel_meta/" }, _meta: META_TOOL },
  { id: "yijing", name: "yijing", repo: "yijing", owner: "rita112025-cpu", category: "生活 / 其他", description: "易經象徵性解讀工具。", detail: "僅供個人自我反思參考，不構成醫療、法律、財務或心理診斷建議。", tags: ["易經", "自我反思", "工具"], status: "可用", links: { github: "https://github.com/rita112025-cpu/yijing", demo: "https://rita112025-cpu.github.io/yijing/" }, _meta: META_TOOL },
];

/* ------------------------------------------------------------------ */
/* Derived helpers (no fabricated data — built FROM the manifest)     */
/* ------------------------------------------------------------------ */

/** Stable lookup by id. Single resolver used by every command. */
export function findProjectById(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id || p.name === id || p.repo === id);
}

/**
 * Skills view — DERIVED from project tags. We do NOT fabricate a skills
 * list. A project counts as a "skill project" when its tags contain
 * "Skill" / "Skills" (case-insensitive). This is a derived view with a
 * clear provenance, never a second hand-written map.
 */
export function skillProjects(): Project[] {
  return PROJECTS.filter((p) =>
    p.tags.some((t) => /skill/i.test(t))
  );
}

/**
 * Workflows view — DERIVED from project tags. Counts when a tag contains
 * "工作流" or "Workflow" (case-insensitive). Derived, not fabricated.
 */
export function workflowProjects(): Project[] {
  return PROJECTS.filter((p) =>
    p.tags.some((t) => /工作流|workflow/i.test(t))
  );
}

/** Projects grouped by their original Chinese category. */
export function projectsByCategory(): { category: string; projects: Project[] }[] {
  const order = ABOUT.categories;
  const groups = order.map((category) => ({
    category,
    projects: PROJECTS.filter((p) => p.category === category),
  }));
  // append any categories not in ABOUT.categories, defensively (should be none)
  for (const p of PROJECTS) {
    if (!order.includes(p.category)) {
      let g = groups.find((x) => x.category === p.category);
      if (!g) {
        g = { category: p.category, projects: [] };
        groups.push(g);
      }
      g.projects.push(p);
    }
  }
  return groups;
}

/** Honest count assertions — guards against transcription drift. */
export const MANIFEST_ASSERTIONS = {
  totalProjects: PROJECTS.length,
  expectedTotal: ABOUT.totalTools,
  matchesExpected: PROJECTS.length === ABOUT.totalTools,
  uniqueIds: new Set(PROJECTS.map((p) => p.id)).size === PROJECTS.length,
} as const;
