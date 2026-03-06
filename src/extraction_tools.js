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
            return await local_scrape(url, (selectors)=>{
                return {
                    name: document.querySelector(selectors.TITLE)?.innerText.trim(),
                    bio: document.querySelector(selectors.BIO)?.innerText.trim(),
                    stats: document.querySelector(selectors.STATS)?.innerText.trim()
                };
            }, SELECTORS.TIKTOK_PROFILE);
        }
    });

    register_tracked_tool(server, {
        name: 'osint_youtube_video_details',
        description: 'Get deep structured data for a specific YouTube video URL.',
        parameters: z.object({
            url: z.string().url().describe('YouTube video URL')
        }),
        execute: async({url})=>{
            return await local_scrape(url, (selectors)=>{
                return {
                    title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                    description: document.querySelector(selectors.DESCRIPTION)?.innerText.trim(),
                    channel: document.querySelector(selectors.CHANNEL)?.innerText.trim()
                };
            }, SELECTORS.YOUTUBE_VIDEO);
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
            
            return await page.evaluate(({selectors, limit}) => {
                return Array.from(document.querySelectorAll(selectors.CONTAINER))
                    .slice(0, limit)
                    .map(el=>({
                        author: el.querySelector(selectors.AUTHOR)?.innerText.trim(),
                        body: el.querySelector(selectors.BODY)?.innerText.trim()
                    }));
            }, {selectors: SELECTORS.YOUTUBE_COMMENTS, limit});
        }
    });

    register_tracked_tool(server, {
        name: 'osint_tiktok_video_details',
        description: 'Get public data for a specific TikTok video URL.',
        parameters: z.object({
            url: z.string().url().describe('TikTok video URL')
        }),
        execute: async({url})=>{
            return await local_scrape(url, (selectors)=>{
                return {
                    title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                    stats: document.querySelector(selectors.STATS)?.innerText.trim(),
                    author: document.querySelector(selectors.AUTHOR)?.innerText.trim()
                };
            }, SELECTORS.TIKTOK_VIDEO);
        }
    });

    register_tracked_tool(server, {
        name: 'osint_reddit_thread',
        description: 'Extract title, body, and comments from a Reddit post.',
        parameters: z.object({
            url: z.string().url().describe('Reddit thread URL')
        }),
        execute: async({url})=>{
            return await local_scrape(url, (selectors)=>{
                // Find comments and extract metadata
                const commentElements = Array.from(document.querySelectorAll('shreddit-comment, .comment'));
                const comments = commentElements.slice(0, 20).map(el => {
                    const author = el.getAttribute('author') || el.querySelector('[data-testid="comment-author"]')?.innerText.trim();
                    const score = el.getAttribute('score');
                    const depth = parseInt(el.getAttribute('depth') || '0', 10);
                    
                    // The body is usually in a slot or a specific div
                    const bodyEl = el.querySelector('[slot="comment"], .comment-body, div[id*="-post-rtjson-content"]');
                    
                    return {
                        author,
                        score,
                        depth,
                        body: bodyEl?.innerText.trim() || el.innerText.trim()
                    };
                });

                return {
                    title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                    body: document.querySelector(selectors.BODY)?.innerText.trim(),
                    comments
                };
            }, SELECTORS.REDDIT_THREAD, SELECTORS.REDDIT_THREAD.TITLE);
        }
    });

    register_tracked_tool(server, {
        name: 'osint_x_post_details',
        description: 'Extract data from a specific public post on X (Twitter).',
        parameters: z.object({
            url: z.string().url().describe('X post URL')
        }),
        execute: async({url})=>{
            return await local_scrape(url, (selectors)=>{
                const post = document.querySelector(selectors.CONTAINER);
                return {
                    body: post?.querySelector(selectors.BODY)?.innerText.trim(),
                    stats: post?.querySelector(selectors.STATS)?.innerText.trim()
                };
            }, SELECTORS.X_POST, SELECTORS.X_POST.CONTAINER);
        }
    });

    register_tracked_tool(server, {
        name: 'osint_linkedin_post',
        description: 'Extract public data for a specific LinkedIn post URL.',
        parameters: z.object({
            url: z.string().url().describe('LinkedIn post URL')
        }),
        execute: async({url})=>{
            return await local_scrape(url, (selectors)=>{
                const post = document.querySelector(selectors.CONTAINER);
                return {
                    author: post?.querySelector(selectors.AUTHOR)?.innerText.trim(),
                    body: post?.querySelector(selectors.BODY)?.innerText.trim()
                };
            }, SELECTORS.LINKEDIN_POST, SELECTORS.LINKEDIN_POST.CONTAINER);
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
            return await local_scrape(url, (selectors)=>{
                return {
                    name: document.querySelector(selectors.TITLE)?.innerText.trim(),
                    bio: document.querySelector(selectors.BIO)?.innerText.trim(),
                    stats: Array.from(document.querySelectorAll(selectors.STATS)).map(el=>el.innerText.trim())
                };
            }, SELECTORS.INSTAGRAM_PROFILE, SELECTORS.INSTAGRAM_PROFILE.TITLE);
        }
    });

    register_tracked_tool(server, {
        name: 'osint_google_play_app',
        description: 'Get metadata for an Android app from Google Play Store.',
        parameters: z.object({
            url: z.string().url().describe('Google Play Store app URL')
        }),
        execute: async({url})=>{
            return await local_scrape(url, (selectors)=>{
                return {
                    title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                    description: document.querySelector(selectors.DESCRIPTION)?.innerText.trim(),
                    developer: document.querySelector(selectors.DEVELOPER)?.innerText.trim()
                };
            }, SELECTORS.GOOGLE_PLAY_APP);
        }
    });

    register_tracked_tool(server, {
        name: 'osint_apple_app_store_app',
        description: 'Get metadata for an iOS app from Apple App Store.',
        parameters: z.object({
            url: z.string().url().describe('Apple App Store app URL')
        }),
        execute: async({url})=>{
            return await local_scrape(url, (selectors)=>{
                return {
                    title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                    description: document.querySelector(selectors.DESCRIPTION)?.innerText.trim(),
                    developer: document.querySelector(selectors.DEVELOPER)?.innerText.trim()
                };
            }, SELECTORS.APPLE_APP_STORE_APP);
        }
    });

    register_tracked_tool(server, {
        name: 'osint_yahoo_finance_profile',
        description: 'Get company profile and summary from Yahoo Finance.',
        parameters: z.object({
            url: z.string().url().describe('Yahoo Finance company profile URL')
        }),
        execute: async({url})=>{
            return await local_scrape(url, (selectors)=>{
                return {
                    title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                    summary: document.querySelector(selectors.SUMMARY)?.innerText.trim(),
                    sector: document.querySelector(selectors.SECTOR)?.innerText.trim()
                };
            }, SELECTORS.YAHOO_FINANCE_PROFILE);
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
            return results.slice(0, limit);
        }
    });

    register_tracked_tool(server, {
        name: 'osint_booking_hotel_details',
        description: 'Get detailed facts for a specific hotel listing on Booking.com.',
        parameters: z.object({
            url: z.string().url().describe('Booking.com hotel URL')
        }),
        execute: async({url})=>{
            return await local_scrape(url, (selectors)=>{
                return {
                    title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                    amenities: document.querySelector(selectors.AMENITIES)?.innerText.trim(),
                    rooms: document.querySelector(selectors.ROOMS)?.innerText.trim()
                };
            }, SELECTORS.BOOKING_HOTEL);
        }
    });

    register_tracked_tool(server, {
        name: 'osint_zillow_property_details',
        description: 'Get deep property facts from a Zillow property listing.',
        parameters: z.object({
            url: z.string().url().describe('Zillow property listing URL')
        }),
        execute: async({url})=>{
            return await local_scrape(url, (selectors)=>{
                return {
                    title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                    price: document.querySelector(selectors.PRICE)?.innerText.trim(),
                    facts: document.querySelector(selectors.FACTS)?.innerText.trim()
                };
            }, SELECTORS.ZILLOW_PROPERTY);
        }
    });

    register_tracked_tool(server, {
        name: 'osint_amazon_product',
        description: 'Get deep structured data for a specific Amazon product URL (Title, Price, Features).',
        parameters: z.object({
            url: z.string().url().describe('Amazon product URL (containing /dp/)')
        }),
        execute: async({url})=>{
            return await local_scrape(url, (selectors)=>{
                return {
                    title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                    price: document.querySelector(selectors.PRICE)?.innerText.trim(),
                    features: Array.from(document.querySelectorAll(selectors.FEATURES)).map(el=>el.innerText.trim())
                };
            }, SELECTORS.AMAZON_PRODUCT);
        }
    });

    register_tracked_tool(server, {
        name: 'osint_amazon_reviews',
        description: 'Get structured reviews for a specific Amazon product.',
        parameters: z.object({
            url: z.string().url().describe('Amazon product or reviews page URL')
        }),
        execute: async({url})=>{
            return await local_scrape(url, (selectors)=>{
                return Array.from(document.querySelectorAll(selectors.CONTAINER))
                    .map(el=>({
                        title: el.querySelector(selectors.TITLE)?.innerText.trim(),
                        rating: el.querySelector(selectors.RATING)?.innerText.trim(),
                        body: el.querySelector(selectors.BODY)?.innerText.trim()
                    }));
            }, SELECTORS.AMAZON_REVIEWS);
        }
    });

    register_tracked_tool(server, {
        name: 'osint_walmart_product',
        description: 'Get structured data for a Walmart product.',
        parameters: z.object({
            url: z.string().url().describe('Walmart product URL')
        }),
        execute: async({url})=>{
            return await local_scrape(url, (selectors)=>{
                return {
                    title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                    price: document.querySelector(selectors.PRICE)?.innerText.trim(),
                    specifications: Array.from(document.querySelectorAll(selectors.SPECIFICATIONS)).map(el=>el.innerText.trim())
                };
            }, SELECTORS.WALMART_PRODUCT);
        }
    });

    register_tracked_tool(server, {
        name: 'osint_ebay_product',
        description: 'Get structured data for an eBay listing.',
        parameters: z.object({
            url: z.string().url().describe('eBay item URL')
        }),
        execute: async({url})=>{
            return await local_scrape(url, (selectors)=>{
                return {
                    title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                    price: document.querySelector(selectors.PRICE)?.innerText.trim(),
                    condition: document.querySelector(selectors.CONDITION)?.innerText.trim()
                };
            }, SELECTORS.EBAY_PRODUCT);
        }
    });

    register_tracked_tool(server, {
        name: 'osint_homedepot_product',
        description: 'Get structured data for a Home Depot product.',
        parameters: z.object({
            url: z.string().url().describe('Home Depot product URL')
        }),
        execute: async({url})=>{
            return await local_scrape(url, (selectors)=>{
                return {
                    title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                    price: document.querySelector(selectors.PRICE)?.innerText.trim(),
                    specifications: document.querySelector(selectors.SPECIFICATIONS)?.innerText.trim()
                };
            }, SELECTORS.HOMEDEPOT_PRODUCT);
        }
    });

    register_tracked_tool(server, {
        name: 'osint_bestbuy_product',
        description: 'Get structured data for a Best Buy product.',
        parameters: z.object({
            url: z.string().url().describe('Best Buy product URL')
        }),
        execute: async({url})=>{
            return await local_scrape(url, (selectors)=>{
                return {
                    title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                    price: document.querySelector(selectors.PRICE)?.innerText.trim(),
                    specifications: document.querySelector(selectors.SPECIFICATIONS)?.innerText.trim()
                };
            }, SELECTORS.BESTBUY_PRODUCT);
        }
    });

    register_tracked_tool(server, {
        name: 'osint_etsy_product',
        description: 'Get structured data for an Etsy listing.',
        parameters: z.object({
            url: z.string().url().describe('Etsy product URL')
        }),
        execute: async({url})=>{
            return await local_scrape(url, (selectors)=>{
                return {
                    title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                    price: document.querySelector(selectors.PRICE)?.innerText.trim(),
                    description: document.querySelector(selectors.DESCRIPTION)?.innerText.trim()
                };
            }, SELECTORS.ETSY_PRODUCT);
        }
    });

    register_tracked_tool(server, {
        name: 'osint_zara_product',
        description: 'Get structured data for a Zara product.',
        parameters: z.object({
            url: z.string().url().describe('Zara product URL')
        }),
        execute: async({url})=>{
            return await local_scrape(url, (selectors)=>{
                return {
                    title: document.querySelector(selectors.TITLE)?.innerText.trim(),
                    price: document.querySelector(selectors.PRICE)?.innerText.trim(),
                    composition: document.querySelector(selectors.COMPOSITION)?.innerText.trim()
                };
            }, SELECTORS.ZARA_PRODUCT);
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
            const page = await browser.get_active_page({url});
            
            try {
                await page.waitForSelector(SELECTORS.GITHUB_FILE.RAW_URL, {timeout: 5000});
                const raw_url = await page.locator(SELECTORS.GITHUB_FILE.RAW_URL).first().getAttribute('href');
                if (raw_url) {
                    const absolute_raw = raw_url.startsWith('http') ? raw_url : `https://github.com${raw_url}`;
                    const response = await axios.get(absolute_raw);
                    return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
                }
            } catch (e) {
                // Fallback to reading the whole page text if the raw button isn't found
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

    register_tracked_tool(server, {
        name: 'osint_reddit_news_feed',
        description: 'Extract recent news from the official Reddit news feed.',
        parameters: z.object({
            limit: z.number().default(10).describe('Max items to extract')
        }),
        execute: async({limit})=>{
            const url = 'https://www.reddit.com/?feed=news';
            return await local_scrape(url, (selectors, limit)=>{
                const items = Array.from(document.querySelectorAll(selectors.CONTAINER));
                return items.slice(0, limit).map(el => ({
                    id: el.getAttribute('id'),
                    title: el.getAttribute(selectors.TITLE_ATTR),
                    author: el.getAttribute(selectors.AUTHOR_ATTR),
                    subreddit: el.getAttribute(selectors.SUBREDDIT_ATTR),
                    score: el.getAttribute(selectors.SCORE_ATTR),
                    commentCount: el.getAttribute(selectors.COMMENTS_ATTR),
                    timestamp: el.getAttribute(selectors.TIMESTAMP_ATTR),
                    type: el.getAttribute(selectors.TYPE_ATTR),
                    link: el.getAttribute(selectors.LINK_ATTR) ? `https://www.reddit.com${el.getAttribute(selectors.LINK_ATTR)}` : null,
                    externalLink: el.getAttribute(selectors.EXTERNAL_LINK_ATTR)
                }));
            }, SELECTORS.REDDIT_FEED, limit);
        }
    });

    register_tracked_tool(server, {
        name: 'osint_reddit_community_feed',
        description: 'Extract recent posts from a specific Reddit community (subreddit).',
        parameters: z.object({
            subreddit: z.string().describe('Subreddit name (e.g., worldnews)'),
            sort: z.enum(['hot', 'new', 'top', 'rising']).default('hot').describe('Feed sorting method'),
            limit: z.number().default(10).describe('Max items to extract')
        }),
        execute: async({subreddit, sort, limit})=>{
            const cleanSub = subreddit.startsWith('r/') ? subreddit.slice(2) : subreddit;
            const url = `https://www.reddit.com/r/${cleanSub}/${sort}/`;
            return await local_scrape(url, (selectors, limit)=>{
                const items = Array.from(document.querySelectorAll(selectors.CONTAINER));
                return items.slice(0, limit).map(el => ({
                    id: el.getAttribute('id'),
                    title: el.getAttribute(selectors.TITLE_ATTR),
                    author: el.getAttribute(selectors.AUTHOR_ATTR),
                    subreddit: el.getAttribute(selectors.SUBREDDIT_ATTR),
                    score: el.getAttribute(selectors.SCORE_ATTR),
                    commentCount: el.getAttribute(selectors.COMMENTS_ATTR),
                    timestamp: el.getAttribute(selectors.TIMESTAMP_ATTR),
                    type: el.getAttribute(selectors.TYPE_ATTR),
                    link: el.getAttribute(selectors.LINK_ATTR) ? `https://www.reddit.com${el.getAttribute(selectors.LINK_ATTR)}` : null,
                    externalLink: el.getAttribute(selectors.EXTERNAL_LINK_ATTR)
                }));
            }, SELECTORS.REDDIT_FEED, limit);
        }
    });
};
