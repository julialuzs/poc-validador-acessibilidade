import chalk from "chalk";
import { ConsolidatedReport } from "../auditors/types.js";

export function printTerminalReport(report: ConsolidatedReport): void {
  const { summary, metadata } = report;

  console.log(chalk.bold("\n=== Relatorio de Auditoria de Acessibilidade ==="));
  console.log(`URL: ${metadata.url}`);
  console.log(`Data: ${metadata.timestamp}`);
  console.log(`Duracao: ${metadata.durationMs} ms`);
  console.log(`Score Lighthouse: ${summary.lighthouseScore ?? "N/A"}`);
  console.log(`Total de achados: ${summary.totalFindings}\n`);

  console.log(chalk.bold("Severidades:"));
  console.log(`- Critica: ${summary.bySeverity.critical}`);
  console.log(`- Alta: ${summary.bySeverity.serious}`);
  console.log(`- Media: ${summary.bySeverity.moderate}`);
  console.log(`- Baixa: ${summary.bySeverity.minor}`);
  console.log(`- Informativa: ${summary.bySeverity.info}\n`);

  console.log(chalk.bold("Tecnologias assistivas BR:"));
  console.log(`- VLibras: ${summary.assistiveTech.vlibras.detected ? "Detectado" : "Nao detectado"}`);
  if (summary.assistiveTech.vlibras.evidence.length) {
    console.log(`  Evidencias: ${summary.assistiveTech.vlibras.evidence.join(" | ")}`);
  }
  console.log(`- Hand Talk: ${summary.assistiveTech.handTalk.detected ? "Detectado" : "Nao detectado"}`);
  if (summary.assistiveTech.handTalk.evidence.length) {
    console.log(`  Evidencias: ${summary.assistiveTech.handTalk.evidence.join(" | ")}`);
  }

  console.log(chalk.bold("\nTop achados:"));
  report.findings.slice(0, 10).forEach((finding, index) => {
    console.log(`${index + 1}. [${finding.source}] (${finding.severity}) ${finding.title}`);
    console.log(`   Recomendacao: ${finding.recommendation}`);
    console.log(`   eMAG: ${finding.emagCriteria.join(", ")}`);
  });
}
