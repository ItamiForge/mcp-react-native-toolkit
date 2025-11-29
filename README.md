# MCP React Native Toolkit

A Model Context Protocol (MCP) server that provides AI agents with accurate, version-aware documentation for React Native, Expo, React Navigation, and Ignite.

## Why This Exists

AI coding assistants often hallucinate React Native APIs or suggest outdated patterns. This toolkit solves that by:

- **Version Awareness**: Automatically detects your project's dependency versions and serves matching documentation
- **🔍 Semantic Search**: AI-powered documentation search using embeddings to find conceptually similar content beyond keyword matching
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
| `npm run generate-templates` | Generate AI framework configuration files |
| `npm test` | Run test suite |

## Available Tools

| Tool | Description |
|------|-------------|
| `detect-project-context` | Detects React Native, Expo, and library versions from `package.json` |
| `search-docs` | Lists available documentation topics for a library |
| `get-library-docs` | Retrieves specific documentation with pagination |
| `semantic-search-docs` | AI-powered semantic search using embeddings to find relevant documentation |
| `validate-api` | Validates if an API symbol exists (checks `node_modules` first) |
| `find-examples` | Finds code examples for a topic |
| `get-best-practices` | Returns performance and architecture best practices |
| `resolve-library` | Resolves fuzzy library names to exact IDs |
| `generate-component-scaffold` | Generates boilerplate code for common React Native patterns |
| `compare-api-versions` | Compares API differences between library versions |
| `suggest-migration-path` | Provides step-by-step migration guidance between versions |
| `generate-ai-template` | Generates configuration files for AI coding assistants |

### semantic-search-docs

Performs semantic search across documentation using AI embeddings to find conceptually similar content, even when exact keywords don't match.

**Parameters:**
- `query` (required): Natural language search query
- `library` (optional): Filter to specific library
- `version` (optional): Version string or 'auto'
- `topK` (optional): Number of results (1-50, default 10)
- `searchMode` (optional): 'semantic' or 'hybrid' (default)

**Example:**
```
"How do I optimize list performance in React Native?"
```
This query will find FlatList optimization documentation even without using the exact term "FlatList".

### generate-component-scaffold

Generates boilerplate code for common React Native patterns like optimized FlatLists, navigation screens, forms, and more.

**Parameters:**
- `scaffoldId` (optional): ID of the scaffold template (e.g., 'flatlist-basic', 'stack-navigator')
- `language` (optional): 'typescript' or 'javascript' (default: 'typescript')
- `listScaffolds` (optional): Set to true to see all available scaffolds
- `category` (optional): Filter by category ('list', 'navigation', 'form', 'api', 'storage', 'animation')

**Available Scaffolds:**
- `flatlist-basic` - Basic FlatList with proper typing
- `flatlist-optimized` - Performance-optimized FlatList with memoization
- `flatlist-infinite-scroll` - FlatList with pagination and infinite scroll
- `stack-navigator` - React Navigation stack navigator setup
- `tab-navigator` - React Navigation tab navigator setup
- `form-basic` - Form with controlled inputs and validation
- `api-fetch` - API data fetching with loading/error states
- `mmkv-storage` - MMKV persistent storage hooks
- `reanimated-gesture` - Reanimated + Gesture Handler animation

### compare-api-versions

Compares API differences between two versions of a library, showing added, removed, and modified APIs.

**Parameters:**
- `library` (required): Library to compare
- `fromVersion` (required): Starting version
- `toVersion` (required): Target version
- `detailLevel` (optional): 'summary' or 'detailed'

### suggest-migration-path

Provides step-by-step migration guidance for upgrading between library versions.

**Parameters:**
- `library` (required): Library to migrate
- `fromVersion` (optional): Starting version (or 'auto' to detect)
- `toVersion` (required): Target version
- `format` (optional): 'detailed', 'checklist', or 'summary'
- `includeCodeExamples` (optional): Include before/after code examples

### generate-ai-template

Generates configuration files for 50+ AI coding assistants and agentic frameworks.

