#!/usr/bin/env node
/**
 * OSINT Web MCP: Main Server
 * Clean, SOLID implementation for a free-for-everyone MCP experience.
 */

import {FastMCP} from 'fastmcp';
import {z} from 'zod';
import axios from 'axios';
import whois from 'whois-json';
import dns from 'node:dns/promises';
import {createRequire} from 'node:module';
import {get_browser_instance} from './local_browser.js';
import {tools as browser_tools} from './browser_tools.js';
import prompts from './prompts.js';
import {SEARCH_ENGINES, SELECTORS, API_ENDPOINTS} from './constants.js';
import {local_scrape, perform_search_scrape, to_readable_markdown} from './scraper_engine.js';

const require = createRequire(import.meta.url);
const package_json = require('../package.json');

const server = new FastMCP({
    name: 'OSINT Web MCP',
    version: package_json.version,
});

// --- SESSION STATS TRACKING ---
const SESSION_STATS = {};
const track_tool_call = (name) => {
    SESSION_STATS[name] = (SESSION_STATS[name] || 0) + 1;
};

// Wrap addTool to automatically track usage
const original_addTool = server.addTool.bind(server);
server.addTool = (tool) => {
    const original_execute = tool.execute;
    tool.execute = async (args, ctx) => {
        track_tool_call(tool.name);
        return await original_execute(args, ctx);
    };
    original_addTool(tool);
};

/**
 * Register a standard search tool based on common parameters.
 */
const register_search_tool = (name, description, engine_url, selectors)=>{
    server.addTool({
        name,
        description,
        parameters: z.object({
            query: z.string().describe(`Search query for ${name}`)
        }),
        execute: async({query})=>{
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
                    error: `Search failed: ${e.message}`,
                    results: []
                }, null, 2);
            }
        }
    });
};

// --- UTILITY TOOLS ---

server.addTool({
    name: 'osint_session_stats',
    description: 'Report how many times each tool has been called during the current MCP session.',
    parameters: z.object({}),
    execute: async () => {
        return JSON.stringify(SESSION_STATS, null, 2);
    }
});

server.addTool({
    name: 'osint_scrape_as_html',
    description: 'Scrape a single webpage and return the raw HTML response body.',
    parameters: z.object({
        url: z.string().url().describe('Target URL to scrape')
    }),
    execute: async ({ url }) => {
        return await local_scrape(url);
    }
});

server.addTool({
    name: 'osint_search_engine_batch',
    description: 'Run multiple search queries in parallel across different engines.',
    parameters: z.object({
        queries: z.array(z.string()).min(1).max(10).describe('List of search queries'),
        engine: z.enum(['duckduckgo', 'bing', 'yandex']).default('duckduckgo').describe('Search engine to use')
    }),
    execute: async ({ queries, engine }) => {
        const engine_url = SEARCH_ENGINES[engine.toUpperCase()];
        const selectors = SELECTORS[engine.toUpperCase()];
        
        const results = await Promise.all(queries.map(async (query) => {
            try {
                const url = `${engine_url}${encodeURIComponent(query)}`;
                const data = await perform_search_scrape(url, selectors);
                return { query, results: data };
            } catch (e) {
                return { query, error: e.message };
            }
        }));
        
        return JSON.stringify(results, null, 2);
    }
});

// --- DATA-DRIVEN TOOL REGISTRATION ---

