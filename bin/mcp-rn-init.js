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
import { homedir } from 'os';

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

/**
 * Setup MCP server configuration in .vscode/mcp.json
 * - Creates if doesn't exist
 * - Merges into existing config without overwriting other servers
 */
function setupVSCodeMcpConfig() {
  const mcpConfigPath = join(PROJECT_DIR, '.vscode', 'mcp.json');
  const vscodeDir = join(PROJECT_DIR, '.vscode');
  
  const serverConfig = {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "mcp-react-native-toolkit"]
  };

  // Ensure .vscode directory exists
  if (!existsSync(vscodeDir)) {
    mkdirSync(vscodeDir, { recursive: true });
  }

  if (existsSync(mcpConfigPath)) {
    try {
      const existing = JSON.parse(readFileSync(mcpConfigPath, 'utf-8'));
      
      // Check if already configured
      if (existing.servers?.['react-native-toolkit']) {
        console.log('  ✓ VS Code MCP config (already configured)');
        return true;
      }
      
      // Merge into existing config
      existing.servers = existing.servers || {};
      existing.servers['react-native-toolkit'] = serverConfig;
      
      writeFileSync(mcpConfigPath, JSON.stringify(existing, null, 2) + '\n');
      console.log('  + Updated VS Code MCP config (.vscode/mcp.json)');
      return true;
    } catch (err) {
      console.log(`  ⚠️  Could not parse existing .vscode/mcp.json: ${err.message}`);
      return false;
    }
  } else {
    // Create new config
    const newConfig = {
      servers: {
        'react-native-toolkit': serverConfig
      }
    };
    writeFileSync(mcpConfigPath, JSON.stringify(newConfig, null, 2) + '\n');
    console.log('  + Created VS Code MCP config (.vscode/mcp.json)');
    return true;
  }
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

// Setup MCP server configuration
console.log('\n⚙️  MCP Server Configuration\n');

// Auto-configure VS Code (project-local config is safe)
if (existsSync(join(PROJECT_DIR, '.vscode'))) {
  setupVSCodeMcpConfig();
}

// For global configs, just print instructions (safer)
const cursorConfig = join(homedir(), '.cursor', 'mcp.json');
const claudeConfig = join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');

const hasGlobalConfigs = existsSync(cursorConfig) || existsSync(claudeConfig);

if (hasGlobalConfigs) {
  console.log('\n   For other AI tools, add this to their config:\n');
  
  const mcpServerSnippet = {
    "react-native-toolkit": {
      "command": "npx",
      "args": ["-y", "mcp-react-native-toolkit"]
    }
  };
  
  console.log('   ' + JSON.stringify(mcpServerSnippet, null, 2).split('\n').join('\n   '));
  
  if (existsSync(cursorConfig)) {
    console.log(`\n   • Cursor: ~/.cursor/mcp.json`);
  }
  if (existsSync(claudeConfig)) {
    console.log(`   • Claude: ~/Library/Application Support/Claude/claude_desktop_config.json`);
  }
}

console.log('\n✅ Setup complete!\n');
