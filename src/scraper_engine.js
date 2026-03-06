/**
 * OSINT Web MCP: Scraper Engine
 * Configuration-driven local scraping using Playwright.
 */

import { get_browser_instance } from './local_browser.js';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { remark } from 'remark';
import strip from 'strip-markdown';
import { BOT_INDICATORS } from './constants.js';

/**
 * Execute a local browser-based scrape with optional extraction.
 * @param {string} url - The URL to navigate to.
 * @param {Function} [extractor=null] - A Playwright page.evaluate function for custom extraction.
 * @param {any} [arg=null] - Argument to pass to the extractor function.
 * @returns {Promise<any>} The extracted data or full page content.
 */
export const local_scrape = async (url, extractor = null, arg = null) => {
    const browser = await get_browser_instance();
    const page = await browser.get_active_page({ url });
    
    if (process.env.DEBUG === 'true') {
        console.error(`Navigating to ${url}...`);
    }

    try {
        if (extractor) {
            return await page.evaluate(extractor, arg);
        }
        return await page.content();
    } catch (e) {
        throw new Error(`Scrape failed for ${url}: ${e.message}`);
    }
};

/**
 * Perform a search and extract results based on a provided selector map.
 * @param {string} search_url - The search engine URL including query.
 * @param {Object} selector_map - A map of CSS selectors for container, title, link, snippet.
 * @returns {Promise<Array>} List of structured results.
 */
export const perform_search_scrape = async (search_url, selector_map) => {
    const result = await local_scrape(search_url, (selectors) => {
        const items = Array.from(document.querySelectorAll(selectors.CONTAINER));
        return items.map(el => {
            // Optional skip logic for skeleton loaders or ads
            if (selectors.SKIP && el.querySelector(selectors.SKIP)) return null;

            const title_el = el.querySelector(selectors.TITLE);
            const link_el = el.querySelector(selectors.LINK);
            const thread_el = selectors.THREAD_LINK ? el.querySelector(selectors.THREAD_LINK) : null;
            const snippet_el = selectors.SNIPPET ? el.querySelector(selectors.SNIPPET) : null;
            const price_el = selectors.PRICE ? el.querySelector(selectors.PRICE) : null;
            const rating_el = selectors.RATING ? el.querySelector(selectors.RATING) : null;
            const reviews_el = selectors.REVIEWS ? el.querySelector(selectors.REVIEWS) : null;
            const image_el = selectors.IMAGE ? el.querySelector(selectors.IMAGE) : null;

            // Fallback for link: if specific LINK is not found, use THREAD_LINK
            const final_link = link_el?.href || link_el?.getAttribute('href') || thread_el?.href || thread_el?.getAttribute('href');

            return {
                id: selectors.ID_ATTR ? el.getAttribute(selectors.ID_ATTR) : null,
                title: title_el?.innerText.trim(),
                link: final_link,
                commentsUrl: thread_el?.href || thread_el?.getAttribute('href'),
                snippet: snippet_el?.innerText.trim(),
                price: price_el?.innerText.trim(),
                rating: rating_el?.innerText.trim(),
                reviews: reviews_el?.innerText.trim(),
                imageUrl: image_el?.src || image_el?.getAttribute('src')
            };
        })
        .filter(item => item && item.title && item.link);
    }, selector_map);

    if (process.env.DEBUG === 'true') {
        console.error(`Search for ${search_url} returned ${result?.length || 0} results.`);
    }

    return result;
};

/**
 * Checks if the page content indicates a bot detection challenge.
 * @param {Document} doc - The JSDOM document instance.
 * @param {string} url - The URL of the page.
 * @throws {Error} If bot detection is identified.
 */
const check_bot_detection = (doc, url) => {
    const title = doc.title?.toLowerCase() || '';
    const h1 = doc.querySelector('h1')?.innerText?.toLowerCase() || '';
    const body = doc.body?.innerText?.toLowerCase() || '';
    
    const is_blocked = BOT_INDICATORS.some(ind => 
        title.includes(ind) || 
        h1.includes(ind) || 
        body.includes(ind)
    );

    if (is_blocked) {
        throw new Error(`Scraper blocked by bot detection on ${new URL(url).hostname}. Try setting HEADLESS=false.`);
    }
};

/**
 * Parses the document into an article object using Readability.
 * @param {Document} doc - The JSDOM document instance.
 * @param {string} url - The URL for error reporting.
 * @returns {Object} The parsed article object.
 */
const parse_article = (doc, url) => {
    const reader = new Readability(doc);
    let article = reader.parse();
    
    if (!article) {
        const bodyText = doc.body?.textContent?.trim();
        if (bodyText && bodyText.length > 200) {
            article = {
                title: doc.title || 'Extracted Page Content',
                textContent: bodyText
            };
        } else {
            throw new Error(`Failed to parse meaningful content from ${url}.`);
        }
    }
    return article;
};

/**
 * Convert raw HTML to AI-friendly Markdown using readability and remark.
 * @param {string} html - The raw HTML content.
 * @param {string} url - The original URL for link resolution.
 * @returns {Promise<string>} Cleaned Markdown string.
 */
export const to_readable_markdown = async (html, url) => {
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;
    
    check_bot_detection(doc, url);
    const article = parse_article(doc, url);
        
    const result = await remark()
        .use(strip, { keep: ['link', 'linkReference', 'code', 'inlineCode'] })
        .process(article.textContent);
        
    return `# ${article.title}\\n\\n${result.value}`;
};
