# OSINT Web MCP: Local Evaluation Suite

This folder contains the automated evaluation framework for the **OSINT Web MCP**, optimized for **Local LLMs** (via Ollama) to maintain a 100% free and private workflow.

## Overview

The evaluation framework tests the local **OSINT Web MCP** server by running natural language queries through a local model and checking if the correct local tools are invoked.

## Project Structure

```
mcp-evals/
├── tests/                    # Tool group test definitions
│   └── osint_suite.json      # Local-first OSINT and Scraper tests
├── server-config.json        # Local server connection details
└── README.md                 # This documentation
```

## Prerequisites

1. **mcpjam CLI**:
   ```bash
   npm install -g @mcpjam/cli
   ```

2. **Local LLM (Ollama)**:
   - Install [Ollama](https://ollama.com/).
   - Pull the default testing model:
     ```bash
     ollama pull llama3
     ```

## Running Evaluations

To run the full OSINT suite against the local server using your local Ollama instance:

```bash
mcpjam evals run \
  -t mcp-evals/tests/osint_suite.json \
  -e mcp-evals/server-config.json
```

## Test Coverage

- **Search**: Verifies `osint_search_google` and platform-specific scrapers.
- **Investigative**: Checks `osint_whois`, `osint_user_lookup`, and `osint_dns`.
- **Scraping**: Tests `osint_scrape` with local readability and markdown conversion.
- **Browser**: Exercises interactive tools like `browser_navigate` and `browser_screenshot`.

## Success Criteria

A test passes when:
1. The local model (e.g., `llama3`) correctly identifies and calls the `expectedToolCalls`.
2. The tools return valid data from the local stealth browser or OSINT modules.
3. The process completes entirely on your local machine with zero external API calls.
