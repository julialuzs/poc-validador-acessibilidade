import { runAxeAudit } from "./auditors/axe/axe-auditor.js";
import { runLighthouseAudit } from "./auditors/lighthouse/lighthouse-auditor.js";
import { runW3CAudit } from "./auditors/w3c/w3c-auditor.js";
import { consolidateResults } from "./consolidator.js"; 
import {
  buildPipelineReport,
  writePipelineHtmlReport,
  writePipelineReport
} from "./reporters/report-generator.js";
import { loadAuditConfig } from "./navigation-engine.js";
import { detectAssistiveTechOnPage } from "./auditors/assistive-tech-detector.js";
import { chromium } from "playwright";
import { writeHtmlReport } from "./reporters/html-reporter.js";
import { writeJsonReport } from "./reporters/json-reporter.js";
import { printTerminalReport } from "./reporters/terminal-reporter.js";
import chalk from "chalk";
import { runConfigAudit } from "./auditors/audit-runner.js";

function parseArgs() {
  const args = process.argv.slice(2);
  const configIdx = args.indexOf("--config");
  const configPath =
    configIdx !== -1
      ? (() => {
          const p = args[configIdx + 1];
          if (!p || p.startsWith("-")) {
            throw new Error("Uso: --config <arquivo.json>");
          }
          return p;
        })()
      : undefined;
  const positional = args.filter((a, i) => {
    if (a.startsWith("--")) {
      if (["--json", "--html", "--out", "--config"].includes(a)) return false;
      return false;
    }
    const prev = args[i - 1];
    if (prev && ["--json", "--html", "--out", "--config"].includes(prev)) return false;
    return true;
  });
  const url = configPath ? undefined : positional[0];
  const noW3c = args.includes("--no-w3c");
  const jsonOutput = getArgValue(args, "--json") ?? "reports/report.json";
  const htmlOutput = getArgValue(args, "--html") ?? "reports/report.html";
  const pipelineJson = getArgValue(args, "--out") ?? "reports/consolidated-report.json";

  return { url, configPath, noW3c, jsonOutput, htmlOutput, pipelineJson };
}

function getArgValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  return args[index + 1];
}

function assertValidUrl(url: string): void {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Somente protocolos HTTP/HTTPS sao aceitos.");
    }
  } catch {
    throw new Error(`URL invalida: ${url}`);
  }
}

async function runLegacySingleUrlAudit(url: string, noW3c: boolean, jsonOutput: string, htmlOutput: string) {
  assertValidUrl(url);
  const startedAt = Date.now();

  console.log(`Iniciando auditoria (modo URL unica) para: ${url}`);

  const [lighthouse, axe, assistiveTech, w3c] = await Promise.all([
    runLighthouseAudit(url),
    runAxeAudit(url),
    (async () => {
      const browser = await chromium.launch();
      const page = await browser.newPage();
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
        return await detectAssistiveTechOnPage(page);
      } finally {
        await page.close();
        await browser.close();
      }
    })(),
    noW3c ? Promise.resolve(undefined) : runW3CAudit(url)
  ]);

  const consolidated = consolidateResults({
    url,
    startedAt,
    lighthouse,
    axe,
    assistiveTech,
    w3c:
      w3c ??
      ({
        url,
        checked: false,
        apiAvailable: false,
        findings: [],
        rawSummary: { errors: 0, warnings: 0 }
      } as const)
  });

  await writeJsonReport(consolidated, jsonOutput);
  await writeHtmlReport(consolidated, htmlOutput);
  printTerminalReport(consolidated);

  console.log(`\nArquivos gerados: ${jsonOutput}, ${htmlOutput}`);
}

async function runPipelineFromConfig(configPath: string, pipelineJson: string, pipelineHtml: string) {
  console.log(`Iniciando auditoria multi-pagina (config: ${configPath})`);
  const config = await loadAuditConfig(configPath);
  const { records, assistiveAggregated, plan } = await runConfigAudit(config);
  const flowsCount = plan.flows.length;
  const report = buildPipelineReport(records, flowsCount, assistiveAggregated);
  await writePipelineReport(report, pipelineJson);
  await writePipelineHtmlReport(report, pipelineHtml);

  console.log(chalk.bold("\n=== Resumo (pipeline) ==="));
  console.log(`Rotas auditadas: ${report.routesAudited}`);
  console.log(`Fluxos autenticados: ${report.flowsAudited}`);
  console.log(`VLibras: ${report.assistiveTechnologies.vlibras ? "sim" : "nao"}`);
  console.log(`Hand Talk: ${report.assistiveTechnologies.handTalk ? "sim" : "nao"}`);
  report.results.forEach((r) => {
    console.log(
      `- ${r.path}${r.flow ? ` [${r.flow}]` : ""} | score: ${r.score ?? "N/A"} | criticos: ${r.criticalIssues}`
    );
  });
  console.log(`\nArquivos gerados: ${pipelineJson}, ${pipelineHtml}`);
}

async function main() {
  const { url, configPath, noW3c, jsonOutput, htmlOutput, pipelineJson } = parseArgs();

  if (configPath) {
    await runPipelineFromConfig(configPath, pipelineJson, htmlOutput);
    return;
  }

  if (!url) {
    console.error(
      "Uso:\n  npm run audit -- <url> [--no-w3c] [--json reports/...] [--html reports/...]\n  npm run audit -- --config audit.config.json [--out reports/consolidated-report.json] [--html reports/consolidated-report.html]"
    );
    process.exit(1);
  }

  if (url.startsWith("--")) {
    console.error("Argumento invalido. Informe uma URL ou --config <arquivo.json>.");
    process.exit(1);
  }

  await runLegacySingleUrlAudit(url, noW3c, jsonOutput, htmlOutput);
}

main().catch((error: unknown) => {
  console.error("Falha na auditoria:", error);
  process.exit(1);
});
