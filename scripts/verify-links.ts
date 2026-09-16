// Link verification — reads URLs ONLY from the canonical manifest.
// Run: bun run scripts/verify-links.ts
import { PROJECTS } from "@/data/workbench-manifest";

interface Result { url: string; label: string; status: string; code?: number; finalUrl?: string }

async function checkUrl(url: string, label: string): Promise<Result> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RitaWorkbenchLinkCheck/1.0)" },
    });
    // 2xx = PASS. 3xx followed to final = handled by redirect:follow.
    // 404/410/500+ = FAIL. Other 4xx (e.g. 403 anti-bot) = N/A (inconclusive).
    let status: string;
    if (res.ok) status = "PASS";
    else if (res.status === 403 || res.status === 401 || res.status === 429) status = "N/A";
    else if (res.status === 404 || res.status === 410 || res.status >= 500) status = "FAIL";
    else status = "PASS"; // other 3xx/4xx after follow treated as reachable
    return { url, label, status, code: res.status, finalUrl: res.url };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { url, label, status: "FAIL", code: undefined, finalUrl: msg };
  }
}

(async () => {
  let ghPass = 0, ghFail = 0, ghNa = 0;
  let dmPass = 0, dmFail = 0, dmNa = 0;
  const failed: { kind: string; project: string; url: string; code?: number; detail: string }[] = [];

  process.stdout.write(`Checking ${PROJECTS.length} projects...\n\n`);

  // GitHub URLs
  for (const p of PROJECTS) {
    const u = p.links.github;
    if (!u) { ghNa++; continue; }
    const r = await checkUrl(u, `github/${p.id}`);
    if (r.status === "PASS") ghPass++;
    else if (r.status === "N/A") ghNa++;
    else { ghFail++; failed.push({ kind: "github", project: p.id, url: u, code: r.code, detail: r.finalUrl ?? "" }); }
    process.stdout.write(`github ${p.id.padEnd(42)} ${r.status.padEnd(4)} ${r.code ?? ""}\n`);
  }

  process.stdout.write("\n");
  // Demo URLs
  for (const p of PROJECTS) {
    const u = p.links.demo;
    if (!u) { dmNa++; continue; }
    const r = await checkUrl(u, `demo/${p.id}`);
    if (r.status === "PASS") dmPass++;
    else if (r.status === "N/A") dmNa++;
    else { dmFail++; failed.push({ kind: "demo", project: p.id, url: u, code: r.code, detail: r.finalUrl ?? "" }); }
    process.stdout.write(`demo   ${p.id.padEnd(42)} ${r.status.padEnd(4)} ${r.code ?? ""}\n`);
  }

  process.stdout.write("\n==================== SUMMARY ====================\n");
  process.stdout.write(`GitHub URLs   PASS ${ghPass} / FAIL ${ghFail} / N/A ${ghNa}    (total ${PROJECTS.length})\n`);
  process.stdout.write(`Demo URLs     PASS ${dmPass} / FAIL ${dmFail} / N/A ${dmNa}    (total ${PROJECTS.length})\n`);
  if (failed.length > 0) {
    process.stdout.write("\n--- FAILED URLs ---\n");
    for (const f of failed) {
      process.stdout.write(`[${f.kind}] ${f.project}: ${f.url}  -> ${f.code ?? "ERR"} ${f.detail}\n`);
    }
  }
})();
