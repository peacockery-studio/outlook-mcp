# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-29

### Changed
- **BREAKING**: Converted entire codebase from JavaScript to TypeScript
- **BREAKING**: Migrated from Node.js to Bun runtime
- Replaced Node.js http.createServer with Bun.serve() for auth server
- Replaced https.request with native fetch() for all API calls
- Replaced fs.readFileSync/writeFileSync with Bun.file() and Bun.write()
- Removed Express dependency (auth server now uses Bun native APIs)
- Removed dotenv dependency (Bun auto-loads .env files)

### Added
- **Email categories**: get-master-categories, set-email-categories tools
- **Email management**: archive-email, delete-email tools
- **Mailbox permissions**: Restrict send/modify operations to specific mailboxes (contracts@, chi@, dustpermits@)
- Shared TypeScript types in types.ts
- Calendar-specific types in calendar/types.ts
- Strict TypeScript configuration with full type safety

### Removed
- All JavaScript files (replaced with TypeScript)
- Express-based OAuth server module (auth/oauth-server.ts)
- Jest and supertest dependencies (use bun test)
- Node.js-specific APIs throughout codebase

### Technical
- Uses Bun.serve() with routes pattern for HTTP server
- Uses native fetch() for Microsoft Graph API calls
- Uses Bun.file() for token storage and file operations
- Full ESM module system with proper imports/exports

## [1.0.0] - 2024-12-05

### Added
- Initial public release
- MCP server for Claude to access Outlook via Microsoft Graph API
- OAuth 2.0 authentication with automatic token refresh
- **Email tools**: list, read, search, send, mark as read
- **Calendar tools**: list, create, accept, decline, cancel, delete events
- **Folder tools**: list, create, move mail folders
- **Rules tools**: list, create inbox rules
- Test mode with mock data for development
- Biome linting configuration
- 85 passing tests
- MIT License

### Technical
- Uses `@modelcontextprotocol/sdk` v1.24.3
- Modular architecture with separate files per operation
- Token storage in `~/.outlook-mcp-tokens.json`
- Configurable via environment variables

[2.0.0]: https://github.com/peacockery-studio/outlook-mcp/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/peacockery-studio/outlook-mcp/releases/tag/v1.0.0
