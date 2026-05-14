import { mapToEmagCriteria } from "../../mappers/emag-mapper.js";
import {
  normalizeSeverity,
  recommendationFromContext,
} from "../../config/enrichment.js";
import { translateToPortuguese } from "../../config/translator.js";
import { CssValidationIssue, W3CAuditResult } from "./types.js";
import { Finding } from "../types.js";
import { BASE_W3C_CSS_CHECKER, MAX_CSS_FINDINGS } from "./config.js";
import { getCss, getHtml } from "./w3c.service.js";

export async function runW3CAudit(url: string): Promise<W3CAuditResult> {
  const [html, css] = await Promise.all([
    runW3CHtmlAudit(url),
    runW3CCssAudit(url),
  ]);
  return mergeW3cResults(html, css, url);
}

export async function runW3CHtmlAudit(url: string): Promise<W3CAuditResult> {
  const data = await getHtml(url);

  if (data === null) {
    return unavailableResult(url);
  }

  const messages = data.messages ?? [];
  const findings: Finding[] = messages.map((msg, index) => {
    const messageType = msg.type === "error" ? "serious" : "minor";
    const messageTraduzida = translateToPortuguese(msg.message);
    return {
      id: `w3c-html:${index + 1}`,
      source: "w3c",
      title:
        msg.type === "error"
          ? "Erro de validação estrutural"
          : "Aviso estrutural",
      description: messageTraduzida.trim(),
      impact: messageType,
      severity: normalizeSeverity(messageType),
      recommendation: recommendationFromContext(
        messageTraduzida,
        messageTraduzida,
      ),
      emagCriteria: mapToEmagCriteria(messageTraduzida),
      htmlElement: msg.extract,
      helpUrl: "https://validator.w3.org/nu/",
    };
  });

  const errors = messages.filter((msg) => msg.type === "error").length;
  const warnings = messages.length - errors;

  return {
    url,
    checked: true,
    apiAvailable: true,
    findings,
    rawSummary: {
      errors,
      warnings,
    },
  };
}

export async function runW3CCssAudit(url: string): Promise<W3CAuditResult> {
  const data = await getCss(url);

  if (data === null) {
    return unavailableResult(url);
  }

  const cv = data.cssvalidation!;
  const errorList = cv.errors ?? [];
  const warningList = cv.warnings ?? [];
  const result = cv.result ?? {};

  const errors = typeof result.errorcount === "number" ? result.errorcount : errorList.length;
  const warnings = typeof result.warningcount === "number" ? result.warningcount : warningList.length;

  const errorFindings = mapCssIssuesToFindings(errorList, "error");
  const warningFindings = mapCssIssuesToFindings(warningList, "warning");
  const findings = [...errorFindings, ...warningFindings].slice(
    0,
    MAX_CSS_FINDINGS,
  );

  return {
    url,
    checked: true,
    apiAvailable: true,
    findings,
    rawSummary: {
      errors,
      warnings,
    },
  };
}

function mapCssIssuesToFindings(
  issues: CssValidationIssue[],
  kind: "error" | "warning",
): Finding[] {
  return issues.map((item, index) => {
    const messageTraduzida = translateToPortuguese(item.message);
    const messageType = kind === "error" ? "serious" : "minor";
    const location = item.source && item.line != null ? `${item.source} (linha ${item.line})` : (item.source ?? "");

    return {
      id: `w3c-css:${kind}-${index + 1}`,
      source: "w3c-css" as const,
      title: kind === "error" ? "Erro de validação CSS" : "Aviso de validação CSS",
      description: location ? `${messageTraduzida.trim()} - ${location}` : messageTraduzida.trim(),
      impact: messageType,
      severity: normalizeSeverity(messageType),
      recommendation: recommendationFromContext(messageTraduzida, item.type ?? ""),
      emagCriteria: mapToEmagCriteria(`${messageTraduzida} ${item.type ?? ""}`),
      helpUrl: `${BASE_W3C_CSS_CHECKER}/`,
      cssSelector: item.context,
    };
  });
}

function mergeW3cResults(
  html: W3CAuditResult,
  css: W3CAuditResult,
  url: string,
): W3CAuditResult {
  return {
    url,
    checked: html.checked || css.checked,
    apiAvailable: html.apiAvailable || css.apiAvailable,
    findings: [...html.findings, ...css.findings],
    rawSummary: {
      errors: html.rawSummary.errors + css.rawSummary.errors,
      warnings: html.rawSummary.warnings + css.rawSummary.warnings,
    },
  };
}

function unavailableResult(url: string): W3CAuditResult {
  return {
    url,
    checked: false,
    apiAvailable: false,
    findings: [],
    rawSummary: {
      errors: 0,
      warnings: 0,
    },
  };
}
