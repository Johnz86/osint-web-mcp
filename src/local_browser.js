/**
 * OSINT Web MCP: Local Browser Management
 */
import { chromium } from 'playwright-extra';
import stealth_plugin from 'puppeteer-extra-plugin-stealth';
import { Aria_snapshot_filter } from './aria_snapshot_filter.js';
import { BROWSER_CONFIG } from './constants.js';
import { find_browser_path } from './utils.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const chromium_stealth = chromium;
chromium_stealth.use(stealth_plugin());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USER_DATA_DIR = path.resolve(__dirname, '..', '.browser_cache');

/**
 * Manages a local stealth-enabled Playwright instance.
 * Singleton-like behavior via get_browser_instance.
 */
export class LocalBrowser {
    /**
     * @constructor
     */
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.network_requests = new Set();
        this.is_headless = process.env.HEADLESS !== 'false';
    }

    /**
     * Initializes the browser and context if not already done.
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.context) return;

        const executablePath = find_browser_path();
        if (!executablePath) {
            console.error('⚠️ No compatible Chromium-based browser found (Brave, Chrome, or Chromium).');
        }

        if (process.env.DEBUG === 'true') {
            console.error(`Launching local stealth browser with user data: ${USER_DATA_DIR}...`);
        }
        
        this.context = await chromium_stealth.launchPersistentContext(USER_DATA_DIR, {
            executablePath: executablePath || undefined,
            headless: this.is_headless,
            viewport: {
                width: 1280 + Math.floor(Math.random() * 100),
                height: 800 + Math.floor(Math.random() * 100)
            },
            userAgent: process.env.USER_AGENT || BROWSER_CONFIG.DEFAULT_USER_AGENT,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled'
            ]
        });

        this.browser = this.context.browser();

        if (process.env.DEBUG === 'true') {
            console.error(`Browser initialized. Headless: ${this.is_headless}. Path: ${executablePath}`);
        }

        this.setup_network_tracking();
    }

    /**
     * Sets up network tracking for the browser context.
     * @private
     */
    setup_network_tracking() {
        this.context.on('request', request => {
            this.network_requests.add({
                url: request.url(),
                method: request.method(),
                resourceType: request.resourceType(),
                status: null
            });
        });
        
        this.context.on('response', response => {
            const url = response.url();
            const status = response.status();
            
            for (const req of this.network_requests) {
                if (req.url === url && req.status === null) {
                    req.status = status;
                    break;
                }
            }
        });
    }

    /**
     * Returns an active page instance, navigating to a URL if provided.
     * @param {Object} [options={}] - Page options.
     * @param {string} [options.url] - URL to navigate to.
     * @returns {Promise<import('playwright').Page>}
     */
    async get_active_page(options = {}) {
        await this.initialize();
        
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
            // Add a small random jitter after navigation
            const jitter = Math.floor(Math.random() * 2000) + 1000;
            await this.page.waitForTimeout(jitter);
        }

        return this.page;
    }

    /**
     * Navigates back in history.
     * @returns {Promise<import('playwright').Response | null>}
     */
    async go_back() {
        const page = await this.get_active_page();
        return await page.goBack({ waitUntil: 'domcontentloaded' });
    }

    /**
     * Navigates forward in history.
     * @returns {Promise<import('playwright').Response | null>}
     */
    async go_forward() {
        const page = await this.get_active_page();
        return await page.goForward({ waitUntil: 'domcontentloaded' });
    }

    /**
     * Returns the full HTML of the current page.
     * @returns {Promise<string>}
     */
    async get_html() {
        const page = await this.get_active_page();
        return await page.content();
    }

    /**
     * Closes the browser context and resets state.
     * @returns {Promise<void>}
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
     * Clears the recorded network requests.
     * @returns {Promise<void>}
     */
    async reset_network_log() {
        this.network_requests.clear();
    }

    /**
     * Returns an array of recorded network requests.
     * @returns {Promise<Array>}
     */
    async get_network_log() {
        return Array.from(this.network_requests);
    }

    /**
     * Captures and optionally filters an ARIA snapshot for AI consumption.
     * @param {Object} [options={}] - Snapshot options.
     * @param {boolean} [options.filtered=true] - Whether to filter the snapshot.
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
     * Recursively formats accessibility nodes into a readable string.
     * @param {Object} node - Snapshot node.
     * @param {number} [indent=0] - Indentation level.
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
     * Resolves a Playwright locator based on ref, ID, or text.
     * @param {Object} params - Target parameters.
     * @param {string} params.element - Semantic element description.
     * @param {string} params.ref - Unique reference.
     * @returns {Promise<import('playwright').Locator>}
     */
    async resolve_locator({ element, ref }) {
        const page = await this.get_active_page();
        const selector = `[ref="${ref}"], [id="${ref}"], text="${element}"`;
        return page.locator(selector).first();
    }

    /**
     * Waits for a CSS selector to become available.
     * @param {string} selector - CSS selector.
     * @param {number} [timeout=30000] - Timeout in ms.
     * @returns {Promise<void>}
     */
    async wait_for_selector(selector, timeout = 30000) {
        const page = await this.get_active_page();
        await page.waitForSelector(selector, { timeout });
    }

    /**
     * Pauses execution for a specified duration.
     * @param {number} ms - Milliseconds to wait.
     * @returns {Promise<void>}
     */
    async wait_for_timeout(ms) {
        const page = await this.get_active_page();
        await page.waitForTimeout(ms);
    }

    /**
     * Evaluates a JavaScript expression in the page context.
     * @param {string} expression - JS code to evaluate.
     * @returns {Promise<any>}
     */
    async execute_expression(expression) {
        const page = await this.get_active_page();
        return await page.evaluate(expression);
    }
}

let browser_instance = null;

/**
 * Returns a singleton instance of the LocalBrowser.
 * @returns {Promise<LocalBrowser>}
 */
export const get_browser_instance = async () => {
    if (!browser_instance) {
        browser_instance = new LocalBrowser();
    }
    await browser_instance.initialize();
    return browser_instance;
};
