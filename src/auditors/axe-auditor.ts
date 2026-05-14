import { chromium } from "playwright";
import type { Page } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import type { Result } from "axe-core";
import { mapToEmagCriteria } from "../emag-mapper.js";
import { normalizeSeverity, recommendationFromContext } from "../config/enrichment.js";
import { translateToPortuguese } from "../config/translator.js";
import { writeRawApiReport } from "../helpers/raw-report-writer.js";
import { AxeAuditResult, Finding } from "../types.js";

function mapViolationsToFindings(violations: Result[]): Finding[] {
  return violations.map((violation: Result) => {
    const translatedTitle = translateToPortuguese(violation.help);
    const translatedDescription = translateToPortuguese(violation.description);
    const description = `${translatedDescription}. Ajuda: ${translatedTitle}`;
    return {
      id: `axe:${violation.id}`,
      source: "axe",
      title: translatedTitle,
      description,
      impact: violation.impact ?? "unknown",
      severity: normalizeSeverity(violation.impact ?? undefined),
      recommendation: recommendationFromContext(translatedTitle, translatedDescription),
      emagCriteria: mapToEmagCriteria(`${translatedTitle} ${translatedDescription}`),
      wcagRefs: violation.tags.filter((tag: string) => tag.startsWith("wcag")),
      htmlElement: violation.nodes[0]?.html,
      helpUrl: `${violation.helpUrl}&lang=pt-BR`,
      elementCount: violation.nodes.length
    };
  });
}

export async function runAxeAudit(url: string): Promise<AxeAuditResult> {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    return await runAxeOnPage(page, url);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

export async function runAxeOnPage(page: Page, urlForReport: string): Promise<AxeAuditResult> {
  const axeResults = await new AxeBuilder({ page }).analyze();
  await writeRawApiReport("axe", urlForReport, axeResults);
  const findings = mapViolationsToFindings(axeResults.violations);

  return {
    url: urlForReport,
    findings,
    rawSummary: {
      violations: axeResults.violations.length,
      incomplete: axeResults.incomplete.length,
      passes: axeResults.passes.length
    }
  };
}
