import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { ConsolidatedReport, Finding } from "../auditors/types.js";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const severityOrder: Record<Finding["severity"], number> = {
  critical: 1,
  serious: 2,
  moderate: 3,
  minor: 4,
  info: 5
};

function sortFindings(a: Finding, b: Finding): number {
  return severityOrder[a.severity] > severityOrder[b.severity] ? 1 : -1;
}

export function renderFindingItemHtml(finding: Finding): string {
  return `
      <li>
        <strong>[${escapeHtml(finding.source)}] ${escapeHtml(finding.title)}</strong>
        <div>Severidade: ${escapeHtml(finding.severity)}</div>
        <div>Descrição: ${escapeHtml(finding.description)}</div>
        <div>Recomendação: ${escapeHtml(finding.recommendation)}</div>
        <div>eMAG: ${escapeHtml(finding.emagCriteria.join(", "))}</div>
        ${finding.helpUrl ? `<div>Help URL: ${escapeHtml(finding.helpUrl)}</div>` : ""}
        ${finding.wcagRefs ? `<div>WCAG: ${escapeHtml(finding.wcagRefs.join(", "))}</div>` : ""}
        ${finding.cssSelector ? `<div>Seletor CSS: ${escapeHtml(finding.cssSelector)}</div>` : ""}
        ${finding.htmlElement ? `<div>Elemento HTML: ${escapeHtml(finding.htmlElement)}</div>` : ""}
        ${finding.elementCount ? `<div>Quantidade de elementos: ${escapeHtml(finding.elementCount.toString())}</div>` : ""}
      </li>`;
}

export function renderFindingsListHtml(findings: Finding[]): string {
  const items = findings
    .filter((finding) => finding.source !== "lighthouse")
    .sort(sortFindings)
    .map(renderFindingItemHtml)
    .join("\n");

  return `<ul>${items || "<li>Nenhum achado encontrado.</li>"}</ul>`;
}

export const REPORT_STYLES = `
    body { font-family: Arial, sans-serif; margin: 24px; line-height: 1.45; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 18px; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
    section { margin-bottom: 24px; border-top: 1px solid #eee; padding-top: 16px; }
    ul { padding-left: 18px; }
    li { margin-bottom: 14px; }
  `;

export async function writeHtmlFile(html: string, outputPath: string): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf-8");
}

export async function writeHtmlReport(report: ConsolidatedReport, outputPath = "reports/report.html"): Promise<void> {
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
  <p><strong>URL:</strong> ${escapeHtml(report.metadata.url)}</p>
  <p><strong>Data:</strong> ${escapeHtml(report.metadata.timestamp)}</p>
  <div class="cards">
    <div class="card"><strong>Total de achados</strong><div>${report.summary.totalFindings}</div></div>
    <div class="card"><strong>Lighthouse</strong><div>${report.summary.lighthouseScore ?? "N/A"}</div></div>
    <div class="card"><strong>Critica/Alta</strong><div>${report.summary.bySeverity.critical + report.summary.bySeverity.serious}</div></div>
    <div class="card"><strong>VLibras</strong><div>${report.summary.assistiveTech.vlibras.detected ? "Detectado" : "Nao detectado"}</div></div>
  </div>
  <h2>Achados consolidados</h2>
  ${renderFindingsListHtml(report.findings)}
</body>
</html>`;

  await writeHtmlFile(html, outputPath);
}
