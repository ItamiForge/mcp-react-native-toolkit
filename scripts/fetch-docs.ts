#!/usr/bin/env tsx
/**
 * Fetch Documentation Script v3.0 - Git Sparse Checkout Edition
 *
 * Downloads documentation using git sparse-checkout with --filter=blob:none
 * This is the FASTEST method as it:
 * 1. Downloads only the folder we need (not entire repo)
 * 2. Uses git's efficient pack protocol (single bulk transfer)
 * 3. No individual HTTP requests per file
 *
 * Performance: ~3-8 seconds for 1200+ files
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const DOCS_ROOT = path.join(PROJECT_ROOT, 'docs');
const TEMP_DIR = path.join(PROJECT_ROOT, '.temp_clone');

// Load configuration
const configPath = path.join(PROJECT_ROOT, 'docs-sources.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

interface DocSource {
    id: string;
    name: string;
    repo: string;
    docsPath: string;
    branch: string;
    versions: string[];
    preprocessingRules?: PreprocessingRules;
}

interface PreprocessingRules {
    stripComments: boolean;
    removeNavigation: boolean;
    minifyWhitespace: boolean;
}

interface Settings {
    preprocessMarkdown: boolean;
}

interface FetchResult {
    source: string;
    success: boolean;
    fileCount: number;
    duration: number;
    error?: string;
}

const sources: DocSource[] = config.sources;
const settings: Settings = config.settings || { preprocessMarkdown: true };

// ============================================================================
// Utility Functions
// ============================================================================

function ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function removeDir(dir: string): void {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

function parseGitHubUrl(repoUrl: string): { owner: string; repo: string } {
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (!match) {
        throw new Error(`Invalid GitHub URL: ${repoUrl}`);
    }
    return { owner: match[1], repo: match[2] };
}

/**
 * Run a git command asynchronously and return stdout
 */
function gitAsync(args: string[], cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const proc = spawn('git', args, {
            cwd,
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';
        let settled = false;

        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        proc.on('close', (code) => {
            if (settled) return;
            settled = true;
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(stderr || `Git exited with code ${code}`));
            }
        });

        proc.on('error', (err) => {
            if (settled) return;
            settled = true;
            reject(err);
        });
    });
}

// ============================================================================
// Preprocessing
// ============================================================================

function preprocessMarkdown(content: string, rules?: PreprocessingRules): string {
    if (!rules) return content;

    let processed = content;

    // Remove MDX imports and exports
    processed = processed.replace(/^import\s+.*?;?\s*$/gm, '');
    processed = processed.replace(/^export\s+.*?;?\s*$/gm, '');

    if (rules.stripComments) {
        processed = processed.replace(/<!--[\s\S]*?-->/g, '');
        processed = processed.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    }

    if (rules.removeNavigation) {
        processed = processed.replace(/\[.*?\]\(#.*?\)/g, '');
        processed = processed.replace(/^---\s*$/gm, '');
    }

    if (rules.minifyWhitespace) {
        const codeBlocks: string[] = [];
        processed = processed.replace(/(```[\s\S]*?```)/g, (match) => {
            codeBlocks.push(match);
            return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
        });
        processed = processed.replace(/\n{3,}/g, '\n\n');
        processed = processed.replace(/[ \t]+$/gm, '');
        processed = processed.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => {
            return codeBlocks[parseInt(idx)];
        });
    }

    return processed.trim();
}

/**
 * Recursively process and copy markdown files
 */
function processMarkdownFiles(
    srcDir: string,
    destDir: string,
    rules?: PreprocessingRules
): number {
    let count = 0;

    if (!fs.existsSync(srcDir)) {
        return count;
    }

    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);

        if (entry.isDirectory()) {
            ensureDir(destPath);
            count += processMarkdownFiles(srcPath, destPath, rules);
        } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
            let content = fs.readFileSync(srcPath, 'utf-8');

            if (settings.preprocessMarkdown && rules) {
                content = preprocessMarkdown(content, rules);
            }

            // Convert .mdx to .md
            const finalPath = destPath.replace(/\.mdx$/, '.md');
            fs.writeFileSync(finalPath, content, 'utf-8');
            count++;
        }
    }

    return count;
}

