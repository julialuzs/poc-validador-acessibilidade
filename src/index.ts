import { runAxeAudit } from "./auditors/axe-auditor.js";
import { runLighthouseAudit } from "./auditors/lighthouse-auditor.js";
import { runW3CAudit } from "./auditors/w3c-auditor.js";
import { consolidateResults } from "./consolidator.js";
import { detectLibrasAssistiveTech } from "./detectors/assistive-tech-detector.js";
import { writeHtmlReport } from "./reporters/html-reporter.js";
import { writeJsonReport } from "./reporters/json-reporter.js";
import { printTerminalReport } from "./reporters/terminal-reporter.js";

function parseArgs() {
  const args = process.argv.slice(2);
  const url = args[0];
  const noW3c = args.includes("--no-w3c");
  const jsonOutput = getArgValue(args, "--json") ?? "report.json";
  const htmlOutput = getArgValue(args, "--html") ?? "report.html";

  return { url, noW3c, jsonOutput, htmlOutput };
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

async function main() {
  const { url, noW3c, jsonOutput, htmlOutput } = parseArgs();
  if (!url) {
    console.error("Uso: npm run audit -- <url> [--no-w3c] [--json caminho.json] [--html caminho.html]");
    process.exit(1);
  }

  assertValidUrl(url);
  const startedAt = Date.now();

  console.log(`Iniciando auditoria para: ${url}`);

  const [lighthouse, axe, assistiveTech, w3c] = await Promise.all([
    runLighthouseAudit(url),
    runAxeAudit(url),
    detectLibrasAssistiveTech(url),
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

main().catch((error: unknown) => {
  console.error("Falha na auditoria:", error);
  process.exit(1);
});
