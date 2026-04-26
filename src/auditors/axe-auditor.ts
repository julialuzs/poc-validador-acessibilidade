import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import type { Result } from "axe-core";
import { mapToEmagCriteria } from "../config/emag-mapping.js";
import { normalizeSeverity, recommendationFromContext } from "../config/enrichment.js";
import { translateToPortuguese } from "../config/translator.js";
import { AxeAuditResult, Finding } from "../types.js";

export async function runAxeAudit(url: string): Promise<AxeAuditResult> {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    const axeResults = await new AxeBuilder({ page }).analyze();

    const findings: Finding[] = axeResults.violations.map((violation: Result) => {
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
        elementCount: violation.nodes.length
      };
    });

    return {
      url,
      findings,
      rawSummary: {
        violations: axeResults.violations.length,
        incomplete: axeResults.incomplete.length,
        passes: axeResults.passes.length
      }
    };
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}
