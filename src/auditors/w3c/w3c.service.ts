import { writeRawApiReport } from "../../config/raw-report-writer.js";
import { BASE_W3C_CSS_CHECKER, BASE_W3C_HTML_CHECKER } from "./config.js";
import { CssValidationPayload, W3CResponse } from "./types.js";

export async function getCss(url: string): Promise<CssValidationPayload | null> {
  const endpoint = `${BASE_W3C_CSS_CHECKER}/validator?uri=${encodeURIComponent(url)}&output=json&profile=css3svg`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        "user-agent": "poc-acessibilidade-validator/1.0",
      },
    });

    if (!response.ok) {
      await writeRawApiReport("w3c-css", url, {
        ok: false,
        status: response.status,
        statusText: response.statusText,
        endpoint,
      });

      return null;
    }

    const data = (await response.json()) as CssValidationPayload;
    await writeRawApiReport("w3c-css", url, data);
 
    return data;
  } catch (err: unknown) {
    await writeRawApiReport("w3c-css", url, {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      endpoint,
    }).catch(() => undefined);
 
    return null;
  }
}

export async function getHtml(url: string): Promise<W3CResponse | null> {
  const endpoint = `${BASE_W3C_HTML_CHECKER}?doc=${encodeURIComponent(url)}&out=json`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        "user-agent": "poc-acessibilidade-validator/1.0",
      },
    });

    if (!response.ok) {
      await writeRawApiReport("w3c", url, {
        ok: false,
        kind: "html",
        status: response.status,
        statusText: response.statusText,
        endpoint,
      });
 
      return null;
    }

    const data = (await response.json()) as W3CResponse;
    await writeRawApiReport("w3c", url, { kind: "html", ...data });
    return data;
  } catch (err: unknown) {
    await writeRawApiReport("w3c", url, {
      ok: false,
      kind: "html",
      error: err instanceof Error ? err.message : String(err),
      endpoint,
    }).catch(() => undefined);

     
    return null;
  }
}
 