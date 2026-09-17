# 部署指南（Vercel / Railway）

## 專案現況（部署前必讀）

這個專案本質上是**前端 CLI Workbench**：

- 幾乎所有邏輯都在瀏覽器端執行（`src/core/`、`src/components/terminal/`）
- 唯一的 API route 是 `src/app/api/route.ts`（回傳 Hello World）
- Prisma + SQLite 有設定（`src/lib/db.ts`），但**目前沒有任何頁面引用它**，資料庫實際上沒被使用

因此兩個平台都能直接部署。差別在於未來如果真的接上資料庫：

| | Vercel | Railway |
|---|---|---|
| 部署難度 | 最低（零設定） | 低（Dockerfile 已附） |
| SQLite 持久化 | ❌ 檔案系統不持久 | ✅ 掛 Volume 即可 |
| 適合場景 | 純前端 / 換託管 DB（如 Turso） | 想繼續用 SQLite |

## 方案 A：Vercel（最快）

1. 把本機的變更 push 到 GitHub（見下方「推送變更」）
2. 到 [vercel.com](https://vercel.com) → **Add New Project** → 匯入 `rita-ai-workbench-cli-edition`
3. Framework 會自動偵測為 Next.js，**不需改任何設定**
4. 在 **Environment Variables** 加一筆（Prisma generate 建置時需要）：
   ```
   DATABASE_URL = file:./db/custom.db
   ```
5. 按 Deploy，完成後會拿到 `https://<專案名>.vercel.app`

> 注意：`next.config.ts` 的 `output: "standalone"` 在 Vercel 上會被忽略，不影響部署。
> 未來若真的使用 SQLite，資料會在每次部署後消失，屆時建議改用 [Turso](https://turso.tech)（SQLite 相容的託管服務，Prisma 只需改 datasource url）。

## 方案 B：Railway（支援 SQLite 持久化）

已附上 `Dockerfile` 與 `railway.json`（使用 node + bun 映像建置，standalone 模式執行）。

1. push 到 GitHub 後，到 [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Railway 會偵測到 Dockerfile 並自動建置
3. 到服務的 **Variables** 加：
   ```
   DATABASE_URL = file:/data/custom.db
   ```
4. 到 **Settings → Volumes** 建立一個 Volume，掛載路徑設為 `/data`（SQLite 檔案會存在這裡，重新部署不會遺失）
5. 到 **Settings → Networking → Generate Domain** 取得公開網址
6. 健康檢查走 `/api`（已設定在 `railway.json`）

> 本機沒有 Docker 環境可預先驗證 Dockerfile，若 Railway 建置出錯，把 log 貼給我修正。

## 推送變更

本機已完成且需要 push 的變更：

- `package.json` — scripts 改用 `node` 直接呼叫（繞過 Windows Device Guard 封鎖，Linux 上同樣可用）
- `.gitignore` — 補 `!.env.example`；`.env` 已從 git 追蹤移除（`git rm --cached`），本機檔案保留
- `.env.example` — 新增的環境變數範本，clone 後複製成 `.env` 修改即可
- `vercel.json`、`Dockerfile`、`railway.json`、`DEPLOY.md` — 本次新增的部署設定

```powershell
cd C:\tool\rita-ai-workbench-cli-edition\repo
git add package.json .gitignore .env.example vercel.json Dockerfile railway.json DEPLOY.md
git commit -m "chore: add Vercel/Railway deployment config and node-based scripts"
git push
```
