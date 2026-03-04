/**
 * OSINT Web MCP: Global Constants
 */

export const BROWSER_CONFIG = {
    DEFAULT_HEADLESS: true,
    DEFAULT_TIMEOUT: 30000,
    NAV_TIMEOUT: 120000,
    DEFAULT_VIEWPORT: { width: 1280, height: 800 },
    DEFAULT_USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

export const SEARCH_ENGINES = {
    DUCKDUCKGO: 'https://duckduckgo.com/?q=',
    GOOGLE: 'https://www.google.com/search?q=',
    GOOGLE_NEWS: 'https://www.google.com/search?tbm=nws&q=',
    YOUTUBE: 'https://www.youtube.com/results?search_query=',
    HACKER_NEWS: 'https://hn.algolia.com/?q=',
    EBAY: 'https://www.ebay.com/sch/i.html?_nkw=',
    AMAZON: 'https://www.amazon.com/s?k=',
    GITHUB: 'https://github.com/search?type=repositories&q=',
    REDDIT: 'https://www.reddit.com/search/?q=',
    LINKEDIN_JOBS: 'https://www.linkedin.com/jobs/search?keywords=',
    TWITTER: 'https://twitter.com/search?f=live&q=',
    GOOGLE_MAPS: 'https://www.google.com/maps/search/',
    ZILLOW: 'https://www.zillow.com/homes/',
    LINKEDIN: 'https://www.linkedin.com/jobs/search?keywords=',
    TWITTER_X: 'https://twitter.com/search?f=live&q=',
    HACKER_NEWS_SEARCH: 'https://hn.algolia.com/?q=',
    WIKIPEDIA: 'https://en.wikipedia.org/w/index.php?search=',
    CRAIGSLIST: 'https://craigslist.org/search/sss?query=',
    STACKOVERFLOW: 'https://stackoverflow.com/search?q=',
    YAHOO_FINANCE: 'https://finance.yahoo.com/quote/',
    BOOKING: 'https://www.booking.com/searchresults.html?ss=',
    INDEED: 'https://www.indeed.com/jobs?q=',
    BING: 'https://www.bing.com/search?q=',
    YANDEX: 'https://yandex.com/search/?text=',
    PLAY_STORE: 'https://play.google.com/store/search?q=',
    APPLE_APP_STORE: 'https://www.google.com/search?q=site:apps.apple.com+',
    WALMART: 'https://www.walmart.com/search?q=',
    BESTBUY: 'https://www.bestbuy.com/site/searchpage.jsp?st=',
    REUTERS: 'https://www.reuters.com/site-search/?query=',
    ETSY: 'https://www.etsy.com/search?q=',
    ZARA: 'https://www.zara.com/us/en/search?searchTerm=',
    HOMEDEPOT: 'https://www.homedepot.com/s/',
    LINKEDIN_COMPANY_SEARCH: 'https://www.google.com/search?q=site:linkedin.com/company+',
    TIKTOK_PROFILE: 'https://www.tiktok.com/@'
};

export const SELECTORS = {
    GOOGLE: {
        CONTAINER: 'div.g',
        TITLE: 'h3',
        LINK: 'a',
        SNIPPET: 'div.VwiC3b'
    },
    TIKTOK_PROFILE: {
        TITLE: '[data-e2e="user-title"]',
        BIO: '[data-e2e="user-bio"]',
        STATS: '[data-e2e="user-stats"]'
    },
    REUTERS: {
        CONTAINER: 'li[class*="search-results__item"]',
        TITLE: 'h3[class*="media-story-card__heading"]',
        LINK: 'a[data-testid="Heading"]',
        SNIPPET: 'p[class*="media-story-card__description"]'
    },
    WALMART: {
        CONTAINER: 'div[data-item-id]',
        TITLE: 'span[data-automation-id="product-title"]',
        LINK: 'a[data-automation-id="product-anchor"]',
        PRICE: 'div[data-automation-id="product-price"]'
    },
    BESTBUY: {
        CONTAINER: 'li.sku-item',
        TITLE: 'h4.sku-title a',
        LINK: 'h4.sku-title a',
        PRICE: 'div.priceView-hero-price span'
    },
    ETSY: {
        CONTAINER: '.wt-grid__item-section, .listing-link',
        TITLE: '.v2-listing-card__title, h3',
        LINK: 'a.listing-link, a.v2-listing-card__link',
        PRICE: '.currency-value'
    },
    HOMEDEPOT: {
        CONTAINER: '.id-product-card, [data-component="ProductCard"]',
        TITLE: '.product-header__title-product--nx6nd, .product-pod__title',
        LINK: 'a',
        PRICE: '.price-format__main-price'
    },
    ZARA: {
        CONTAINER: '.product-grid-product, .product-card',
        TITLE: '.product-grid-product-info__name, .product-card__name',
        LINK: 'a.product-grid-product__link, a.product-card__link',
        PRICE: '.price-current__amount'
    },
    PLAY_STORE: {
        CONTAINER: 'div.VfPpkd-ES9v6b-OWXpue-TV698c',
        TITLE: 'span.Dd9H9d',
        LINK: 'a.Si66be'
    },
    BING: {
        CONTAINER: 'li.b_algo',
        TITLE: 'h2 a',
        LINK: 'h2 a',
        SNIPPET: 'div.b_caption p'
    },
    YANDEX: {
        CONTAINER: 'li.serp-item',
        TITLE: 'h2 a',
        LINK: 'h2 a',
        SNIPPET: 'div.organic__text'
    },
    AMAZON_PRODUCT: {
        TITLE: '#productTitle',
        PRICE: '.a-price .a-offscreen',
        FEATURES: '#feature-bullets ul li',
        DESCRIPTION: '#productDescription'
    },
    GITHUB_FILE: {
        CONTENT: 'div.blob-wrapper table',
        RAW_URL: 'a[data-testid="raw-button"]'
    },
    DUCKDUCKGO: {
        CONTAINER: 'article[data-testid="result"]',
        TITLE: 'a[data-testid="result-title-a"]',
        LINK: 'a[data-testid="result-title-a"]',
        SNIPPET: 'div[data-testid="result-snippet"]'
    },
    AMAZON: {
        CONTAINER: 'div[data-component-type="s-search-result"]',
        TITLE: 'h2',
        LINK: 'a.a-link-normal',
        PRICE: '.a-price-whole',
        RATING: '.a-icon-alt'
    },
    EBAY: {
        CONTAINER: 'li.s-item',
        TITLE: '.s-item__title',
        LINK: 'a.s-item__link',
        PRICE: '.s-item__price',
        SUBTITLE: '.s-item__subtitle'
    },
    GITHUB: {
        CONTAINER: 'div.js-repo-list-item, div.Box-row',
        TITLE: 'a.v-align-middle, a[data-testid="results-list-item-title"]',
        LINK: 'a.v-align-middle, a[data-testid="results-list-item-title"]',
        SNIPPET: 'p.mb-1, span.flex-1',
        STARS: 'a.Link--muted, span.flex-items-center'
    },
    REDDIT: {
        CONTAINER: 'shreddit-post, div[data-testid="post-container"]',
        TITLE: 'h3',
        LINK: 'a[data-click-id="body"]',
        AUTHOR: 'a[data-click-id="user_link"]'
    },
    LINKEDIN: {
        CONTAINER: '.jobs-search__results-list li',
        TITLE: '.base-search-card__title',
        LINK: '.base-card__full-link',
        SNIPPET: '.job-search-card__location',
        PRICE: '.base-search-card__subtitle' // Using price for company name
    },
    TWITTER: {
        CONTAINER: 'article[data-testid="tweet"]',
        TITLE: 'div[data-testid="User-Name"]',
        LINK: 'a[href*="/status/"]',
        SNIPPET: 'div[data-testid="tweetText"]'
    },
    GOOGLE_NEWS: {
        CONTAINER: 'div.SoS9be, div.g',
        TITLE: 'div[role="heading"], h3',
        LINK: 'a',
        SNIPPET: '.OSrXXb',
        PRICE: '.Mg7P1b, .XTXvN' // Using price for source
    },
    YOUTUBE: {
        CONTAINER: 'ytd-video-renderer',
        TITLE: '#video-title',
        LINK: '#video-title',
        SNIPPET: '#metadata-line',
        PRICE: '#channel-info' // Using price for channel
    },
    HACKER_NEWS: {
        CONTAINER: '.Story',
        TITLE: '.Story_title a span',
        LINK: '.Story_title a',
        SNIPPET: '.Story_meta span:nth-child(2) a', // Author
        PRICE: '.Story_meta span:first-child' // Points
    },
    WIKIPEDIA: {
        CONTAINER: 'li.mw-search-result',
        TITLE: 'div.mw-search-result-heading a',
        LINK: 'div.mw-search-result-heading a',
        SNIPPET: 'div.searchresult'
    },
    CRAIGSLIST: {
        CONTAINER: 'li.cl-search-result',
        TITLE: 'a.titlestring',
        LINK: 'a.titlestring',
        PRICE: 'span.priceinfo'
    },
    STACKOVERFLOW: {
        CONTAINER: 'div.s-post-summary',
        TITLE: 'h3.s-post-summary--content-title a',
        LINK: 'h3.s-post-summary--content-title a',
        SNIPPET: 'div.s-post-summary--content-excerpt'
    },
    BOOKING: {
        CONTAINER: 'div[data-testid="property-card"]',
        TITLE: 'div[data-testid="title"]',
        LINK: 'a[data-testid="title-link"]',
        PRICE: 'span[data-testid="price-and-discounted-price"]',
        RATING: 'div[data-testid="review-score"]'
    },
    INDEED: {
        CONTAINER: 'td.resultContent',
        TITLE: 'h2.jobTitle span',
        LINK: 'h2.jobTitle a',
        PRICE: 'span.companyName', // Using price for company
        SNIPPET: 'div.companyLocation'
    }
};

export const API_ENDPOINTS = {
    IP_API: 'http://ip-api.com/json/'
};
