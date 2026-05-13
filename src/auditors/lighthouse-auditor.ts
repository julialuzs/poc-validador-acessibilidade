import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import type * as LH from "lighthouse/types/lh.js";
import { mapToEmagCriteria } from "../emag-mapper.js";
import { normalizeSeverity, recommendationFromContext } from "../config/enrichment.js";
import { translateToPortuguese } from "../config/translator.js";
import { Finding, LighthouseAuditResult } from "../types.js";

function mapLhrToResult(url: string, lhr: LH.Result | undefined): LighthouseAuditResult {
  const score = lhr?.categories?.accessibility?.score;
  const audits = Object.values(lhr?.audits ?? {});

  const failingOrWarningAudits = audits.filter((audit) => {
    if (audit.scoreDisplayMode === "notApplicable" || audit.scoreDisplayMode === "informative") {
      return false;
    }
    return typeof audit.score === "number" && audit.score < 1;
  });

  const findings: Finding[] = failingOrWarningAudits.map((audit) => {
    const title = translateToPortuguese(audit.title ?? audit.id);
    const description = translateToPortuguese(audit.description ?? "Sem descricao fornecida");
    const displayValue = audit.displayValue ? ` (${audit.displayValue})` : "";
    const details = `${description}${displayValue}`;

    return {
      id: `lighthouse:${audit.id}`,
      source: "lighthouse",
      title,
      description: details,
      impact: audit.score !== null && audit.score < 0.5 ? "serious" : "moderate",
      severity: normalizeSeverity(audit.score !== null && audit.score < 0.5 ? "serious" : "moderate"),
      recommendation: recommendationFromContext(audit.title ?? "", audit.description ?? ""),
      emagCriteria: mapToEmagCriteria(`${title} ${description}`)
    };
  });

  return {
    url,
    score: typeof score === "number" ? Math.round(score * 100) : null,
    findings,
    rawSummary: {
      accessibilityScore: typeof score === "number" ? Math.round(score * 100) : null,
      failingAudits: failingOrWarningAudits.length,
      warningAudits: 0
    }
  };
}

export async function runLighthouseAudit(url: string): Promise<LighthouseAuditResult> {
  const chrome = await launch({ chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"] });

  try {
    const runnerResult = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["accessibility"]
    });

    return mapLhrToResult(url, runnerResult?.lhr);
  } finally {
    await chrome.kill();
  }
}

/** Lighthouse contra instancia Chrome ja aberta (ex.: Playwright com --remote-debugging-port). */
export async function runLighthouseOnDebugPort(url: string, debugPort: number): Promise<LighthouseAuditResult> {
  const runnerResult = await lighthouse(url, {
    port: debugPort,
    output: "json",
    logLevel: "error",
    onlyCategories: ["accessibility"]
  });

  return mapLhrToResult(url, runnerResult?.lhr);
}
