import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { AssistiveTechDetection, Finding } from "../auditors/types.js";
import { RouteAuditRecord } from "../auditors/audit-runner.js";
import { escapeHtml, renderFindingsListHtml, REPORT_STYLES, writeHtmlFile } from "./html-reporter.js";

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

export async function writePipelineHtmlReport(
  report: ConsolidatedPipelineReport,
  outputPath = "reports/consolidated-report.html"
): Promise<void> {
  const routesHtml = report.results
    .map(
      (route) => `
      <section>
        <h3>${escapeHtml(route.path)}${route.flow ? ` <small>(${escapeHtml(route.flow)})</small>` : ""}</h3>
        <p><strong>URL:</strong> ${escapeHtml(route.url)}</p>
        <p><strong>Score:</strong> ${route.score ?? "N/A"} | <strong>Criticos:</strong> ${route.criticalIssues}</p>
        ${renderFindingsListHtml(route.findings)}
      </section>`
    )
    .join("\n");

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Relatorio de Acessibilidade</title>
  <style>${REPORT_STYLES}</style>
</head>
<body>
  <h1>Relatorio de Auditoria de Acessibilidade</h1>
  <p><strong>Data:</strong> ${escapeHtml(report.auditDate)}</p>
  <div class="cards">
    <div class="card"><strong>Rotas auditadas</strong><div>${report.routesAudited}</div></div>
    <div class="card"><strong>Fluxos autenticados</strong><div>${report.flowsAudited}</div></div>
    <div class="card"><strong>VLibras</strong><div>${report.assistiveTechnologies.vlibras ? "Detectado" : "Nao detectado"}</div></div>
    <div class="card"><strong>Hand Talk</strong><div>${report.assistiveTechnologies.handTalk ? "Detectado" : "Nao detectado"}</div></div>
  </div>
  <h2>Resultados por rota</h2>
  ${routesHtml}
</body>
</html>`;

  await writeHtmlFile(html, outputPath);
}
