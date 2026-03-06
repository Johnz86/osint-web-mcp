/**
 * OSINT Web MCP: Global Constants
 */

export const BROWSER_CONFIG = {
    DEFAULT_HEADLESS: true,
    DEFAULT_TIMEOUT: 15000,
    NAV_TIMEOUT: 30000,
    DEFAULT_VIEWPORT: { width: 1280, height: 800 },
    DEFAULT_USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

export const SEARCH_ENGINES = {
    DUCKDUCKGO: 'https://duckduckgo.com/?q=',
    GOOGLE: 'https://www.google.com/search?q=',
    GOOGLE_NEWS: 'https://www.google.com/search?tbm=nws&q=',
    YOUTUBE: 'https://www.youtube.com/results?search_query=',
    HACKER_NEWS: 'https://news.ycombinator.com/',
    HACKER_NEWS_NEWEST: 'https://news.ycombinator.com/newest',
    HACKER_NEWS_SEARCH: 'https://hn.algolia.com/?q=',
    EBAY: 'https://www.ebay.com/sch/i.html?_nkw=',
    AMAZON: 'https://www.amazon.com/s?k=',
    GITHUB: 'https://github.com/search?type=repositories&q=',
    REDDIT: 'https://www.reddit.com/search/?q=',
    LINKEDIN_JOBS: 'https://www.linkedin.com/jobs/search?keywords=',
    TWITTER: 'https://twitter.com/search?f=live&q=',
    TWITTER_X: 'https://twitter.com/search?f=live&q=',
    GOOGLE_MAPS: 'https://www.google.com/maps/search/',
    ZILLOW: 'https://www.zillow.com/homes/',
    LINKEDIN: 'https://www.linkedin.com/jobs/search?keywords=',
    WIKIPEDIA: 'https://en.wikipedia.org/w/index.php?fulltext=1&search=',
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
    BESTBUY: 'https://www.bestbuy.com/site/searchpage.jsp?intl=nosplash&st=',
    REUTERS: 'https://www.reuters.com/site-search/?query=',
    ETSY: 'https://www.etsy.com/search?q=',
    ZARA: 'https://www.zara.com/us/en/search?searchTerm=',
    HOMEDEPOT: 'https://www.homedepot.com/s/',
    LINKEDIN_COMPANY_SEARCH: 'https://www.google.com/search?q=site:linkedin.com/company+',
    TIKTOK_PROFILE: 'https://www.tiktok.com/@'
};

export const SELECTORS = {
    GOOGLE: {
        CONTAINER: 'div.g, div.V9tjod, div.tF2Cxc, div.MjjYud, div.srK7ed, div.uwS8re',
        TITLE: 'h3, div[role="heading"], a > div > span',
        LINK: 'a',
        SNIPPET: 'div.VwiC3b, div.kb0980, .STZOf, .hgKElc'
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
        CONTAINER: 'li.product-list-item.grid-view, li.sku-item, .sku-item-list > li',
        SKIP: '.skeleton-product-grid-view',
        ID_ATTR: 'data-testid',
        TITLE: '.product-title, h4.sku-title, .sku-title',
        LINK: 'a.product-list-item-link, h4.sku-title a, a.sku-title',
        PRICE: '[data-testid="price-block-customer-price"], div[data-testid="customer-price"] span[aria-hidden="true"], .priceView-customer-price span, .priceView-hero-price span',
        RATING: '.ratings .font-weight-bold',
        REVIEWS: '.c-reviews',
        IMAGE: '[data-testid="product-image"]'
    },
    ETSY: {
        CONTAINER: '.v2-listing-card, .wt-grid__item-section',
        TITLE: '.v2-listing-card__title, h3',
        LINK: 'a.listing-link, a.v2-listing-card__img, a.v2-listing-card__link',
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
        CONTAINER: 'li.b_algo, .b_algo',
        TITLE: 'h2 a, h2, a.title',
        LINK: 'h2 a, a',
        SNIPPET: 'div.b_caption p, .b_algo p, .b_caption'
    },
    YANDEX: {
        CONTAINER: 'li.serp-item, .serp-item',
        TITLE: 'h2 a, h2.OrganicTitle-LinkText, a.Link_theme_outer',
        LINK: 'h2 a, a.Link_theme_outer, a.organic__url',
        SNIPPET: 'div.organic__text, .Organic-ContentWrapper, .TextContainer'
    },
    AMAZON_PRODUCT: {
        TITLE: '#productTitle',
        PRICE: '.a-price .a-offscreen',
        FEATURES: '#feature-bullets ul li',
        DESCRIPTION: '#productDescription'
    },
    AMAZON_REVIEWS: {
        CONTAINER: 'div[data-hook="review"]',
        TITLE: 'a[data-hook="review-title"]',
        RATING: 'i[data-hook="review-star-rating"] span',
        BODY: 'span[data-hook="review-body"]'
    },
    WALMART_PRODUCT: {
        TITLE: 'h1[data-automation-id="product-title"]',
        PRICE: 'span[itemprop="price"]',
        SPECIFICATIONS: 'div.mb3 div.flex'
    },
    EBAY_PRODUCT: {
        TITLE: 'h1.x-item-title__mainTitle',
        PRICE: 'div.x-price-primary span',
        CONDITION: 'div.x-item-condition-value'
    },
    HOMEDEPOT_PRODUCT: {
        TITLE: 'h1.product-details__title',
        PRICE: 'div.price-format__main-price',
        SPECIFICATIONS: 'div.specifications__table'
    },
    BESTBUY_PRODUCT: {
        TITLE: 'h1.heading-5',
        PRICE: 'div.priceView-hero-price span',
        SPECIFICATIONS: 'div.spec-table'
    },
    ETSY_PRODUCT: {
        TITLE: 'h1[data-buy-box-listing-title], h1.wt-text-body-01, h1',
        PRICE: 'div[data-buy-box-region="price"] p.wt-text-title-03, .wt-text-title-03, .currency-value',
        DESCRIPTION: 'p[data-product-details-description-text-content], #listing-right-column'
    },
    ZARA_PRODUCT: {
        TITLE: 'h1.product-detail-info__name',
        PRICE: 'span.price-current__amount',
        COMPOSITION: 'div.product-detail-extra-detail'
    },
    YOUTUBE_VIDEO: {
        TITLE: 'h1.ytd-watch-metadata yt-formatted-string',
        DESCRIPTION: '#description-inline-expander',
        CHANNEL: '#owner-sub-count'
    },
    YOUTUBE_COMMENTS: {
        CONTAINER: 'ytd-comment-thread-renderer',
        AUTHOR: '#author-text',
        BODY: '#content-text'
    },
    TIKTOK_VIDEO: {
        TITLE: 'div[data-e2e="browse-video-desc"]',
        STATS: 'div[data-e2e="browse-video-stats"]',
        AUTHOR: 'span[data-e2e="browse-username"]'
    },
    REDDIT_THREAD: {
        TITLE: 'shreddit-title, h1[slot="title"], h1, [data-testid="post-title"]',
        BODY: 'shreddit-post [slot="text-body"], div[id*="-post-rtjson-content"], #post-content, .post-body, [data-testid="post-content"]',
        COMMENT: 'shreddit-comment [slot="comment"], [data-testid="comment"], .comment-body'
    },
    X_POST: {
        CONTAINER: 'article[data-testid="tweet"]',
        BODY: 'div[data-testid="tweetText"]',
        STATS: 'div[data-testid="app-bar"]'
    },
    GOOGLE_PLAY_APP: {
        TITLE: 'h1[itemprop="name"]',
        DESCRIPTION: 'div[data-g-id="description"]',
        DEVELOPER: 'div.VfPpkd-ES9v6b-OWXpue-TV698c a'
    },
    APPLE_APP_STORE_APP: {
        TITLE: 'h1.product-header__title',
        DESCRIPTION: 'div.section__description',
        DEVELOPER: 'h2.product-header__identity'
    },
    YAHOO_FINANCE_PROFILE: {
        TITLE: 'h1',
        SUMMARY: 'section[data-test="qsp-profile"] p',
        SECTOR: 'span[data-test="qsp-profile"] span:nth-child(2)'
    },
    GOOGLE_MAPS_REVIEWS: {
        CONTAINER: 'div.jftiEf',
        AUTHOR: 'div.d4r55',
        BODY: 'span.wiI7ic',
        RATING: 'span.kvv7Id'
    },
    BOOKING_HOTEL: {
        TITLE: 'h2.pp-header__title',
        AMENITIES: 'div.hotel_facilities_block',
        ROOMS: 'table.hprt-table'
    },
    ZILLOW_PROPERTY: {
        TITLE: 'h1',
        PRICE: 'span[data-testid="price"]',
        FACTS: 'div.hdp-facts-container'
    },
    LINKEDIN_POST: {
        CONTAINER: 'article, .main-feed-card',
        BODY: '.feed-shared-update-v2__description, .comment-body',
        AUTHOR: '.feed-shared-actor__name'
    },
    INSTAGRAM_PROFILE: {
        TITLE: 'header h2',
        BIO: 'header span',
        STATS: 'header ul li'
    },
    GITHUB_FILE: {
        CONTENT: 'div.blob-wrapper table',
        RAW_URL: 'a[data-testid="raw-button"], a[aria-label="Download raw content"]'
    },
    DUCKDUCKGO: {
        CONTAINER: 'article[data-testid="result"]',
        TITLE: 'a[data-testid="result-title-a"]',
        LINK: 'a[data-testid="result-title-a"]',
        SNIPPET: 'div[data-testid="result-snippet"]'
    },
    AMAZON: {
        CONTAINER: 'div[data-component-type="s-search-result"], .s-result-item[data-asin]:not(.ad-placeholder)',
        TITLE: 'h2, .a-size-medium.a-text-normal, .a-size-base-plus.a-text-normal',
        LINK: 'a.a-link-normal',
        PRICE: '.a-price-whole, .a-price .a-offscreen',
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
        CONTAINER: 'div.fXzjPH, div.js-repo-list-item, div.Box-row',
        TITLE: '.search-title a, a.v-align-middle, a[data-testid="results-list-item-title"]',
        LINK: '.search-title a, a.v-align-middle, a[data-testid="results-list-item-title"]',
        SNIPPET: 'span.search-match, p.mb-1, span.flex-1',
        STARS: 'a.Link--muted, span.flex-items-center'
    },
    REDDIT: {
        CONTAINER: 'div[data-testid="search-post-with-content-preview"], [data-testid="search-sdui-post"], shreddit-post',
        ID_ATTR: 'id',
        TITLE: 'a[data-testid="post-title-text"], [data-testid="post-title-text"], h3',
        LINK: 'a[data-testid="post-title-text"], a[data-testid="post-title"]',
        SNIPPET: '[data-testid="search-counter-row"], faceplate-timeago, .text-neutral-content-weak',
        AUTHOR: 'a[href^="/r/"]',
        IMAGE: 'faceplate-img[data-testid="search_post_thumbnail"]'
    },
    LINKEDIN: {
        CONTAINER: '.jobs-search__results-list li',
        TITLE: '.base-search-card__title',
        LINK: '.base-card__full-link',
        SNIPPET: '.job-search-card__location',
        PRICE: '.base-search-card__subtitle'
    },
    TWITTER: {
        CONTAINER: 'article[data-testid="tweet"]',
        TITLE: 'div[data-testid="User-Name"]',
        LINK: 'a[href*="/status/"]',
        SNIPPET: 'div[data-testid="tweetText"]'
    },
    GOOGLE_NEWS: {
        CONTAINER: 'a.WlydOe, a.WlyYGe, a.SoS9be, div.g, article, a:has(div[role="heading"]), a:has(h3)',
        TITLE: 'div[role="heading"], h3, h4, div.n7vBic, div.n0jPhd',
        LINK: 'a',
        THREAD_LINK: 'a',
        SNIPPET: 'div.GI74ad, div.VwiC3b, .OSrXXb'
    },
    YOUTUBE: {
        CONTAINER: 'ytd-video-renderer',
        TITLE: '#video-title',
        LINK: '#video-title',
        SNIPPET: '#metadata-line',
        PRICE: '#channel-info'
    },
    HACKER_NEWS: {
        CONTAINER: '.Story',
        TITLE: '.Story_title a span',
        LINK: 'a.Story_link',
        THREAD_LINK: '.Story_title a',
        SNIPPET: '.Story_comment',
        PRICE: '.Story_meta span:first-child'
    },
    HACKER_NEWS_FRONT: {
        CONTAINER: 'tr.athing',
        TITLE: 'span.titleline > a',
        LINK: 'span.titleline > a',
        METADATA: '.subtext'
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
        PRICE: 'span.companyName',
        SNIPPET: 'div.companyLocation'
    }
};

export const API_ENDPOINTS = {
    IP_API: 'http://ip-api.com/json/'
};

export const BOT_INDICATORS = [
    'unusual traffic',
    'captcha',
    'bot detection',
    'verify you are human',
    'access denied',
    'datadome',
    'captcha-delivery',
    'robot check',
    'are you a human',
    'checking your browser',
    'just a moment',
    'pardon our interruption',
    'security check'
];
