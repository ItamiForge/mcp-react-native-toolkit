# MCP React Native Toolkit

A Model Context Protocol (MCP) server that provides AI agents with accurate, version-aware documentation for React Native, Expo, React Navigation, and Ignite.

## Why This Exists

AI coding assistants often hallucinate React Native APIs or suggest outdated patterns. This toolkit solves that by:

- **Version Awareness**: Automatically detects your project's dependency versions and serves matching documentation
- **Token Efficiency**: Smart chunking and pagination prevents context window overflow
- **Fast Validation**: Validates API symbols against your actual `node_modules` before suggesting code
- **Best Practices**: Curated performance tips to prevent common anti-patterns

## Quick Start

### 1. Install

```bash
git clone https://github.com/ItamiForge/mcp-react-native-toolkit.git
cd mcp-react-native-toolkit
npm install && npm run build
```

### 2. Configure Your Editor

#### vscode

Add the MCP server to your editor's configuration:
Edit `~/.vscode/mcp.json` (global) or `.vscode/mcp.json` (per-project):

```json
{
  "servers": {
    "react-native-toolkit": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/mcp-react-native-toolkit/dist/index.js"]
    }
  }
}
```

#### cursor

Edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "react-native-toolkit": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-react-native-toolkit/dist/index.js"]
    }
  }
}
```

#### claude

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "react-native-toolkit": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-react-native-toolkit/dist/index.js"]
    }
  }
}
```

### 3. Use It (Zero Config Per-Project)

Just start asking your AI about React Native! The toolkit:

1. **Reads your project's `package.json`** to detect versions
2. **Fetches matching docs** on first request (cached for future use)
3. **Serves version-accurate documentation** automatically

---

## Multi-Project Workflow

The toolkit handles multiple projects with different versions seamlessly:

```text
~/projects/
├── legacy-app/           # expo@50.0.0
│   └── package.json
└── new-app/              # expo@52.0.0
    └── package.json
```

### What Happens

```text
┌─────────────────────────────────────────────────────────────────┐
│  You open legacy-app/ and ask: "How do I use Camera?"          │
├─────────────────────────────────────────────────────────────────┤
│  1. Toolkit reads package.json → detects expo@50.0.0            │
│  2. Checks docs/expo/50/ → NOT FOUND                            │
│  3. Fetches from git branch `sdk-50` → 745 files in ~3s         │
│  4. Caches at docs/expo/50/                                     │
│  5. Returns Expo 50 documentation                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  You switch to new-app/ and ask: "How do I use Camera?"        │
├─────────────────────────────────────────────────────────────────┤
│  1. Toolkit reads package.json → detects expo@52.0.0            │
│  2. Checks docs/expo/52/ → NOT FOUND                            │
│  3. Fetches from git branch `sdk-52` → 745 files in ~3s         │
│  4. Caches at docs/expo/52/                                     │
│  5. Returns Expo 52 documentation                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  You go back to legacy-app/ and ask another question            │
├─────────────────────────────────────────────────────────────────┤
│  1. Toolkit reads package.json → detects expo@50.0.0            │
│  2. Checks docs/expo/50/ → FOUND ✓                              │
│  3. Returns cached Expo 50 documentation instantly              │
└─────────────────────────────────────────────────────────────────┘
```

### Resulting Cache Structure

```text
mcp-react-native-toolkit/
└── docs/
    ├── expo/
    │   ├── 50/           # Cached for legacy-app
    │   └── 52/           # Cached for new-app
    ├── react-native/
    │   └── latest/       # Shared (no versioned docs available)
    └── react-navigation/
        ├── 6/            # If you have a v6 project
        └── 7/            # If you have a v7 project
```

### Version Detection

| Dependency in package.json | Docs Version Fetched |
|---------------------------|---------------------|
| `"expo": "^52.0.0"` | `docs/expo/52/` from `sdk-52` branch |
| `"expo": "~50.0.14"` | `docs/expo/50/` from `sdk-50` branch |
| `"@react-navigation/native": "^7.1.0"` | `docs/react-navigation/7/` |
| `"react-native": "0.73.0"` | `docs/react-native/latest/` (single version) |

## Commands Reference

