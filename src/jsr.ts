import { checkAiCrawlerAccess as runCheck } from "./check.js";

export interface CrawlerAccessDecision {
  allowed: boolean | null;
  matchedRule: string | null;
  usedSpecificGroup: boolean;
}

export interface CrawlerProbe {
  status: number | null;
  finalUrl: string | null;
  reachable: boolean;
}

export interface CrawlerResult {
  name: string;
  userAgent: string;
  provider: string;
  purpose: string;
  sourceUrl: string;
  robots: CrawlerAccessDecision;
  probe: CrawlerProbe;
}

export interface AiCrawlerAccessReport {
  requestedUrl: string;
  finalUrl: string;
  pageStatus: number;
  robots: {
    url: string;
    status: number | null;
    available: boolean;
  };
  indexing: {
    robotsMeta: string[];
    xRobotsTag: string | null;
    noindex: boolean;
    nofollow: boolean;
  };
  crawlers: CrawlerResult[];
  checkedAt: string;
  caveat: string;
}

/**
 * Check how a public page treats documented OpenAI and Anthropic crawler names.
 *
 * Probes originate from the caller and do not prove access from a
 * provider-owned IP range.
 */
export async function checkAiCrawlerAccess(
  input: string,
): Promise<AiCrawlerAccessReport> {
  return await runCheck(input) as AiCrawlerAccessReport;
}
