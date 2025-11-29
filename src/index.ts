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
                description: "Search for documentation topics available for a library",
                inputSchema: {
                    type: "object",
                    properties: {
                        library: { type: "string", enum: ["react-native", "expo", "react-navigation", "ignite"] },
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
                        library: { type: "string", enum: ["react-native", "expo", "react-navigation", "ignite"] },
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
                        library: { type: "string", enum: ["react-native", "expo", "react-navigation", "ignite"] },
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
                        library: { type: "string", enum: ["react-native", "expo", "react-navigation", "ignite"] },
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
            `Ignite: ${context.versions.ignite || 'not installed'}\n\n` +
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

        const libraries = [
            { id: 'react-native', name: 'React Native', aliases: ['rn', 'react-native', 'reactnative'] },
            { id: 'expo', name: 'Expo', aliases: ['expo', 'expo-sdk'] },
            { id: 'react-navigation', name: 'React Navigation', aliases: ['navigation', 'react-navigation', 'nav'] },
            { id: 'ignite', name: 'Ignite', aliases: ['ignite', 'ignite-cli'] }
        ];

        const matches = libraries.filter(lib =>
            lib.aliases.some(alias => alias.includes(query) || query.includes(alias))
        );

        if (matches.length === 0) {
            return {
                content: [{
                    type: "text",
                    text: `❌ No library found matching: "${query}"\n\nAvailable: react-native, expo, react-navigation, ignite`
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
