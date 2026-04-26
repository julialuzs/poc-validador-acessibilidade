const emagMappings: Array<{ pattern: RegExp; criteria: string[] }> = [
  { pattern: /color|contrast/i, criteria: ["1.2.1"] },
  { pattern: /label|name|form/i, criteria: ["3.5.1", "3.5.2"] },
  { pattern: /heading|landmark|region|structure/i, criteria: ["2.4.1", "2.4.2"] },
  { pattern: /link|anchor/i, criteria: ["1.1.1", "3.1.1"] },
  { pattern: /keyboard|focus/i, criteria: ["2.1.1", "2.1.2"] },
  { pattern: /image|alt/i, criteria: ["1.1.1"] },
  { pattern: /aria|role/i, criteria: ["2.4.6", "3.6.1"] }
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
