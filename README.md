# Mydentify AI Crawler Access Checker

[![CITATION.cff](https://img.shields.io/badge/cite-CITATION.cff-2f80ed.svg)](CITATION.cff)

A dependency-free Node.js command-line tool for checking how a public page treats documented OpenAI and Anthropic crawler names.

The checker reads `robots.txt`, evaluates the submitted path for six named crawlers, inspects page-level indexing directives, and sends a labeled request with each user-agent string. It keeps search discovery, user-requested retrieval, and model-training crawlers separate because they serve different jobs.

## Try the browser evaluator

Use the [browser-local robots policy evaluator](https://mitdralla.github.io/mydentify-ai-crawler-access-checker/) to paste a `robots.txt` file and test one path without sending that policy anywhere. The browser demo performs rule evaluation only; use the hosted checker when you also need live page, header, redirect, and user-agent response checks.

## Run the check

Node.js 20 or newer is required. No package install or API key is needed.

Run the published CLI with:

```sh
npx mydentify-ai-crawler-access-checker https://example.com/product
```

Or run the source checkout directly:

```sh
node src/cli.js https://example.com/product
```

Return the complete machine-readable result with:

```sh
node src/cli.js https://example.com/product --json
```

## What it checks

- `OAI-SearchBot`, `ChatGPT-User`, and `GPTBot`
- `Claude-SearchBot`, `Claude-User`, and `ClaudeBot`
- the longest applicable `Allow` or `Disallow` rule for the submitted path
- the page response for each user-agent string
- `robots` meta tags and `X-Robots-Tag` headers

The user-agent probes come from your computer, not a verified OpenAI or Anthropic IP range. They can reveal obvious user-agent handling, but they cannot prove how a CDN, WAF, login, geography rule, or official crawler IP will behave.

## Use the hosted checker

Use [Can AI Bots Read My Site?](https://mydentify.com/tools/ai-crawler-access-checker) for a hosted report with the same crawler-purpose separation and remediation guidance.

## Provider references

- [OpenAI crawler documentation](https://platform.openai.com/docs/bots)
- [Anthropic crawler documentation](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)

## Test

```sh
npm test
```

## License

MIT
