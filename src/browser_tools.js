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
    browser_scroll
];
