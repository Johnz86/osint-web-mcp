/**
 * OSINT Web MCP: Extraction Tools
 */
import { z } from 'zod';
import axios from 'axios';
import { SEARCH_ENGINES, SELECTORS } from './constants.js';
import { local_scrape, to_readable_markdown } from './scraper_engine.js';
import { get_browser_instance } from './local_browser.js';
import { register_tracked_tool } from './session_manager.js';

/**
 * Registers deep extraction tools on the provided FastMCP server.
 * @param {import('fastmcp').FastMCP} server - The FastMCP server instance.
 */
export const register_extraction_tools = (server) => {
    
    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
        name: 'osint_youtube_comments',
        description: 'Extract top-level comments from a YouTube video URL.',
        parameters: z.object({
            url: z.string().url().describe('YouTube video URL'),
            limit: z.number().default(10).describe('Max comments to extract')
        }),
        execute: async({url, limit})=>{
            const browser = await get_browser_instance();
            const page = await browser.get_active_page({url});
            
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

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
        name: 'osint_github_file',
        description: 'Read the contents of a specific file from a GitHub repository.',
        parameters: z.object({
            url: z.string().url().describe('GitHub file URL')
        }),
        execute: async({url})=>{
            const browser = await get_browser_instance();
            const page = await browser.get_active_page();
            await page.goto(url, {waitUntil: 'domcontentloaded'});
            
            const raw_url = await page.getAttribute(SELECTORS.GITHUB_FILE.RAW_URL, 'href');
            if (raw_url) {
                const absolute_raw = raw_url.startsWith('http') ? raw_url : `https://github.com${raw_url}`;
                const response = await axios.get(absolute_raw);
                return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
            }
            
            return await page.innerText('body');
        }
    });

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
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

    register_tracked_tool(server, {
        name: 'osint_extract',
        description: 'Extract structured JSON data from a URL using AI guidance.',
        parameters: z.object({
            url: z.string().url().describe('URL to extract data from'),
            extraction_prompt: z.string().describe('Instructions on what data to extract')
        }),
        execute: async({url, extraction_prompt}, ctx)=>{
            const html = await local_scrape(url);
            const markdown = await to_readable_markdown(html, url);

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
};