const SEARCH_TOOLS = [
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
    { name: 'osint_hacker_news_search', desc: 'Search Hacker News stories.', url: SEARCH_ENGINES.HACKER_NEWS_SEARCH, sel: SELECTORS.HACKER_NEWS },
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

SEARCH_TOOLS.forEach(tool => {
    register_search_tool(tool.name, tool.desc, tool.url, tool.sel);
});

// --- DEEP EXTRACTION TOOLS ---

server.addTool({
    name: 'osint_tiktok_profile',
    description: 'Get public data for a specific TikTok username (Title, Bio, Stats).',
    parameters: z.object({
        username: z.string().describe('TikTok username (without @)')
    }),
    execute: async({username})=>{
        const url = `${SEARCH_ENGINES.TIKTOK_PROFILE}${username}`;
        const data = await local_scrape(url, (selectors)=>{
            return {
                name: document.querySelector(selectors.TITLE)?.innerText.trim(),
                bio: document.querySelector(selectors.BIO)?.innerText.trim(),
                stats: document.querySelector(selectors.STATS)?.innerText.trim()
            };
        }, SELECTORS.TIKTOK_PROFILE);
        return JSON.stringify(data, null, 2);
    }
});

server.addTool({
    name: 'osint_youtube_video_details',
    description: 'Get deep structured data for a specific YouTube video URL.',
    parameters: z.object({
        url: z.string().url().describe('YouTube video URL')
    }),
    execute: async({url})=>{
        const data = await local_scrape(url, (selectors)=>{
            return {
                title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                description: document.querySelector(selectors.DESCRIPTION)?.innerText.trim(),
                channel: document.querySelector(selectors.CHANNEL)?.innerText.trim()
            };
        }, SELECTORS.YOUTUBE_VIDEO);
        return JSON.stringify(data, null, 2);
    }
});

server.addTool({
    name: 'osint_youtube_comments',
    description: 'Extract top-level comments from a YouTube video URL.',
    parameters: z.object({
        url: z.string().url().describe('YouTube video URL'),
        limit: z.number().default(10).describe('Max comments to extract')
    }),
    execute: async({url, limit})=>{
        const browser = await get_browser_instance();
        const page = await browser.get_active_page({url});
        
        // Scroll down to load comments
        await page.evaluate(() => window.scrollTo(0, 1000));
        await page.waitForSelector(SELECTORS.YOUTUBE_COMMENTS.CONTAINER, {timeout: 10000});
        
        const results = await page.evaluate(({selectors, limit}) => {
            return Array.from(document.querySelectorAll(selectors.CONTAINER))
                .slice(0, limit)
                .map(el=>({
                    author: el.querySelector(selectors.AUTHOR)?.innerText.trim(),
                    body: el.querySelector(selectors.BODY)?.innerText.trim()
                }));
        }, {selectors: SELECTORS.YOUTUBE_COMMENTS, limit});
        
        return JSON.stringify(results, null, 2);
    }
});

server.addTool({
    name: 'osint_tiktok_video_details',
    description: 'Get public data for a specific TikTok video URL.',
    parameters: z.object({
        url: z.string().url().describe('TikTok video URL')
    }),
    execute: async({url})=>{
        const data = await local_scrape(url, (selectors)=>{
            return {
                title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                stats: document.querySelector(selectors.STATS)?.innerText.trim(),
                author: document.querySelector(selectors.AUTHOR)?.innerText.trim()
            };
        }, SELECTORS.TIKTOK_VIDEO);
        return JSON.stringify(data, null, 2);
    }
});

server.addTool({
    name: 'osint_reddit_thread',
    description: 'Extract title, body, and comments from a Reddit post.',
    parameters: z.object({
        url: z.string().url().describe('Reddit thread URL')
    }),
    execute: async({url})=>{
        const data = await local_scrape(url, (selectors)=>{
            return {
                title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                body: document.querySelector(selectors.BODY)?.innerText.trim(),
                comments: Array.from(document.querySelectorAll(selectors.COMMENT)).map(el=>el.innerText.trim()).slice(0, 10)
            };
        }, SELECTORS.REDDIT_THREAD);
        return JSON.stringify(data, null, 2);
    }
});

server.addTool({
    name: 'osint_x_post_details',
    description: 'Extract data from a specific public post on X (Twitter).',
    parameters: z.object({
        url: z.string().url().describe('X post URL')
    }),
    execute: async({url})=>{
        const data = await local_scrape(url, (selectors)=>{
            const post = document.querySelector(selectors.CONTAINER);
            return {
                body: post?.querySelector(selectors.BODY)?.innerText.trim(),
                stats: post?.querySelector(selectors.STATS)?.innerText.trim()
            };
        }, SELECTORS.X_POST);
        return JSON.stringify(data, null, 2);
    }
});

server.addTool({
    name: 'osint_linkedin_post',
    description: 'Extract public data for a specific LinkedIn post URL.',
    parameters: z.object({
        url: z.string().url().describe('LinkedIn post URL')
    }),
    execute: async({url})=>{
        const data = await local_scrape(url, (selectors)=>{
            const post = document.querySelector(selectors.CONTAINER);
            return {
                author: post?.querySelector(selectors.AUTHOR)?.innerText.trim(),
                body: post?.querySelector(selectors.BODY)?.innerText.trim()
            };
        }, SELECTORS.LINKEDIN_POST);
        return JSON.stringify(data, null, 2);
    }
});

server.addTool({
    name: 'osint_instagram_profile',
    description: 'Get public bio and stats for an Instagram profile (Username).',
    parameters: z.object({
        username: z.string().describe('Instagram username')
    }),
    execute: async({username})=>{
        const url = `https://www.instagram.com/${username}/`;
        const data = await local_scrape(url, (selectors)=>{
            return {
                name: document.querySelector(selectors.TITLE)?.innerText.trim(),
                bio: document.querySelector(selectors.BIO)?.innerText.trim(),
                stats: Array.from(document.querySelectorAll(selectors.STATS)).map(el=>el.innerText.trim())
            };
        }, SELECTORS.INSTAGRAM_PROFILE);
        return JSON.stringify(data, null, 2);
    }
});

server.addTool({
    name: 'osint_google_play_app',
    description: 'Get metadata for an Android app from Google Play Store.',
    parameters: z.object({
        url: z.string().url().describe('Google Play Store app URL')
    }),
    execute: async({url})=>{
        const data = await local_scrape(url, (selectors)=>{
            return {
                title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                description: document.querySelector(selectors.DESCRIPTION)?.innerText.trim(),
                developer: document.querySelector(selectors.DEVELOPER)?.innerText.trim()
            };
        }, SELECTORS.GOOGLE_PLAY_APP);
        return JSON.stringify(data, null, 2);
    }
});

server.addTool({
    name: 'osint_apple_app_store_app',
    description: 'Get metadata for an iOS app from Apple App Store.',
    parameters: z.object({
        url: z.string().url().describe('Apple App Store app URL')
    }),
    execute: async({url})=>{
        const data = await local_scrape(url, (selectors)=>{
            return {
                title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                description: document.querySelector(selectors.DESCRIPTION)?.innerText.trim(),
                developer: document.querySelector(selectors.DEVELOPER)?.innerText.trim()
            };
        }, SELECTORS.APPLE_APP_STORE_APP);
        return JSON.stringify(data, null, 2);
    }
});

server.addTool({
    name: 'osint_yahoo_finance_profile',
    description: 'Get company profile and summary from Yahoo Finance.',
    parameters: z.object({
        url: z.string().url().describe('Yahoo Finance company profile URL')
    }),
    execute: async({url})=>{
        const data = await local_scrape(url, (selectors)=>{
            return {
                title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                summary: document.querySelector(selectors.SUMMARY)?.innerText.trim(),
                sector: document.querySelector(selectors.SECTOR)?.innerText.trim()
            };
        }, SELECTORS.YAHOO_FINANCE_PROFILE);
        return JSON.stringify(data, null, 2);
    }
});

server.addTool({
    name: 'osint_google_maps_reviews',
    description: 'Extract reviews from a Google Maps business URL.',
    parameters: z.object({
        url: z.string().url().describe('Google Maps business URL'),
        limit: z.number().default(10).describe('Max reviews to extract')
    }),
    execute: async({url, limit})=>{
        const results = await local_scrape(url, (selectors)=>{
            return Array.from(document.querySelectorAll(selectors.CONTAINER))
                .slice(0, 10)
                .map(el=>({
                    author: el.querySelector(selectors.AUTHOR)?.innerText.trim(),
                    body: el.querySelector(selectors.BODY)?.innerText.trim(),
                    rating: el.querySelector(selectors.RATING)?.ariaLabel
                }));
        }, SELECTORS.GOOGLE_MAPS_REVIEWS);
        return JSON.stringify(results.slice(0, limit), null, 2);
    }
});

server.addTool({
    name: 'osint_booking_hotel_details',
    description: 'Get detailed facts for a specific hotel listing on Booking.com.',
    parameters: z.object({
        url: z.string().url().describe('Booking.com hotel URL')
    }),
    execute: async({url})=>{
        const data = await local_scrape(url, (selectors)=>{
            return {
                title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                amenities: document.querySelector(selectors.AMENITIES)?.innerText.trim(),
                rooms: document.querySelector(selectors.ROOMS)?.innerText.trim()
            };
        }, SELECTORS.BOOKING_HOTEL);
        return JSON.stringify(data, null, 2);
    }
});

server.addTool({
    name: 'osint_zillow_property_details',
    description: 'Get deep property facts from a Zillow property listing.',
    parameters: z.object({
        url: z.string().url().describe('Zillow property listing URL')
    }),
    execute: async({url})=>{
        const data = await local_scrape(url, (selectors)=>{
            return {
                title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                price: document.querySelector(selectors.PRICE)?.innerText.trim(),
                facts: document.querySelector(selectors.FACTS)?.innerText.trim()
            };
        }, SELECTORS.ZILLOW_PROPERTY);
        return JSON.stringify(data, null, 2);
    }
});

server.addTool({
    name: 'osint_amazon_product',
    description: 'Get deep structured data for a specific Amazon product URL (Title, Price, Features).',
    parameters: z.object({
        url: z.string().url().describe('Amazon product URL (containing /dp/)')
    }),
    execute: async({url})=>{
        const data = await local_scrape(url, (selectors)=>{
            return {
                title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                price: document.querySelector(selectors.PRICE)?.innerText.trim(),
                features: Array.from(document.querySelectorAll(selectors.FEATURES)).map(el=>el.innerText.trim())
            };
        }, SELECTORS.AMAZON_PRODUCT);
        return JSON.stringify(data, null, 2);
    }
});

server.addTool({
    name: 'osint_amazon_reviews',
    description: 'Get structured reviews for a specific Amazon product.',
    parameters: z.object({
        url: z.string().url().describe('Amazon product or reviews page URL')
    }),
    execute: async({url})=>{
        const results = await local_scrape(url, (selectors)=>{
            return Array.from(document.querySelectorAll(selectors.CONTAINER))
                .map(el=>({
                    title: el.querySelector(selectors.TITLE)?.innerText.trim(),
                    rating: el.querySelector(selectors.RATING)?.innerText.trim(),
                    body: el.querySelector(selectors.BODY)?.innerText.trim()
                }));
        }, SELECTORS.AMAZON_REVIEWS);
        return JSON.stringify(results, null, 2);
    }
});

server.addTool({
    name: 'osint_walmart_product',
    description: 'Get structured data for a Walmart product.',
    parameters: z.object({
        url: z.string().url().describe('Walmart product URL')
    }),
    execute: async({url})=>{
        const data = await local_scrape(url, (selectors)=>{
            return {
                title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                price: document.querySelector(selectors.PRICE)?.innerText.trim(),
                specifications: Array.from(document.querySelectorAll(selectors.SPECIFICATIONS)).map(el=>el.innerText.trim())
            };
        }, SELECTORS.WALMART_PRODUCT);
        return JSON.stringify(data, null, 2);
    }
});

server.addTool({
    name: 'osint_ebay_product',
    description: 'Get structured data for an eBay listing.',
    parameters: z.object({
        url: z.string().url().describe('eBay item URL')
    }),
    execute: async({url})=>{
        const data = await local_scrape(url, (selectors)=>{
            return {
                title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                price: document.querySelector(selectors.PRICE)?.innerText.trim(),
                condition: document.querySelector(selectors.CONDITION)?.innerText.trim()
            };
        }, SELECTORS.EBAY_PRODUCT);
        return JSON.stringify(data, null, 2);
    }
});

server.addTool({
    name: 'osint_homedepot_product',
    description: 'Get structured data for a Home Depot product.',
    parameters: z.object({
        url: z.string().url().describe('Home Depot product URL')
    }),
    execute: async({url})=>{
        const data = await local_scrape(url, (selectors)=>{
            return {
                title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                price: document.querySelector(selectors.PRICE)?.innerText.trim(),
                specifications: document.querySelector(selectors.SPECIFICATIONS)?.innerText.trim()
            };
        }, SELECTORS.HOMEDEPOT_PRODUCT);
        return JSON.stringify(data, null, 2);
    }
});

server.addTool({
    name: 'osint_bestbuy_product',
    description: 'Get structured data for a Best Buy product.',
    parameters: z.object({
        url: z.string().url().describe('Best Buy product URL')
    }),
    execute: async({url})=>{
        const data = await local_scrape(url, (selectors)=>{
            return {
                title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                price: document.querySelector(selectors.PRICE)?.innerText.trim(),
                specifications: document.querySelector(selectors.SPECIFICATIONS)?.innerText.trim()
            };
        }, SELECTORS.BESTBUY_PRODUCT);
        return JSON.stringify(data, null, 2);
    }
});

server.addTool({
    name: 'osint_etsy_product',
    description: 'Get structured data for an Etsy listing.',
    parameters: z.object({
        url: z.string().url().describe('Etsy product URL')
    }),
    execute: async({url})=>{
        const data = await local_scrape(url, (selectors)=>{
            return {
                title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                price: document.querySelector(selectors.PRICE)?.innerText.trim(),
                description: document.querySelector(selectors.DESCRIPTION)?.innerText.trim()
            };
        }, SELECTORS.ETSY_PRODUCT);
        return JSON.stringify(data, null, 2);
    }
});

server.addTool({
    name: 'osint_zara_product',
    description: 'Get structured data for a Zara product.',
    parameters: z.object({
        url: z.string().url().describe('Zara product URL')
    }),
    execute: async({url})=>{
        const data = await local_scrape(url, (selectors)=>{
            return {
                title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                price: document.querySelector(selectors.PRICE)?.innerText.trim(),
                composition: document.querySelector(selectors.COMPOSITION)?.innerText.trim()
            };
        }, SELECTORS.ZARA_PRODUCT);
        return JSON.stringify(data, null, 2);
    }
});

server.addTool({
    name: 'osint_github_file',
    description: 'Read the contents of a specific file from a GitHub repository.',
    parameters: z.object({
        url: z.string().url().describe('GitHub file URL')
    }),
    execute: async({url})=>{
        const browser = await get_browser_instance();
        const page = await browser.get_active_page();
        await page.goto(url, {waitUntil: 'domcontentloaded'});
        
        // Try to find the raw button and click it, or just extract text
        const raw_url = await page.getAttribute(SELECTORS.GITHUB_FILE.RAW_URL, 'href');
        if (raw_url) {
            const absolute_raw = raw_url.startsWith('http') ? raw_url : `https://github.com${raw_url}`;
            const response = await axios.get(absolute_raw);
            return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        }
        
        return await page.innerText('body');
    }
});

// --- CORE SCRAPING TOOLS ---

server.addTool({
    name: 'osint_scrape',
    description: 'Deep scrape a single URL and return AI-optimized Markdown content.',
    parameters: z.object({
        url: z.string().url().describe('Target URL to scrape')
    }),
    execute: async({url})=>{
        const html = await local_scrape(url);
        return await to_readable_markdown(html, url);
    }
});

server.addTool({
    name: 'osint_scrape_batch',
    description: 'Scrape multiple URLs in sequence and return results.',
    parameters: z.object({
        urls: z.array(z.string().url()).min(1).max(5).describe('List of URLs to scrape (max 5)')
    }),
    execute: async({urls})=>{
        const results = [];
        for (const url of urls) {
            try {
                const html = await local_scrape(url);
                const markdown = await to_readable_markdown(html, url);
                results.push({ url, content: markdown });
            } catch(e) {
                results.push({ url, error: e.message });
            }
        }
        return JSON.stringify(results, null, 2);
    }
});

server.addTool({
    name: 'osint_extract',
    description: 'Extract structured JSON data from a URL using AI guidance. This tool scrapes the page and then uses the LLM to format the results.',
    parameters: z.object({
        url: z.string().url().describe('URL to extract data from'),
        extraction_prompt: z.string().describe('Instructions on what data to extract (e.g., "Extract all product prices and names")')
    }),
    execute: async({url, extraction_prompt}, ctx)=>{
        // First, get the markdown content
        const html = await local_scrape(url);
        const markdown = await to_readable_markdown(html, url);

        // Access the active session for sampling (LLM-guided extraction)
        const session = server.sessions[0];
        if (!session) throw new Error('No active session for AI sampling');

        const system_prompt = 'You are a data extraction specialist. Your task is to extract specific information from the provided markdown content and return ONLY valid JSON. No explanations or extra text.';
        
        const response = await session.requestSampling({
            messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `Instruction: ${extraction_prompt}\n\nContent:\n${markdown}`
                }
            }],
            systemPrompt: system_prompt,
            includeContext: 'thisServer'
        });

        return response.content.text;
    }
});

