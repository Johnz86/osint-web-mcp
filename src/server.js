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

/**
 * Register a standard search tool based on common parameters.
 * @param {string} name - Tool identifier.
 * @param {string} description - Human-friendly tool description.
 * @param {string} engine_url - Base URL for the search engine.
 * @param {Object} selectors - CSS selectors for data extraction.
 */
const register_search_tool = (name, description, engine_url, selectors)=>{
    server.addTool({
        name,
        description,
        parameters: z.object({
            query: z.string().describe(`Search query for ${name}`)
        }),
        execute: async({query})=>{
            const url = `${engine_url}${encodeURIComponent(query)}`;
            const results = await perform_search_scrape(url, selectors);
            return JSON.stringify(results, null, 2);
        }
    });
};

// --- DATA-DRIVEN TOOL REGISTRATION ---

const SEARCH_TOOLS = [
    { name: 'osint_search_google', desc: 'Search Google.', url: SEARCH_ENGINES.GOOGLE, sel: SELECTORS.GOOGLE },
    { name: 'osint_search_duckduckgo', desc: 'Search DuckDuckGo.', url: SEARCH_ENGINES.DUCKDUCKGO, sel: SELECTORS.DUCKDUCKGO },
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
    { name: 'osint_search_reuters', desc: 'Search Reuters for news.', url: SEARCH_ENGINES.REUTERS, sel: SELECTORS.REUTERS },
    { name: 'osint_search_walmart', desc: 'Search Walmart products.', url: SEARCH_ENGINES.WALMART, sel: SELECTORS.WALMART },
    { name: 'osint_search_bestbuy', desc: 'Search BestBuy products.', url: SEARCH_ENGINES.BESTBUY, sel: SELECTORS.BESTBUY },
    { name: 'osint_search_playstore', desc: 'Search Google Play Store apps.', url: SEARCH_ENGINES.PLAY_STORE, sel: SELECTORS.PLAY_STORE },
    { name: 'osint_search_appstore', desc: 'Search Apple App Store apps (via Google).', url: SEARCH_ENGINES.APPLE_APP_STORE, sel: SELECTORS.GOOGLE },
    { name: 'osint_search_etsy', desc: 'Search Etsy products.', url: SEARCH_ENGINES.ETSY, sel: SELECTORS.ETSY },
    { name: 'osint_search_zara', desc: 'Search Zara products.', url: SEARCH_ENGINES.ZARA, sel: SELECTORS.ZARA },
    { name: 'osint_search_homedepot', desc: 'Search HomeDepot products.', url: SEARCH_ENGINES.HOMEDEPOT, sel: SELECTORS.HOMEDEPOT },
    { name: 'osint_search_linkedin_company', desc: 'Search LinkedIn company profiles (via Google).', url: SEARCH_ENGINES.LINKEDIN_COMPANY_SEARCH, sel: SELECTORS.GOOGLE },
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
    }),
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
server.start({transportType: 'stdio'});
