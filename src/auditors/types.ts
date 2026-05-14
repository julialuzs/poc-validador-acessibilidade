import { W3CAuditResult } from "./w3c/types.js";

export type Severity = "critical" | "serious" | "moderate" | "minor" | "info";

export interface Finding {
  id: string;
  source: "lighthouse" | "axe" | "w3c" | "w3c-css";
  title: string;
  description: string;
  impact?: string;
  severity: Severity;
  recommendation: string;
  emagCriteria: string[];
  helpUrl?: string;
  wcagRefs?: string[];
  htmlElement?: string;
  cssSelector?: string;
  elementCount?: number;
}

export interface AxeAuditResult {
  url: string;
  findings: Finding[];
  rawSummary: {
    violations: number;
    incomplete: number;
    passes: number;
  };
}

export interface LighthouseAuditResult {
  url: string;
  score: number | null;
  findings: Finding[];
  rawSummary: {
    accessibilityScore: number | null;
    failingAudits: number;
    warningAudits: number;
  };
}

export interface AssistiveTechDetection {
  vlibras: {
    detected: boolean;
    evidence: string[];
  };
  handTalk: {
    detected: boolean;
    evidence: string[];
  };
}

export interface ConsolidatedReport {
  metadata: {
    url: string;
    timestamp: string;
    durationMs: number;
    toolVersions: Record<string, string>;
  };
  summary: {
    totalFindings: number;
    bySeverity: Record<Severity, number>;
    lighthouseScore: number | null;
    assistiveTech: AssistiveTechDetection;
  };
  findings: Finding[];
  raw: {
    lighthouse: LighthouseAuditResult["rawSummary"];
    axe: AxeAuditResult["rawSummary"];
    w3c: W3CAuditResult["rawSummary"] & {
      checked: boolean;
      apiAvailable: boolean;
    };
  };
}
