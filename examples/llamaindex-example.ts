/**
 * LlamaIndex Integration Example
 *
 * This example demonstrates how to use the MCP React Native Toolkit
 * with LlamaIndex to build a RAG (Retrieval Augmented Generation) system
 * that provides accurate React Native documentation to your AI applications.
 *
 * Prerequisites:
 * - Node.js 18+
 * - npm install llamaindex
 * - MCP React Native Toolkit running
 * - OpenAI API key set in environment
 */

/**
 * LlamaIndex + MCP Integration Pattern
 *
 * LlamaIndex can integrate with MCP servers to use them as tool providers.
 * The MCP React Native Toolkit exposes documentation as tools that can be
 * called by your LlamaIndex agents.
 *
 * Key Benefits:
 * - Version-aware documentation (matches your project's package.json)
 * - Token-efficient chunked responses
 * - Fast API validation from node_modules
 * - Best practices and anti-pattern detection
 */

interface MCPToolCall {
    name: string;
    arguments: Record<string, unknown>;
}

interface DocumentationChunk {
    content: string;
    library: string;
    version: string;
    topic: string;
    page: number;
    totalPages: number;
}

/**
 * Example: RAG pattern with local React Native documentation
 *
 * This pattern combines:
 * 1. MCP tools for retrieving accurate, version-specific docs
 * 2. LlamaIndex for orchestrating the retrieval and response generation
 */
async function ragWithMCPDocs() {
    console.log("=".repeat(60));
    console.log("LlamaIndex + MCP React Native Toolkit Example");
    console.log("=".repeat(60));

    // Simulated flow - in real implementation, these would be actual MCP calls

    // Step 1: Detect project context
    const projectContext = {
        reactNative: "0.73.0",
        expo: "~50.0.0",
        reactNavigation: "^6.0.0",
    };
    console.log("\n1. Project Context Detected:");
    console.log(`   React Native: ${projectContext.reactNative}`);
    console.log(`   Expo: ${projectContext.expo}`);
    console.log(`   React Navigation: ${projectContext.reactNavigation}`);

    // Step 2: User query
    const userQuery = "How do I handle deep linking in my Expo app?";
    console.log(`\n2. User Query: "${userQuery}"`);

    // Step 3: Search relevant docs
    console.log("\n3. Searching documentation...");
    const relevantTopics = [
        "expo/linking",
        "expo/router",
        "react-navigation/deep-linking",
    ];
    console.log(`   Found topics: ${relevantTopics.join(", ")}`);

    // Step 4: Retrieve chunked documentation
    console.log("\n4. Retrieving documentation chunks...");
    const chunks: DocumentationChunk[] = [
        {
            content: "# Deep Linking with Expo...",
            library: "expo",
            version: "50.0.0",
            topic: "linking",
            page: 1,
            totalPages: 3,
        },
    ];
    console.log(`   Retrieved ${chunks.length} chunk(s)`);

    // Step 5: Generate response with context
    console.log("\n5. Generating response with retrieved context...");
    console.log("   (In real implementation, LlamaIndex synthesizes the response)");

    console.log("\n" + "=".repeat(60));
    console.log("Integration Complete");
    console.log("=".repeat(60));
}

/**
 * MCP Server Configuration for LlamaIndex
 *
 * To use with LlamaIndex:
 *
 * 1. Start the MCP server:
 *    node /path/to/mcp-react-native-toolkit/dist/index.js
 *
 * 2. Configure LlamaIndex to use MCP tools:
 *    - The server exposes tools via the MCP protocol
 *    - Each tool can be wrapped as a LlamaIndex Tool
 *
 * Available MCP Tools:
 * - detect-project-context: Get project dependency versions
 * - search-docs: Search for documentation topics
 * - get-library-docs: Retrieve specific documentation with pagination
 * - validate-api: Check if an API exists in the current version
 * - find-examples: Get code examples for a topic
 * - get-best-practices: Get performance recommendations
 * - resolve-library: Resolve fuzzy library names to exact IDs
 *
 * Tool Response Format:
 * All tools return { content: [{ type: "text", text: "..." }] }
 * Parse the text field for structured data when needed.
 */

// Example tool wrapper for LlamaIndex
class MCPReactNativeTools {
    private serverPath: string;

    constructor(serverPath: string) {
        this.serverPath = serverPath;
    }

    /**
     * Wraps an MCP tool call for use with LlamaIndex
     */
    async callTool(toolCall: MCPToolCall): Promise<string> {
        // In real implementation:
        // 1. Spawn MCP server as child process
        // 2. Send JSON-RPC request
        // 3. Parse and return response
        console.log(`Calling MCP tool: ${toolCall.name}`);
        console.log(`Arguments: ${JSON.stringify(toolCall.arguments)}`);
        return "Tool response would appear here";
    }

    /**
     * Get documentation for a specific topic
     */
    async getDocs(
        library: string,
        topic: string,
        page: number = 1
    ): Promise<DocumentationChunk | null> {
        const response = await this.callTool({
            name: "get-library-docs",
            arguments: { library, topic, page, version: "auto" },
        });
        // Parse response and return structured chunk
        return null; // Placeholder
    }

    /**
     * Validate an API exists
     */
    async validateAPI(library: string, symbol: string): Promise<boolean> {
        const response = await this.callTool({
            name: "validate-api",
            arguments: { library, symbol },
        });
        return response.includes("✅");
    }
}

// Run the example
ragWithMCPDocs().catch(console.error);

export { MCPReactNativeTools, ragWithMCPDocs };
