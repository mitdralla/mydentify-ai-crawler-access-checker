import assert from "node:assert/strict";
import test from "node:test";
import { evaluateRobotsAccess, extractPageIndexingSignals, parseRobotsTxt } from "../src/robots.js";

const robots = `
User-agent: OAI-SearchBot
Disallow: /private/
Allow: /private/public/

User-agent: *
Disallow: /private/
`;

test("parses specific and wildcard robots groups", () => {
  const groups = parseRobotsTxt(robots);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].agents, ["oai-searchbot"]);
});

test("prefers the longest matching rule", () => {
  assert.equal(
    evaluateRobotsAccess(robots, "OAI-SearchBot", "/private/public/page").allowed,
    true,
  );
  assert.equal(
    evaluateRobotsAccess(robots, "OAI-SearchBot", "/private/account").allowed,
    false,
  );
});

test("falls back to the wildcard group", () => {
  const result = evaluateRobotsAccess(robots, "GPTBot", "/private/account");
  assert.equal(result.allowed, false);
  assert.equal(result.usedSpecificGroup, false);
});

test("reads page and header indexing directives", () => {
  const signals = extractPageIndexingSignals(
    '<meta content="noindex, follow" name="robots"><meta name="GPTBot" content="nofollow">',
    "max-snippet: 0",
  );
  assert.equal(signals.noindex, true);
  assert.equal(signals.nofollow, true);
  assert.deepEqual(signals.robotsMeta, ["robots: noindex, follow", "gptbot: nofollow"]);
});

test("an empty disallow does not block", () => {
  assert.equal(
    evaluateRobotsAccess("User-agent: *\nDisallow:", "ClaudeBot", "/anything").allowed,
    true,
  );
});
