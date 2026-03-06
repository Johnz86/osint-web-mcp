/**
 * OSINT Web MCP: Search Tools
 */
import { z } from 'zod';
import { SEARCH_ENGINES, SELECTORS } from './constants.js';
import { perform_search_scrape, local_scrape } from './scraper_engine.js';
import { register_tracked_tool } from './session_manager.js';

/**
 * Common execution logic for standard search tools.
 * @param {string} engine_url - Base search engine URL.
 * @param {Object} selectors - CSS selectors for result extraction.
 * @param {string} name - The tool name for error reporting.
 * @returns {Function} Tool execution function.
 */
const execute_search = (engine_url, selectors, name) => async ({ query }) => {
    try {
        const url = `${engine_url}${encodeURIComponent(query)}`;
        const results = await perform_search_scrape(url, selectors);
        
        if (!results || results.length === 0) {
            return JSON.stringify({
                error: `No results found on ${new URL(engine_url).hostname}. This site may have anti-bot protections active.`,
                suggestion: 'Try setting HEADLESS=false to solve any CAPTCHAs manually.',
                results: []
            }, null, 2);
        }

        return JSON.stringify(results, null, 2);
    } catch (e) {
        return JSON.stringify({
            error: `Search failed for ${name}: ${e.message}`,
            results: []
        }, null, 2);
    }
};

/**
 * Extractor for Hacker News official front-page layout.
 * @param {Object} selectors - CSS selectors from SELECTORS.HACKER_NEWS_FRONT.
 * @returns {Array} List of extracted story objects.
 */
const extract_hn_front_page = (selectors) => {
    const items = Array.from(document.querySelectorAll(selectors.CONTAINER));
    return items.map(el => {
        const title_el = el.querySelector(selectors.TITLE);
        const link_el = el.querySelector(selectors.LINK);
        const meta_row = el.nextElementSibling;
        const points_el = meta_row?.querySelector('.score');
        const author_el = meta_row?.querySelector('.hnuser');
        const age_el = meta_row?.querySelector('.age a');
        
        const item_links = Array.from(meta_row?.querySelectorAll('a[href^="item?id="]') || []);
        const comments_el = item_links.find(a => a.innerText.toLowerCase().includes('comment'));
        const comments_text = comments_el?.innerText.trim() || '0 comments';
        
        return {
            title: title_el?.innerText.trim(),
            link: link_el?.href || link_el?.getAttribute('href'),
            snippet: `${points_el?.innerText || '0 points'} by ${author_el?.innerText || 'unknown'} | ${age_el?.innerText || ''} | ${comments_text}`,
            commentsUrl: age_el?.href || age_el?.getAttribute('href')
        };
    }).filter(item => item.title && item.link);
};

/**
 * Registers a set of search tools on the provided FastMCP server.
 * @param {import('fastmcp').FastMCP} server - The FastMCP server instance.
 */
