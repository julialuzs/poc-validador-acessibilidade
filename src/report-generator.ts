import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { RouteAuditRecord } from "./audit-runner.js";
import type { AssistiveTechDetection, Finding } from "./types.js";

export interface ConsolidatedPipelineReport {
  auditDate: string;
  routesAudited: number;
  flowsAudited: number;
  results: Array<{
    path: string;
    flow?: string;
    score: number | null;
    criticalIssues: number;
    emagMappings: string[];
    findings: Finding[];
    url: string;
  }>;
  assistiveTechnologies: {
    vlibras: boolean;
    handTalk: boolean;
  };
}

export function buildPipelineReport(
  records: RouteAuditRecord[],
  flowsAudited: number,
  assistiveAggregated: AssistiveTechDetection
): ConsolidatedPipelineReport {
  return {
    auditDate: new Date().toISOString(),
    routesAudited: records.length,
    flowsAudited,
    results: records.map((r) => ({
      path: r.path,
      flow: r.flowName,
      score: r.score,
      criticalIssues: r.criticalIssues,
      emagMappings: r.emagMappings,
      findings: r.findings,
      url: r.url
    })),
    assistiveTechnologies: {
      vlibras: assistiveAggregated.vlibras.detected,
      handTalk: assistiveAggregated.handTalk.detected
    }
  };
}

export async function writePipelineReport(
  report: ConsolidatedPipelineReport,
  outputPath = "reports/consolidated-report.json"
): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2), "utf-8");
}
