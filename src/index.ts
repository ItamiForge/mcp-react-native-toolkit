import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
    ListToolsRequestSchema,
    CallToolRequestSchema,
    ErrorCode,
    McpError
} from "@modelcontextprotocol/sdk/types.js";
import path from 'path';
import { DocsManager } from "./docs-manager.js";
import { getBestPractices } from "./best-practices.js";
import { ContextDetector } from "./context-detector.js";
import { nodeModulesParser } from "./node-modules-parser.js";
import * as scaffolds from "./scaffolds.js";
import * as migrations from "./migrations.js";
import * as templates from "./template-registry.js";
import type { ScaffoldGenerationOptions } from "./types.js";

const server = new Server(
    {
        name: "mcp-react-native-toolkit",
        version: "2.0.0",
    },
    {
        capabilities: {
            resources: {},
            tools: {},
        },
    }
);

const docsManager = new DocsManager();
const contextDetector = new ContextDetector();

// List Resources (async methods needed)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const rnDocs = await docsManager.listDocs("react-native", "latest");
    const expoDocs = await docsManager.listDocs("expo", "latest");

    const rnResources = rnDocs.map(topic => ({
        uri: `docs://react-native/latest/${topic}`,
        name: `React Native: ${topic}`,
        mimeType: "text/markdown"
    }));

    const expoResources = expoDocs.map(topic => ({
        uri: `docs://expo/latest/${topic}`,
        name: `Expo: ${topic}`,
        mimeType: "text/markdown"
    }));

    return {
        resources: [...rnResources, ...expoResources]
    };
});

// Read Resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const match = uri.match(/^docs:\/\/([^\/]+)\/([^\/]+)\/([^\/]+)$/);
    if (!match) {
        throw new McpError(ErrorCode.InvalidRequest, `Invalid URI format: ${uri}`);
    }
    const [, library, version, topic] = match;

    const doc = await docsManager.getDoc(library, version, topic);
    if (!doc) {
        throw new McpError(ErrorCode.InvalidRequest, `Documentation not found: ${uri}`);
    }

    return {
        contents: [
            {
                uri: uri,
                mimeType: "text/markdown",
                text: doc.content
            }
        ]
    };
});

