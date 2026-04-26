import { writeFile } from "node:fs/promises";
import { ConsolidatedReport } from "../types.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function writeHtmlReport(report: ConsolidatedReport, outputPath = "report.html"): Promise<void> {
  const findingsHtml = report.findings
    .map(
      (finding) => `
      <li>
        <strong>[${escapeHtml(finding.source)}] ${escapeHtml(finding.title)}</strong>
        <div>Severidade: ${escapeHtml(finding.severity)}</div>
        <div>Descricao: ${escapeHtml(finding.description)}</div>
        <div>Recomendacao: ${escapeHtml(finding.recommendation)}</div>
        <div>eMAG: ${escapeHtml(finding.emagCriteria.join(", "))}</div>
      </li>`
    )
    .join("\n");

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Relatorio de Acessibilidade</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; line-height: 1.45; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 18px; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
    ul { padding-left: 18px; }
    li { margin-bottom: 14px; }
  </style>
</head>
<body>
  <h1>Relatorio de Auditoria de Acessibilidade</h1>
  <p><strong>URL:</strong> ${escapeHtml(report.metadata.url)}</p>
  <p><strong>Data:</strong> ${escapeHtml(report.metadata.timestamp)}</p>
  <div class="cards">
    <div class="card"><strong>Total de achados</strong><div>${report.summary.totalFindings}</div></div>
    <div class="card"><strong>Lighthouse</strong><div>${report.summary.lighthouseScore ?? "N/A"}</div></div>
    <div class="card"><strong>Critica/Alta</strong><div>${report.summary.bySeverity.critical + report.summary.bySeverity.serious}</div></div>
    <div class="card"><strong>VLibras</strong><div>${report.summary.assistiveTech.vlibras.detected ? "Detectado" : "Nao detectado"}</div></div>
  </div>
  <h2>Achados consolidados</h2>
  <ul>
    ${findingsHtml || "<li>Nenhum achado encontrado.</li>"}
  </ul>
</body>
</html>`;

  await writeFile(outputPath, html, "utf-8");
}
