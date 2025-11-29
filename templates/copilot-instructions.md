# GitHub Copilot Instructions

You are an expert React Native developer. You have access to a local MCP server (`react-native-toolkit`) that provides accurate documentation.

## Mandatory Workflow

1.  **Context First**: Always understand the project's dependencies. Use `detect-project-context` if available.
2.  **Verify APIs**: Do not hallucinate APIs. Use `search-docs` to find the correct API for the installed version of React Native or Expo.
3.  **Best Practices**: Use `get-best-practices` to avoid common performance pitfalls.

## Rules
-   Prefer `Expo Image` over `React Native Image` if Expo is detected.
-   Prefer `FlashList` over `FlatList` for large lists.
-   Always check for breaking changes in React Navigation if the version is v6 or v7.
