#!/usr/bin/env node

/**
 * MCP Domino's Pizza Server Integration Test
 *
 * This script tests the Domino's Pizza MCP server by:
 * 1. Starting the server as a child process
 * 2. Listing all available tools
 * 3. Calling the findNearbyStores tool with a real address
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name from the current file path
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(__dirname, "../src/index.js");

async function runIntegrationTest() {
  console.log("Starting MCP Domino's Pizza Server integration test...");
  console.log(`Server path: ${serverPath}`);

  try {
    // Create an MCP client that connects to the server via stdio
    const transport = new StdioClientTransport({
      command: "node",
      args: [serverPath],
    });

    const client = new Client({
      name: "integration-test",
      version: "1.0.0",
    });

    console.log("Connecting to MCP server...");
    await client.connect(transport);
    console.log("Connected successfully!");

    // List available tools
    console.log("\n--- Available Tools ---");
    const toolResponse = await client.listTools();

    if (toolResponse.tools && toolResponse.tools.length > 0) {
      toolResponse.tools.forEach((tool) => {
        console.log(`- ${tool.name}: ${tool.description || "No description"}`);
      });
    } else {
      console.log("No tools available.");
    }

    // Test the findNearbyStores tool
    console.log("\n--- Testing findNearbyStores tool ---");
    const testAddress = "2 Portola Plaza, Monterey, CA 93940"; // Monterey Bay Aquarium
    console.log(`Finding stores near: ${testAddress}`);

    const storesResponse = await client.callTool({
      name: "findNearbyStores",
      arguments: {
        address: testAddress,
      },
    });

    console.log("\nResponse:");

    // Format the response content as JSON
    if (storesResponse.content && storesResponse.content.length > 0) {
      const textContent = storesResponse.content.find((c) => c.type === "text");
      if (textContent && textContent.text) {
        try {
          // Parse and prettify the JSON for better readability
          const responseData = JSON.parse(textContent.text);
          console.log(JSON.stringify(responseData, null, 2));
        } catch (e) {
          // If parsing fails, just output the raw text
          console.log(textContent.text);
        }
      }
    }

    console.log("\nTest completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Integration test failed:", error);
    process.exit(1);
  }
}

runIntegrationTest();