| Command | Purpose |
|---------|---------|
| `npm install && npm run build` | Initial setup (one time) |
| `npm run build` | Rebuild after pulling updates |
| `npm run refresh-docs` | Pre-fetch latest docs for offline use |
| `npm run fetch-docs` | Fetch docs only (no optimization) |
| `npm run optimize-docs` | Optimize existing cached docs |
| `npm test` | Run test suite |

## Available Tools

| Tool | Description |
|------|-------------|
| `detect-project-context` | Detects React Native, Expo, and library versions from `package.json` |
| `search-docs` | Searches documentation topics for a library |
| `get-library-docs` | Retrieves specific documentation with pagination |
| `validate-api` | Validates if an API symbol exists (checks `node_modules` first) |
| `find-examples` | Finds code examples for a topic |
| `get-best-practices` | Returns performance and architecture best practices |
| `resolve-library` | Resolves fuzzy library names to exact IDs |

## Supported Libraries

| Library | Source |
|---------|--------|
| React Native | [facebook/react-native-website](https://github.com/facebook/react-native-website) |
| Expo | [expo/expo](https://github.com/expo/expo) |
| React Navigation | [react-navigation/react-navigation.github.io](https://github.com/react-navigation/react-navigation.github.io) |
| Ignite | [infinitered/ignite](https://github.com/infinitered/ignite) |

See [`examples/custom-source.md`](examples/custom-source.md) to add your own documentation sources.

## How It Works

```text
┌─────────────────────────────────────────────────────────────┐
│                     Your React Native App                   │
│                   package.json: expo@52.0.0                 │
└─────────────────────────┬───────────────────────────────────┘
                          │ AI asks about Expo
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  MCP React Native Toolkit                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Context   │  │    Docs     │  │   On-Demand         │ │
│  │  Detector   │  │   Manager   │  │     Fetcher         │ │
│  │             │  │             │  │                     │ │
│  │ Detects     │  │ Chunks and  │  │ Fetches SDK 52 docs │ │
│  │ expo@52.0.0 │  │ serves docs │  │ from git if needed  │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                          │                                  │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 Version-Specific Docs                 │  │
│  │   docs/expo/52/  •  docs/react-native/latest/        │  │
│  │   (fetched once, cached locally)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Version Strategies by Library:**

| Library | Strategy | Example |
|---------|----------|---------|
| Expo | SDK branches | `expo@52.0.0` → `sdk-52` branch |
| React Navigation | Versioned folders | `@react-navigation/native@7.x` → `version-7.x/` |
| React Native | Latest only | Always fetches current docs |
| Ignite | Latest only | Always fetches current docs |

## Project Structure

```text
mcp-react-native-toolkit/
├── src/                    # TypeScript source code
│   ├── index.ts            # MCP server entry point
│   ├── docs-manager.ts     # Documentation retrieval and chunking
│   ├── docs-fetcher.ts     # On-demand version-specific fetching
│   ├── indexer.ts          # Symbol and example indexing
│   ├── chunker.ts          # Token-efficient content splitting
│   ├── context-detector.ts # Project dependency detection
│   ├── node-modules-parser.ts # .d.ts file parsing
│   ├── semver-resolver.ts  # Version matching logic
│   ├── config.ts           # Configuration management
│   └── types.ts            # TypeScript type definitions
├── docs/                   # Cached documentation (auto-generated)
├── scripts/                # Utility scripts
│   ├── fetch-docs.ts       # Bulk documentation fetcher
│   └── optimize-docs.ts    # Token optimization
├── templates/              # Agent instruction templates
├── examples/               # Integration examples
└── bin/                    # CLI utilities
```

## Configuration

Documentation sources are configured in `docs-sources.json`:

```json
{
  "sources": [
    {
      "id": "expo",
      "name": "Expo",
      "repo": "https://github.com/expo/expo.git",
      "docsPath": "docs/pages",
      "branch": "main",
      "versionStrategy": "sdk-branch",
      "versionBranchPattern": "sdk-{major}"
    }
  ]
}
```

## Examples

See the [`examples/`](examples/) directory for integration guides:

- **[LangChain Integration](examples/langchain-example.ts)** - Build a React Native coding agent
- **[LlamaIndex Integration](examples/llamaindex-example.ts)** - RAG with local documentation
- **[Adding Custom Sources](examples/custom-source.md)** - Add Supabase, Reanimated, etc.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT - see [LICENSE](LICENSE)
