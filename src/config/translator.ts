interface TranslationRule {
  pattern: RegExp;
  replacement: string;
}

const RULES: TranslationRule[] = [
  { pattern: /\bDocument does not have a main landmark\b/gi, replacement: "Documento nao possui landmark principal (main)." },
  { pattern: /\bDocument should have one main landmark\b/gi, replacement: "Documento deve ter uma landmark principal (main)." },
  { pattern: /\bAll page content should be contained by landmarks\b/gi, replacement: "Todo o conteudo da pagina deve estar contido em landmarks." },
  { pattern: /\bForm elements must have labels\b/gi, replacement: "Elementos de formulario devem ter rotulos." },
  { pattern: /\bLinks must have discernible text\b/gi, replacement: "Links devem ter texto identificavel." },
  { pattern: /\bImages must have alternate text\b/gi, replacement: "Imagens devem ter texto alternativo." },
  { pattern: /\bButtons must have discernible text\b/gi, replacement: "Botoes devem ter texto identificavel." },
  { pattern: /\bHeading levels should only increase by one\b/gi, replacement: "Niveis de titulos devem aumentar de um em um." },
  { pattern: /\bBackground and foreground colors do not have a sufficient contrast ratio\b/gi, replacement: "Cores de fundo e primeiro plano nao possuem contraste suficiente." },
  { pattern: /\bElements must meet minimum color contrast ratio thresholds\b/gi, replacement: "Elementos devem atender ao contraste minimo de cores." },
  { pattern: /\bPage must contain a level-one heading\b/gi, replacement: "Pagina deve conter um titulo de nivel 1." },
  { pattern: /\bAvoid large layout shifts\b/gi, replacement: "Evite grandes mudancas de layout." },
  { pattern: /\bEnsure all ARIA attributes have valid values\b/gi, replacement: "Garanta que todos os atributos ARIA tenham valores validos." },
  { pattern: /\bARIA input fields must have an accessible name\b/gi, replacement: "Campos ARIA devem ter nome acessivel." },
  { pattern: /\bEnsures\b/gi, replacement: "Garante" },
  { pattern: /\bEnsure\b/gi, replacement: "Garanta" },
  { pattern: /\bAvoid\b/gi, replacement: "Evite" },
  { pattern: /\bmust\b/gi, replacement: "devem" },
  { pattern: /\bshould\b/gi, replacement: "deve" },
  { pattern: /\bpage\b/gi, replacement: "pagina" },
  { pattern: /\bcontent\b/gi, replacement: "conteudo" },
  { pattern: /\bkeyboard\b/gi, replacement: "teclado" },
  { pattern: /\bfocus\b/gi, replacement: "foco" },
  { pattern: /\blandmark(s)?\b/gi, replacement: "landmark$1" }
];

export function translateToPortuguese(text: string): string {
  if (!text) return text;
  let translated = text;
  for (const rule of RULES) {
    translated = translated.replace(rule.pattern, rule.replacement);
  }
  return translated.replace(/\.\./g, ".").trim();
}