**Parameters:**
- `framework` (optional): Target framework ID
- `listFrameworks` (optional): Set to true to see all supported frameworks
- `generateAll` (optional): Generate templates for all frameworks
- `includeExamples` (optional): Include code examples in templates

**Supported Frameworks (53 total):**

<details>
<summary><b>IDE Extensions (9)</b></summary>

| ID | Name | Output File |
|----|------|-------------|
| `cursor` | Cursor | `.cursorrules` |
| `vscode-copilot` | GitHub Copilot (VS Code) | `.github/copilot-instructions.md` |
| `windsurf` | Windsurf | `.windsurfrules` |
| `kiro` | Kiro | `.kiro/rules.md` |
| `zed` | Zed | `.zed/settings.json` |
| `jetbrains` | JetBrains AI | `.idea/ai-assistant.xml` |
| `trae` | Trae | `.trae/rules.md` |
| `vs2022` | Visual Studio 2022 Copilot | `.vs/copilot-instructions.md` |
| `lm-studio` | LM Studio | `.lmstudio/config.json` |

</details>

<details>
<summary><b>Agentic Assistants (10)</b></summary>

| ID | Name | Output File |
|----|------|-------------|
| `cline` | Cline | `.clinerules` |
| `roo-code` | Roo Code | `.roo/rules.md` |
| `augment` | Augment | `.augment/settings.json` |
| `continue` | Continue | `.continuerc.json` |
| `cody` | Sourcegraph Cody | `.sourcegraph/cody.json` |
| `supermaven` | Supermaven | `.supermaven/config.json` |
| `tabnine` | Tabnine | `.tabnine.json` |
| `amazon-q` | Amazon Q | `.aws/amazonq.md` |
| `qodo-gen` | Qodo Gen | `.qodo/settings.json` |
| `zencoder` | ZenCoder | `.zencoder/config.json` |

</details>

<details>
<summary><b>CLI Tools (14)</b></summary>

| ID | Name | Output File |
|----|------|-------------|
| `claude-code` | Claude Code | `CLAUDE.md` |
| `aider` | Aider | `.aider.conf.yml` |
| `codex-cli` | Codex CLI | `.codex/instructions.md` |
| `gemini-cli` | Gemini CLI | `.gemini/settings.json` |
| `copilot-cli` | GitHub Copilot CLI | `.copilot/config.json` |
| `amp` | Amp | `.amp/config.md` |
| `warp` | Warp AI | `.warp/config.yaml` |
| `goose` | Goose | `.goose/config.yaml` |
| `mentat` | Mentat | `.mentat/config.yaml` |
| `plandex` | Plandex | `.plandex/config.json` |
| `opencode` | OpenCode | `.opencode/config.json` |
| `rovo-dev` | Rovo Dev | `.rovo/config.json` |
| `factory` | Factory | `.factory/config.json` |
| `qwen-coder` | Qwen Coder | `.qwen/config.json` |

</details>

<details>
<summary><b>Autonomous Agents (5)</b></summary>

| ID | Name | Output File |
|----|------|-------------|
| `devin` | Devin | `.devin/settings.json` |
| `openhands` | OpenHands | `.openhands/config.json` |
| `swe-agent` | SWE-Agent | `.swe-agent/config.yaml` |
| `sweep` | Sweep | `sweep.yaml` |
| `gpt-engineer` | GPT Engineer | `.gpt-engineer/config.json` |

</details>

<details>
<summary><b>Web Platforms (13)</b></summary>

| ID | Name | Output File |
|----|------|-------------|
| `claude` | Claude Projects | `CLAUDE.md` |
| `claude-desktop` | Claude Desktop | `CLAUDE.md` |
| `chatgpt` | ChatGPT Projects | `chatgpt-instructions.md` |
| `gemini` | Gemini | `gemini-instructions.md` |
| `perplexity` | Perplexity | `.perplexity/instructions.md` |
| `replit` | Replit AI | `.replit-ai` |
| `v0` | Vercel v0 | `v0-instructions.md` |
| `bolt` | Bolt.new | `.bolt/config.md` |
| `lovable` | Lovable | `lovable-instructions.md` |
| `pythagora` | Pythagora | `.pythagora/config.json` |
| `boltai` | BoltAI | `.boltai/config.json` |
| `crush` | Crush | `.crush/config.json` |
| `emdash` | Emdash | `.emdash/config.json` |

