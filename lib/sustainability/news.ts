import type { ArticleSummary } from "./insights";

type ReachabilityOptions = {
  timeoutMs?: number;
};

export function normalizeArticleUrl(url: string): string | null {
  const trimmed = url.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export async function isReachableArticleUrl(
  url: string,
  options: ReachabilityOptions = {},
): Promise<boolean> {
  const timeoutMs = options.timeoutMs ?? 2500;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headResponse = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });

    // Accept only success/redirect status codes.
    if (headResponse.status >= 200 && headResponse.status < 400) {
      return true;
    }

    // Some sites do not support HEAD correctly. Retry once with a tiny GET.
    if (headResponse.status === 405 || headResponse.status === 501) {
      const getResponse = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          Range: "bytes=0-0",
        },
      });

      return getResponse.status >= 200 && getResponse.status < 400;
    }

    return false;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function filterValidArticleSummaries(
  articles: ArticleSummary[],
): Promise<ArticleSummary[]> {
  const seen = new Set<string>();
  const validArticles: ArticleSummary[] = [];

  for (const article of articles) {
    const normalizedUrl = normalizeArticleUrl(article.url);

    if (!normalizedUrl || seen.has(normalizedUrl)) {
      continue;
    }

    seen.add(normalizedUrl);

    if (!(await isReachableArticleUrl(normalizedUrl))) {
      continue;
    }

    validArticles.push({
      ...article,
      url: normalizedUrl,
    });
  }

  return validArticles;
}