# OSINT Web MCP: Open-Source Specification

## Project Vision
The **OSINT Web MCP** is a 100% free, community-driven, and open-source Model Context Protocol (MCP) server that empowers AI assistants with real-time web access and OSINT (Open Source Intelligence) capabilities. It eliminates all reliance on paid API keys or commercial proxies, running entirely on the user's local machine.

## Core Philosophies
1.  **Omakase Menu**: The solution provides a curated, integrated system of high-quality tools that work best together, removing the burden of configuration from the developer.
2.  **KISS & DRY & SOLID**: The codebase favors small, decomposed functions over large classes, avoids repetitive code, and maintains single responsibilities. Inline comments are minimized in favor of descriptive function names and documentation comments.
3.  **No Magic Strings**: All external site selectors and URLs are strictly defined in `src/constants.js`.
4.  **Local Execution**: Scraping and data processing happen locally using Playwright with stealth plugins, rather than relying on remote cloud services.
5.  **Open & Free**: All data sources must be open and freely accessible. No API keys or paywalls.

## Architecture
The server is structured into logical, modular components:
- **`src/local_browser.js`**: Manages a singleton local Playwright instance equipped with `puppeteer-extra-plugin-stealth` to bypass basic bot detections.
- **`src/scraper_engine.js`**: A functional, configuration-driven engine that encapsulates navigation, extraction, and formatting (using `@mozilla/readability` and `remark`).
- **`src/constants.js`**: The central repository for all search engine URLs and DOM selectors.
- **`src/server.js`**: The main entry point using `fastmcp`, dynamically registering search tools based on configurations.
- **`src/browser_tools.js`**: Specialized tools for direct browser interaction (clicking, typing, snapshots).
