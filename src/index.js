#!/usr/bin/env node

/**
 * MCP Domino's Pizza Server
 *
 * A Model Context Protocol server for interacting with the Domino's Pizza API
 */

import { createMCPServer } from "./utils/mcpServer.js";
import { registerActions } from "./actions/index.js";
import { createSessionManager } from "./utils/sessionManager.js";

// Initialize the session manager for tracking state
const sessionManager = createSessionManager();

// Initialize the MCP server
const server = createMCPServer({
  name: "Domino's Pizza MCP",
  description: "Order and track Domino's Pizza through natural language",
  version: "1.0.0",
});

// Register all the actions with the server
registerActions(server, sessionManager);

// Start the MCP server
server.start();
