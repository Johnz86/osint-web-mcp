'use strict';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const test_dir = dirname(fileURLToPath(import.meta.url));
const repo_root = resolve(test_dir, '..');

/**
 * Parameterized test suite for OSINT Web MCP tools.
 */
test('OSINT Web MCP: Full Tool Validation Suite', async (t) => {
    const client = new Client(
        { name: 'osint-suite-test', version: '1.0.0' },
        { capabilities: { tools: {} } }
    );
    
    const transport = new StdioClientTransport({
        command: process.execPath,
        args: ['src/server.js'],
        cwd: repo_root,
        env: { ...process.env, HEADLESS: 'true', NODE_ENV: 'test' },
    });

    await client.connect(transport);

    /**
     * Helper to call a tool and validate its basic response.
     */
    async function validateTool(tool, args, description) {
        console.error(`   ▶ Testing ${description}...`);
        try {
            const result = await client.callTool({ name: tool, arguments: args });
            
            assert.ok(!result.isError, `Tool ${tool} returned an MCP error: ${JSON.stringify(result)}`);
            
            const rawText = result.content[0].text;
            let content;
            let isJson = false;

            try {
                content = JSON.parse(rawText);
                isJson = true;
            } catch (e) {
                content = rawText;
            }
            
            if (isJson && content.error) {
                // Handle CI blocks/rate-limits gracefully
                const skipErrors = ['anti-bot', 'blocked', '403', '429', 'No results found'];
                if (skipErrors.some(err => content.error.toLowerCase().includes(err))) {
                    console.error(`      ⚠️  ${tool} potential block/rate-limit/no-results: ${content.error}`);
                    return;
                }
                assert.fail(`Tool ${tool} returned application error: ${content.error}`);
            }
            
            if (isJson) {
                if (Array.isArray(content)) {
                    assert.ok(content.length >= 0, `Tool ${tool} should return an array`);
                } else {
                    assert.ok(typeof content === 'object' && content !== null, `Tool ${tool} should return an object`);
                }
            } else {
                assert.ok(typeof content === 'string' && content.length > 0, `Tool ${tool} should return a non-empty string`);
            }
        } catch (e) {
            assert.fail(`Test ${description} failed with exception: ${e.message}`);
        }
    }

    const testGroups = [
        {
            name: 'Utilities',
            tests: [
                { tool: 'osint_session_stats', args: {}, description: 'Session stats report' },
                { tool: 'osint_scrape_as_html', args: { url: 'https://example.com' }, description: 'Raw HTML scrape' }
            ]
        },
        {
            name: 'OSINT Tools',
            tests: [
                { tool: 'osint_dns', args: { domain: 'google.com', type: 'A' }, description: 'DNS Lookup' },
                { tool: 'osint_whois', args: { domain: 'example.com' }, description: 'WHOIS Lookup' },
                { tool: 'osint_ip_info', args: { ip: '8.8.8.8' }, description: 'IP Geolocation' },
                { tool: 'osint_user_lookup', args: { username: 'google' }, description: 'Username Lookup' },
                { tool: 'osint_yahoo_finance_quote', args: { ticker: 'AAPL' }, description: 'Stock Quote' }
            ]
        },
        {
            name: 'Search Tools',
            tests: [
                { tool: 'osint_search_google', args: { query: 'MCP protocol' }, description: 'Google Search' },
                { tool: 'osint_search_duckduckgo', args: { query: 'MCP protocol' }, description: 'DuckDuckGo Search' },
                { tool: 'osint_search_bing', args: { query: 'Model Context Protocol' }, description: 'Bing Search' },
                { tool: 'osint_search_yandex', args: { query: 'MCP' }, description: 'Yandex Search' },
                { tool: 'osint_amazon_search', args: { query: 'mechanical keyboard' }, description: 'Amazon Search' },
                { tool: 'osint_ebay_search', args: { query: 'laptop' }, description: 'eBay Search' },
                { tool: 'osint_github_search', args: { query: 'fastmcp' }, description: 'GitHub Search' },
                { tool: 'osint_reddit_search', args: { query: 'OSINT' }, description: 'Reddit Search' },
                { tool: 'osint_linkedin_jobs_search', args: { query: 'software engineer' }, description: 'LinkedIn Jobs' },
                { tool: 'osint_twitter_search', args: { query: 'OSINT' }, description: 'Twitter Search' },
                { tool: 'osint_google_news_search', args: { query: 'AI' }, description: 'Google News' },
                { tool: 'osint_youtube_search', args: { query: 'Model Context Protocol' }, description: 'YouTube Search' },
                { tool: 'osint_search_wikipedia', args: { query: 'Open-source intelligence' }, description: 'Wikipedia Search' },
                { tool: 'osint_search_craigslist', args: { query: 'bicycle' }, description: 'Craigslist Search' },
                { tool: 'osint_search_stackoverflow', args: { query: 'javascript' }, description: 'StackOverflow Search' },
                { tool: 'osint_search_booking', args: { query: 'London' }, description: 'Booking Search' },
                { tool: 'osint_search_indeed', args: { query: 'developer' }, description: 'Indeed Search' },
                { tool: 'osint_search_walmart', args: { query: 'TV' }, description: 'Walmart Search' },
                { tool: 'osint_search_bestbuy', args: { query: 'OLED' }, description: 'BestBuy Search' },
                { tool: 'osint_search_playstore', args: { query: 'OSINT' }, description: 'PlayStore Search' },
                { tool: 'osint_search_etsy', args: { query: 'handmade' }, description: 'Etsy Search' },
                { tool: 'osint_search_zara', args: { query: 'shirt' }, description: 'Zara Search' },
                { tool: 'osint_search_homedepot', args: { query: 'drill' }, description: 'HomeDepot Search' },
                { tool: 'osint_hacker_news_search', args: { query: 'top', sort: 'popularity', dateRange: 'pastWeek' }, description: 'HN Trending' },
                { tool: 'osint_search_engine_batch', args: { queries: ['OSINT', 'MCP'], engine: 'duckduckgo' }, description: 'Batch Search' }
            ]
        },
        {
            name: 'Extraction Tools',
            tests: [
                { tool: 'osint_amazon_product', args: { url: 'https://www.amazon.com/dp/B08N5KWB9H' }, description: 'Amazon Product' },
                { tool: 'osint_amazon_reviews', args: { url: 'https://www.amazon.com/product-reviews/B08N5KWB9H' }, description: 'Amazon Reviews' },
                { tool: 'osint_walmart_product', args: { url: 'https://www.walmart.com/ip/12345' }, description: 'Walmart Product (Dummy)' },
                { tool: 'osint_ebay_product', args: { url: 'https://www.ebay.com/itm/123456789012' }, description: 'eBay Product (Dummy)' },
                { tool: 'osint_homedepot_product', args: { url: 'https://www.homedepot.com/p/312468406' }, description: 'HomeDepot Product' },
                { tool: 'osint_bestbuy_product', args: { url: 'https://www.bestbuy.com/site/6430161.p' }, description: 'BestBuy Product' },
                { tool: 'osint_etsy_product', args: { url: 'https://www.etsy.com/listing/12345' }, description: 'Etsy Product' },
                { tool: 'osint_zara_product', args: { url: 'https://www.zara.com/us/en/p12345.html' }, description: 'Zara Product' },
                { tool: 'osint_reddit_thread', args: { url: 'https://www.reddit.com/r/osint/comments/16j1v92/official_weekly_checkin_thread/' }, description: 'Reddit Thread' },
                { tool: 'osint_github_file', args: { url: 'https://github.com/google/gemini-cli/blob/main/README.md' }, description: 'GitHub File' },
                { tool: 'osint_tiktok_profile', args: { username: 'google' }, description: 'TikTok Profile' },
                { tool: 'osint_tiktok_video_details', args: { url: 'https://www.tiktok.com/@google/video/12345' }, description: 'TikTok Video' },
                { tool: 'osint_youtube_video_details', args: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, description: 'YouTube Video Details' },
                { tool: 'osint_youtube_comments', args: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', limit: 5 }, description: 'YouTube Comments' },
                { tool: 'osint_x_post_details', args: { url: 'https://twitter.com/X/status/12345' }, description: 'X Post Details' },
                { tool: 'osint_linkedin_post', args: { url: 'https://www.linkedin.com/posts/activity-12345' }, description: 'LinkedIn Post' },
                { tool: 'osint_instagram_profile', args: { username: 'google' }, description: 'Instagram Profile' },
                { tool: 'osint_google_play_app', args: { url: 'https://play.google.com/store/apps/details?id=com.google.android.googlequicksearchbox' }, description: 'Google Play App' },
                { tool: 'osint_apple_app_store_app', args: { url: 'https://apps.apple.com/us/app/google/id284815973' }, description: 'Apple App Store App' },
                { tool: 'osint_yahoo_finance_profile', args: { url: 'https://finance.yahoo.com/quote/AAPL/profile' }, description: 'Yahoo Finance Profile' },
                { tool: 'osint_google_maps_reviews', args: { url: 'https://www.google.com/maps/place/Googleplex/' }, description: 'Google Maps Reviews' },
                { tool: 'osint_booking_hotel_details', args: { url: 'https://www.booking.com/hotel/us/example.html' }, description: 'Booking Hotel Details' },
                { tool: 'osint_zillow_property_details', args: { url: 'https://www.zillow.com/homedetails/123-Main-St' }, description: 'Zillow Property' },
                { tool: 'osint_scrape', args: { url: 'https://news.ycombinator.com' }, description: 'Markdown Scrape' },
                { tool: 'osint_scrape_batch', args: { urls: ['https://example.com', 'https://example.org'] }, description: 'Batch Scrape' }
            ]
        }
    ];

    for (const group of testGroups) {
        await t.test(group.name, async (st) => {
            for (const { tool, args, description } of group.tests) {
                await st.test(description, async () => {
                    await validateTool(tool, args, description);
                    // Small delay to let browser settle between tools
                    await new Promise(resolve => setTimeout(resolve, 500));
                });
            }
        });
    }

    await t.test('Browser Interaction Tools', async (st) => {
        const workflow = [
            { name: 'browser_navigate', args: { url: 'https://example.com' } },
            { name: 'browser_snapshot', args: {}, validate: (res) => assert.ok(res.includes('example.com')) },
            { name: 'browser_eval', args: { expression: 'document.title' }, validate: (res) => assert.ok(res.includes('Example Domain')) },
            { name: 'browser_get_text', args: {}, validate: (res) => assert.ok(res.includes('Example Domain')) },
            { name: 'browser_get_html', args: {}, validate: (res) => assert.ok(res.includes('<html')) },
            { name: 'browser_network_log', args: {} },
            { name: 'browser_wait_ms', args: { ms: 100 } },
            { name: 'browser_scroll', args: { direction: 'bottom' } },
            { name: 'browser_screenshot', args: {}, isImage: true },
            { name: 'browser_go_back', args: {} },
            { name: 'browser_go_forward', args: {} },
            { name: 'scraping_browser_navigate', args: { url: 'https://example.org' } }
        ];

        for (const step of workflow) {
            await st.test(step.name, async () => {
                const result = await client.callTool({ name: step.name, arguments: step.args });
                assert.ok(!result.isError);
                
                if (step.validate) {
                    step.validate(result.content[0].text);
                }
                
                if (step.isImage) {
                    assert.strictEqual(result.content[0].type, 'image');
                }
                
                // Small delay between interactive steps
                await new Promise(resolve => setTimeout(resolve, 300));
            });
        }
    });

    await client.close();
});
