# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `bun install` - **ALWAYS run first** to install dependencies
- `bun run start` - Start the MCP server
- `bun run auth-server` - Start the OAuth authentication server on port 3333 (**required for authentication**)
- `bun run test-mode` - Start the server in test mode with mock data
- `bun run inspect` - Use MCP Inspector to test the server interactively
- `bun run typecheck` - Run TypeScript type checking
- `bun test` - Run Jest tests
- `./test-modular-server.sh` - Test the server using MCP Inspector
- `./test-direct.sh` - Direct testing script
- `bunx kill-port 3333` - Kill process using port 3333 if auth server won't start

## Architecture Overview

This is a modular MCP (Model Context Protocol) server that provides Claude with access to Microsoft Outlook via the Microsoft Graph API. The architecture is organized into functional modules:

### Core Structure
- `index.ts` - Main entry point that combines all module tools and handles MCP protocol
- `config.ts` - Centralized configuration including API endpoints, field selections, and authentication settings
- `outlook-auth-server.ts` - Standalone OAuth server for authentication flow
- `types.ts` - Shared TypeScript type definitions

### Modules
Each module exports tools and handlers:
- `auth/` - OAuth 2.0 authentication with token management
- `calendar/` - Calendar operations (list, create, accept, decline, delete events)
- `email/` - Email management (list, search, read, send, mark as read)
- `folder/` - Folder operations (list, create, move)
- `rules/` - Email rules management
- `utils/` - Shared utilities including Graph API client and OData helpers

### Key Components
- **Token Management**: Tokens stored in `~/.outlook-mcp-tokens.json`
- **Graph API Client**: `utils/graph-api.ts` handles all Microsoft Graph API calls with proper OData encoding
- **Test Mode**: Mock data responses when `USE_TEST_MODE=true`
- **Modular Tools**: Each module exports tools array that gets combined in main server

## Type Safety

The codebase is fully written in TypeScript for improved type safety and developer experience.

- Run `bun run typecheck` to check types across the entire codebase
- Shared types are defined in `types.ts` at the project root
- All modules use strict TypeScript with explicit type annotations

## Available Tools

### Auth
- `authenticate` - Initiate OAuth authentication flow
- `get-auth-status` - Check current authentication status

### Email
- `list-emails` - List emails from inbox or specified folder
- `search-emails` - Search emails with various filters
- `read-email` - Read a specific email by ID
- `send-email` - Send a new email
- `mark-as-read` - Mark an email as read/unread
- `get-master-categories` - Get available email categories
- `set-email-categories` - Set categories on an email
- `archive-email` - Archive an email
- `delete-email` - Delete an email

### Folder
- `list-folders` - List all mail folders
- `create-folder` - Create a new mail folder
- `move-emails` - Move emails to a different folder

### Rules
- `list-rules` - List all inbox rules
- `create-rule` - Create a new inbox rule
- `edit-rule-sequence` - Edit the sequence/priority of rules

### Calendar
- `list-events` - List calendar events
- `create-event` - Create a new calendar event
- `decline-event` - Decline a calendar event invitation
- `cancel-event` - Cancel a calendar event (organizer only)
- `delete-event` - Delete a calendar event

## Mailbox Permissions

Some operations are restricted by mailbox to prevent accidental modifications:

### Full Access (Send, Modify, Delete, Archive)
- contracts@
- chi@
- dustpermits@

### Read-Only Access
All other mailboxes have read-only access. Attempting to send, delete, or archive from these mailboxes will be blocked.

## Authentication Flow

1. Azure app registration required with specific permissions (Mail.Read, Mail.Send, Calendars.ReadWrite, etc.)
2. Start auth server: `bun run auth-server`
3. Use authenticate tool to get OAuth URL
4. Complete browser authentication
5. Tokens automatically stored and refreshed

## Configuration Requirements

### Environment Variables
- **For .env file**: Use `MS_CLIENT_ID` and `MS_CLIENT_SECRET`
- **For Claude Desktop config**: Use `OUTLOOK_CLIENT_ID` and `OUTLOOK_CLIENT_SECRET`
- **Important**: Always use the client secret VALUE from Azure, not the Secret ID
- Copy `.env.example` to `.env` and populate with real Azure credentials
- Default timezone is "Central European Standard Time"
- Default page size is 25, max results 50
- **Note**: Bun auto-loads `.env` files, so no dotenv package is needed

### Common Setup Issues
1. **Missing dependencies**: Always run `bun install` first
2. **Wrong secret**: Use Azure secret VALUE, not ID (AADSTS7000215 error)
3. **Auth server not running**: Start `bun run auth-server` before authenticating
4. **Port conflicts**: Use `bunx kill-port 3333` if port is in use

## Test Mode

Set `USE_TEST_MODE=true` to use mock data instead of real API calls. Mock responses are defined in `utils/mock-data.ts`.

## OData Query Handling

The Graph API client properly handles OData filters with URI encoding. Filters are processed separately from other query parameters to ensure correct escaping of special characters.

## Error Handling

- Authentication failures return "UNAUTHORIZED" error
- Graph API errors include status codes and response details
- Token expiration triggers re-authentication flow
- Empty API responses are handled gracefully (returns '{}' if empty)
