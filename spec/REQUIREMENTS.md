# OSINT Web MCP: Technical Requirements Specification

## Hardware Requirements
- **CPU**: 2+ cores recommended (for local Playwright browser execution).
- **RAM**: 2GB+ recommended (Playwright is memory-intensive).
- **Network**: Stable internet connection without restrictive scraping firewalls.

## Software Dependencies
- **Node.js**: v18.0.0 or higher (ESM strictly enforced).
- **MCP Framework**: `fastmcp`
- **Browser Engine**: `playwright` (Chromium).
- **Stealth Integration**: `playwright-extra` and `puppeteer-extra-plugin-stealth`.
- **Content Parsing**: `jsdom` and `@mozilla/readability`.
- **Markdown Conversion**: `remark` and `strip-markdown`.
- **OSINT Utilities**: `axios`, `whois-json`, native `node:dns`.
- **Validation**: `zod`.

## Development Standards
- **ES Modules**: The project strictly uses ESM (`import`/`export`).
- **No Magic Strings**: All URLs, CSS selectors, and configurable constants must reside in `src/constants.js`.
- **Functional Omakase**: Tools should be curated and registered dynamically via data structures where possible (e.g., `register_search_tool`), minimizing boilerplate.
- **Documentation Comments**: Inline comments are considered a code smell. Complex logic must be decomposed into smaller functions accompanied by JSDoc-style block comments.

## Configuration (Environment Variables)
- `HEADLESS`: `true` (default) or `false`. Determines if the Playwright instance runs with a visible UI.
- `USER_AGENT`: Overrides the default stealth User-Agent string.
- `RATE_LIMIT`: Optional local rate limiting to prevent aggressive polling.
