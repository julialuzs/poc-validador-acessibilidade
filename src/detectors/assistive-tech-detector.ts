import { chromium } from "playwright";
import { AssistiveTechDetection } from "../types.js";

export async function detectLibrasAssistiveTech(url: string): Promise<AssistiveTechDetection> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    const detection = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll("script[src]"))
        .map((script) => script.getAttribute("src") || "")
        .filter(Boolean);

      const html = document.documentElement.outerHTML;

      const vlibrasEvidence = scripts.filter((src) => /vlibras|gov\.br\/vlibras/i.test(src));
      if ((window as any).VLibras || /vw-access-button|vlibras/i.test(html)) {
        vlibrasEvidence.push("Marcadores globais/HTML de VLibras detectados");
      }

      const handTalkEvidence = scripts.filter((src) => /handtalk|ht-app/i.test(src));
      if ((window as any).HT || /handtalk|ht-widget/i.test(html)) {
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
  } finally {
    await page.close();
    await browser.close();
  }
}
