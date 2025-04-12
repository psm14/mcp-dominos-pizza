/**
 * MCP Server Implementation
 *
 * Implements the Model Context Protocol over stdio
 */

import * as readline from "readline";

/**
 * Creates an MCP server that communicates over stdio
 *
 * @param {Object} config - Configuration for the MCP server
 * @returns {Object} MCP server instance
 */
export function createMCPServer(config = {}) {
  const actions = new Map();
  const registeredActions = [];

  // Create a readline interface for stdio communication
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  /**
   * Send a message to the client
   *
   * @param {Object} message - Message to send
   */
  function send(message) {
    console.log(JSON.stringify(message));
  }

  /**
   * Register an action with the server
   *
   * @param {Object} action - Action definition
   * @param {Function} handler - Function to handle the action
   */
  function registerAction(action, handler) {
    if (!action.name) {
      throw new Error("Action must have a name");
    }

    if (typeof handler !== "function") {
      throw new Error("Handler must be a function");
    }

    actions.set(action.name, handler);
    registeredActions.push(action);
  }

  /**
   * Start the MCP server
   */
  function start() {
    // Make executable files executable
    process.stdin.setEncoding("utf8");

    // Send server info when starting
    send({
      jsonrpc: "2.0",
      method: "mcp/server_info",
      params: {
        name: config.name || "MCP Server",
        description: config.description || "Model Context Protocol Server",
        version: config.version || "1.0.0",
        actions: registeredActions,
      },
    });

    // Listen for incoming messages
    rl.on("line", async (line) => {
      try {
        // Parse the incoming message
        const message = JSON.parse(line);

        // Check if it's a valid MCP request
        if (message.jsonrpc !== "2.0" || !message.method) {
          throw new Error("Invalid MCP request");
        }

        // Handle different method types
        if (message.method === "mcp/discover") {
          // Send the list of available actions
          send({
            jsonrpc: "2.0",
            id: message.id,
            result: {
              actions: registeredActions,
            },
          });
        } else if (message.method === "mcp/execute") {
          // Execute an action
          const actionName = message.params?.action?.name;
          const handler = actions.get(actionName);

          if (!handler) {
            send({
              jsonrpc: "2.0",
              id: message.id,
              error: {
                code: -32601,
                message: `Action not found: ${actionName}`,
              },
            });
            return;
          }

          try {
            // Execute the action handler
            const result = await handler(
              message.params?.action?.parameters || {}
            );

            send({
              jsonrpc: "2.0",
              id: message.id,
              result,
            });
          } catch (error) {
            send({
              jsonrpc: "2.0",
              id: message.id,
              error: {
                code: -32000,
                message: error.message || "Action execution failed",
              },
            });
          }
        }
      } catch (error) {
        send({
          jsonrpc: "2.0",
          error: {
            code: -32700,
            message: "Parse error",
          },
        });
      }
    });

    // Handle process exit
    process.on("SIGINT", () => {
      rl.close();
      process.exit(0);
    });
  }

  // Return the server interface
  return {
    registerAction,
    start,
  };
}
