/**
 * LangChain Integration Example
 *
 * This example demonstrates how to use the MCP React Native Toolkit
 * with LangChain to build an AI agent that has access to accurate,
 * version-aware React Native documentation.
 *
 * Prerequisites:
 * - Node.js 18+
 * - npm install langchain @langchain/openai
 * - MCP React Native Toolkit running (npm start in toolkit directory)
 * - OpenAI API key set in environment
 */

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// Note: LangChain's MCP integration is evolving. This example shows the pattern.
// Check LangChain docs for the latest MCP tool integration approach.

/**
 * Example: Building a React Native coding assistant with LangChain
 *
 * The MCP server provides these tools to your agent:
 * - detect-project-context: Detects RN/Expo versions from package.json
 * - search-docs: Searches documentation for a library
 * - get-library-docs: Gets specific documentation with pagination
 * - validate-api: Validates if an API symbol exists
 * - find-examples: Finds code examples for a topic
 * - get-best-practices: Gets performance best practices
 * - resolve-library: Resolves fuzzy library names
 */

async function main() {
    // Initialize the LLM
    const llm = new ChatOpenAI({
        modelName: "gpt-4",
        temperature: 0,
    });

    // System prompt that instructs the agent to use MCP tools
    const systemPrompt = `You are an expert React Native developer assistant.
You have access to MCP tools that provide accurate, version-aware documentation.

IMPORTANT: Always use these tools before answering React Native questions:
1. detect-project-context - to understand the user's project setup
2. validate-api - to verify APIs exist before suggesting them
3. get-library-docs - to get accurate documentation
4. get-best-practices - to avoid anti-patterns

Never guess APIs. Always verify with the tools first.`;

    // Example conversation
    const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(
            "How do I implement an optimized list with React Native?"
        ),
    ];

    console.log("=".repeat(60));
    console.log("LangChain + MCP React Native Toolkit Example");
    console.log("=".repeat(60));
    console.log("\nThis is a demonstration of the integration pattern.");
    console.log("In a real implementation, you would:");
    console.log("1. Connect LangChain to the MCP server");
    console.log("2. Register the MCP tools with your agent");
    console.log("3. Let the agent call tools as needed");
    console.log("\nMCP Tools Available:");
    console.log("- detect-project-context");
    console.log("- search-docs");
    console.log("- get-library-docs");
    console.log("- validate-api");
    console.log("- find-examples");
    console.log("- get-best-practices");
    console.log("- resolve-library");
    console.log("=".repeat(60));

    // In a real implementation with MCP tool binding:
    // const response = await agentWithTools.invoke(messages);
    // console.log(response);
}

// Run the example
main().catch(console.error);

/**
 * MCP Connection Configuration
 *
 * To connect LangChain to the MCP server, you'll need to:
 *
 * 1. Start the MCP server:
 *    cd /path/to/mcp-react-native-toolkit
 *    npm start
 *
 * 2. Configure the MCP client in your LangChain setup.
 *    The server communicates over stdio, so you'll spawn it as a child process.
 *
 * Example spawn configuration:
 * {
 *   command: "node",
 *   args: ["/path/to/mcp-react-native-toolkit/dist/index.js"],
 *   transport: "stdio"
 * }
 *
 * See the LangChain MCP documentation for the latest integration patterns.
 */
