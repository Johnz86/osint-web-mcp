# OSINT Web MCP: Tool Categorization & Roadmap

This document divides the tool ecosystem into two groups based on access requirements.

## 🟢 Group A: Zero-Access Tools (Public OSINT)
**Requirement**: None. No API keys, no accounts, no logins.
**Method**: Local Stealth Browser (Playwright) + Functional Scraper Engine.

### 1. Marketplaces (Open Scrapers)
- [x] Amazon (Search, Product)
- [x] eBay (Search)
- [x] Walmart (Search)
- [x] BestBuy (Search)
- [x] Zara / Etsy / HomeDepot (Search)

### 2. App Stores
- [x] Google Play Store (Search)
- [x] Apple App Store (Search via Google)

### 3. Research & News
- [x] Google Search / News
- [x] DuckDuckGo / Bing / Yandex
- [x] Wikipedia
- [x] GitHub (Search, File)
- [x] StackOverflow
- [x] Hacker News
- [x] Reuters (News Search)

### 4. Social & Identity (Public Only)
- [x] Reddit (Search)
- [x] Twitter/X (Search)
- [x] YouTube (Search)
- [x] LinkedIn Jobs (No login)
- [x] LinkedIn Company Profiles
- [x] TikTok Profiles (Public)

### 5. Infrastructure
- [x] WHOIS (Domain)
- [x] DNS (Records)
- [x] IP Info (Geolocation)
- [x] User Lookup (Sherlock-style availability)

---

## 🔴 Group B: Access-Required Tools (Authenticated OSINT)
**Requirement**: User-provided session cookies, proxy servers, or private API keys.
**Method**: To be implemented via a plugin architecture where users can provide their own `AUTH_TOKEN` or `PROXY_URL`.

### 1. Walled Social Networks
- LinkedIn People Search (Requires Login)
- Facebook Marketplace / Private Events (Requires Login)
- Instagram Comments (Requires Login/Session)

### 2. Paid Intelligence APIs
- Crunchbase (API Key)
- ZoomInfo (API Key)
- Specialized Financial Data (Bloomberg/Refinitiv equivalents)

---

## 🛠️ Roadmap for Group A Expansion
1.  **Specialized Detail Extraction**: Create more tools like `osint_amazon_product` for other platforms.
2.  **Enhanced Social Discovery**: Implement TikTok public profile extraction.
3.  **News Depth**: Add Reuters news search logic.
4.  **Local "Auth" Plugin**: Create a mechanism for users to optionally provide session cookies for Group B tools without hardcoding them.
