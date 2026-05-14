import {
  AssistiveTechDetection,
  AxeAuditResult,
  ConsolidatedReport,
  Finding,
  LighthouseAuditResult,
  Severity, 
} from "./auditors/types.js";
import { W3CAuditResult } from "./auditors/w3c/types.js";

export function consolidateResults(params: {
  url: string;
  startedAt: number;
  lighthouse: LighthouseAuditResult;
  axe: AxeAuditResult;
  w3c: W3CAuditResult;
  assistiveTech: AssistiveTechDetection;
}): ConsolidatedReport {
  const findings = dedupeFindings([...params.lighthouse.findings, ...params.axe.findings, ...params.w3c.findings]);
  const bySeverity = countBySeverity(findings);

  return {
    metadata: {
      url: params.url,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - params.startedAt,
      toolVersions: {
        lighthouse: "13.x",
        axeCore: "4.x",
        playwright: "1.x"
      }
    },
    summary: {
      totalFindings: findings.length,
      bySeverity,
      lighthouseScore: params.lighthouse.score,
      assistiveTech: params.assistiveTech
    },
    findings,
    raw: {
      lighthouse: params.lighthouse.rawSummary,
      axe: params.axe.rawSummary,
      w3c: {
        ...params.w3c.rawSummary,
        checked: params.w3c.checked,
        apiAvailable: params.w3c.apiAvailable
      }
    }
  };
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

function countBySeverity(findings: Finding[]): Record<Severity, number> {
  const initial: Record<Severity, number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    info: 0
  };

  for (const finding of findings) {
    initial[finding.severity] += 1;
  }

  return initial;
}
