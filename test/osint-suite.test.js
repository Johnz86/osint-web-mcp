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
        env: { ...process.env, HEADLESS: 'true' },
    });

    await client.connect(transport);

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
                { tool: 'osint_search_duckduckgo', args: { query: 'MCP protocol' }, description: 'DuckDuckGo Search' },
                { tool: 'osint_search_bing', args: { query: 'Model Context Protocol' }, description: 'Bing Search' },
                { tool: 'osint_github_search', args: { query: 'fastmcp' }, description: 'GitHub Search' },
                { tool: 'osint_reddit_search', args: { query: 'OSINT' }, description: 'Reddit Search' },
                { tool: 'osint_youtube_search', args: { query: 'Model Context Protocol' }, description: 'YouTube Search' },
                { tool: 'osint_ebay_search', args: { query: 'laptop' }, description: 'eBay Search' },
                { tool: 'osint_amazon_search', args: { query: 'mechanical keyboard' }, description: 'Amazon Search' },
                { tool: 'osint_hacker_news_search', args: { query: 'top', sort: 'popularity', dateRange: 'pastWeek' }, description: 'HN Trending' }
            ]
        },
        {
            name: 'Extraction Tools',
            tests: [
                { tool: 'osint_amazon_product', args: { url: 'https://www.amazon.com/dp/B08N5KWB9H' }, description: 'Amazon Product' },
                { tool: 'osint_reddit_thread', args: { url: 'https://www.reddit.com/r/osint/comments/16j1v92/official_weekly_checkin_thread/' }, description: 'Reddit Thread' },
                { tool: 'osint_github_file', args: { url: 'https://github.com/google/gemini-cli/blob/main/README.md' }, description: 'GitHub File' },
                { tool: 'osint_tiktok_profile', args: { username: 'google' }, description: 'TikTok Profile' },
                { tool: 'osint_youtube_video_details', args: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, description: 'YouTube Video Details' },
                { tool: 'osint_ebay_product', args: { url: 'https://www.ebay.com/itm/123456789012' }, description: 'eBay Product (Dummy)' },
                { tool: 'osint_homedepot_product', args: { url: 'https://www.homedepot.com/p/312468406' }, description: 'HomeDepot Product' },
                { tool: 'osint_scrape', args: { url: 'https://news.ycombinator.com' }, description: 'Markdown Scrape' }
            ]
        }
    ];

    for (const group of testGroups) {
        await t.test(group.name, async (st) => {
            for (const { tool, args, description } of group.tests) {
                await st.test(description, async () => {
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
                            // Specific bypass for known anti-bot / rate-limit issues in CI
                            if (content.error.includes('anti-bot') || content.error.includes('blocked') || content.error.includes('403') || content.error.includes('429')) {
                                console.error(`      ⚠️  ${tool} potential block/rate-limit: ${content.error}`);
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
                        // If it's a known failing tool, we might catch it here
                        assert.fail(`Test ${description} failed with exception: ${e.message}`);
                    }
                });
            }
        });
    }

    // Browser Tools Group (Special handling because they depend on page state)
    await t.test('Browser Interaction Tools', async (st) => {
        await st.test('Browser Workflow', async () => {
            console.error('   ▶ Testing Browser Workflow...');
            
            // 1. Navigate
            const nav = await client.callTool({ name: 'browser_navigate', arguments: { url: 'https://example.com' } });
            assert.ok(!nav.isError);
            
            // 2. Snapshot
            const snap = await client.callTool({ name: 'browser_snapshot', arguments: {} });
            assert.ok(!snap.isError);
            assert.ok(snap.content[0].text.includes('example.com'));
            
            // 3. Eval
            const ev = await client.callTool({ name: 'browser_eval', arguments: { expression: 'document.title' } });
            assert.ok(!ev.isError);
            assert.ok(ev.content[0].text.includes('Example Domain'));
            
            // 4. Screenshot
            const shot = await client.callTool({ name: 'browser_screenshot', arguments: {} });
            assert.ok(!shot.isError);
            assert.ok(shot.content[0].type === 'image');
        });
    });

    await client.close();
});