// List Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "detect-project-context",
                description: "Detects the React Native, Expo, React Navigation, and Ignite versions in the current project.",
                inputSchema: {
                    type: "object",
                    properties: {
                        cwd: { type: "string", description: "The current working directory to check." }
                    }
                }
            },
            {
                name: "search-docs",
                description: "Lists available documentation topics for a library. Use semantic-search-docs for AI-powered content search.",
                inputSchema: {
                    type: "object",
                    properties: {
                        library: { type: "string", enum: ["react-native", "expo", "react-navigation", "ignite", "react-native-reanimated", "react-native-gesture-handler", "react-native-mmkv", "react-native-skia"] },
                        version: { type: "string", default: "auto", description: "Version string or 'auto' to detect from project." },
                        cwd: { type: "string", description: "Current working directory for auto-detection." }
                    },
                    required: ["library"]
                }
            },
            {
                name: "get-library-docs",
                description: "Get specific documentation with smart chunking and pagination for token efficiency",
                inputSchema: {
                    type: "object",
                    properties: {
                        library: { type: "string", enum: ["react-native", "expo", "react-navigation", "ignite", "react-native-reanimated", "react-native-gesture-handler", "react-native-mmkv", "react-native-skia"] },
                        topic: { type: "string", description: "The documentation topic (e.g., 'FlatList', 'navigation-basics')" },
                        version: { type: "string", default: "auto", description: "Version string or 'auto' to detect from project." },
                        page: { type: "number", default: 1, description: "Page number for paginated content (1-indexed)" },
                        cwd: { type: "string", description: "Current working directory for auto-detection." }
                    },
                    required: ["library", "topic"]
                }
            },
            {
                name: "get-best-practices",
                description: "Get performance and architecture best practices for a library",
                inputSchema: {
                    type: "object",
                    properties: {
                        library: { type: "string", enum: ["react-native", "expo"] }
                    },
                    required: ["library"]
                }
            },
            {
                name: "validate-api",
                description: "Fast validation if a symbol exists, checking node_modules first then docs index",
                inputSchema: {
                    type: "object",
                    properties: {
                        library: { type: "string", enum: ["react-native", "expo", "react-navigation", "ignite", "react-native-reanimated", "react-native-gesture-handler", "react-native-mmkv", "react-native-skia"] },
                        symbol: { type: "string", description: "The API symbol to check (e.g., 'View', 'FlatList', 'useNavigation')" },
                        cwd: { type: "string", description: "Current working directory" }
                    },
                    required: ["library", "symbol"]
                }
            },
            {
                name: "find-examples",
                description: "Finds code examples for a specific topic using the index",
                inputSchema: {
                    type: "object",
                    properties: {
                        library: { type: "string", enum: ["react-native", "expo", "react-navigation", "ignite", "react-native-reanimated", "react-native-gesture-handler", "react-native-mmkv", "react-native-skia"] },
                        topic: { type: "string", description: "The topic to find examples for (e.g., 'FlatList', 'navigation')" },
                        version: { type: "string", default: "auto" },
                        cwd: { type: "string" }
                    },
                    required: ["library", "topic"]
                }
            },
            {
                name: "resolve-library",
                description: "Resolves a fuzzy library name to exact library ID and available versions",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "Library name query (e.g., 'navigation', 'rn', 'expo')" }
                    },
                    required: ["query"]
                }
            },
            {
                name: "semantic-search-docs",
                description: "Performs semantic search across documentation using AI embeddings to find conceptually similar content, even when exact keywords don't match. Returns the most relevant documentation chunks with similarity scores.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "Natural language search query describing what you're looking for" },
                        library: { type: "string", enum: ["react-native", "expo", "react-navigation", "ignite", "react-native-reanimated", "react-native-gesture-handler", "react-native-mmkv", "react-native-skia"], description: "Optional: Filter results to a specific library" },
                        version: { type: "string", default: "auto", description: "Version string or 'auto' to detect from project" },
                        topK: { type: "number", default: 10, description: "Number of results to return (1-50)" },
                        cwd: { type: "string", description: "Current working directory for auto-detection" },
                        searchMode: { type: "string", enum: ["semantic", "hybrid"], default: "hybrid", description: "Search mode: semantic (embeddings only) or hybrid (combines keyword + semantic)" }
                    },
                    required: ["query"]
                }
            },
            {
                name: "generate-component-scaffold",
                description: "Generates boilerplate code for common React Native patterns like FlatList, navigation screens, forms, API calls, and more. Returns production-ready, type-safe code following best practices.",
                inputSchema: {
                    type: "object",
                    properties: {
                        scaffoldId: { type: "string", description: "ID of the scaffold template (e.g., 'flatlist-basic', 'stack-navigator', 'form-basic')" },
                        language: { type: "string", enum: ["typescript", "javascript"], default: "typescript", description: "Target language" },
                        library: { type: "string", enum: ["react-native", "expo", "react-navigation", "ignite", "react-native-reanimated", "react-native-gesture-handler", "react-native-mmkv", "react-native-skia"], description: "Filter scaffolds by library" },
                        category: { type: "string", enum: ["list", "navigation", "form", "api", "storage", "animation", "image", "other"], description: "Filter scaffolds by category" },
                        listScaffolds: { type: "boolean", default: false, description: "If true, returns list of available scaffolds instead of generating code" },
                        includeComments: { type: "boolean", default: true, description: "Include explanatory comments in generated code" },
                        styleApproach: { type: "string", enum: ["stylesheet", "inline"], default: "stylesheet", description: "Styling approach" },
                        customizations: { type: "object", description: "Key-value pairs for template variable substitution (e.g., {componentName: 'UserList', itemType: 'User'})" }
                    },
                    required: []
                }
            },
            {
                name: "compare-api-versions",
                description: "Compares API differences between two versions of a library, showing added, removed, and modified APIs. Useful for understanding breaking changes and new features when upgrading.",
                inputSchema: {
                    type: "object",
                    properties: {
                        library: { type: "string", enum: ["react-native", "expo", "react-navigation", "ignite", "react-native-reanimated", "react-native-gesture-handler", "react-native-mmkv", "react-native-skia"], description: "Library to compare" },
                        fromVersion: { type: "string", description: "Starting version (e.g., '0.71', 'SDK 49')" },
                        toVersion: { type: "string", description: "Target version (e.g., '0.72', 'SDK 50')" },
                        cwd: { type: "string", description: "Current working directory for version detection" },
                        showUnchanged: { type: "boolean", default: false, description: "Include count of unchanged APIs" },
                        detailLevel: { type: "string", enum: ["summary", "detailed"], default: "summary", description: "Level of detail in output" }
                    },
                    required: ["library", "fromVersion", "toVersion"]
                }
            },
            {
                name: "suggest-migration-path",
                description: "Provides step-by-step migration guidance for upgrading between library versions, including breaking changes, deprecated APIs, code examples, and estimated effort. Combines curated migration guides with documentation search.",
                inputSchema: {
                    type: "object",
                    properties: {
                        library: { type: "string", enum: ["react-native", "expo", "react-navigation", "ignite", "react-native-reanimated", "react-native-gesture-handler", "react-native-mmkv", "react-native-skia"], description: "Library to migrate" },
                        fromVersion: { type: "string", default: "auto", description: "Starting version (or 'auto' to detect from project)" },
                        toVersion: { type: "string", description: "Target version" },
                        cwd: { type: "string", description: "Current working directory for auto-detection" },
                        format: { type: "string", enum: ["detailed", "checklist", "summary"], default: "detailed", description: "Output format" },
                        includeCodeExamples: { type: "boolean", default: true, description: "Include before/after code examples" }
                    },
                    required: ["library", "toVersion"]
                }
            },
            {
                name: "generate-ai-template",
                description: "Generates configuration files for AI coding assistants and agentic frameworks (Cursor, Windsurf, Kiro, Claude Code, Cline, Aider, Devin, etc.). These templates provide React Native best practices, API validation rules, and project context to help AI assistants write better code.",
                inputSchema: {
                    type: "object",
                    properties: {
                        framework: { 
                            type: "string", 
                            description: "Target AI framework/assistant ID. Use listFrameworks=true to see all options." 
                        },
                        listFrameworks: { type: "boolean", default: false, description: "If true, returns list of all 35+ supported frameworks and their output files" },
                        generateAll: { type: "boolean", default: false, description: "If true, generates templates for all supported frameworks" },
                        outputDir: { type: "string", description: "Directory to write generated files (optional, returns content if not provided)" },
                        includeExamples: { type: "boolean", default: true, description: "Include code examples in generated templates" }
                    },
                    required: []
                }
            }
        ]
    };
});