// --- INVESTIGATIVE OSINT TOOLS ---

server.addTool({
    name: 'osint_user_lookup',
    description: 'Search for a username across multiple social platforms.',
    parameters: z.object({
        username: z.string().describe('The username to search for'),
    }),
    execute: async({username})=>{
        const platforms = [
            { name: 'GitHub', url: `https://github.com/${username}` },
            { name: 'Twitter', url: `https://twitter.com/${username}` },
            { name: 'Instagram', url: `https://instagram.com/${username}` },
            { name: 'Reddit', url: `https://reddit.com/user/${username}` },
            { name: 'YouTube', url: `https://youtube.com/@${username}` }
        ];

        const results = await Promise.all(platforms.map(async platform => {
            try {
                const response = await axios.get(platform.url, { 
                    validateStatus: false,
                    timeout: 5000 
                });
                return {
                    platform: platform.name,
                    url: platform.url,
                    status: response.status === 200 ? 'found' : 'not_found'
                };
            } catch(e) {
                return {
                    platform: platform.name,
                    url: platform.url,
                    status: 'error'
                };
            }
        }));

        return JSON.stringify(results, null, 2);
    }
});

server.addTool({
    name: 'osint_yahoo_finance_quote',
    description: 'Get the current stock quote from Yahoo Finance locally.',
    parameters: z.object({
        ticker: z.string().describe('Stock ticker symbol (e.g., AAPL)')
    }),
    execute: async({ticker})=>{
        const url = `${SEARCH_ENGINES.YAHOO_FINANCE}${encodeURIComponent(ticker)}`;
        const browser = await get_browser_instance();
        const page = await browser.get_active_page();
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        
        const data = await page.evaluate(() => {
            const price = document.querySelector('fin-streamer[data-field="regularMarketPrice"]')?.innerText;
            const change = document.querySelector('fin-streamer[data-field="regularMarketChangePercent"]')?.innerText;
            const name = document.querySelector('h1')?.innerText;
            return { name, price, change };
        });
        
        return JSON.stringify(data, null, 2);
    }
});

