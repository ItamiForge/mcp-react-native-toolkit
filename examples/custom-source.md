# Adding Custom Documentation Sources

This guide explains how to add your own documentation sources to the MCP React Native Toolkit. This is useful when you want to include documentation for libraries not included by default, such as Supabase, Reanimated, or your own internal libraries.

## Overview

The toolkit uses a configuration file (`docs-sources.json`) to define which documentation sources to fetch and how to process them. You can add any GitHub-hosted documentation by following this guide.

## Step 1: Understand the Configuration Schema

Each source in `docs-sources.json` has the following structure:

```json
{
  "id": "unique-library-id",
  "name": "Human Readable Name",
  "repo": "https://github.com/owner/repo.git",
  "docsPath": "path/to/docs/folder",
  "branch": "main",
  "versions": ["latest"],
  "locales": ["en"],
  "description": "Brief description of the library",
  "preprocessingRules": {
    "stripComments": true,
    "removeNavigation": true,
    "minifyWhitespace": true
  }
}
```

### Field Descriptions

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier used in tool calls (e.g., "supabase") |
| `name` | Yes | Display name shown in responses |
| `repo` | Yes | Git repository URL (must be HTTPS) |
| `docsPath` | Yes | Path to documentation folder within the repo |
| `branch` | Yes | Branch to fetch (usually "main" or "master") |
| `versions` | Yes | Array of versions to support (use ["latest"] for most cases) |
| `locales` | No | Language codes for i18n docs (default: ["en"]) |
| `description` | No | Brief description for help text |
| `preprocessingRules` | No | Token optimization settings |

## Step 2: Find the Documentation Path

Before adding a source, you need to find where the documentation lives in the repository:

1. Go to the GitHub repository
2. Look for a `docs/` folder, or check common locations:
   - `docs/`
   - `documentation/`
   - `website/docs/`
   - `packages/docs/`
3. Note the exact path from the repository root

### Example: Finding Supabase Docs

1. Visit <https://github.com/supabase/supabase>
2. Navigate to find the docs folder
3. The path might be `apps/docs/content` or similar

## Step 3: Add Your Source

Edit `docs-sources.json` and add your new source to the `sources` array:

```json
{
  "sources": [
    {
      "id": "supabase",
      "name": "Supabase",
      "repo": "https://github.com/supabase/supabase.git",
      "docsPath": "apps/docs/content",
      "branch": "master",
      "versions": ["latest"],
      "locales": ["en"],
      "description": "Supabase - The open source Firebase alternative",
      "preprocessingRules": {
        "stripComments": true,
        "removeNavigation": true,
        "minifyWhitespace": true
      }
    }
  ]
}
```

## Step 4: Fetch the Documentation

After adding your source, run the fetch script:

```bash
npm run fetch-docs
```

This will:

1. Clone the repository (using sparse checkout for efficiency)
2. Extract only the documentation folder
3. Preprocess markdown files (strip comments, minify whitespace)
4. Copy processed files to `docs/<your-id>/latest/`
5. Clean up temporary files

## Step 5: Verify the Integration

Test that your new source works:

```bash
# Build the project
npm run build

# Start the server
npm start
```

Then in your AI client, try:

- `search-docs` with `library: "supabase"`
- `get-library-docs` with `library: "supabase", topic: "auth"`

## Example: Adding React Native Reanimated

```json
{
  "id": "reanimated",
  "name": "React Native Reanimated",
  "repo": "https://github.com/software-mansion/react-native-reanimated.git",
  "docsPath": "docs/docs",
  "branch": "main",
  "versions": ["latest"],
  "description": "React Native's Animated library reimplemented",
  "preprocessingRules": {
    "stripComments": true,
    "removeNavigation": true,
    "minifyWhitespace": true
  }
}
```

## Example: Adding Internal Documentation

For private repositories, you'll need to ensure git has access (SSH keys or tokens):

```json
{
  "id": "internal-components",
  "name": "Internal Component Library",
  "repo": "git@github.com:your-org/component-library.git",
  "docsPath": "docs",
  "branch": "main",
  "versions": ["latest"],
  "description": "Internal React Native component documentation"
}
```

## Preprocessing Rules Explained

The `preprocessingRules` help reduce token usage:

### `stripComments: true`

Removes HTML comments like `<!-- TODO: update this -->` that waste tokens.

### `removeNavigation: true`

Removes internal anchor links and horizontal rules often used for navigation that aren't useful for LLMs.

### `minifyWhitespace: true`

Reduces excessive blank lines (max 2 consecutive) and removes trailing whitespace, while preserving code block formatting.

## Troubleshooting

### "Docs path not found"

- Double-check the `docsPath` value matches the actual folder structure
- Verify the `branch` name is correct
- Try cloning the repo manually to inspect the structure

### Empty documentation folder

- Some repos use dynamic documentation generation
- Look for a build step that generates markdown from source
- Check if docs are in a separate repository

### Fetch takes too long

- Sparse checkout should make this fast, but large repos may still be slow
- Consider using `sparseCheckoutPaths` to be more specific:

```json
{
  "sparseCheckoutPaths": ["docs/guides/**", "docs/api/**"]
}
```

### Build errors after adding source

- Run `npm run build` to check for TypeScript errors
- Ensure markdown files are valid UTF-8
- Check for unusually large files that might cause memory issues

## Advanced: Multiple Versions

To support multiple versions of documentation:

```json
{
  "id": "react-navigation",
  "versions": ["6.x", "7.x", "latest"],
  "docsPath": "versioned_docs/version-{version}"
}
```

Note: Version templating requires modifying the fetch script. For most use cases, "latest" is sufficient.

## Need Help?

If you encounter issues adding a custom source:

1. Check the GitHub repository structure matches your configuration
2. Run `npm run fetch-docs` with `--verbose` for detailed output
3. Open an issue on the MCP React Native Toolkit repository
