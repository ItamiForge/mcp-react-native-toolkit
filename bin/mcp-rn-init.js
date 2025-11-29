#!/usr/bin/env node

/**
 * MCP React Native Toolkit - Project Initializer
 * 
 * This script sets up AI assistant configuration files for a React Native project.
 * It detects the development environment and creates appropriate instruction files.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TOOLKIT_ROOT = dirname(__dirname);
const TEMPLATES_DIR = join(TOOLKIT_ROOT, 'templates');
const PROJECT_DIR = process.cwd();

console.log('🔌 Initializing MCP React Native Toolkit...');
console.log(`   Target Project: ${PROJECT_DIR}`);

// Helper to copy template if target doesn't exist or update if exists
function setupTemplate(targetPath, templatePath, description) {
  const fullTargetPath = join(PROJECT_DIR, targetPath);
  const fullTemplatePath = join(TEMPLATES_DIR, templatePath);
  
  if (!existsSync(fullTemplatePath)) {
    console.log(`  ⚠️  Template not found: ${templatePath}`);
    return false;
  }

  // Create directory if needed
  const targetDir = dirname(fullTargetPath);
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  if (existsSync(fullTargetPath)) {
    const existing = readFileSync(fullTargetPath, 'utf-8');
    if (existing.includes('MCP TOOL USAGE') || existing.includes('mcp-react-native-toolkit')) {
      console.log(`  ✓ ${description} (already configured)`);
      return true;
    }
    // Append to existing file
    const template = readFileSync(fullTemplatePath, 'utf-8');
    writeFileSync(fullTargetPath, existing + '\n\n<!-- Added by MCP React Native Toolkit -->\n' + template);
    console.log(`  + Updated ${description}`);
  } else {
    copyFileSync(fullTemplatePath, fullTargetPath);
    console.log(`  + Created ${description}`);
  }
  return true;
}

// Detect environment and apply appropriate templates
console.log('\n📋 Setting up AI assistant configuration...\n');

let configured = false;

// Check for Cursor
if (existsSync(join(PROJECT_DIR, '.cursor')) || existsSync(join(PROJECT_DIR, '.cursorrules'))) {
  setupTemplate('.cursorrules', '.cursorrules', 'Cursor Rules');
  configured = true;
}

// Check for VS Code / GitHub Copilot
if (existsSync(join(PROJECT_DIR, '.vscode'))) {
  setupTemplate('.github/copilot-instructions.md', '.github/copilot-instructions.md', 'GitHub Copilot Instructions');
  configured = true;
}

// Check for Windsurf
if (existsSync(join(PROJECT_DIR, '.windsurfrules'))) {
  setupTemplate('.windsurfrules', '.windsurfrules', 'Windsurf Rules');
  configured = true;
}

// Check for Cline
if (existsSync(join(PROJECT_DIR, '.clinerules'))) {
  setupTemplate('.clinerules', '.clinerules', 'Cline Rules');
  configured = true;
}

// If no specific IDE detected, create generic instructions
if (!configured) {
  setupTemplate('ai-instructions.md', 'ai-instructions.md', 'AI Instructions (generic)');
}

// Provide MCP server configuration guidance
console.log('\n⚙️  MCP Server Configuration\n');
console.log('   Add to your editor\'s MCP config:\n');

const mcpConfig = {
  "react-native-toolkit": {
    "command": "npx",
    "args": ["-y", "mcp-react-native-toolkit"]
  }
};

console.log('   ' + JSON.stringify(mcpConfig, null, 2).split('\n').join('\n   '));

console.log('\n   Config file locations:');
console.log('   • VS Code:  .vscode/mcp.json');
console.log('   • Cursor:   ~/.cursor/mcp.json');
console.log('   • Claude:   ~/Library/Application Support/Claude/claude_desktop_config.json');

console.log('\n✅ Setup complete!\n');
console.log('💡 Tip: Run `npx mcp-react-native-toolkit --help` for more options.\n');