// ============================================================================
// Git Sparse Checkout
// ============================================================================

async function fetchWithSparseCheckout(source: DocSource): Promise<FetchResult> {
    const startTime = Date.now();
    const prefix = `[${source.id}]`.padEnd(20);
    const { owner, repo } = parseGitHubUrl(source.repo);
    const cloneDir = path.join(TEMP_DIR, source.id);
    const targetDir = path.join(DOCS_ROOT, source.id, 'latest');

    try {
        // Clean up any previous clone
        removeDir(cloneDir);
        ensureDir(cloneDir);

        console.log(`${prefix} 📥 Cloning (sparse)...`);

        // Step 1: Clone with blob filter and sparse mode (no files downloaded yet)
        await gitAsync(
            [
                'clone',
                '--filter=blob:none',
                '--no-checkout',
                '--depth=1',
                '--sparse',
                `--branch=${source.branch}`,
                source.repo,
                '.',
            ],
            cloneDir
        );

        // Step 2: Set sparse-checkout to only our docs folder
        console.log(`${prefix} 📂 Setting sparse path: ${source.docsPath}`);
        await gitAsync(['sparse-checkout', 'init', '--cone'], cloneDir);
        await gitAsync(['sparse-checkout', 'set', source.docsPath], cloneDir);

        // Step 3: Checkout - this downloads ONLY the files in docsPath
        console.log(`${prefix} 📦 Downloading files...`);
        await gitAsync(['checkout'], cloneDir);

        // Step 4: Copy and preprocess markdown files to docs folder
        const srcDocsPath = path.join(cloneDir, source.docsPath);
        ensureDir(targetDir);

        const fileCount = processMarkdownFiles(srcDocsPath, targetDir, source.preprocessingRules);

        const duration = (Date.now() - startTime) / 1000;
        console.log(`${prefix} ✅ ${fileCount} files in ${duration.toFixed(1)}s`);

        return {
            source: source.name,
            success: true,
            fileCount,
            duration,
        };
    } catch (error) {
        const duration = (Date.now() - startTime) / 1000;
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`${prefix} ❌ ${errorMessage.split('\n')[0]}`);

        return {
            source: source.name,
            success: false,
            fileCount: 0,
            duration,
            error: errorMessage.split('\n')[0],
        };
    }
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
    const startTime = Date.now();

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║        React Native Documentation Fetcher v3.0             ║');
    console.log('║         Git Sparse Checkout • Bulk Downloads               ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📚 Sources: ${sources.map((s) => s.name).join(' • ')}`);
    console.log('─'.repeat(62));

    // Ensure directories exist
    ensureDir(DOCS_ROOT);
    ensureDir(TEMP_DIR);

    // Fetch all sources in parallel
    const results = await Promise.all(sources.map((source) => fetchWithSparseCheckout(source)));

    // Cleanup temp directory
    removeDir(TEMP_DIR);

    // Summary
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const successCount = results.filter((r) => r.success).length;
    const totalFiles = results.reduce((sum, r) => sum + r.fileCount, 0);

    console.log('');
    console.log('─'.repeat(62));
    console.log('📊 SUMMARY');
    console.log('─'.repeat(62));

    for (const result of results) {
        const status = result.success ? '✅' : '❌';
        const files = result.fileCount.toString().padStart(4);
        const time = result.duration.toFixed(1).padStart(5) + 's';
        const name = result.source.padEnd(20);
        if (result.success) {
            console.log(`${status} ${name} ${files} files  ${time}`);
        } else {
            console.log(`${status} ${name} ${result.error}`);
        }
    }

    console.log('─'.repeat(62));
    console.log(`✨ Total: ${totalFiles} files from ${successCount}/${sources.length} sources in ${totalTime}s`);
    console.log('═'.repeat(62));
    console.log('');
}

// Run
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