export const register_search_tools = (server) => {
    const SEARCH_TOOLS_CONFIG = [
        { name: 'osint_search_google', desc: 'Search Google.', url: SEARCH_ENGINES.GOOGLE, sel: SELECTORS.GOOGLE },
        { name: 'osint_search_duckduckgo', desc: 'Search DuckDuckGo (High Success Rate).', url: SEARCH_ENGINES.DUCKDUCKGO, sel: SELECTORS.DUCKDUCKGO },
        { name: 'osint_search_bing', desc: 'Search Bing.', url: SEARCH_ENGINES.BING, sel: SELECTORS.BING },
        { name: 'osint_search_yandex', desc: 'Search Yandex.', url: SEARCH_ENGINES.YANDEX, sel: SELECTORS.YANDEX },
        { name: 'osint_amazon_search', desc: 'Search Amazon products.', url: SEARCH_ENGINES.AMAZON, sel: SELECTORS.AMAZON },
        { name: 'osint_ebay_search', desc: 'Search eBay products.', url: SEARCH_ENGINES.EBAY, sel: SELECTORS.EBAY },
        { name: 'osint_github_search', desc: 'Search GitHub repositories.', url: SEARCH_ENGINES.GITHUB, sel: SELECTORS.GITHUB },
        { name: 'osint_reddit_search', desc: 'Search Reddit posts.', url: SEARCH_ENGINES.REDDIT, sel: SELECTORS.REDDIT },
        { name: 'osint_linkedin_jobs_search', desc: 'Search LinkedIn jobs.', url: SEARCH_ENGINES.LINKEDIN, sel: SELECTORS.LINKEDIN },
        { name: 'osint_twitter_search', desc: 'Search Twitter (X).', url: SEARCH_ENGINES.TWITTER_X, sel: SELECTORS.TWITTER },
        { name: 'osint_google_news_search', desc: 'Search Google News.', url: SEARCH_ENGINES.GOOGLE_NEWS, sel: SELECTORS.GOOGLE_NEWS },
        { name: 'osint_youtube_search', desc: 'Search YouTube videos.', url: SEARCH_ENGINES.YOUTUBE, sel: SELECTORS.YOUTUBE },
        { name: 'osint_search_wikipedia', desc: 'Search Wikipedia articles.', url: SEARCH_ENGINES.WIKIPEDIA, sel: SELECTORS.WIKIPEDIA },
        { name: 'osint_search_craigslist', desc: 'Search Craigslist.', url: SEARCH_ENGINES.CRAIGSLIST, sel: SELECTORS.CRAIGSLIST },
        { name: 'osint_search_stackoverflow', desc: 'Search StackOverflow questions.', url: SEARCH_ENGINES.STACKOVERFLOW, sel: SELECTORS.STACKOVERFLOW },
        { name: 'osint_search_booking', desc: 'Search Booking.com for hotels.', url: SEARCH_ENGINES.BOOKING, sel: SELECTORS.BOOKING },
        { name: 'osint_search_indeed', desc: 'Search Indeed for jobs.', url: SEARCH_ENGINES.INDEED, sel: SELECTORS.INDEED },
        { name: 'osint_search_walmart', desc: 'Search Walmart products.', url: SEARCH_ENGINES.WALMART, sel: SELECTORS.WALMART },
        { name: 'osint_search_bestbuy', desc: 'Search BestBuy products.', url: SEARCH_ENGINES.BESTBUY, sel: SELECTORS.BESTBUY },
        { name: 'osint_search_playstore', desc: 'Search Google Play Store apps.', url: SEARCH_ENGINES.PLAY_STORE, sel: SELECTORS.PLAY_STORE },
        { name: 'osint_search_etsy', desc: 'Search Etsy products.', url: SEARCH_ENGINES.ETSY, sel: SELECTORS.ETSY },
        { name: 'osint_search_zara', desc: 'Search Zara products.', url: SEARCH_ENGINES.ZARA, sel: SELECTORS.ZARA },
        { name: 'osint_search_homedepot', desc: 'Search HomeDepot products.', url: SEARCH_ENGINES.HOMEDEPOT, sel: SELECTORS.HOMEDEPOT },
    ];

    for (const tool of SEARCH_TOOLS_CONFIG) {
        register_tracked_tool(server, {
            name: tool.name,
            description: tool.desc,
            parameters: z.object({
                query: z.string().describe(`Search query for ${tool.name}`)
            }),
            execute: execute_search(tool.url, tool.sel, tool.name)
        });
    }

    register_tracked_tool(server, {
        name: 'osint_hacker_news_search',
        description: 'Search Hacker News for stories. Use "top" for real-time front-page stories, or "latest" for newest submissions. Supports date filtering for popular stories.',
        parameters: z.object({
            query: z.string().describe('Search query for Hacker News. "top" returns front-page stories, "latest" returns newest stories.'),
            sort: z.enum(['date', 'popularity']).default('date').describe('Sort order: "date" for newest first, "popularity" for top stories.'),
            dateRange: z.enum(['all', 'pastDay', 'pastWeek', 'pastMonth', 'pastYear']).default('pastWeek').describe('Date range for popularity sorting. Defaults to pastWeek for keyword searches.')
        }),
        execute: async ({ query, sort, dateRange }) => {
            try {
                const q = query.toLowerCase();
                const is_top = ['top', 'trending', 'frontpage'].includes(q);
                const is_latest = ['latest', 'newest', 'new'].includes(q);
                
                // Real-time front page (Today's trending)
                if (is_top && dateRange !== 'all') {
                    const data = await local_scrape(SEARCH_ENGINES.HACKER_NEWS, extract_hn_front_page, SELECTORS.HACKER_NEWS_FRONT);
                    return JSON.stringify(data, null, 2);
                } 
                
                // Real-time newest
                if (is_latest) {
                    const data = await local_scrape(SEARCH_ENGINES.HACKER_NEWS_NEWEST, extract_hn_front_page, SELECTORS.HACKER_NEWS_FRONT);
                    return JSON.stringify(data, null, 2);
                }

                // Keyword search or "All Time Top" via Algolia
                let sort_param = sort === 'date' ? '&sort=byDate' : '&sort=byRelevance';
                
                // Add date range filter if popularity is selected
                if (sort === 'popularity' && dateRange !== 'all') {
                    sort_param += `&dateRange=${dateRange}`;
                }

                // If query is "top" but dateRange is "all", we search for empty query to get all-time popularity
                const search_q = is_top ? '' : query;
                const url = `${SEARCH_ENGINES.HACKER_NEWS_SEARCH}${encodeURIComponent(search_q)}${sort_param}&type=story`;
                
                const results = await perform_search_scrape(url, SELECTORS.HACKER_NEWS);
                
                if (!results || results.length === 0) {
                    return JSON.stringify({
                        error: `No results found on Hacker News for "${query}".`,
                        results: []
                    }, null, 2);
                }

                return JSON.stringify(results, null, 2);
            } catch (e) {
                return JSON.stringify({
                    error: `Search failed for Hacker News: ${e.message}`,
                    results: []
                }, null, 2);
            }
        }
    });

    register_tracked_tool(server, {
        name: 'osint_search_engine_batch',
        description: 'Run multiple search queries sequentially across different engines.',
        parameters: z.object({
            queries: z.array(z.string()).min(1).max(10).describe('List of search queries'),
            engine: z.enum(['duckduckgo', 'bing', 'yandex']).default('duckduckgo').describe('Search engine to use')
        }),
        execute: async ({ queries, engine }) => {
            const engine_url = SEARCH_ENGINES[engine.toUpperCase()];
            const selectors = SELECTORS[engine.toUpperCase()];
            
            const results = [];
            for (const query of queries) {
                try {
                    const url = `${engine_url}${encodeURIComponent(query)}`;
                    const data = await perform_search_scrape(url, selectors);
                    results.push({ query, results: data });
                } catch (e) {
                    results.push({ query, error: e.message });
                }
            }
            
            return JSON.stringify(results, null, 2);
        }
    });
};
