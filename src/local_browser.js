/**
 * OSINT Web MCP: Local Browser Management
 */
import { chromium } from 'playwright-extra';
import stealth_plugin from 'puppeteer-extra-plugin-stealth';
import { Aria_snapshot_filter } from './aria_snapshot_filter.js';
import { BROWSER_CONFIG } from './constants.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

// Apply stealth plugin globally
const chromium_stealth = chromium;
chromium_stealth.use(stealth_plugin());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USER_DATA_DIR = path.resolve(__dirname, '..', '.browser_cache');

/**
 * Attempt to locate a local Chromium-based browser (Brave, Chrome, or Chromium).
 */
const find_browser_path = () => {
    const browsers = [
        'brave-browser',
        'brave',
        'google-chrome',
        'google-chrome-stable',
        'chromium-browser',
        'chromium'
    ];

    for (const name of browsers) {
        try {
            return execSync(`which ${name}`, { stdio: 'pipe' }).toString().trim();
        } catch (e) {
            continue;
        }
    }
    return null;
};

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
        if (this.context) return;

        const executablePath = find_browser_path();
        if (!executablePath) {
            console.error('⚠️ No compatible Chromium-based browser found (Brave, Chrome, or Chromium).');
        }

        console.error(`Launching local stealth browser with user data: ${USER_DATA_DIR}...`);
        
        // Use launchPersistentContext to support User Data Dir
        this.context = await chromium_stealth.launchPersistentContext(USER_DATA_DIR, {
            executablePath: executablePath || undefined,
            headless: this.is_headless,
            viewport: BROWSER_CONFIG.DEFAULT_VIEWPORT,
            userAgent: process.env.USER_AGENT || BROWSER_CONFIG.DEFAULT_USER_AGENT,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled'
            ]
        });

        // In persistent context, the context represents the browser lifetime
        this.browser = this.context.browser();

        if (process.env.DEBUG === 'true') {
            console.error(`Browser initialized. Headless: ${this.is_headless}. Path: ${executablePath}`);
        }

        this.setup_network_tracking();
    }

    /**
     * Subscribe to network events to track session activity.
     */
    setup_network_tracking() {
        this.context.on('request', request => {
            this.network_requests.add({
                url: request.url(),
                method: request.method(),
                resourceType: request.resourceType(),
                status: null // Will be updated on response
            });
        });
        this.context.on('response', response => {
            const url = response.url();
            const status = response.status();
            // Find and update the request in the set
            for (const req of this.network_requests) {
                if (req.url === url && req.status === null) {
                    req.status = status;
                    break;
                }
            }
        });
    }

    /**
     * Get or create a page instance.
     * @param {Object} options - Navigation options.
     * @returns {Promise<Page>}
     */
    async get_active_page(options = {}) {
        await this.initialize();
        
        // In persistent context, one page is usually already open
        const pages = this.context.pages();
        if (pages.length > 0 && (!this.page || this.page.isClosed())) {
            this.page = pages[0];
        }

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
     * Navigate back in history.
     */
    async go_back() {
        const page = await this.get_active_page();
        return await page.goBack({ waitUntil: 'domcontentloaded' });
    }

    /**
     * Navigate forward in history.
     */
    async go_forward() {
        const page = await this.get_active_page();
        return await page.goForward({ waitUntil: 'domcontentloaded' });
    }

    /**
     * Get the full HTML content of the current page.
     */
    async get_html() {
        const page = await this.get_active_page();
        return await page.content();
    }

    /**
     * Gracefully close all browser resources.
     */
    async shutdown() {
        if (this.context) {
            await this.context.close();
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
     * @returns {Array}
     */
    async get_network_log() {
        return Array.from(this.network_requests);
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