// Call Tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "detect-project-context") {
        const cwd = (args?.cwd as string) || process.cwd();
        const context = contextDetector.detectContext(cwd);
        if (!context) {
            return {
                content: [{ type: "text", text: "No package.json found in the current context." }]
            };
        }
        const formatted = `📦 Project Context:\n\n` +
            `React Native: ${context.versions.reactNative || 'not installed'}\n` +
            `Expo: ${context.versions.expo || 'not installed'}\n` +
            `React Navigation: ${context.versions.reactNavigation || 'not installed'}\n` +
            `Ignite: ${context.versions.ignite || 'not installed'}\n` +
            `Reanimated: ${context.versions.reanimated || 'not installed'}\n` +
            `Gesture Handler: ${context.versions.gestureHandler || 'not installed'}\n` +
            `MMKV: ${context.versions.mmkv || 'not installed'}\n` +
            `Skia: ${context.versions.skia || 'not installed'}\n\n` +
            `Full context:\n${JSON.stringify(context, null, 2)}`;

        return {
            content: [{ type: "text", text: formatted }]
        };
    }

    if (name === "search-docs") {
        const library = args?.library as string;
        const version = (args?.version as string) || "auto";
        const cwd = (args?.cwd as string) || process.cwd();

        if (!library) throw new McpError(ErrorCode.InvalidParams, "Missing library parameter");

        const topics = await docsManager.listDocs(library, version, cwd);
        const resolvedVersion = await docsManager.resolveVersion(library, version, cwd);

        const formatted = `📚 Available topics for ${library} (${resolvedVersion}):\n\n` +
            topics.map(t => `• ${t}`).join("\n") +
            `\n\n Total: ${topics.length} topics`;

        return {
            content: [{ type: "text", text: formatted }]
        };
    }

    if (name === "get-library-docs") {
        const library = args?.library as string;
        const topic = args?.topic as string;
        const version = (args?.version as string) || "auto";
        const page = (args?.page as number) || 1;
        const cwd = (args?.cwd as string) || process.cwd();

        if (!library || !topic) {
            throw new McpError(ErrorCode.InvalidParams, "Missing library or topic");
        }

        const chunk = await docsManager.getDocChunked(library, version, topic, page, cwd);

        if (!chunk) {
            return {
                content: [{ type: "text", text: `❌ Documentation not found for: ${library} → ${topic}` }]
            };
        }

        const pagination = chunk.totalChunks > 1
            ? `\n\n📄 Page ${chunk.chunkIndex + 1} of ${chunk.totalChunks}` +
            (chunk.metadata.hasNextChunk ? `\n💡 Use page=${chunk.chunkIndex + 2} for next chunk` : '')
            : '';

        const formatted = `# ${library} / ${topic}\n\n` +
            `Version: ${chunk.version}\n` +
            `Tokens: ~${chunk.metadata.estimatedTokens}\n` +
            pagination +
            `\n\n---\n\n${chunk.content}`;

        return {
            content: [{ type: "text", text: formatted }]
        };
    }

    if (name === "get-best-practices") {
        const library = args?.library as string;
        if (!library) throw new McpError(ErrorCode.InvalidParams, "Missing library parameter");

        const practices = getBestPractices(library);
        return {
            content: [{ type: "text", text: JSON.stringify(practices, null, 2) }]
        };
    }

    if (name === "validate-api") {
        const library = args?.library as string;
        const symbol = args?.symbol as string;
        const cwd = (args?.cwd as string) || process.cwd();

        if (!library || !symbol) {
            throw new McpError(ErrorCode.InvalidParams, "Missing library or symbol");
        }

        // Fast path: Check node_modules first
        const nodeModulesPath = path.join(cwd, 'node_modules');
        const nodeResult = nodeModulesParser.validateSymbol(symbol, library, nodeModulesPath);

        if (nodeResult.valid) {
            const formatted = `✅ **${symbol}** is valid (from node_modules)\n\n` +
                `Library: ${library}\n` +
                (nodeResult.signature ? `Signature: \`${nodeResult.signature}\`\n` : '') +
                `Source: Installed package`;

            return {
                content: [{ type: "text", text: formatted }]
            };
        }

        // Fallback: Check docs index
        const docsValid = await docsManager.validateSymbol(symbol, library);

        if (docsValid) {
            return {
                content: [{
                    type: "text",
                    text: `✅ **${symbol}** exists in ${library} documentation\n\nSource: Documentation index`
                }]
            };
        }

        // Not found
        const suggestions = await docsManager.searchSymbols(symbol, 5);
        const suggestionText = suggestions.length > 0
            ? `\n\n💡 Did you mean?\n` + suggestions.map(s => `• ${s.symbol} (${s.library})`).join('\n')
            : '';

        return {
            content: [{
                type: "text",
                text: `❌ **${symbol}** not found in ${library}${suggestionText}`
            }]
        };
    }

    if (name === "find-examples") {
        const library = args?.library as string;
        const topic = args?.topic as string;
        const version = (args?.version as string) || "auto";
        const cwd = (args?.cwd as string) || process.cwd();

        if (!library || !topic) {
            throw new McpError(ErrorCode.InvalidParams, "Missing library or topic");
        }

        const resolvedVersion = await docsManager.resolveVersion(library, version, cwd);
        const examples = await docsManager.getExamples(library, resolvedVersion, topic);

        if (examples.length === 0) {
            return {
                content: [{
                    type: "text",
                    text: `No code examples found for ${library} → ${topic}`
                }]
            };
        }

        const formatted = `📝 **Code Examples: ${library} / ${topic}**\n\n` +
            examples.map((ex, idx) =>
                `### Example ${idx + 1} (${ex.language})\n\n\`\`\`${ex.language}\n${ex.code}\n\`\`\``
            ).join('\n\n');

        return {
            content: [{ type: "text", text: formatted }]
        };
    }

    if (name === "resolve-library") {
        const query = (args?.query as string)?.toLowerCase();

        if (!query) {
            throw new McpError(ErrorCode.InvalidParams, "Missing query");
        }

        const allLibraries = [
            { id: 'react-native', name: 'React Native', aliases: ['rn', 'react-native', 'reactnative'] },
            { id: 'expo', name: 'Expo', aliases: ['expo', 'expo-sdk'] },
            { id: 'react-navigation', name: 'React Navigation', aliases: ['navigation', 'react-navigation', 'nav'] },
            { id: 'ignite', name: 'Ignite', aliases: ['ignite', 'ignite-cli'] },
            { id: 'react-native-reanimated', name: 'React Native Reanimated', aliases: ['reanimated', 'react-native-reanimated'] },
            { id: 'react-native-gesture-handler', name: 'React Native Gesture Handler', aliases: ['gesture-handler', 'react-native-gesture-handler', 'gestures'] },
            { id: 'react-native-mmkv', name: 'React Native MMKV', aliases: ['mmkv', 'react-native-mmkv'] },
            { id: 'react-native-skia', name: 'React Native Skia', aliases: ['skia', 'react-native-skia'] }
        ];

        // Filter to only include enabled libraries
        const libraries = allLibraries.filter(lib => docsManager.isLibraryEnabled(lib.id));

        const matches = libraries.filter(lib =>
            lib.aliases.some(alias => alias.includes(query) || query.includes(alias))
        );

        if (matches.length === 0) {
            const availableLibraries = libraries.map(lib => lib.id).join(', ');
            return {
                content: [{
                    type: "text",
                    text: `❌ No library found matching: "${query}"\n\nAvailable: ${availableLibraries}`
                }]
            };
        }

        const formatted = matches.map(lib => {
            const versions = docsManager.getAvailableVersions(lib.id);
            return `• **${lib.name}** (${lib.id})\n  Versions: ${versions.join(', ')}`;
        }).join('\n\n');

        return {
            content: [{ type: "text", text: `📚 Library matches:\n\n${formatted}` }]
        };
    }

    if (name === "semantic-search-docs") {
        const query = args?.query as string;
        const library = args?.library as string | undefined;
        const version = (args?.version as string) || "auto";
        const topK = Math.min(Math.max((args?.topK as number) || 10, 1), 50);
        const cwd = (args?.cwd as string) || process.cwd();
        const searchMode = (args?.searchMode as string) || "hybrid";

        if (!query) {
            throw new McpError(ErrorCode.InvalidParams, "Missing query parameter");
        }

        // Check if semantic search is enabled
        if (!docsManager.isSemanticSearchEnabled()) {
            // Check if it failed to initialize vs being disabled in config
            if (docsManager.didEmbeddingsInitFail()) {
                const errorMsg = docsManager.getEmbeddingsInitError();
                return {
                    content: [{
                        type: "text",
                        text: `⚠️ **Semantic Search Unavailable**\n\nSemantic search failed to initialize and is temporarily unavailable.\n\n**Error:** ${errorMsg || 'Unknown error during model initialization'}\n\n**Possible causes:**\n- Network issues downloading the embedding model\n- Insufficient memory to load the model\n- Missing dependencies (@huggingface/transformers)\n\n💡 **Alternative:** Use the \`search-docs\` tool for keyword-based topic listing, which remains fully functional.`
                    }]
                };
            }
            
            return {
                content: [{
                    type: "text",
                    text: `⚠️ **Semantic Search Disabled**\n\nSemantic search is currently disabled in the configuration.\n\nTo enable semantic search, set \`semanticSearchEnabled: true\` in your MCP server configuration.\n\n💡 **Alternative:** Use the \`search-docs\` tool for keyword-based topic listing.`
                }]
            };
        }

        try {
            // Resolve version if needed
            let resolvedVersion: string | undefined;
            if (library && version === "auto") {
                resolvedVersion = await docsManager.resolveVersion(library, version, cwd);
            } else if (version !== "auto") {
                resolvedVersion = version;
            }

            // Perform search based on mode
            let results;
            if (searchMode === "hybrid") {
                results = await docsManager.hybridSearch(query, topK, library, resolvedVersion);
            } else {
                results = await docsManager.semanticSearch(query, topK, library, resolvedVersion);
            }

            if (results.length === 0) {
                return {
                    content: [{
                        type: "text",
                        text: `🔍 **Semantic Search Results**\n\nQuery: "${query}"\nMode: ${searchMode}\n${library ? `Library: ${library}\n` : ''}${resolvedVersion ? `Version: ${resolvedVersion}\n` : ''}\n\n❌ No results found.\n\n💡 Tips:\n- Try rephrasing your query\n- Use more general terms\n- Check if the library documentation has been indexed`
                    }]
                };
            }

            // Format results
            const headerInfo = [
                `🔍 **Semantic Search Results**`,
                ``,
                `Query: "${query}"`,
                `Mode: ${searchMode}`,
                library ? `Library: ${library}` : null,
                resolvedVersion ? `Version: ${resolvedVersion}` : null,
                `Results: ${results.length}`,
                ``,
                `---`
            ].filter(Boolean).join('\n');

            const formattedResults = results.map((result, idx) => {
                const scorePercent = (result.score * 100).toFixed(1);
                const matchType = 'matchType' in result ? ` (${result.matchType})` : '';
                const preview = result.content.slice(0, 200).replace(/\n/g, ' ').trim();
                
                return [
                    ``,
                    `### ${idx + 1}. ${result.library}/${result.version}/${result.topic}`,
                    ``,
                    `**Score:** ${scorePercent}%${matchType}`,
                    result.metadata.headings.length > 0 ? `**Headings:** ${result.metadata.headings.slice(0, 3).join(' → ')}` : null,
                    `**Tokens:** ~${result.metadata.estimatedTokens}`,
                    ``,
                    `> ${preview}${result.content.length > 200 ? '...' : ''}`,
                    ``,
                    `<details>`,
                    `<summary>Full Content</summary>`,
                    ``,
                    `\`\`\`markdown`,
                    result.content.slice(0, 1000),
                    result.content.length > 1000 ? '\n... (truncated)' : '',
                    `\`\`\``,
                    `</details>`
                ].filter(Boolean).join('\n');
            }).join('\n\n---\n');

            const footer = `\n\n---\n\n📊 Showing ${results.length} result${results.length !== 1 ? 's' : ''}. ${topK < 50 ? `Use topK=${topK + 10} to see more results.` : ''}`;

            return {
                content: [{
                    type: "text",
                    text: headerInfo + formattedResults + footer
                }]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                content: [{
                    type: "text",
                    text: `❌ Semantic search failed: ${errorMessage}\n\n💡 The embedding model may still be loading. Please try again in a few seconds.`
                }]
            };
        }
    }

    if (name === "generate-component-scaffold") {
        const scaffoldId = args?.scaffoldId as string | undefined;
        const language = (args?.language as 'typescript' | 'javascript') || 'typescript';
        const library = args?.library as string | undefined;
        const category = args?.category as string | undefined;
        const listScaffolds = (args?.listScaffolds as boolean) || false;
        const includeComments = args?.includeComments !== false;
        const styleApproach = (args?.styleApproach as 'stylesheet' | 'inline') || 'stylesheet';
        const customizations = (args?.customizations as Record<string, string>) || {};

        // List scaffolds mode
        if (listScaffolds || !scaffoldId) {
            let availableScaffolds = scaffolds.listAvailableScaffolds();

            // Apply filters
            if (library) {
                availableScaffolds = availableScaffolds.filter(s => s.library === library);
            }
            if (category) {
                availableScaffolds = availableScaffolds.filter(s => s.category === category);
            }

            if (availableScaffolds.length === 0) {
                return {
                    content: [{
                        type: "text",
                        text: `❌ No scaffolds found matching the filters.\n\nTry removing filters or use different criteria.`
                    }]
                };
            }

            // Format as table
            const header = `| ID | Name | Category | Library | Description |\n|---|---|---|---|---|`;
            const rows = availableScaffolds.map(s => 
                `| ${s.id} | ${s.name} | ${s.category} | ${s.library} | ${s.description.slice(0, 50)}${s.description.length > 50 ? '...' : ''} |`
            ).join('\n');

            const formatted = `# 📦 Available Component Scaffolds\n\n${header}\n${rows}\n\n**Total:** ${availableScaffolds.length} scaffolds\n\n💡 Use \`scaffoldId\` parameter to generate a specific scaffold.`;

            return {
                content: [{ type: "text", text: formatted }]
            };
        }

        // Generate scaffold mode
        const scaffold = scaffolds.getScaffoldById(scaffoldId);
        if (!scaffold) {
            // Suggest similar scaffolds
            const allScaffolds = scaffolds.listAvailableScaffolds();
            const suggestions = allScaffolds
                .filter(s => s.id.includes(scaffoldId) || scaffoldId.includes(s.id.split('-')[0]))
                .slice(0, 5)
                .map(s => s.id);

            return {
                content: [{
                    type: "text",
                    text: `❌ Scaffold not found: "${scaffoldId}"\n\n${suggestions.length > 0 ? `💡 Did you mean?\n${suggestions.map(s => `• ${s}`).join('\n')}` : 'Use listScaffolds=true to see available scaffolds.'}`
                }]
            };
        }

        try {
            const options: ScaffoldGenerationOptions = {
                scaffoldId,
                language,
                includeComments,
                includeTypes: language === 'typescript',
                styleApproach,
                customizations,
            };

            const generatedCode = scaffolds.generateScaffold(options);

            const formatted = [
                `# 📦 ${scaffold.name}`,
                '',
                scaffold.description,
                '',
                '## Dependencies',
                '',
                scaffold.dependencies.map(d => `\`${d}\``).join(', '),
                '',
                '## Generated Code',
                '',
                '```' + (language === 'typescript' ? 'tsx' : 'jsx'),
                generatedCode,
                '```',
                '',
                '## Notes',
                '',
                scaffold.notes.map(n => `• ${n}`).join('\n'),
            ].join('\n');

            return {
                content: [{ type: "text", text: formatted }]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                content: [{
                    type: "text",
                    text: `❌ Failed to generate scaffold: ${errorMessage}`
                }]
            };
        }
    }

    if (name === "compare-api-versions") {
        const library = args?.library as string;
        const fromVersion = args?.fromVersion as string;
        const toVersion = args?.toVersion as string;
        const showUnchanged = (args?.showUnchanged as boolean) || false;
        const detailLevel = (args?.detailLevel as 'summary' | 'detailed') || 'summary';

        if (!library || !fromVersion || !toVersion) {
            throw new McpError(ErrorCode.InvalidParams, "Missing library, fromVersion, or toVersion");
        }

        try {
            const diff = await docsManager.compareVersions(library, fromVersion, toVersion);

            const lines: string[] = [
                `# 📊 API Comparison: ${library}`,
                '',
                `**From:** ${diff.fromVersion} → **To:** ${diff.toVersion}`,
                '',
                '---',
                '',
            ];

            // Summary stats
            const totalChanges = diff.added.length + diff.removed.length + diff.modified.length;
            lines.push(`## Summary`);
            lines.push('');
            lines.push(`• **Added:** ${diff.added.length} APIs`);
            lines.push(`• **Removed:** ${diff.removed.length} APIs`);
            lines.push(`• **Modified:** ${diff.modified.length} APIs`);
            if (showUnchanged) {
                lines.push(`• **Unchanged:** ${diff.unchanged} APIs`);
            }
            lines.push('');

            // Added APIs
            if (diff.added.length > 0) {
                lines.push('## ✅ Added APIs');
                lines.push('');
                for (const entry of diff.added.slice(0, detailLevel === 'detailed' ? 50 : 20)) {
                    if (detailLevel === 'detailed' && entry.signature) {
                        lines.push(`### \`${entry.symbol}\``);
                        lines.push(`- Type: ${entry.type}`);
                        lines.push(`- Signature: \`${entry.signature}\``);
                        lines.push('');
                    } else {
                        lines.push(`• \`${entry.symbol}\` (${entry.type})`);
                    }
                }
                if (diff.added.length > (detailLevel === 'detailed' ? 50 : 20)) {
                    lines.push(`\n... and ${diff.added.length - (detailLevel === 'detailed' ? 50 : 20)} more`);
                }
                lines.push('');
            }

            // Removed APIs
            if (diff.removed.length > 0) {
                lines.push('## ❌ Removed APIs');
                lines.push('');
                for (const entry of diff.removed.slice(0, detailLevel === 'detailed' ? 50 : 20)) {
                    if (detailLevel === 'detailed' && entry.signature) {
                        lines.push(`### \`${entry.symbol}\``);
                        lines.push(`- Type: ${entry.type}`);
                        lines.push(`- Was: \`${entry.signature}\``);
                        lines.push('');
                    } else {
                        lines.push(`• \`${entry.symbol}\` (${entry.type})`);
                    }
                }
                if (diff.removed.length > (detailLevel === 'detailed' ? 50 : 20)) {
                    lines.push(`\n... and ${diff.removed.length - (detailLevel === 'detailed' ? 50 : 20)} more`);
                }
                lines.push('');
            }

            // Modified APIs
            if (diff.modified.length > 0) {
                lines.push('## 🔄 Modified APIs');
                lines.push('');
                for (const mod of diff.modified.slice(0, detailLevel === 'detailed' ? 30 : 10)) {
                    if (detailLevel === 'detailed') {
                        lines.push(`### \`${mod.symbol}\``);
                        if (mod.fromSignature) lines.push(`- Before: \`${mod.fromSignature}\``);
                        if (mod.toSignature) lines.push(`- After: \`${mod.toSignature}\``);
                        lines.push(`- Change: ${mod.changes}`);
                        lines.push('');
                    } else {
                        lines.push(`• \`${mod.symbol}\`: ${mod.changes}`);
                    }
                }
                if (diff.modified.length > (detailLevel === 'detailed' ? 30 : 10)) {
                    lines.push(`\n... and ${diff.modified.length - (detailLevel === 'detailed' ? 30 : 10)} more`);
                }
                lines.push('');
            }

            if (totalChanges === 0) {
                lines.push('*No API changes detected between these versions.*');
                lines.push('');
                lines.push('💡 This could mean:');
                lines.push('- The versions are identical');
                lines.push('- Documentation for one or both versions is not indexed');
                lines.push('- Use `search-docs` to verify documentation availability');
            }

            return {
                content: [{ type: "text", text: lines.join('\n') }]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                content: [{
                    type: "text",
                    text: `❌ Failed to compare versions: ${errorMessage}`
                }]
            };
        }
    }

    if (name === "suggest-migration-path") {
        const library = args?.library as string;
        let fromVersion = (args?.fromVersion as string) || 'auto';
        const toVersion = args?.toVersion as string;
        const cwd = (args?.cwd as string) || process.cwd();
        const format = (args?.format as 'detailed' | 'checklist' | 'summary') || 'detailed';
        const includeCodeExamples = args?.includeCodeExamples !== false;

        if (!library || !toVersion) {
            throw new McpError(ErrorCode.InvalidParams, "Missing library or toVersion");
        }

        // Auto-detect fromVersion if needed
        if (fromVersion === 'auto') {
            const context = contextDetector.detectContext(cwd);
            if (context?.versions) {
                const versionKey = {
                    'react-native': 'reactNative',
                    'expo': 'expo',
                    'react-navigation': 'reactNavigation',
                    'ignite': 'ignite',
                    'react-native-reanimated': 'reanimated',
                    'react-native-gesture-handler': 'gestureHandler',
                    'react-native-mmkv': 'mmkv',
                    'react-native-skia': 'skia',
                }[library] as keyof typeof context.versions;

                fromVersion = context.versions[versionKey] || 'unknown';
            } else {
                fromVersion = 'unknown';
            }
        }

        if (fromVersion === 'unknown') {
            return {
                content: [{
                    type: "text",
                    text: `❌ Could not detect current ${library} version.\n\nPlease specify the \`fromVersion\` parameter explicitly.`
                }]
            };
        }

        // Try to find a curated migration path
        let migration = migrations.findMigrationPath(library, fromVersion, toVersion);

        if (!migration) {
            // No curated migration - generate dynamic guidance
            const migrationDocs = await docsManager.findMigrationDocs(library, fromVersion, toVersion);
            const apiDiff = await docsManager.compareVersions(library, fromVersion, toVersion);

            const lines: string[] = [
                `# 🔄 Migration Guide: ${library}`,
                '',
                `**From:** ${fromVersion} → **To:** ${toVersion}`,
                '',
                '⚠️ *No curated migration guide available. Showing auto-generated guidance.*',
                '',
                '---',
                '',
            ];

            // API changes summary
            if (apiDiff.added.length > 0 || apiDiff.removed.length > 0 || apiDiff.modified.length > 0) {
                lines.push('## API Changes');
                lines.push('');
                lines.push(`• ${apiDiff.added.length} new APIs`);
                lines.push(`• ${apiDiff.removed.length} removed APIs`);
                lines.push(`• ${apiDiff.modified.length} modified APIs`);
                lines.push('');
                
                if (apiDiff.removed.length > 0) {
                    lines.push('### ⚠️ Removed APIs (Action Required)');
                    lines.push('');
                    for (const entry of apiDiff.removed.slice(0, 10)) {
                        lines.push(`• \`${entry.symbol}\``);
                    }
                    if (apiDiff.removed.length > 10) {
                        lines.push(`• ... and ${apiDiff.removed.length - 10} more`);
                    }
                    lines.push('');
                }
            }

            // Related documentation
            if (migrationDocs.length > 0) {
                lines.push('## 📚 Related Documentation');
                lines.push('');
                for (const topic of migrationDocs.slice(0, 10)) {
                    lines.push(`• ${topic}`);
                }
                lines.push('');
                lines.push('Use `get-library-docs` to read these topics.');
            }

            lines.push('');
            lines.push('## 💡 Recommended Steps');
            lines.push('');
            lines.push('1. Review the API changes above');
            lines.push('2. Update package.json dependencies');
            lines.push('3. Run `npm install` or `yarn`');
            lines.push('4. Address any removed/modified APIs');
            lines.push('5. Test thoroughly');

            return {
                content: [{ type: "text", text: lines.join('\n') }]
            };
        }

        // Format the curated migration
        if (format === 'checklist') {
            const checklist = migrations.generateMigrationChecklist(migration);
            return {
                content: [{ type: "text", text: checklist }]
            };
        }

        // Summary or detailed format
        const lines: string[] = [
            `# 🔄 Migration Guide: ${library}`,
            '',
            `**From:** ${migration.fromVersion} → **To:** ${migration.toVersion}`,
            '',
            `**Difficulty:** ${migration.difficulty === 'easy' ? '🟢 Easy' : migration.difficulty === 'moderate' ? '🟡 Moderate' : '🔴 Complex'}`,
            `**Estimated Time:** ${migration.estimatedTime} minutes`,
            '',
            '---',
            '',
        ];

        // Breaking changes
        if (migration.breakingChanges.length > 0) {
            lines.push('## ⚠️ Breaking Changes');
            lines.push('');
            for (const change of migration.breakingChanges) {
                lines.push(`• ${change}`);
            }
            lines.push('');
        }

        // Migration steps
        lines.push('## 📋 Migration Steps');
        lines.push('');

        for (const step of migration.steps) {
            const breaking = step.breaking ? ' ⚠️' : '';
            const automated = step.automated ? ' 🤖' : '';
            lines.push(`### ${step.order}. ${step.title}${breaking}${automated}`);
            lines.push('');
            lines.push(step.description);
            lines.push('');

            if (includeCodeExamples && step.codeExample && format === 'detailed') {
                if (step.codeExample.before) {
                    lines.push('**Before:**');
                    lines.push('```' + step.codeExample.language);
                    lines.push(step.codeExample.before);
                    lines.push('```');
                    lines.push('');
                }
                if (step.codeExample.after) {
                    lines.push('**After:**');
                    lines.push('```' + step.codeExample.language);
                    lines.push(step.codeExample.after);
                    lines.push('```');
                    lines.push('');
                }
            }

            if (step.references.length > 0 && format === 'detailed') {
                lines.push('**References:**');
                for (const ref of step.references) {
                    lines.push(`• ${ref}`);
                }
                lines.push('');
            }
        }

        // New features
        if (migration.newFeatures.length > 0 && format !== 'summary') {
            lines.push('## ✨ New Features');
            lines.push('');
            for (const feature of migration.newFeatures) {
                lines.push(`• ${feature}`);
            }
            lines.push('');
        }

        // Deprecations
        if (migration.deprecations.length > 0 && format !== 'summary') {
            lines.push('## 📦 Deprecations');
            lines.push('');
            for (const dep of migration.deprecations) {
                lines.push(`• ${dep}`);
            }
            lines.push('');
        }

        // Resources
        if (migration.resources.length > 0) {
            lines.push('## 📚 Resources');
            lines.push('');
            for (const resource of migration.resources) {
                lines.push(`• ${resource}`);
            }
        }

        return {
            content: [{ type: "text", text: lines.join('\n') }]
        };
    }

    if (name === "generate-ai-template") {
        const framework = args?.framework as string | undefined;
        const listFrameworks = args?.listFrameworks as boolean;
        const generateAll = args?.generateAll as boolean;
        const includeExamples = (args?.includeExamples as boolean) !== false;

        // List all supported frameworks
        if (listFrameworks) {
            const formatted = templates.formatFrameworksList();
            return {
                content: [{ type: "text", text: formatted }]
            };
        }

        // Generate templates for all frameworks
        if (generateAll) {
            const allTemplates = templates.generateAllTemplates(includeExamples);
            const lines: string[] = [
                '# 🤖 Generated AI Framework Templates',
                '',
                `Generated ${allTemplates.length} templates:`,
                ''
            ];

            for (const template of allTemplates) {
                lines.push(`## ${template.framework.name}`);
                lines.push(`**Output file:** \`${template.outputPath}\``);
                lines.push('');
                lines.push('```' + (template.framework.format === 'markdown' ? 'markdown' : template.framework.format));
                // Truncate content for display
                const contentPreview = template.content.length > 500 
                    ? template.content.substring(0, 500) + '\n... (truncated)'
                    : template.content;
                lines.push(contentPreview);
                lines.push('```');
                lines.push('');
            }

            lines.push('---');
            lines.push('💡 Use `generate-ai-template` with a specific framework ID to get the full template content.');

            return {
                content: [{ type: "text", text: lines.join('\n') }]
            };
        }

        // Generate template for specific framework
        if (!framework) {
            // No framework specified - show available options
            const configs = templates.listFrameworks();
            const lines: string[] = [
                '# 🤖 AI Template Generator',
                '',
                'Generate configuration files for AI coding assistants.',
                '',
                '## Available Frameworks:',
                '',
                ...configs.map(c => `• **${c.id}** - ${c.name} (\`${c.outputFile}\`)`),
                '',
                '## Usage:',
                '',
                '• Set `framework` to generate a specific template',
                '• Set `listFrameworks: true` for detailed framework info',
                '• Set `generateAll: true` to generate all templates'
            ];

            return {
                content: [{ type: "text", text: lines.join('\n') }]
            };
        }

        const template = templates.generateTemplate(framework, includeExamples);

        if (!template) {
            const availableFrameworks = templates.listFrameworks().map(f => f.id).join(', ');
            return {
                content: [{
                    type: "text",
                    text: `❌ Unknown framework: "${framework}"\n\nAvailable frameworks: ${availableFrameworks}`
                }]
            };
        }

        const lines: string[] = [
            `# 🤖 ${template.framework.name} Template`,
            '',
            `**Output file:** \`${template.outputPath}\``,
            `**Format:** ${template.framework.format}`,
            '',
            '---',
            '',
            '```' + (template.framework.format === 'markdown' ? 'markdown' : template.framework.format === 'text' ? '' : template.framework.format),
            template.content,
            '```',
            '',
            '---',
            '',
            `💡 Save this content to \`${template.outputPath}\` in your project root.`
        ];

        return {
            content: [{ type: "text", text: lines.join('\n') }]
        };
    }

    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("React Native MCP Server v2.0 running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
