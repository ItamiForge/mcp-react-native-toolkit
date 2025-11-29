#!/usr/bin/env npx ts-node
/**
 * Template Generator CLI for AI/Agentic Frameworks
 * 
 * Generates configuration files for various AI coding assistants and agentic frameworks
 * to properly integrate with the MCP React Native Toolkit.
 * 
 * Usage:
 *   npx ts-node scripts/generate-templates.ts [framework] [--output-dir ./path]
 *   npx ts-node scripts/generate-templates.ts --list
 *   npx ts-node scripts/generate-templates.ts --all [--output-dir ./path]
 * 
 * Examples:
 *   npx ts-node scripts/generate-templates.ts cursor
 *   npx ts-node scripts/generate-templates.ts vscode-copilot --output-dir ./my-project
 *   npx ts-node scripts/generate-templates.ts --all --output-dir ./my-project
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    generateTemplate,
    generateAllTemplates,
    listFrameworks,
    formatFrameworksList,
    getFrameworkConfig,
    type FrameworkConfig,
    type GeneratedTemplate
} from '../src/template-registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CLI Utilities
// ============================================

function printUsage(): void {
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║            🤖 MCP React Native - AI Template Generator            ║
╚═══════════════════════════════════════════════════════════════════╝

Generate configuration files for AI coding assistants to understand
your React Native project and provide better assistance.

USAGE:
  npx ts-node scripts/generate-templates.ts [command] [options]

COMMANDS:
  <framework>     Generate template for a specific framework
  --list          List all supported frameworks
  --all           Generate templates for all frameworks

OPTIONS:
  --output-dir    Directory to write generated files (default: stdout)
  --no-examples   Don't include code examples in templates
  --help          Show this help message

EXAMPLES:
  # List all supported frameworks
  npx ts-node scripts/generate-templates.ts --list

  # Generate Cursor rules to stdout
  npx ts-node scripts/generate-templates.ts cursor

  # Generate VS Code Copilot instructions to a file
  npx ts-node scripts/generate-templates.ts vscode-copilot --output-dir .

  # Generate all templates to a directory
  npx ts-node scripts/generate-templates.ts --all --output-dir ./ai-configs

SUPPORTED FRAMEWORKS:
  ${listFrameworks().map(f => `${f.id.padEnd(16)} - ${f.name}`).join('\n  ')}
`);
}

function printFrameworkList(): void {
    console.log(formatFrameworksList());
    console.log('\n💡 Use any framework ID as a command to generate its template.\n');
}

function ensureDirectoryExists(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function writeTemplate(template: GeneratedTemplate, outputDir: string): void {
    const outputPath = path.join(outputDir, template.outputPath);
    ensureDirectoryExists(outputPath);
    fs.writeFileSync(outputPath, template.content, 'utf-8');
    console.log(`✅ Generated: ${outputPath}`);
}

// ============================================
// CLI Main
// ============================================

function main(): void {
    const args = process.argv.slice(2);

    // Parse arguments
    let command: string | undefined;
    let outputDir: string | undefined;
    let includeExamples = true;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--help' || arg === '-h') {
            printUsage();
            process.exit(0);
        }

        if (arg === '--list' || arg === '-l') {
            command = 'list';
            continue;
        }

        if (arg === '--all' || arg === '-a') {
            command = 'all';
            continue;
        }

        if (arg === '--output-dir' || arg === '-o') {
            outputDir = args[++i];
            continue;
        }

        if (arg === '--no-examples') {
            includeExamples = false;
            continue;
        }

        // If it's not a flag, it's the framework ID
        if (!arg.startsWith('-')) {
            command = arg;
        }
    }

    // No command provided - show usage
    if (!command) {
        printUsage();
        process.exit(0);
    }

    // List frameworks
    if (command === 'list') {
        printFrameworkList();
        process.exit(0);
    }

    // Generate all templates
    if (command === 'all') {
        console.log('\n🤖 Generating templates for all frameworks...\n');

        const allTemplates = generateAllTemplates(includeExamples);

        if (outputDir) {
            for (const template of allTemplates) {
                writeTemplate(template, outputDir);
            }
            console.log(`\n✨ Generated ${allTemplates.length} templates in ${outputDir}\n`);
        } else {
            // Output to stdout
            for (const template of allTemplates) {
                console.log(`\n${'='.repeat(60)}`);
                console.log(`📄 ${template.framework.name} (${template.outputPath})`);
                console.log('='.repeat(60));
                console.log(template.content);
            }
        }
        process.exit(0);
    }

    // Generate specific framework template
    const config = getFrameworkConfig(command);
    if (!config) {
        console.error(`❌ Unknown framework: "${command}"`);
        console.error(`\nRun with --list to see available frameworks.\n`);
        process.exit(1);
    }

    const template = generateTemplate(command, includeExamples);
    if (!template) {
        console.error(`❌ Failed to generate template for: ${command}`);
        process.exit(1);
    }

    if (outputDir) {
        writeTemplate(template, outputDir);
        console.log(`\n✨ Template generated successfully!\n`);
    } else {
        // Output to stdout
        console.log(template.content);
    }
}

// Run the CLI
main();
