import { AI_CRAWLERS, evaluateRobotsAccess, extractPageIndexingSignals } from "./robots.js";

const TOOL_AGENT = "Mydentify crawler access checker (+https://mydentify.com/tools/ai-crawler-access-checker)";

function normalizeUrl(input) {
  const value = input.trim();
  const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Enter an HTTP or HTTPS URL.");
  return url;
}

async function request(url, { userAgent = TOOL_AGENT, readBody = false } = {}) {
  const response = await fetch(url, {
    headers: {
      accept: readBody ? "text/html,application/xhtml+xml,text/plain,*/*" : "text/html,*/*",
      "user-agent": userAgent,
    },
    redirect: "follow",
    signal: AbortSignal.timeout(10_000),
  });
  const body = readBody ? (await response.text()).slice(0, 750_000) : "";
  return { response, body };
}

async function fetchRobots(origin) {
  const url = new URL("/robots.txt", origin).toString();
  try {
    const { response, body } = await request(url, { readBody: true });
    return {
      url: response.url,
      status: response.status,
      text: response.ok ? body.slice(0, 500_000) : "",
      available: response.ok,
    };
  } catch {
    return { url, status: null, text: "", available: false };
  }
}

async function probe(url, userAgent) {
  try {
    const { response } = await request(url, { userAgent });
    await response.body?.cancel().catch(() => undefined);
    return { status: response.status, finalUrl: response.url, reachable: response.ok };
  } catch {
    return { status: null, finalUrl: null, reachable: false };
  }
}

/**
 * Check how a public HTTP or HTTPS page treats documented OpenAI and Anthropic
 * crawler user-agent names.
 *
 * The response includes robots.txt decisions, page indexing directives, and
 * labeled response probes. Probes originate from the caller and do not prove
 * access from a provider-owned IP range.
 *
 * @param {string} input Public page URL or hostname to check.
 * @returns {Promise<object>} Structured crawler-access report.
 */
export async function checkAiCrawlerAccess(input) {
  const requestedUrl = normalizeUrl(input);
  const { response, body } = await request(requestedUrl, { readBody: true });
  const finalUrl = new URL(response.url);
  const robots = await fetchRobots(finalUrl.origin);
  const path = `${finalUrl.pathname}${finalUrl.search}`;
  const probes = await Promise.all(
    AI_CRAWLERS.map((crawler) => probe(finalUrl.toString(), crawler.userAgent)),
  );

  const crawlers = AI_CRAWLERS.map((crawler, index) => ({
    ...crawler,
    robots: robots.available
      ? evaluateRobotsAccess(robots.text, crawler.userAgent, path)
      : {
          allowed: robots.status === 404 ? true : null,
          matchedRule: null,
          usedSpecificGroup: false,
        },
    probe: probes[index],
  }));

  return {
    requestedUrl: requestedUrl.toString(),
    finalUrl: finalUrl.toString(),
    pageStatus: response.status,
    robots: { url: robots.url, status: robots.status, available: robots.available },
    indexing: extractPageIndexingSignals(body, response.headers.get("x-robots-tag")),
    crawlers,
    checkedAt: new Date().toISOString(),
    caveat: "User-agent probes come from your machine, not a verified provider IP range.",
  };
}
