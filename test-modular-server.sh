#!/bin/bash
# Test the modular Outlook MCP server using MCP Inspector

echo "Testing modular Outlook MCP server..."

# Use the MCP Inspector to test the server
bunx @modelcontextprotocol/inspector bun "/Users/chiejimofor/Documents/Github/outlook-mcp/index.ts"
