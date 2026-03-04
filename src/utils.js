/**
 * OSINT Web MCP: Utilities
 */
import { execSync } from 'node:child_process';

/**
 * Attempt to locate a local Chromium-based browser (Brave, Chrome, or Chromium).
 * @returns {string|null} The path to the browser executable or null if not found.
 */
export const find_browser_path = () => {
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