</details>

<details>
<summary><b>Other (2)</b></summary>

| ID | Name | Output File |
|----|------|-------------|
| `copilot-agent` | GitHub Copilot Agent | `.github/copilot-instructions.md` |
| `generic` | Generic | `ai-instructions.md` |

</details>

**CLI Usage:**
```bash
# List all supported frameworks
npm run generate-templates -- --list

# Generate Cursor rules
npm run generate-templates -- cursor

# Generate to a specific directory
npm run generate-templates -- vscode-copilot --output-dir ./my-project

# Generate all templates
npm run generate-templates -- --all --output-dir ./ai-configs
```

## Supported Libraries

| Library | Source | Enabled by Default |
|---------|--------|-------------------|
| React Native | [facebook/react-native-website](https://github.com/facebook/react-native-website) | ✅ Yes |
| Expo | [expo/expo](https://github.com/expo/expo) | ✅ Yes |
| React Navigation | [react-navigation/react-navigation.github.io](https://github.com/react-navigation/react-navigation.github.io) | ❌ No |
| Ignite | [infinitered/ignite](https://github.com/infinitered/ignite) | ❌ No |
| React Native Reanimated | [software-mansion/react-native-reanimated](https://github.com/software-mansion/react-native-reanimated) | ❌ No |
| React Native Gesture Handler | [software-mansion/react-native-gesture-handler](https://github.com/software-mansion/react-native-gesture-handler) | ❌ No |
| React Native MMKV | [mrousavy/react-native-mmkv](https://github.com/mrousavy/react-native-mmkv) | ❌ No |
| React Native Skia | [Shopify/react-native-skia](https://github.com/Shopify/react-native-skia) | ❌ No |

To enable additional libraries, set `"enabled": true` in `docs-sources.json`.

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
  ],
  "settings": {
    "semanticSearchEnabled": true,
    "embeddingModel": "Xenova/all-MiniLM-L6-v2",
    "vectorIndexPath": "./docs/.vector-index",
    "embeddingBatchSize": 32
  }
}
```

### Semantic Search Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `semanticSearchEnabled` | `true` | Enable/disable semantic search with embeddings |
| `embeddingModel` | `Xenova/all-MiniLM-L6-v2` | Hugging Face model for generating embeddings |
| `vectorIndexPath` | `./docs/.vector-index` | Path to store the vector index |
| `embeddingBatchSize` | `32` | Batch size for embedding generation |

## Semantic Search

The toolkit includes AI-powered semantic search that finds relevant documentation based on meaning, not just keywords.

### How It Works

1. **Embedding Generation**: When documentation is indexed, each chunk is converted to a 384-dimensional vector using the all-MiniLM-L6-v2 model
2. **Vector Storage**: Embeddings are stored locally using Vectra for efficient similarity search
3. **Query Processing**: Your search query is converted to the same vector space
4. **Similarity Matching**: The most similar documentation chunks are returned

### Search Modes

- **Semantic**: Uses only embedding similarity (best for conceptual queries)
- **Hybrid** (default): Combines keyword matching (40%) with semantic similarity (60%)

### When to Use Semantic Search

- Finding documentation without knowing exact API names
- Searching for concepts ("how to handle gestures" → gesture handler docs)
- Discovering related functionality across libraries

### Performance Notes

- First-time model loading takes ~10-30 seconds (model is cached locally)
- Vector index is generated on first run and cached in `docs/.vector-index/`
- Subsequent searches are fast (<100ms)

## Examples

See the [`examples/`](examples/) directory for integration guides:

- **[LangChain Integration](examples/langchain-example.ts)** - Build a React Native coding agent
- **[LlamaIndex Integration](examples/llamaindex-example.ts)** - RAG with local documentation
- **[Adding Custom Sources](examples/custom-source.md)** - Add Supabase, Reanimated, etc.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT - see [LICENSE](LICENSE)
