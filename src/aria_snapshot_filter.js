/**
 * OSINT Web MCP: ARIA Snapshot Filter
 * Processes and filters accessibility snapshots for AI consumption.
 */

export class Aria_snapshot_filter {
    /**
     * Set of roles considered interactive.
     * @type {Set<string>}
     */
    static INTERACTIVE_ROLES = new Set([
        'button', 'link', 'textbox', 'searchbox', 'combobox', 'checkbox',
        'radio', 'switch', 'slider', 'tab', 'menuitem', 'option',
    ]);

    /**
     * Parses a raw Playwright accessibility snapshot string into element objects.
     * @param {string} snapshot_text - The raw snapshot text.
     * @returns {Array<Object>} List of parsed elements.
     */
    static parse_playwright_snapshot(snapshot_text) {
        const lines = snapshot_text.split('\n');
        const elements = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('-')) continue;
            
            const ref_match = trimmed.match(/\[ref=([^\]]+)\]/);
            if (!ref_match) continue;
            
            const ref = ref_match[1];
            const role_match = trimmed.match(/^-\s+([a-zA-Z]+)/);
            if (!role_match) continue;
            
            const role = role_match[1];
            if (!this.INTERACTIVE_ROLES.has(role)) continue;
            
            const name_match = trimmed.match(/"([^"]*)"/);
            const name = name_match ? name_match[1] : '';

            let url = null;
            const next_line_index = lines.indexOf(line) + 1;
            if (next_line_index < lines.length) {
                const next_line = lines[next_line_index];
                const url_match = next_line.match(/\/url:\s*(.+)/);
                if (url_match) {
                    url = url_match[1].trim().replace(/^["']|["']$/g, '');
                }
            }
            elements.push({ ref, role, name, url });
        }
        return elements;
    }

    /**
     * Formats a list of elements into a compact string representation.
     * @param {Array<Object>} elements - List of elements to format.
     * @returns {string} Compact formatted string.
     */
    static format_compact(elements) {
        return elements.map(el => {
            const parts = [`[${el.ref}]`, el.role];
            
            if (el.name && el.name.length > 0) {
                const name = el.name.length > 60 
                    ? el.name.substring(0, 57) + '...' 
                    : el.name;
                parts.push(`"${name}"`);
            }
            
            if (el.url && el.url.length > 0 && !el.url.startsWith('#')) {
                let url = el.url;
                if (url.length > 50) {
                    url = url.substring(0, 47) + '...';
                }
                parts.push(`-> ${url}`);
            }
            return parts.join(' ');
        }).join('\n');
    }

    /**
     * Filters a raw snapshot to include only interactive elements in a compact format.
     * @param {string} snapshot_text - The raw snapshot text.
     * @returns {string} Filtered and formatted snapshot.
     */
    static filter_snapshot(snapshot_text) {
        try {
            const elements = this.parse_playwright_snapshot(snapshot_text);
            if (elements.length === 0) {
                return 'No interactive elements found';
            }
            return this.format_compact(elements);
        } catch (e) {
            return `Error filtering snapshot: ${e.message}`;
        }
    }
}
