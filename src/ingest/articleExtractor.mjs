import { Readability } from "@mozilla/readability";
import { JSDOM, VirtualConsole } from "jsdom";

export async function extractArticleExcerpt(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const virtualConsole = new VirtualConsole();
    virtualConsole.on("error", () => {});
    virtualConsole.on("warn", () => {});

    const dom = new JSDOM(html, {
      url,
      virtualConsole,
    });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article?.textContent) {
      return null;
    }

    return article.textContent.replace(/\s+/g, " ").trim().slice(0, 340);
  } catch {
    return null;
  }
}
