#!/bin/bash

echo "🚀 Setting up React Native MCP Toolkit..."

# 1. Install Dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Build Project
echo "🔨 Building project..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Documentation is fetched ON-DEMAND when you first use the server."
echo "   (No need to pre-fetch - it detects your project's versions automatically)"
echo ""
echo "🚀 NEXT STEP: Configure your editor"
echo ""
echo "   VS Code:  Add to .vscode/mcp.json"
echo "   Cursor:   Add to ~/.cursor/mcp.json"
echo "   Claude:   Add to ~/Library/Application Support/Claude/claude_desktop_config.json"
echo ""
echo "   Server path: $PWD/dist/index.js"
echo ""
echo "💡 Optional: Pre-fetch all latest docs for offline use:"
echo "   npm run refresh-docs"
echo ""
