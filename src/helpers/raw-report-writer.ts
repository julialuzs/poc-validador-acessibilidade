import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

export type RawReportSource = "axe" | "lighthouse" | "w3c";

function slugFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname.replace(/^\//, "").replace(/\//g, "_") || "root";
    return pathname.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  } catch {
    return "invalid-url";
  }
}

/**
 * Persiste a resposta bruta de uma ferramenta em `raw-reports/` para debug.
 */
export async function writeRawApiReport(source: RawReportSource, url: string, payload: unknown): Promise<void> {
  const dir = "raw-reports";
  await mkdir(dir, { recursive: true });

  const slug = slugFromUrl(url);
  const id = randomBytes(4).toString("hex");
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `${source}-${slug || "root"}-${id}-${ts}.json`;
  const envelope = {
    source,
    auditedUrl: url,
    capturedAt: new Date().toISOString(),
    data: payload
  };

  let body: string;
  try {
    body = JSON.stringify(envelope, null, 2);
  } catch (err: unknown) {
    body = JSON.stringify(
      {
        source,
        auditedUrl: url,
        capturedAt: new Date().toISOString(),
        data: null,
        stringifyError: err instanceof Error ? err.message : String(err)
      },
      null,
      2
    );
  }

  await writeFile(join(dir, fileName), body, "utf-8");
}
