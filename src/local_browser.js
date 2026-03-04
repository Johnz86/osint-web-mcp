/**
 * OSINT Web MCP: Local Browser Management
 */
import { chromium } from 'playwright-extra';
import stealth_plugin from 'puppeteer-extra-plugin-stealth';
import { Aria_snapshot_filter } from './aria_snapshot_filter.js';
import { BROWSER_CONFIG } from './constants.js';

// Apply stealth plugin globally
const chromium_stealth = chromium;
chromium_stealth.use(stealth_plugin());

/**
 * LocalBrowser: Manages a local stealth-enabled Playwright instance.
 * Follows a singleton-like pattern via the get_browser_instance export.
 */
export class LocalBrowser {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.network_requests = new Set();
        this.is_headless = process.env.HEADLESS !== 'false';
    }

    /**
     * Initialize the browser, context, and request listeners.
     */
    async initialize() {
        if (this.browser) return;

        console.error('Launching local stealth browser...');
        this.browser = await chromium_stealth.launch({
            headless: this.is_headless,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled'
            ]
        });

        this.context = await this.browser.newContext({
            viewport: BROWSER_CONFIG.DEFAULT_VIEWPORT,
            userAgent: process.env.USER_AGENT || BROWSER_CONFIG.DEFAULT_USER_AGENT
        });

        this.setup_network_tracking();
    }

    /**
     * Subscribe to network events to track session activity.
     */
    setup_network_tracking() {
        this.context.on('request', request => this.network_requests.add(request));
    }

    /**
     * Get or create a page instance.
     * @param {Object} options - Navigation options.
     * @returns {Promise<Page>}
     */
    async get_active_page(options = {}) {
        await this.initialize();
        
        if (!this.page || this.page.isClosed()) {
            this.page = await this.context.newPage();
        }

        if (options.url && this.page.url() !== options.url) {
            await this.page.goto(options.url, { 
                waitUntil: 'domcontentloaded', 
                timeout: BROWSER_CONFIG.NAV_TIMEOUT 
            });
        }

        return this.page;
    }

    /**
     * Gracefully close all browser resources.
     */
    async shutdown() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
            this.page = null;
        }
    }

    /**
     * Clear the network request log.
     */
    async reset_network_log() {
        this.network_requests.clear();
    }

    /**
     * Retrieve the current network request log.
     * @returns {Set}
     */
    async get_network_log() {
        return this.network_requests;
    }

    /**
     * Capture and format an accessibility snapshot for AI consumption.
     * @param {Object} params - Formatting parameters.
     * @returns {Promise<Object>}
     */
    async capture_aria_snapshot({ filtered = true } = {}) {
        const page = await this.get_active_page();
        
        try {
            const raw_snapshot = await page.accessibility.snapshot();
            const formatted_text = this.format_snapshot_node(raw_snapshot);

            return {
                url: page.url(),
                title: await page.title(),
                aria_snapshot: filtered 
                    ? Aria_snapshot_filter.filter_snapshot(formatted_text) 
                    : formatted_text
            };
        } catch (e) {
            throw new Error(`Accessibility snapshot failed: ${e.message}`);
        }
    }

    /**
     * Recursively format an accessibility node into a readable string.
     * @param {Object} node - The snapshot node.
     * @param {number} indent - Current indentation level.
     * @returns {string}
     */
    format_snapshot_node(node, indent = 0) {
        if (!node) return '';
        
        let result = '  '.repeat(indent) + `- ${node.role} "${node.name || ''}"`;
        
        if (node.children) {
            for (const child of node.children) {
                result += '\n' + this.format_snapshot_node(child, indent + 1);
            }
        }
        
        return result;
    }

    /**
     * Locate an element based on ref or semantic identifiers.
     * @param {Object} target - Target element description and ref.
     * @returns {Promise<Locator>}
     */
    async resolve_locator({ element, ref }) {
        const page = await this.get_active_page();
        const selector = `[ref="${ref}"], [id="${ref}"], text="${element}"`;
        return page.locator(selector).first();
    }

    /**
     * Wait for a specific CSS selector to appear.
     * @param {string} selector - CSS selector.
     * @param {number} timeout - Timeout in ms.
     */
    async wait_for_selector(selector, timeout = 30000) {
        const page = await this.get_active_page();
        await page.waitForSelector(selector, { timeout });
    }

    /**
     * Wait for a specific duration.
     * @param {number} ms - Milliseconds to wait.
     */
    async wait_for_timeout(ms) {
        const page = await this.get_active_page();
        await page.waitForTimeout(ms);
    }

    /**
     * Execute a raw JavaScript expression in the page context.
     * @param {string} expression - JS code.
     * @returns {Promise<any>}
     */
    async execute_expression(expression) {
        const page = await this.get_active_page();
        return await page.evaluate(expression);
    }
}

let browser_instance = null;

/**
 * Singleton access to the LocalBrowser manager.
 */
export const get_browser_instance = async () => {
    if (!browser_instance) {
        browser_instance = new LocalBrowser();
    }
    await browser_instance.initialize();
    return browser_instance;
};
