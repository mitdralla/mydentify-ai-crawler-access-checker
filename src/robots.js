export const AI_CRAWLERS = [
  {
    name: "OpenAI search",
    userAgent: "OAI-SearchBot",
    provider: "OpenAI",
    purpose: "search",
    sourceUrl: "https://platform.openai.com/docs/bots",
  },
  {
    name: "ChatGPT user requests",
    userAgent: "ChatGPT-User",
    provider: "OpenAI",
    purpose: "user-requested",
    sourceUrl: "https://platform.openai.com/docs/bots",
  },
  {
    name: "OpenAI training",
    userAgent: "GPTBot",
    provider: "OpenAI",
    purpose: "training",
    sourceUrl: "https://platform.openai.com/docs/bots",
  },
  {
    name: "Claude search",
    userAgent: "Claude-SearchBot",
    provider: "Anthropic",
    purpose: "search",
    sourceUrl: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler",
  },
  {
    name: "Claude user requests",
    userAgent: "Claude-User",
    provider: "Anthropic",
    purpose: "user-requested",
    sourceUrl: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler",
  },
  {
    name: "Anthropic training",
    userAgent: "ClaudeBot",
    provider: "Anthropic",
    purpose: "training",
    sourceUrl: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler",
  },
];

export function parseRobotsTxt(value) {
  const groups = [];
  let agents = [];
  let rules = [];

  const commit = () => {
    if (agents.length) groups.push({ agents: [...agents], rules: [...rules] });
    agents = [];
    rules = [];
  };

  for (const rawLine of value.split(/\r?\n/)) {
    const line = rawLine.split("#", 1)[0].trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const content = line.slice(separator + 1).trim();

    if (field === "user-agent") {
      if (rules.length) commit();
      agents.push(content.toLowerCase());
    } else if ((field === "allow" || field === "disallow") && agents.length) {
      rules.push({ directive: field, path: content });
    }
  }

  commit();
  return groups;
}

function ruleMatches(pattern, path) {
  if (!pattern) return false;
  const anchored = pattern.endsWith("$");
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replaceAll("*", ".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`).test(path);
}

export function evaluateRobotsAccess(robotsTxt, userAgent, path) {
  const groups = parseRobotsTxt(robotsTxt);
  const token = userAgent.toLowerCase();
  const exact = groups.filter((group) => group.agents.includes(token));
  const applicable = exact.length
    ? exact
    : groups.filter((group) => group.agents.includes("*"));
  const matches = applicable
    .flatMap((group) => group.rules)
    .filter((rule) => ruleMatches(rule.path, path))
    .sort((left, right) => {
      const leftLength = left.path.replace(/[\*$]/g, "").length;
      const rightLength = right.path.replace(/[\*$]/g, "").length;
      return rightLength - leftLength || (left.directive === "allow" ? -1 : 1);
    });
  const winner = matches[0];

  return {
    allowed: !winner || winner.directive === "allow",
    matchedRule: winner
      ? `${winner.directive === "allow" ? "Allow" : "Disallow"}: ${winner.path}`
      : null,
    usedSpecificGroup: exact.length > 0,
  };
}

export function extractPageIndexingSignals(html, xRobotsTag = null) {
  const robotsMeta = [];
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of metaTags) {
    const attributes = Object.fromEntries(
      [...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(
        (match) => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? ""],
      ),
    );
    const name = (attributes.name ?? "").trim().toLowerCase();
    if (name !== "robots" && !name.endsWith("bot")) continue;
    const content = (attributes.content ?? "").trim();
    if (content) robotsMeta.push(`${name}: ${content}`);
  }

  const combined = [...robotsMeta, xRobotsTag ?? ""].join(", ").toLowerCase();
  const directives = combined.split(/[\s,:;]+/);
  return {
    robotsMeta,
    xRobotsTag,
    noindex: directives.includes("noindex"),
    nofollow: directives.includes("nofollow"),
  };
}
