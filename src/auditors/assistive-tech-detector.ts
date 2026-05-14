import type { Page } from "playwright";
import type { AssistiveTechDetection } from "./auditors/types.js";

export async function detectAssistiveTechOnPage(page: Page): Promise<AssistiveTechDetection> {
  const detection = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll("script[src]"))
      .map((script) => script.getAttribute("src") || "")
      .filter(Boolean);

    const html = document.documentElement.outerHTML;

    const vlibrasEvidence = scripts.filter((src) => /vlibras|gov\.br\/vlibras/i.test(src));
    if ((window as unknown as { VLibras?: unknown }).VLibras || /vw-access-button|vlibras/i.test(html)) {
      vlibrasEvidence.push("Marcadores globais/HTML de VLibras detectados");
    }

    const handTalkEvidence = scripts.filter((src) => /handtalk|ht-app/i.test(src));
    if ((window as unknown as { HT?: unknown }).HT || /handtalk|ht-widget/i.test(html)) {
      handTalkEvidence.push("Marcadores globais/HTML de Hand Talk detectados");
    }

    return {
      vlibras: {
        detected: vlibrasEvidence.length > 0,
        evidence: Array.from(new Set(vlibrasEvidence))
      },
      handTalk: {
        detected: handTalkEvidence.length > 0,
        evidence: Array.from(new Set(handTalkEvidence))
      }
    };
  });

  return detection;
}

export function mergeAssistiveTechDetections(parts: AssistiveTechDetection[]): AssistiveTechDetection {
  const vlibrasEvidence = new Set<string>();
  const handTalkEvidence = new Set<string>();
  let vlibras = false;
  let handTalk = false;

  for (const p of parts) {
    if (p.vlibras.detected) vlibras = true;
    if (p.handTalk.detected) handTalk = true;
    p.vlibras.evidence.forEach((e) => vlibrasEvidence.add(e));
    p.handTalk.evidence.forEach((e) => handTalkEvidence.add(e));
  }

  return {
    vlibras: { detected: vlibras, evidence: Array.from(vlibrasEvidence) },
    handTalk: { detected: handTalk, evidence: Array.from(handTalkEvidence) }
  };
}
