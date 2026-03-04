# OSINT Web MCP - Context & Guidelines

## Project Overview
The **OSINT Web MCP** is a Model Context Protocol (MCP) implementation providing AI assistants with 100% free, local-first web intelligence and scraping capabilities. It allows LLMs to perform advanced OSINT research without any reliance on paid API keys or commercial proxies.

### Core Technologies
- **Runtime**: Node.js (ES Modules)
- **MCP Framework**: `fastmcp`
- **Browser**: Playwright (with Stealth Plugin)
- **Extraction**: @mozilla/readability, JSDOM
- **OSINT Tools**: whois-json, native DNS lookups

## Project Structure
- `src/server.js`: Main entry point. Registers the "Omakase" set of curated search and OSINT tools.
- `src/scraper_engine.js`: Functional engine for local scraping and Markdown conversion.
- `src/local_browser.js`: Singleton manager for the stealth-enabled local browser.
- `src/browser_tools.js`: Interactive browser tools (click, type, screenshot).
- `src/constants.js`: Centralized configuration for search engines and CSS selectors.
- `src/prompts.js`: Tactical guidance for choosing the right investigative tool.

## Building and Running

### Prerequisites
- Node.js (v18+)
- Playwright Chromium (`npx playwright install chromium`)

### Commands
- **Install**: `npm install`
- **Run**: `npm start`
- **Test**: `npm test`

### Configuration (Environment Variables)
- `HEADLESS`: `true` (default) or `false`.
- `USER_AGENT`: Optional custom UA string.
- `RATE_LIMIT`: Local rate limiting (e.g., `100/1h`).

## Development Conventions
- **Omakase Philosophy**: Provide high-quality, integrated tools rather than fragmented components.
- **SOLID & Functional**: Use small, decomposed functions instead of large classes.
- **No Magic Strings**: All external site selectors and URLs MUST be defined in `src/constants.js`.
- **Zero API Keys**: Tools must be designed to work via local browser simulation or free public APIs.
