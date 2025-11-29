# Changelog

All notable changes to MCP React Native Toolkit are documented here.

## [1.0.0] - 2025-11-25

### Added

- **MCP Server** with 7 tools for React Native documentation
  - `detect-project-context` - Detects installed versions from package.json
  - `search-docs` - Search documentation topics by library
  - `get-library-docs` - Retrieve docs with smart chunking and pagination
  - `validate-api` - Fast API validation (node_modules + docs index)
  - `find-examples` - Find code examples by topic
  - `get-best-practices` - Performance and architecture recommendations
  - `resolve-library` - Fuzzy library name resolution

- **Smart Context Delivery**
  - Token-efficient chunking with configurable size limits
  - Pagination for large documents
  - Preprocessing to strip comments and minify whitespace

- **Version-Aware Documentation**
  - Semver resolution to match project dependencies
  - Automatic version detection from package.json
  - Fallback to latest when specific version unavailable

- **Node Modules Integration**
  - Parse .d.ts files for instant API validation
  - Extract type signatures from installed packages
  - Hybrid approach: node_modules for types, GitHub for guides

- **Documentation Sources**
  - React Native (facebook/react-native-website)
  - Expo (expo/expo)
  - React Navigation (react-navigation/react-navigation.github.io)
  - Ignite (infinitered/ignite)

- **Developer Experience**
  - `setup.sh` for one-command installation
  - `bin/mcp-rn-init` for project linking
  - Agent instruction templates (Cursor, Copilot, generic)
  - Configurable via `docs-sources.json`

- **Integration Examples**
  - LangChain integration example
  - LlamaIndex integration example
  - Custom documentation source tutorial

### Technical Details

- Built with TypeScript and @modelcontextprotocol/sdk
- Zod schema validation for configuration
- Sparse checkout for efficient documentation fetching
- In-memory indexing for fast symbol lookups
