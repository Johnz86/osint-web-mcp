/**
 * OSINT Web MCP: Scraper Engine
 * Configuration-driven local scraping using Playwright.
 */

import {get_browser_instance} from './local_browser.js';
import {Readability} from '@mozilla/readability';
import {JSDOM} from 'jsdom';
import {remark} from 'remark';
import strip from 'strip-markdown';

/**
 * Execute a local browser-based scrape with optional extraction.
 * @param {string} url - The URL to navigate to.
 * @param {Function} extractor - A Playwright page.evaluate function for custom extraction.
 * @param {any} arg - Argument to pass to the extractor function.
 * @returns {Promise<any>} The extracted data or full page content.
 */
export const local_scrape = async(url, extractor = null, arg = null)=>{
    const browser = await get_browser_instance();
    // Ensure we use the same robust navigation logic as browser_tools
    const page = await browser.get_active_page({ url });
    
    if (process.env.DEBUG === 'true') {
        console.error(`Navigating to ${url}...`);
    }

    try {
        // Wait for dynamic content
        await page.waitForTimeout(2000);

        if (extractor)
            return await page.evaluate(extractor, arg);
        return await page.content();
    } catch(e){
        throw new Error(`Scrape failed for ${url}: ${e.message}`);
    }
};

/**
 * Perform a search and extract results based on a provided selector map.
 * @param {string} search_url - The search engine URL including query.
 * @param {Object} selector_map - A map of CSS selectors for container, title, link, snippet.
 * @returns {Promise<Array>} List of structured results.
 */
export const perform_search_scrape = async(search_url, selector_map)=>{
    const result = await local_scrape(search_url, (selectors)=>{
        const items = Array.from(document.querySelectorAll(selectors.CONTAINER));
        return items.map(el=>{
                const title_el = el.querySelector(selectors.TITLE);
                const link_el = el.querySelector(selectors.LINK);
                const snippet_el = selectors.SNIPPET ? el.querySelector(selectors.SNIPPET) : null;
                const price_el = selectors.PRICE ? el.querySelector(selectors.PRICE) : null;
                const rating_el = selectors.RATING ? el.querySelector(selectors.RATING) : null;

                return {
                    title: title_el?.innerText.trim(),
                    link: link_el?.href,
                    snippet: snippet_el?.innerText.trim(),
                    price: price_el?.innerText.trim(),
                    rating: rating_el?.innerText.trim()
                };
            })
            .filter(item=>item.title && item.link);
    }, selector_map);

    if (process.env.DEBUG === 'true') {
        console.error(`Search for ${search_url} returned ${result?.length || 0} results.`);
    }

    return result;
};

/**
 * Convert raw HTML to AI-friendly Markdown using readability and remark.
 * @param {string} html - The raw HTML content.
 * @param {string} url - The original URL for link resolution.
 * @returns {Promise<string>} Cleaned Markdown string.
 */
export const to_readable_markdown = async(html, url)=>{
    const dom = new JSDOM(html, {url});
    const doc = dom.window.document;
    
    // Surgical bot detection check (only in title or main heading)
    const title = doc.title?.toLowerCase() || '';
    const h1 = doc.querySelector('h1')?.innerText?.toLowerCase() || '';
    const bot_indicators = ['unusual traffic', 'captcha', 'bot detection', 'verify you are human', 'access denied'];
    
    if (bot_indicators.some(ind => title.includes(ind) || h1.includes(ind))) {
        throw new Error(`Scraper blocked by bot detection on ${new URL(url).hostname}.`);
    }

    const reader = new Readability(doc);
    let article = reader.parse();
    
    if (!article) {
        // Fallback: Try to get basic body text if readability fails
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
        
    const result = await remark()
        .use(strip, {keep: ['link', 'linkReference', 'code', 'inlineCode']})
        .process(article.textContent);
        
    return `# ${article.title}

${result.value}`;
};
