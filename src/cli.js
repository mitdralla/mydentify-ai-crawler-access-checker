#!/usr/bin/env node

import { checkAiCrawlerAccess } from "./check.js";

function usage() {
  console.error("Usage: node src/cli.js <public-url> [--json]");
  console.error("Example: node src/cli.js https://example.com/product");
}

const args = process.argv.slice(2);
const json = args.includes("--json");
const url = args.find((arg) => !arg.startsWith("--"));

if (!url) {
  usage();
  process.exitCode = 1;
} else {
  try {
    const result = await checkAiCrawlerAccess(url);
    if (json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`AI crawler access check: ${result.finalUrl}`);
      console.log(`Page: ${result.pageStatus} | robots.txt: ${result.robots.status ?? "unavailable"}`);
      console.log(`Page noindex: ${result.indexing.noindex ? "yes" : "no"}`);
      console.log("");
      console.table(
        result.crawlers.map((crawler) => ({
          crawler: crawler.userAgent,
          purpose: crawler.purpose,
          robots: crawler.robots.allowed === null
            ? "unknown"
            : crawler.robots.allowed
              ? "allowed"
              : "blocked",
          response: crawler.probe.status ?? "unavailable",
          rule: crawler.robots.matchedRule ?? "none",
        })),
      );
      console.log(result.caveat);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : "The URL could not be checked.");
    process.exitCode = 1;
  }
}
