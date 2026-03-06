/**
 * OSINT Web MCP: Local Browser Management
 */
import { chromium } from 'playwright-extra';
import stealth_plugin from 'puppeteer-extra-plugin-stealth';
import { Aria_snapshot_filter } from './aria_snapshot_filter.js';
import { BROWSER_CONFIG, BOT_INDICATORS } from './constants.js';
import { find_browser_path } from './utils.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import fs from 'node:fs';

const chromium_stealth = chromium;
chromium_stealth.use(stealth_plugin());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_USER_DATA_DIR = path.resolve(__dirname, '..', '.browser_cache');

/**
 * Get the user data directory to use.
 */
const get_user_data_dir = () => {
    if (process.env.USER_DATA_DIR) return process.env.USER_DATA_DIR;
    
    // Use unique temp directory in test/CI environments to avoid ProcessSingleton conflicts
    const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST || process.env.CI;
    if (isTest) {
        const tempDir = path.join(os.tmpdir(), `osint-web-mcp-test-${Math.random().toString(36).substring(7)}`);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        return tempDir;
    }
    
    return DEFAULT_USER_DATA_DIR;
};

const USER_DATA_DIR = get_user_data_dir();

/**
 * Manages a local stealth-enabled Playwright instance.
 */
export class LocalBrowser {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.network_requests = new Set();
        this.is_headless = process.env.HEADLESS !== 'false';
        this.session_verified = new Set();
        this._navigation_lock = Promise.resolve();
    }

    /**
     * Resets the verification state for a domain.
     * @param {string} [domain] - Domain to reset. If omitted, clears all.
     */
    reset_verification(domain) {
        if (domain) {
            this.session_verified.delete(domain);
        } else {
            this.session_verified.clear();
        }
    }

    /**
     * Initializes the browser and context if not already done.
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
                width: BROWSER_CONFIG.DEFAULT_VIEWPORT.width + Math.floor(Math.random() * 100),
                height: BROWSER_CONFIG.DEFAULT_VIEWPORT.height + Math.floor(Math.random() * 100)
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
            console.error(`Browser initialized. Headless: ${this.is_headless}.`);
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
     * Checks for bot detection indicators and waits for manual resolution if not in headless mode.
     * @param {import('playwright').Page} page
     * @param {boolean} force - Force check even if already verified.
     */
    async handle_manual_captcha(page, force = false) {
        if (this.is_headless) return;
        
        const domain = new URL(page.url()).hostname;
        if (this.session_verified.has(domain) && !force) return;

        const is_bot_detected = await this._check_bot_indicators(page);

        if (is_bot_detected) {
            await this._handle_bot_block(page, domain);
        } else {
            this.session_verified.add(domain);
        }
    }

    /**
     * Evaluates the page for known bot block indicators.
     * @private
     */
    async _check_bot_indicators(page) {
        return await page.evaluate((indicators) => {
            const title = document.title?.toLowerCase() || '';
            const h1 = document.querySelector('h1')?.innerText?.toLowerCase() || '';
            const body = document.body?.innerText?.toLowerCase() || '';
            
            return indicators.some(ind => 
                title.includes(ind) || 
                h1.includes(ind) || 
                body.includes(ind)
            );
        }, BOT_INDICATORS);
    }

    /**
     * Notifies user and waits for manual CAPTCHA resolution.
     * @private
     */
    async _handle_bot_block(page, domain) {
        console.error(`\n🛑 BOT DETECTION DETECTED on ${domain}!`);
        console.error('Please solve the CAPTCHA or verification challenge in the browser window.');
        console.error('The engine will wait for you to resolve it...\n');
        
        try {
            await page.waitForFunction((indicators) => {
                const title = document.title?.toLowerCase() || '';
                const h1 = document.querySelector('h1')?.innerText?.toLowerCase() || '';
                const body = document.body?.innerText?.toLowerCase() || '';
                
                return !indicators.some(ind => 
                    title.includes(ind) || 
                    h1.includes(ind) || 
                    body.includes(ind)
                );
            }, BOT_INDICATORS, { timeout: 120000 });
            
            console.error('✅ CAPTCHA resolved or bot detection cleared. Proceeding...');
            this.session_verified.add(domain);
            await page.waitForTimeout(2000);
        } catch (e) {
            console.error('⚠️ Timeout waiting for CAPTCHA resolution. Attempting to proceed anyway...');
        }
    }

    /**
     * Returns an active page instance, navigating to a URL if provided.
     * @param {Object} [options={}]
     * @param {string} [options.url]
     * @returns {Promise<import('playwright').Page>}
     */
    async get_active_page(options = {}) {
        // Strict mutex to prevent parallel navigations on the same singleton page
        const current_lock = this._navigation_lock;
        let release;
        this._navigation_lock = new Promise(res => release = res);
        
        await current_lock;

        try {
            await this.initialize();
            const page = await this._ensure_page();

            if (options.url && page.url() !== options.url) {
                await this._navigate_to_url(page, options.url);
            }
            return page;
        } finally {
            release();
        }
    }

    /**
     * Internal helper to ensure a valid page exists.
     * @private
     */
    async _ensure_page() {
        const pages = this.context.pages();
        if (pages.length > 0 && (!this.page || this.page.isClosed())) {
            this.page = pages[0];
        }

        if (!this.page || this.page.isClosed()) {
            this.page = await this.context.newPage();
        }
        return this.page;
    }

    /**
     * Navigates to a URL and performs post-navigation checks.
     * @private
     */
    async _navigate_to_url(page, url) {
        const perform_nav = async () => {
            try {
                await page.evaluate(() => window.stop()).catch(() => {});
            } catch (e) {}

            await page.goto(url, { 
                waitUntil: 'domcontentloaded', 
                timeout: BROWSER_CONFIG.NAV_TIMEOUT 
            });
        };

        try {
            await perform_nav();
        } catch (e) {
            if (e.message.includes('interrupted')) {
                // Retry once if interrupted by a late redirect from previous session
                await page.waitForTimeout(500);
                await perform_nav();
            } else {
                throw e;
            }
        }

        if (!this.is_headless) {
            await this.handle_manual_captcha(page);
        }

        const jitter = Math.floor(Math.random() * 2000) + 1000;
        await page.waitForTimeout(jitter);
    }

    /**
     * Navigates back in history.
     */
    async go_back() {
        const page = await this.get_active_page();
        return await page.goBack({ waitUntil: 'domcontentloaded' });
    }

    /**
     * Navigates forward in history.
     */
    async go_forward() {
        const page = await this.get_active_page();
        return await page.goForward({ waitUntil: 'domcontentloaded' });
    }

    /**
     * Returns the full HTML of the current page.
     */
    async get_html() {
        const page = await this.get_active_page();
        return await page.content();
    }

    /**
     * Closes the browser context and resets state.
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
     */
    async reset_network_log() {
        this.network_requests.clear();
    }

    /**
     * Returns an array of recorded network requests.
     */
    async get_network_log() {
        return Array.from(this.network_requests);
    }

    /**
     * Captures and optionally filters an ARIA snapshot for AI consumption.
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
     */
    async resolve_locator({ element, ref }) {
        const page = await this.get_active_page();
        const selector = `[ref="${ref}"], [id="${ref}"], text="${element}"`;
        return page.locator(selector).first();
    }

    /**
     * Waits for a CSS selector to become available.
     */
    async wait_for_selector(selector, timeout = 30000) {
        const page = await this.get_active_page();
        await page.waitForSelector(selector, { timeout });
    }

    /**
     * Pauses execution for a specified duration.
     */
    async wait_for_timeout(ms) {
        const page = await this.get_active_page();
        await page.waitForTimeout(ms);
    }

    /**
     * Evaluates a JavaScript expression in the page context.
     */
    async execute_expression(expression) {
        const page = await this.get_active_page();
        return await page.evaluate(expression);
    }
}

let browser_instance = null;

/**
 * Returns a singleton instance of the LocalBrowser.
 */
export const get_browser_instance = async () => {
    if (!browser_instance) {
        browser_instance = new LocalBrowser();
    }
    await browser_instance.initialize();
    return browser_instance;
};
