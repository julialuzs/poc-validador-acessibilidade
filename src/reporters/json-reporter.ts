import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { ConsolidatedReport } from "../types.js";

export async function writeJsonReport(report: ConsolidatedReport, outputPath = "reports/report.json"): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2), "utf-8");
}
