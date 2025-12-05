# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/peacockery-studio/outlook-mcp/releases/tag/v1.0.0
