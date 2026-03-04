#!/usr/bin/env node
/**
 * OSINT Web MCP: Main Server
 * Clean, SOLID implementation for a free-for-everyone MCP experience.
 */

import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { createRequire } from 'node:module';
import { get_browser_instance } from './local_browser.js';
import { tools as browser_tools } from './browser_tools.js';
import prompts from './prompts.js';
import { local_scrape } from './scraper_engine.js';
import { register_tracked_tool, get_session_stats } from './session_manager.js';
import { register_search_tools } from './search_tools.js';
import { register_extraction_tools } from './extraction_tools.js';
import { register_osint_tools } from './osint_tools.js';

const require = createRequire(import.meta.url);
const package_json = require('../package.json');

const server = new FastMCP({
    name: 'OSINT Web MCP',
    version: package_json.version,
});

/**
 * Registers utility tools for the session.
 */
const register_utility_tools = () => {
    register_tracked_tool(server, {
        name: 'osint_session_stats',
        description: 'Report how many times each tool has been called during the current MCP session.',
        parameters: z.object({}),
        execute: async () => {
            return JSON.stringify(get_session_stats(), null, 2);
        }
    });

    register_tracked_tool(server, {
        name: 'osint_scrape_as_html',
        description: 'Scrape a single webpage and return the raw HTML response body.',
        parameters: z.object({
            url: z.string().url().describe('Target URL to scrape')
        }),
        execute: async ({ url }) => {
            return await local_scrape(url);
        }
    });
};

// Initialize tools
register_utility_tools();
register_search_tools(server);
register_extraction_tools(server);
register_osint_tools(server);

// Register browser interaction tools
for (const tool of browser_tools) {
    register_tracked_tool(server, tool);
}

server.addPrompts(prompts);

console.error('OSINT Web MCP Server started successfully (Omakase edition).');

/**
 * Gracefully shuts down the server and browser instance.
 */
const shutdown = async () => {
    console.error('Shutting down OSINT Web MCP Server...');
    const browser = await get_browser_instance();
    await browser.shutdown();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.start({ transportType: 'stdio' });
