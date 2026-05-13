export interface LoginConfig {
  route: string;
  usernameSelector: string;
  passwordSelector: string;
  submitSelector: string;
  username: string;
  password: string;
}

export interface AuthenticatedFlow {
  name: string;
  login: LoginConfig;
  steps: string[];
}

export interface AuditSiteConfig {
  baseUrl: string;
  routes?: string[];
  authenticatedFlows?: AuthenticatedFlow[];
  /** Quando true, executa validação W3C Nu por URL (requer URL acessível publicamente). */
  includeW3c?: boolean;
}

export type AuditStepKind = "public" | "flow-login" | "flow-post-login";

export interface PlannedAuditTarget {
  path: string;
  fullUrl: string;
  flowName?: string;
  kind: AuditStepKind;
  label: string;
}
