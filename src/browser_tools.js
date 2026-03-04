/**
 * OSINT Web MCP: Browser Interaction Tools
 */
import { UserError, imageContent as image_content } from 'fastmcp';
import { z } from 'zod';
import { get_browser_instance } from './local_browser.js';

/**
 * Functional wrapper for browser-based tool execution.
 * @param {Function} task - The browser task to perform.
 * @returns {Function} MCP-compatible execution function.
 */
const with_browser = (task) => async (args) => {
    const browser = await get_browser_instance();
    try {
        return await task(browser, args);
    } catch (e) {
        throw new UserError(`Browser operation failed: ${e.message}`);
    }
};

export const browser_navigate = {
    name: 'browser_navigate',
    description: 'Navigate to a URL using the local stealth browser.',
    parameters: z.object({
        url: z.string().url().describe('Target URL')
    }),
    execute: with_browser(async (browser, { url }) => {
        const page = await browser.get_active_page({ url });
        await browser.reset_network_log();
        return [
            `Navigated to ${url}`,
            `Title: ${await page.title()}`
        ].join('\n');
    })
};

export const browser_snapshot = {
    name: 'browser_snapshot',
    description: 'Capture an ARIA accessibility snapshot of the current page for element targeting.',
    parameters: z.object({
        filtered: z.boolean().default(true).describe('Apply noise filtering')
    }),
    execute: with_browser(async (browser, { filtered }) => {
        const snapshot = await browser.capture_aria_snapshot({ filtered });
        return [
            `Page: ${snapshot.url}`,
            `Title: ${snapshot.title}`,
            '',
            'Interactive Elements:',
            snapshot.aria_snapshot
        ].join('\n');
    })
};

export const browser_click = {
    name: 'browser_click',
    description: 'Click an element using its ARIA ref or semantic name.',
    parameters: z.object({
        ref: z.string().describe('Element reference from snapshot'),
        element: z.string().describe('Description of the element')
    }),
    execute: with_browser(async (browser, { ref, element }) => {
        const locator = await browser.resolve_locator({ ref, element });
        await locator.click({ timeout: 5000 });
        return `Clicked element "${element}" (ref: ${ref})`;
    })
};

export const browser_type = {
    name: 'browser_type',
    description: 'Type text into an element.',
    parameters: z.object({
        ref: z.string().describe('Element reference'),
        element: z.string().describe('Element description'),
        text: z.string().describe('Text to enter'),
        submit: z.boolean().default(false).describe('Press Enter after typing')
    }),
    execute: with_browser(async (browser, { ref, element, text, submit }) => {
        const locator = await browser.resolve_locator({ ref, element });
        await locator.fill(text);
        if (submit) await locator.press('Enter');
        return `Typed text into "${element}"${submit ? ' and submitted' : ''}`;
    })
};

export const browser_wait = {
    name: 'browser_wait',
    description: 'Wait for a specific CSS selector to be visible.',
    parameters: z.object({
        selector: z.string().describe('CSS selector to wait for'),
        timeout: z.number().default(30000).describe('Timeout in ms')
    }),
    execute: with_browser(async (browser, { selector, timeout }) => {
        await browser.wait_for_selector(selector, timeout);
        return `Selector "${selector}" is now visible.`;
    })
};

export const browser_wait_ms = {
    name: 'browser_wait_ms',
    description: 'Wait for a fixed duration (milliseconds).',
    parameters: z.object({
        ms: z.number().describe('Duration to wait in ms')
    }),
    execute: with_browser(async (browser, { ms }) => {
        await browser.wait_for_timeout(ms);
        return `Waited for ${ms}ms.`;
    })
};

export const browser_eval = {
    name: 'browser_eval',
    description: 'Execute a JavaScript expression in the browser context and return the result.',
    parameters: z.object({
        expression: z.string().describe('JavaScript code to evaluate')
    }),
    execute: with_browser(async (browser, { expression }) => {
        const result = await browser.execute_expression(expression);
        return JSON.stringify(result, null, 2);
    })
};

export const browser_screenshot = {
    name: 'browser_screenshot',
    description: 'Capture a screenshot of the current page.',
    parameters: z.object({
        full_page: z.boolean().default(false)
    }),
    execute: with_browser(async (browser, { full_page }) => {
        const page = await browser.get_active_page();
        const buffer = await page.screenshot({ fullPage: full_page });
        return image_content({ buffer });
    })
};

export const browser_get_text = {
    name: 'browser_get_text',
    description: 'Retrieve the visible text content of the page.',
    parameters: z.object({}),
    execute: with_browser(async (browser) => {
        const page = await browser.get_active_page();
        return await page.$eval('body', el => el.innerText);
    })
};

export const browser_scroll = {
    name: 'browser_scroll',
    description: 'Scroll the current page.',
    parameters: z.object({
        direction: z.enum(['top', 'bottom']).default('bottom')
    }),
    execute: with_browser(async (browser, { direction }) => {
        const page = await browser.get_active_page();
        await page.evaluate((dir) => {
            const y = dir === 'bottom' ? document.body.scrollHeight : 0;
            window.scrollTo(0, y);
        }, direction);
        return `Scrolled to ${direction}`;
    })
};