server.addTool({
    name: 'osint_whois',
    description: 'Perform WHOIS domain registration lookup.',
    parameters: z.object({
        domain: z.string().describe('Domain to lookup (e.g., example.com)')
    }),
    execute: async({domain})=>{
        const results = await whois(domain);
        return JSON.stringify(results, null, 2);
    }
});

server.addTool({
    name: 'osint_dns',
    description: 'Perform DNS record lookups.',
    parameters: z.object({
        domain: z.string().describe('Domain to lookup'),
        type: z.enum(['A', 'AAAA', 'MX', 'TXT', 'NS', 'ANY']).default('A')
    }),
    execute: async({domain, type})=>{
        const results = type === 'ANY' ? await dns.resolveAny(domain) : await dns.resolve(domain, type);
        return JSON.stringify(results, null, 2);
    }
});

server.addTool({
    name: 'osint_ip_info',
    description: 'Retrieve IP geolocation and ISP information.',
    parameters: z.object({
        ip: z.string().describe('Target IP address')
    }),
    execute: async({ip})=>{
        const response = await axios.get(`${API_ENDPOINTS.IP_API}${ip}`);
        return JSON.stringify(response.data, null, 2);
    }
});

// --- BROWSER INTERACTION TOOLS ---

for (const tool of browser_tools)
    server.addTool(tool);

server.addPrompts(prompts);

console.error('OSINT Web MCP Server started successfully (Omakase edition).');

// --- GRACEFUL SHUTDOWN ---
const shutdown = async () => {
    console.error('Shutting down OSINT Web MCP Server...');
    const browser = await get_browser_instance();
    await browser.shutdown();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.start({transportType: 'stdio'});
