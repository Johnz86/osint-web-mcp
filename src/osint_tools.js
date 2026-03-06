/**
 * OSINT Web MCP: Investigative OSINT Tools
 */
import { z } from 'zod';
import axios from 'axios';
import whois from 'whois-json';
import dns from 'node:dns/promises';
import { API_ENDPOINTS, SEARCH_ENGINES } from './constants.js';
import { get_browser_instance } from './local_browser.js';
import { register_tracked_tool } from './session_manager.js';

/**
 * Registers investigative OSINT tools on the provided FastMCP server.
 * @param {import('fastmcp').FastMCP} server - The FastMCP server instance.
 */
export const register_osint_tools = (server) => {

    register_tracked_tool(server, {
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

            return results;
        }
    });

    register_tracked_tool(server, {
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
            
            return await page.evaluate(() => {
                const price = document.querySelector('fin-streamer[data-field="regularMarketPrice"]')?.innerText;
                const change = document.querySelector('fin-streamer[data-field="regularMarketChangePercent"]')?.innerText;
                const name = document.querySelector('h1')?.innerText;
                return { name, price, change };
            });
        }
    });

    register_tracked_tool(server, {
        name: 'osint_whois',
        description: 'Perform WHOIS domain registration lookup.',
        parameters: z.object({
            domain: z.string().describe('Domain to lookup (e.g., example.com)')
        }),
        execute: async({domain})=>{
            return await whois(domain);
        }
    });

    register_tracked_tool(server, {
        name: 'osint_dns',
        description: 'Perform DNS record lookups.',
        parameters: z.object({
            domain: z.string().describe('Domain to lookup'),
            type: z.enum(['A', 'AAAA', 'MX', 'TXT', 'NS', 'ANY']).default('A')
        }),
        execute: async({domain, type})=>{
            return type === 'ANY' ? await dns.resolveAny(domain) : await dns.resolve(domain, type);
        }
    });

    register_tracked_tool(server, {
        name: 'osint_ip_info',
        description: 'Retrieve IP geolocation and ISP information.',
        parameters: z.object({
            ip: z.string().describe('Target IP address')
        }),
        execute: async({ip})=>{
            const response = await axios.get(`${API_ENDPOINTS.IP_API}${ip}`);
            return response.data;
        }
    });
};
