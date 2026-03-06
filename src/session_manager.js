/**
 * OSINT Web MCP: Session Manager
 * Handles session statistics and tool usage tracking.
 */

/**
 * Global session statistics.
 * @type {Object.<string, number>}
 */
const SESSION_STATS = {};

/**
 * Tracks a tool call by incrementing its count in the session stats.
 * @param {string} name - The name of the tool.
 */
export const track_tool_call = (name) => {
    SESSION_STATS[name] = (SESSION_STATS[name] || 0) + 1;
};

/**
 * Returns the current session statistics.
 * @returns {Object.<string, number>}
 */
export const get_session_stats = () => {
    return SESSION_STATS;
};

/**
 * Wraps an MCP tool execution to automatically track its usage and ensure valid response format.
 * @param {import('fastmcp').FastMCP} server - The FastMCP server instance.
 * @param {Object} tool - The tool object to register.
 */
export const register_tracked_tool = (server, tool) => {
    const original_execute = tool.execute;
    tool.execute = async (args, ctx) => {
        track_tool_call(tool.name);
        const result = await original_execute(args, ctx);
        
        // Automatically stringify objects to JSON if they aren't already MCP response objects
        if (typeof result === 'object' && result !== null && !result.content) {
            return JSON.stringify(result, null, 2);
        }
        
        return result;
    };
    server.addTool(tool);
};
