import { mapToEmagCriteria } from "../config/emag-mapping.js";
import { normalizeSeverity, recommendationFromContext } from "../config/enrichment.js";
import { translateToPortuguese } from "../config/translator.js";
import { Finding, W3CAuditResult } from "../types.js";

interface W3CMessage {
  type: "error" | "info";
  subType?: string;
  message: string;
  extract?: string;
}

interface W3CResponse {
  messages?: W3CMessage[];
}

export async function runW3CAudit(url: string): Promise<W3CAuditResult> {
  const endpoint = `https://validator.w3.org/nu/?doc=${encodeURIComponent(url)}&out=json`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        "user-agent": "poc-acessibilidade-validator/1.0"
      }
    });

    if (!response.ok) {
      return unavailableResult(url);
    }

    const data = (await response.json()) as W3CResponse;
    const messages = data.messages ?? [];
    const findings: Finding[] = messages.map((msg, index) => {
      const messageType = msg.type === "error" ? "serious" : "minor";
      const context = `${msg.message} ${msg.extract ?? ""}`.trim();
      const contextTraduzido = translateToPortuguese(context);
      return {
        id: `w3c:${index + 1}`,
        source: "w3c",
        title: msg.type === "error" ? "Erro de validação estrutural" : "Aviso estrutural",
        description: contextTraduzido.trim(),
        impact: messageType,
        severity: normalizeSeverity(messageType),
        recommendation: recommendationFromContext(context, context),
        emagCriteria: mapToEmagCriteria(context)
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
        warnings
      }
    };
  } catch {
    return unavailableResult(url);
  }
}

function unavailableResult(url: string): W3CAuditResult {
  return {
    url,
    checked: false,
    apiAvailable: false,
    findings: [],
    rawSummary: {
      errors: 0,
      warnings: 0
    }
  };
}