export const browser_go_back = {
    name: 'browser_go_back',
    description: 'Navigate back to the previous page in history.',
    parameters: z.object({}),
    execute: with_browser(async (browser) => {
        const response = await browser.go_back();
        const page = await browser.get_active_page();
        return `Navigated back. Current URL: ${page.url()}. Title: ${await page.title()}`;
    })
};

export const browser_go_forward = {
    name: 'browser_go_forward',
    description: 'Navigate forward to the next page in history.',
    parameters: z.object({}),
    execute: with_browser(async (browser) => {
        const response = await browser.go_forward();
        const page = await browser.get_active_page();
        return `Navigated forward. Current URL: ${page.url()}. Title: ${await page.title()}`;
    })
};

export const browser_get_html = {
    name: 'browser_get_html',
    description: 'Retrieve the full HTML content of the current page.',
    parameters: z.object({}),
    execute: with_browser(async (browser) => {
        return await browser.get_html();
    })
};

export const browser_network_log = {
    name: 'browser_network_log',
    description: 'Retrieve the current session\'s network request log (URL, Method, Type).',
    parameters: z.object({}),
    execute: with_browser(async (browser) => {
        const logs = await browser.get_network_log();
        return JSON.stringify(logs, null, 2);
    })
};

export const browser_scroll_to_ref = {
    name: 'browser_scroll_to_ref',
    description: 'Scroll the page until the element referenced in the ARIA snapshot is in view.',
    parameters: z.object({
        ref: z.string().describe('Element reference from snapshot'),
        element: z.string().describe('Description of the element')
    }),
    execute: with_browser(async (browser, { ref, element }) => {
        const locator = await browser.resolve_locator({ ref, element });
        await locator.scrollIntoViewIfNeeded();
        return `Scrolled to element "${element}" (ref: ${ref})`;
    })
};

export const browser_wait_for_ref = {
    name: 'browser_wait_for_ref',
    description: 'Wait until an element identified by ARIA ref becomes visible.',
    parameters: z.object({
        ref: z.string().describe('Element reference'),
        element: z.string().describe('Element description'),
        timeout: z.number().default(30000).describe('Timeout in ms')
    }),
    execute: with_browser(async (browser, { ref, element, timeout }) => {
        const locator = await browser.resolve_locator({ ref, element });
        await locator.waitFor({ state: 'visible', timeout });
        return `Element "${element}" is now visible.`;
    })
};

export const scraping_browser_navigate = {
    name: 'scraping_browser_navigate',
    description: 'Open or reuse a scraping-browser session and navigate to the provided URL, resetting tracked network requests.',
    parameters: z.object({
        url: z.string().url().describe('Target URL')
    }),
    execute: with_browser(async (browser, { url }) => {
        const page = await browser.get_active_page({ url });
        await browser.reset_network_log();
        return [
            `Navigated to ${url}`,
            `Title: ${await page.title()}`
        ].join('\n');
    })
};

export const scraping_browser_go_back = {
    name: 'scraping_browser_go_back',
    description: 'Navigate the active scraping-browser session back to the previous page and report the new URL and title.',
    parameters: z.object({}),
    execute: with_browser(async (browser) => {
        await browser.go_back();
        const page = await browser.get_active_page();
        return `Navigated back. Current URL: ${page.url()}. Title: ${await page.title()}`;
    })
};

export const scraping_browser_go_forward = {
    name: 'scraping_browser_go_forward',
    description: 'Navigate the active scraping-browser session forward to the next page and report the new URL and title.',
    parameters: z.object({}),
    execute: with_browser(async (browser) => {
        await browser.go_forward();
        const page = await browser.get_active_page();
        return `Navigated forward. Current URL: ${page.url()}. Title: ${await page.title()}`;
    })
};

export const scraping_browser_snapshot = {
    name: 'scraping_browser_snapshot',
    description: 'Capture an ARIA snapshot of the current page listing interactive elements and their refs for later ref-based actions.',
    parameters: z.object({
        filtered: z.boolean().default(true).describe('Apply noise filtering')
    }),
    execute: with_browser(async (browser, { filtered }) => {
        const snapshot = await browser.capture_aria_snapshot({ filtered });
        return [
            `Page: ${snapshot.url}`,
            `Title: ${snapshot.title}`,
            '',
            'Interactive Elements:',
            snapshot.aria_snapshot
        ].join('\n');
    })
};

export const scraping_browser_click_ref = {
    name: 'scraping_browser_click_ref',
    description: 'Click an element using its ref from the latest ARIA snapshot; requires a ref and human-readable element description.',
    parameters: z.object({
        ref: z.string().describe('Element reference from snapshot'),
        element: z.string().describe('Description of the element')
    }),
    execute: with_browser(async (browser, { ref, element }) => {
        const locator = await browser.resolve_locator({ ref, element });
        await locator.click({ timeout: 5000 });
        return `Clicked element "${element}" (ref: ${ref})`;
    })
};

