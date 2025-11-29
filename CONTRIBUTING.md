# Contributing to MCP React Native Toolkit

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork:

   ```bash
   git clone https://github.com/YOUR_USERNAME/mcp-react-native-toolkit.git
   cd mcp-react-native-toolkit
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Fetch documentation:

   ```bash
   npm run fetch-docs
   ```

5. Build the project:

   ```bash
   npm run build
   ```

## Development Workflow

### Making Changes

1. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes in `src/`

3. Build and test:

   ```bash
   npm run build
   npm test
   ```

4. Test manually by running the server:

   ```bash
   npm start
   ```

### Code Style

- Use TypeScript for all source files
- Follow existing code patterns and naming conventions
- Add JSDoc comments for public APIs
- Keep functions focused and single-purpose

### Commit Messages

Use clear, descriptive commit messages:

```text
feat: add support for custom documentation sources
fix: resolve semver matching for prerelease versions
docs: update README with new configuration options
refactor: simplify chunking logic
```

## Adding a New Tool

1. Define the tool schema in `src/index.ts` under `ListToolsRequestSchema`
2. Implement the handler in `CallToolRequestSchema`
3. Add any supporting logic to appropriate modules
4. Update README.md with the new tool
5. Add tests if applicable

## Adding a Documentation Source

1. Edit `docs-sources.json` to add the new source
2. Run `npm run fetch-docs` to verify it works
3. Update README.md to list the new source
4. Consider adding an example in `examples/`

See [`examples/custom-source.md`](examples/custom-source.md) for detailed instructions.

## Project Structure

```text
src/
├── index.ts            # MCP server and tool handlers
├── docs-manager.ts     # Documentation retrieval
├── indexer.ts          # Symbol indexing
├── chunker.ts          # Content chunking
├── context-detector.ts # Project detection
├── node-modules-parser.ts # .d.ts parsing
├── semver-resolver.ts  # Version matching
├── config.ts           # Configuration loading
├── best-practices.ts   # Best practices data
└── types.ts            # Type definitions
```

## Pull Request Process

1. Ensure your code builds without errors
2. Run tests and ensure they pass
3. Update documentation if needed
4. Create a pull request with a clear description
5. Link any related issues

## Reporting Issues

When reporting bugs, please include:

- Node.js version (`node --version`)
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Relevant error messages

## Questions?

Open an issue for questions or discussions about the project.
