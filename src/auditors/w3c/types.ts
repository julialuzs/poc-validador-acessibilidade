import { Finding } from "../types.js";

export interface W3CMessage {
  type: "error" | "info";
  subType?: string;
  message: string;
  extract?: string;
}

export interface W3CResponse {
  messages?: W3CMessage[];
}

export interface CssValidationIssue {
  source?: string;
  line?: number;
  message: string;
  type?: string;
  level?: number | string;
  context?: string;
}

export interface CssValidationPayload {
  cssvalidation?: {
    uri?: string;
    validity?: boolean;
    result?: {
      errorcount?: number;
      warningcount?: number;
    };
    errors?: CssValidationIssue[];
    warnings?: CssValidationIssue[];
  };
}

export interface W3CAuditResult {
  url: string;
  checked: boolean;
  apiAvailable: boolean;
  findings: Finding[];
  rawSummary: {
    errors: number;
    warnings: number;
  };
}
