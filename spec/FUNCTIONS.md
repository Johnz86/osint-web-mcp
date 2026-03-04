# OSINT Web MCP: Functions Specification

## Implemented Tool Categories

### 1. Curated "Open Scrapers" (Search & Extraction)
Powered by the configuration-driven `scraper_engine.js`, these tools extract structured data using tailored DOM selectors defined in `constants.js`.
- `osint_search_google`: General search via Google.
- `osint_search_duckduckgo`: Privacy-focused search via DuckDuckGo.
- `osint_amazon_search` / `osint_ebay_search`: E-commerce product search.
- `osint_github_search`: Repository search.
- `osint_reddit_search`: Public post search.
- `osint_linkedin_jobs_search` / `osint_search_indeed`: Job market research.
- `osint_twitter_search`: Public tweet extraction (via Twitter/X advanced search).
- `osint_google_news_search`: News article aggregation.
- `osint_youtube_search`: Video search.
- `osint_hacker_news_search`: Tech story aggregation.
- `osint_search_wikipedia`: Encyclopedia article search.
- `osint_search_craigslist`: Local classifieds search.
- `osint_search_stackoverflow`: Developer Q&A search.
- `osint_search_booking`: Hotel and travel search.
- `osint_yahoo_finance_quote`: Specialized scraper for real-time stock quotes.

### 2. General Scraping
- `osint_scrape`: Deep-scrapes a single URL. Utilizes `@mozilla/readability` and `remark` to strip noise and return clean, AI-optimized Markdown.

### 3. Investigative OSINT Suite
Tools that leverage public registries, APIs, or cross-platform lookup techniques:
- `osint_whois`: Retrieves domain registration details.
- `osint_dns`: Performs targeted or wildcard DNS lookups (A, MX, TXT, NS).
- `osint_ip_info`: Retrieves geolocation and ISP information using a free IP API.
- `osint_user_lookup`: Searches for a username asynchronously across GitHub, Twitter, Instagram, Reddit, and YouTube.

### 4. Interactive Browser Tools
Wrappers around the `LocalBrowser` singleton for dynamic interactions:
- `browser_navigate`: Visit a specific URL.
- `browser_snapshot`: Generate an ARIA accessibility tree for element targeting.
- `browser_click`: Click an element using an ARIA reference.
- `browser_type`: Type text into an input field.
- `browser_screenshot`: Capture the visual state of the page.
- `browser_get_text`: Extract raw inner text from the body.
- `browser_scroll`: Scroll to the top or bottom of the page.
