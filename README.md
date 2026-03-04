<div align="center">
  <h1>🌐 OSINT Web MCP</h1>
  
  <p>
    <strong>The Open-Source Intelligence Hub for AI Assistants</strong><br/>
    <i>A 100% free, local-first MCP server for real-time web research and investigative OSINT</i>
  </p>

  <p>
    <a href="https://github.com/Johnz86/osint-web-mcp/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-purple?style=for-the-badge" alt="License"/>
    </a>
    <img src="https://img.shields.io/badge/status-Open%20Source-green?style=for-the-badge" alt="Status"/>
    <img src="https://img.shields.io/badge/API%20Keys-None%20Required-blue?style=for-the-badge" alt="No API Keys"/>
  </p>

  <p>
    <a href="#-features">Features</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-available-tools">Tools</a> •
    <a href="#-configuration">Config</a> •
    <a href="#-architecture">Architecture</a>
  </p>
</div>

---

## 🌟 Overview

**OSINT Web MCP** is a ground-up rework of the original server, now transformed into a community-driven, open-source powerhouse. It eliminates all reliance on paid APIs and commercial proxies, bringing high-performance web scraping and investigative intelligence directly to your local machine.

By leveraging a managed **Local Stealth Browser** (Playwright + Stealth Plugin), it allows your AI assistant to browse the web, bypass common bot detections, and extract clean, structured data from dozens of platforms for free.

---

## ✨ Features

### 🛡️ Privacy & Freedom
- **Zero API Keys**: No commercial API keys required.
- **100% Local**: All browser execution and data processing happens on your machine.
- **Stealth by Default**: Automated user-agent rotation and fingerprint randomization to stay unblocked.

### 🔍 Investigative OSINT Suite
- **Domain Intelligence**: Real-time WHOIS and DNS (A, MX, TXT, NS) lookups.
- **Identity Search**: Cross-platform username lookup (GitHub, Twitter, Instagram, Reddit, YouTube).
- **Network Analysis**: Geolocation and ISP info for any IP address.

### 🍱 Omakase Scrapers (Curated & Integrated)
- **Search**: Google, DuckDuckGo, Wikipedia, StackOverflow.
- **Commerce**: Amazon, eBay, Craigslist.
- **Professional**: LinkedIn Jobs, Indeed.
- **Social & Tech**: Reddit, Twitter (X), Hacker News, YouTube, Google News.
- **Finance**: Real-time Yahoo Finance quotes.

---

## ⚡ Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

### 2. Installation
```bash
git clone https://github.com/Johnz86/osint-web-mcp.git
cd osint-web-mcp
npm install
npx playwright install chromium
```

### 3. Setup in Claude Desktop
Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "OSINT-Web": {
      "command": "node",
      "args": ["/path/to/osint-web-mcp/src/server.js"],
      "env": {
        "HEADLESS": "true"
      }
    }
  }
}
```

---

## 🔧 Available Tools

### 🌐 Web & Search
- `osint_search_google`: Structured Google search results.
- `osint_search_duckduckgo`: Privacy-focused search results.
- `osint_scrape`: Deep-scrape any URL into AI-optimized Markdown.

### 🕵️ Investigative
- `osint_whois`: Domain registration details.
- `osint_dns`: Multi-record DNS lookup.
- `osint_ip_info`: IP geolocation and network info.
- `osint_user_lookup`: Locate a username across 5+ major platforms.

### 📊 Specialized Scrapers
- `osint_amazon_search`: Product listings with prices and ratings.
- `osint_linkedin_jobs_search`: Real-time job listings without login.
- `osint_yahoo_finance_quote`: Live stock data and performance.
- ...and many more (GitHub, Reddit, eBay, Craigslist, etc.).

### 🖱️ Browser Automation
- `browser_navigate`: Visit any URL with the stealth browser.
- `browser_snapshot`: Get an ARIA accessibility tree for element targeting.
- `browser_click` / `browser_type`: Interact with elements via ref or name.
- `browser_screenshot`: Capture visual state for the AI.

---

## ⚙️ Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `HEADLESS` | Run browser without a GUI | `true` |
| `USER_AGENT` | Custom User-Agent string | Modern Chrome (Windows) |
| `RATE_LIMIT` | Local rate limiting (e.g., `50/1h`) | Unlimited |

---

## 🏗️ Architecture

Following **KISS, DRY, and SOLID** principles:
- **`src/local_browser.js`**: Managed singleton for the stealth-enabled Playwright instance.
- **`src/scraper_engine.js`**: A functional, configuration-driven engine for structured extraction.
- **`src/constants.js`**: Zero magic strings. All CSS selectors and URLs are centralized.
- **`src/server.js`**: A clean "Omakase" registry that assembles the tools into a cohesive system.
