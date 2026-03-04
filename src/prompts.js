/**
 * OSINT Web MCP: Strategic Prompts
 * Guides for AI assistants to choose the best local tool for the task.
 */

export default [
    {
        name: 'osint_strategy',
        description: 'Guidance on choosing the right OSINT tool for a specific investigative task.',
        load: () => `
When performing web research or OSINT investigations, follow this hierarchy for maximum efficiency and stealth:

1. **Broad Discovery**: Use 'osint_search_google' or 'osint_search_duckduckgo' for general queries.
2. **Deep Content**: Once a target URL is identified, use 'osint_scrape' to extract high-quality, AI-optimized Markdown content.
3. **Structured Research**: 
   - For products: Use 'osint_amazon_search' or 'osint_ebay_search'.
   - For professional info: Use 'osint_linkedin_jobs_search' or 'osint_github_search'.
   - For social context: Use 'osint_reddit_search' or 'osint_twitter_search'.
4. **Investigative Depth**:
   - Use 'osint_whois' and 'osint_dns' for infrastructure analysis.
   - Use 'osint_user_lookup' to track an identity across platforms.
5. **Direct Interaction**: Use 'browser_*' tools only when automated scrapers cannot reach the data or when human-like interaction (clicking, typing) is required.

Always prioritize 'osint_scrape' for reading articles or documentation as it uses local readability filters to reduce noise and token usage.
`
    }
];
