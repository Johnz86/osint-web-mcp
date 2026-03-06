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
 * @param {string} url
 * @param {Function} [extractor=null]
 * @param {any} [arg=null]
 * @param {string} [wait_selector=null]
 * @returns {Promise<any>}
 */
export const local_scrape = async (url, extractor = null, arg = null, wait_selector = null) => {
    const browser = await get_browser_instance();
    const page = await browser.get_active_page({ url });
    
    if (process.env.DEBUG === 'true') {
        console.error(`Navigating to ${url}...`);
    }

    if (wait_selector) {
        try {
            await page.waitForSelector(wait_selector, { timeout: 10000 });
        } catch (e) {
            if (process.env.DEBUG === 'true') {
                console.error(`Timeout waiting for selector: ${wait_selector}`);
            }
        }
    }

    // Surgical bot detection check using visible text
    const is_blocked = await page.evaluate((indicators) => {
        const title = document.title?.toLowerCase() || '';
        const h1 = document.querySelector('h1')?.innerText?.toLowerCase() || '';
        const body = document.body?.innerText?.toLowerCase() || '';
        
        return indicators.some(ind => 
            title.includes(ind) || 
            h1.includes(ind) || 
            body.includes(ind)
        );
    }, BOT_INDICATORS);
    
    if (is_blocked) {
        if (!browser.is_headless) {
            // Give user one more chance to solve it if they haven't already
            await browser.handle_manual_captcha(page, true);
            
            // Re-check after manual intervention
            const still_blocked = await page.evaluate((indicators) => {
                const title = document.title?.toLowerCase() || '';
                const h1 = document.querySelector('h1')?.innerText?.toLowerCase() || '';
                const body = document.body?.innerText?.toLowerCase() || '';
                return indicators.some(ind => title.includes(ind) || h1.includes(ind) || body.includes(ind));
            }, BOT_INDICATORS);
            
            if (still_blocked) {
                throw new Error(`Scraper blocked by bot detection on ${new URL(url).hostname}. Try setting HEADLESS=false.`);
            }
        } else {
            throw new Error(`Scraper blocked by bot detection on ${new URL(url).hostname}. Try setting HEADLESS=false.`);
        }
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
 * @param {string} search_url
 * @param {Object} selector_map
 * @returns {Promise<Array>}
 */
export const perform_search_scrape = async (search_url, selector_map) => {
    const browser = await get_browser_instance();
    const page = await browser.get_active_page({ url: search_url });

    if (process.env.DEBUG === 'true') {
        console.error(`Waiting for search results on ${search_url}...`);
    }

    await _wait_for_results(page, selector_map.CONTAINER);

    let results = await _extract_results(page, selector_map);

    if ((!results || results.length === 0) && !browser.is_headless) {
        results = await _handle_empty_results(browser, page, search_url, selector_map);
    }

    if (process.env.DEBUG === 'true') {
        console.error(`Search for ${search_url} returned ${results?.length || 0} results.`);
    }

    return results;
};

/**
 * Waits for the results container to appear.
 * @private
 */
async function _wait_for_results(page, container_selector) {
    try {
        await page.waitForSelector(container_selector, { timeout: 10000 });
        await page.waitForTimeout(1000);
    } catch (e) {
        if (process.env.DEBUG === 'true') {
            console.error(`Timeout waiting for selector: ${container_selector}`);
        }
    }
}

/**
 * Executes the extraction logic in the page context.
 * @private
 */
async function _extract_results(page, selector_map) {
    return await page.evaluate((selectors) => {
        const items = Array.from(document.querySelectorAll(selectors.CONTAINER));
        return items.map(el => {
            if (selectors.SKIP && el.querySelector(selectors.SKIP)) return null;

            // Try to extract from tracking context if available (standard for modern Reddit)
            let contextData = {};
            const tracker = el.closest('search-telemetry-tracker') || el.querySelector('search-telemetry-tracker');
            if (tracker) {
                try {
                    const attr = tracker.getAttribute('data-faceplate-tracking-context');
                    if (attr) contextData = JSON.parse(attr);
                } catch (e) {}
            }

            const title_el = el.querySelector(selectors.TITLE);
            const link_el = el.querySelector(selectors.LINK);
            const thread_el = selectors.THREAD_LINK ? el.querySelector(selectors.THREAD_LINK) : null;
            const snippet_el = selectors.SNIPPET ? el.querySelector(selectors.SNIPPET) : null;
            const price_el = selectors.PRICE ? el.querySelector(selectors.PRICE) : null;
            const rating_el = selectors.RATING ? el.querySelector(selectors.RATING) : null;
            const reviews_el = selectors.REVIEWS ? el.querySelector(selectors.REVIEWS) : null;
            const image_el = selectors.IMAGE ? el.querySelector(selectors.IMAGE) : null;

            let final_link = null;
            if (el.tagName === 'A') {
                final_link = el.href || el.getAttribute('href');
            } else {
                final_link = link_el?.href || link_el?.getAttribute('href') || thread_el?.href || thread_el?.getAttribute('href');
            }

            // Map standard fields, preferring context data for cleaner extraction
            const id = contextData.post?.id || contextData.comment?.id || (selectors.ID_ATTR ? el.getAttribute(selectors.ID_ATTR) : null);
            const title = contextData.post?.title || title_el?.innerText.trim() || el.innerText.split('\n')[0].trim();
            const subreddit = contextData.subreddit?.name;
            const contextSnippet = contextData.search?.snippet;

            let snippet = snippet_el?.innerText.trim();
            if (subreddit) {
                snippet = `r/${subreddit}${snippet ? ' · ' + snippet : ''}`;
            } else if (contextSnippet) {
                snippet = contextSnippet;
            }

            return {
                id,
                title,
                link: final_link,
                commentsUrl: thread_el?.href || thread_el?.getAttribute('href'),
                snippet,
                price: price_el?.innerText.trim(),
                rating: rating_el?.innerText.trim(),
                reviews: reviews_el?.innerText.trim(),
                imageUrl: image_el?.src || image_el?.getAttribute('src')
            };
        })
        .filter(item => item && item.title && item.link);
    }, selector_map);
}

/**
 * Handles cases where no results were found, potentially due to bot blocks.
 * @private
 */
async function _handle_empty_results(browser, page, search_url, selector_map) {
    const domain = new URL(search_url).hostname;
    browser.reset_verification(domain);
    
    console.error(`\n⚠️ Zero results found on ${domain}. It might be a silent block or outdated selectors.`);
    console.error(`Browser is left open for manual inspection/resolution.`);
    
    await browser.handle_manual_captcha(page, true);
    
    const retry_results = await _extract_results(page, selector_map);
    
    if (retry_results && retry_results.length > 0) {
        console.error(`✅ Extraction successful after manual intervention: ${retry_results.length} results.`);
        return retry_results;
    }
    
    return [];
}

/**
 * Checks if the page content indicates a bot detection challenge.
 * @param {Document} doc
 * @param {string} url
 * @throws {Error}
 */
const check_bot_detection = (doc, url) => {
    // Clone body to strip scripts/styles for a cleaner check in JSDOM
    const bodyClone = doc.body.cloneNode(true);
    const toRemove = bodyClone.querySelectorAll('script, style, noscript');
    toRemove.forEach(el => el.remove());

    const title = doc.title?.toLowerCase() || '';
    const h1 = (doc.querySelector('h1')?.innerText || doc.querySelector('h1')?.textContent || '').toLowerCase();
    const body = (bodyClone.innerText || bodyClone.textContent || '').toLowerCase();
    
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
 * @param {Document} doc
 * @param {string} url
 * @returns {Object}
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
 * @param {string} html
 * @param {string} url
 * @returns {Promise<string>}
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