export const scraping_browser_type_ref = {
    name: 'scraping_browser_type_ref',
    description: 'Fill an element identified by ref from the ARIA snapshot, optionally pressing Enter to submit after typing.',
    parameters: z.object({
        ref: z.string().describe('Element reference'),
        element: z.string().describe('Element description'),
        text: z.string().describe('Text to enter'),
        submit: z.boolean().default(false).describe('Press Enter after typing')
    }),
    execute: with_browser(async (browser, { ref, element, text, submit }) => {
        const locator = await browser.resolve_locator({ ref, element });
        await locator.fill(text);
        if (submit) await locator.press('Enter');
        return `Typed text into "${element}"${submit ? ' and submitted' : ''}`;
    })
};

export const scraping_browser_screenshot = {
    name: 'scraping_browser_screenshot',
    description: 'Capture a screenshot of the current page; supports optional full_page mode for full-length images.',
    parameters: z.object({
        full_page: z.boolean().default(false)
    }),
    execute: with_browser(async (browser, { full_page }) => {
        const page = await browser.get_active_page();
        const buffer = await page.screenshot({ fullPage: full_page });
        return image_content({ buffer });
    })
};

export const scraping_browser_network_requests = {
    name: 'scraping_browser_network_requests',
    description: 'List the network requests recorded since page load with HTTP method, URL, and response status for debugging.',
    parameters: z.object({}),
    execute: with_browser(async (browser) => {
        const logs = await browser.get_network_log();
        return JSON.stringify(logs, null, 2);
    })
};

export const scraping_browser_wait_for_ref = {
    name: 'scraping_browser_wait_for_ref',
    description: 'Wait until an element identified by ARIA ref becomes visible, with an optional timeout in milliseconds.',
    parameters: z.object({
        ref: z.string().describe('Element reference'),
        element: z.string().describe('Element description'),
        timeout: z.number().default(30000).describe('Timeout in ms')
    }),
    execute: with_browser(async (browser, { ref, element, timeout }) => {
        const locator = await browser.resolve_locator({ ref, element });
        await locator.waitFor({ state: 'visible', timeout });
        return `Element "${element}" is now visible.`;
    })
};

export const scraping_browser_get_text = {
    name: 'scraping_browser_get_text',
    description: 'Return the text content of the current page\'s body element.',
    parameters: z.object({}),
    execute: with_browser(async (browser) => {
        const page = await browser.get_active_page();
        return await page.$eval('body', el => el.innerText);
    })
};

export const scraping_browser_get_html = {
    name: 'scraping_browser_get_html',
    description: 'Return the HTML content of the current page; avoid the full_page option unless head or script tags are required.',
    parameters: z.object({}),
    execute: with_browser(async (browser) => {
        return await browser.get_html();
    })
};

export const scraping_browser_scroll = {
    name: 'scraping_browser_scroll',
    description: 'Scroll to the bottom of the current page in the scraping-browser session.',
    parameters: z.object({
        direction: z.enum(['top', 'bottom']).default('bottom')
    }),
    execute: with_browser(async (browser, { direction }) => {
        const page = await browser.get_active_page();
        await page.evaluate((dir) => {
            const y = dir === 'bottom' ? document.body.scrollHeight : 0;
            window.scrollTo(0, y);
        }, direction);
        return `Scrolled to ${direction}`;
    })
};

export const scraping_browser_scroll_to_ref = {
    name: 'scraping_browser_scroll_to_ref',
    description: 'Scroll the page until the element referenced in the ARIA snapshot is in view.',
    parameters: z.object({
        ref: z.string().describe('Element reference from snapshot'),
        element: z.string().describe('Description of the element')
    }),
    execute: with_browser(async (browser, { ref, element }) => {
        const locator = await browser.resolve_locator({ ref, element });
        await locator.scrollIntoViewIfNeeded();
        return `Scrolled to element "${element}" (ref: ${ref})`;
    })
};

export const tools = [
    browser_navigate,
    browser_snapshot,
    browser_click,
    browser_type,
    browser_wait,
    browser_wait_ms,
    browser_eval,
    browser_screenshot,
    browser_get_text,
    browser_scroll,
    browser_go_back,
    browser_go_forward,
    browser_get_html,
    browser_network_log,
    browser_scroll_to_ref,
    browser_wait_for_ref,
    scraping_browser_navigate,
    scraping_browser_go_back,
    scraping_browser_go_forward,
    scraping_browser_snapshot,
    scraping_browser_click_ref,
    scraping_browser_type_ref,
    scraping_browser_screenshot,
    scraping_browser_network_requests,
    scraping_browser_wait_for_ref,
    scraping_browser_get_text,
    scraping_browser_get_html,
    scraping_browser_scroll,
    scraping_browser_scroll_to_ref
];
