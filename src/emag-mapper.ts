import type { Finding } from "./types.js";

const emagMappings: Array<{ pattern: RegExp; criteria: string[] }> = [
  { pattern: /color|contrast/i, criteria: ["3.6.1"] },
  { pattern: /label|name|form/i, criteria: ["3.5.1", "3.21.1"] },
  { pattern: /heading|landmark|region|structure/i, criteria: ["2.4.1", "2.4.2"] },
  { pattern: /link|anchor/i, criteria: ["1.1.1", "3.1.1"] },
  { pattern: /keyboard|focus/i, criteria: ["2.1.1", "2.1.2"] },
  { pattern: /image|alt/i, criteria: ["1.1.1"] },
  { pattern: /aria|role/i, criteria: ["3.6.1", "3.21.1"] }
];

export function mapToEmagCriteria(text: string): string[] {
  const matches = new Set<string>();

  for (const mapping of emagMappings) {
    if (mapping.pattern.test(text)) {
      mapping.criteria.forEach((criterion) => matches.add(criterion));
    }
  }

  if (matches.size === 0) {
    matches.add("Mapeamento manual necessário");
  }

  return Array.from(matches);
}

/** Agrega critérios eMAG dos achados em códigos curtos (ex.: 3.6.1 → 3.6) para relatório consolidado. */
export function mergeEmagCodesForReport(findings: Finding[]): string[] {
  const set = new Set<string>();

  for (const finding of findings) {
    for (const raw of finding.emagCriteria) {
      if (/manual/i.test(raw)) continue;
      const segments = raw.split(".").filter(Boolean);
      const code = segments.length >= 2 ? `${segments[0]}.${segments[1]}` : raw;
      set.add(code);
    }
  }

  return Array.from(set).sort(compareEmagCodes);
}

function compareEmagCodes(a: string, b: string): number {
  const [amaj, amin] = a.split(".").map((n) => Number.parseInt(n, 10));
  const [bmaj, bmin] = b.split(".").map((n) => Number.parseInt(n, 10));
  if (amaj !== bmaj) return (amaj || 0) - (bmaj || 0);
  return (amin || 0) - (bmin || 0);
}
