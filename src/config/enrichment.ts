import { Severity } from "../types.js";

export function normalizeSeverity(input?: string): Severity {
  const value = (input || "").toLowerCase();

  if (value.includes("critical")) return "critical";
  if (value.includes("serious") || value.includes("high")) return "serious";
  if (value.includes("moderate") || value.includes("medium")) return "moderate";
  if (value.includes("minor") || value.includes("low")) return "minor";

  return "info";
}

export function recommendationFromContext(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes("contrast")) return "Ajuste contraste de cores para atender WCAG AA.";
  if (text.includes("label")) return "Associe rótulos explícitos a todos os campos de formulário.";
  if (text.includes("heading")) return "Estruture títulos hierarquicamente sem saltos de nível.";
  if (text.includes("link")) return "Garanta texto de link descritivo e sem ambiguidade.";
  if (text.includes("keyboard") || text.includes("focus")) return "Assegure navegação completa por teclado e foco visível.";
  if (text.includes("alt") || text.includes("image")) return "Forneça texto alternativo significativo para imagens informativas.";

  return "Revise o item com base no critério WCAG/eMAG correspondente e aplique correção no HTML/ARIA.";
}
