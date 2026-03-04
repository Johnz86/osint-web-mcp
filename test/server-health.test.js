'use strict';
import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';

const test_dir = dirname(fileURLToPath(import.meta.url));
const repo_root = resolve(test_dir, '..');

test('OSINT Web MCP serves tools over stdio', async()=>{
    const client = new Client(
        {name: 'server-health-test', version: '0.0.1'},
        {capabilities: {tools: {}}});
    const transport = new StdioClientTransport({
        command: process.execPath,
        args: ['src/server.js'],
        cwd: repo_root,
        env: { ...process.env, HEADLESS: 'true' },
    });
    try {
        await client.connect(transport);
        const tools = await client.listTools();
        
        // Verify core tools are present
        const toolNames = tools.tools.map(t => t.name);
        assert.ok(toolNames.includes('osint_search_google'), 'osint_search_google tool available');
        assert.ok(toolNames.includes('osint_scrape'), 'osint_scrape tool available');
        assert.ok(toolNames.includes('browser_navigate'), 'browser_navigate tool available');
        
    } finally {
        await client.close();
    }
});
