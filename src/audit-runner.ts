import { createServer } from "node:net";
import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { chromium } from "playwright";
import type { Page } from "playwright";
import type { AuditSiteConfig, PlannedAuditTarget } from "./audit-config.js";
import type { AuditPlan } from "./navigation-engine.js";
import { buildAuditPlan } from "./navigation-engine.js";
import { performLogin } from "./auth-handler.js";
import { runAxeOnPage } from "./auditors/axe-auditor.js";
import { runLighthouseOnDebugPort } from "./auditors/lighthouse-auditor.js";
import { runW3CAudit } from "./auditors/w3c-auditor.js";
import { detectAssistiveTechOnPage, mergeAssistiveTechDetections } from "./assistive-tech-detector.js";
import { mergeEmagCodesForReport } from "./emag-mapper.js";
import type { AssistiveTechDetection, Finding } from "./types.js";

export async function getFreeTcpPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      srv.close(() => {
        if (typeof addr === "object" && addr && "port" in addr && typeof addr.port === "number") {
          resolve(addr.port);
        } else {
          reject(new Error("Porta livre indisponivel"));
        }
      });
    });
  });
}

export interface RouteAuditRecord {
  path: string;
  flowName?: string;
  url: string;
  score: number | null;
  criticalIssues: number;
  emagMappings: string[];
  findings: Finding[];
  assistiveTechnologies: AssistiveTechDetection;
}

function dedupeFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  const output: Finding[] = [];

  for (const finding of findings) {
    const key = `${finding.source}|${finding.title}|${finding.description}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(finding);
  }

  return output;
}

async function auditLoadedPage(
  page: Page,
  target: PlannedAuditTarget,
  config: AuditSiteConfig,
  cdpPort: number
): Promise<RouteAuditRecord> {
  const axe = await runAxeOnPage(page, target.fullUrl);
  const assist = await detectAssistiveTechOnPage(page);

  const w3c = config.includeW3c ? await runW3CAudit(target.fullUrl) : undefined;
  const w3cFindings = w3c?.findings ?? [];

  const lh = await runLighthouseOnDebugPort(target.fullUrl, cdpPort);

  await page.goto(target.fullUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });

  const findings = dedupeFindings([...lh.findings, ...axe.findings, ...w3cFindings]);
  const criticalIssues = findings.filter((f) => f.severity === "critical").length;

  return {
    path: target.path,
    flowName: target.flowName,
    url: target.fullUrl,
    score: lh.score,
    criticalIssues,
    emagMappings: mergeEmagCodesForReport(findings),
    findings,
    assistiveTechnologies: assist
  };
}

export async function runConfigAudit(config: AuditSiteConfig): Promise<{
  records: RouteAuditRecord[];
  assistiveAggregated: AssistiveTechDetection;
  plan: AuditPlan;
}> {
  const plan = buildAuditPlan(config);
  const cdpPort = await getFreeTcpPort();
  const userDataDir = await mkdtemp(join(tmpdir(), "poc-a11y-"));

  const baseUrl = config.baseUrl.replace(/\/$/, "");
  const records: RouteAuditRecord[] = [];
  const assistiveParts: AssistiveTechDetection[] = [];

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    args: [
      `--remote-debugging-port=${cdpPort}`,
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage"
    ],
    viewport: { width: 1365, height: 900 }
  });

  const page = context.pages()[0] ?? (await context.newPage());

  try {
    for (const target of plan.publicTargets) {
      await page.goto(target.fullUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
      const rec = await auditLoadedPage(page, target, config, cdpPort);
      records.push(rec);
      assistiveParts.push(rec.assistiveTechnologies);
    }

    for (const { flow, targets } of plan.flows) {
      await context.clearCookies();
      let authenticated = false;

      for (const target of targets) {
        if (target.kind === "flow-login") {
          await page.goto(target.fullUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
          const rec = await auditLoadedPage(page, target, config, cdpPort);
          records.push(rec);
          assistiveParts.push(rec.assistiveTechnologies);

          await performLogin(page, baseUrl, flow.login);
          authenticated = true;
        } else if (target.kind === "flow-post-login") {
          if (!authenticated) {
            throw new Error(`Fluxo ${flow.name}: etapa pos-login sem autenticacao.`);
          }
          await page.goto(target.fullUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
          const rec = await auditLoadedPage(page, target, config, cdpPort);
          records.push(rec);
          assistiveParts.push(rec.assistiveTechnologies);
        }
      }
    }

    return {
      records,
      assistiveAggregated: mergeAssistiveTechDetections(assistiveParts),
      plan
    };
  } finally {
    await context.close();
  }
}
