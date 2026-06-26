import { readFile } from "node:fs/promises";
import type { AuditSiteConfig, AuthenticatedFlow, PlannedAuditTarget } from "./auditors/audit-config.js";

export interface AuditPlan {
  publicTargets: PlannedAuditTarget[];
  flows: Array<{
    flow: AuthenticatedFlow;
    targets: PlannedAuditTarget[];
  }>;
}

function joinUrl(base: string, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function loadAuditConfig(configPath: string): Promise<AuditSiteConfig> {
  const raw = await readFile(configPath, "utf-8");
  const parsed = JSON.parse(raw) as AuditSiteConfig;
  if (!parsed.baseUrl || typeof parsed.baseUrl !== "string") {
    throw new Error("Config invalida: baseUrl e obrigatorio.");
  }
  return {
    routes: parsed.routes ?? [],
    authenticatedFlows: parsed.authenticatedFlows ?? [],
    includeW3c: parsed.includeW3c ?? false,
    baseUrl: parsed.baseUrl.replace(/\/$/, "")
  };
}

export function buildAuditPlan(config: AuditSiteConfig): AuditPlan {
  const baseUrl = config.baseUrl.replace(/\/$/, "");

  const publicTargets: PlannedAuditTarget[] = [];
  for (const route of config.routes ?? []) {
    const path = route.startsWith("/") ? route : `/${route}`;
    publicTargets.push({
      path,
      fullUrl: joinUrl(baseUrl, path),
      kind: "public",
      label: `Publico: ${path}`
    });
  }

  const flows = (config.authenticatedFlows ?? []).map((flow) => {
    const loginPath = flow.login.route.startsWith("/") ? flow.login.route : `/${flow.login.route}`;
    const targets: PlannedAuditTarget[] = [
      {
        path: loginPath,
        fullUrl: joinUrl(baseUrl, loginPath),
        flowName: flow.name,
        kind: "flow-login",
        label: `Fluxo ${flow.name}: login (${loginPath})`
      },
      ...flow.steps.map((step) => {
        const stepPath = step.startsWith("/") ? step : `/${step}`;
        return {
          path: stepPath,
          fullUrl: joinUrl(baseUrl, stepPath),
          flowName: flow.name,
          kind: "flow-post-login" as const,
          label: `Fluxo ${flow.name}: ${stepPath}`
        };
      })
    ];
    return { flow, targets };
  });

  return { publicTargets, flows };
}
