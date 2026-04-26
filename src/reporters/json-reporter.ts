import { writeFile } from "node:fs/promises";
import { ConsolidatedReport } from "../types.js";

export async function writeJsonReport(report: ConsolidatedReport, outputPath = "report.json"): Promise<void> {
  await writeFile(outputPath, JSON.stringify(report, null, 2), "utf-8");
}
