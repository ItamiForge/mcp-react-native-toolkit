#!/usr/bin/env tsx
/**
 * Documentation Optimizer
 *
 * Cleans up fetched documentation to minimize token usage while preserving
 * essential technical content. Removes MDX components, redundant formatting,
 * and non-essential content.
 *
 * Usage: npm run optimize-docs
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Configuration
// ============================================================================

const DOCS_ROOT = path.join(process.cwd(), 'docs');

interface Stats {
    filesProcessed: number;
    filesDeleted: number;
    originalSize: number;
    optimizedSize: number;
    savings: number;
}

// Files to delete (not useful for LLM context)
const DELETE_PATTERNS = [
    /^_/, // Files starting with underscore (partials, includes)
    /changelog/i,
    /upgrade-helper/i,
    /release-notes/i,
    /^index\.md$/, // Index files (navigation only)
    /versions\.md$/,
    /CHANGELOG/,
];

// Directories to skip entirely
const SKIP_DIRS = [
    'archive',
    'versions',
    'community',
    'blog',
    'assets',
    'static',
    'img',
    'images',
    '_',
];

// ============================================================================
// Optimization Rules
// ============================================================================

const optimizations: Array<{
    name: string;
    pattern: RegExp;
    replacement: string | ((match: string, ...args: string[]) => string);
}> = [
    // Remove frontmatter entirely or simplify to just title
    {
        name: 'simplify-frontmatter',
        pattern: /^---\n([\s\S]*?)\n---\n*/,
        replacement: (match, content) => {
            const titleMatch = content.match(/title:\s*["']?([^"'\n]+)["']?/);
            const descMatch = content.match(/description:\s*["']?([^"'\n]+)["']?/);
            if (titleMatch) {
                const title = titleMatch[1].trim();
                const desc = descMatch ? `\n${descMatch[1].trim()}` : '';
                return `# ${title}${desc}\n\n`;
            }
            return '';
        },
    },

    // Remove MDX imports
    {
        name: 'remove-imports',
        pattern: /^import\s+.*?(?:from\s+['"].*?['"])?;?\s*$/gm,
        replacement: '',
    },

    // Remove MDX exports
    {
        name: 'remove-exports',
        pattern: /^export\s+(?:default\s+)?(?:const|let|var|function|class)?\s*.*?(?:;|\n)/gm,
        replacement: '',
    },

    // Remove HTML comments
    {
        name: 'remove-html-comments',
        pattern: /<!--[\s\S]*?-->/g,
        replacement: '',
    },

    // Remove JSX comments
    {
        name: 'remove-jsx-comments',
        pattern: /\{\/\*[\s\S]*?\*\/\}/g,
        replacement: '',
    },

    // Remove custom MDX components (BoxLink, Card, etc.)
    {
        name: 'remove-mdx-components',
        pattern: /<(?:BoxLink|Card|ContentSpotlight|Terminal|Collapsible|Step|SnackInline|ThemedImage|PlatformTabs|CreateExpoApp|YouTubeEmbed|Video|ImageSpotlight|ProgressTracker|ConfigReactNative|ScreenContainer|Diagram|APIBox|APISection|PlatformSection|DeviceName|InlineButton|PageSection|CreateExpoModuleVideo)[^>]*(?:\/>|>[\s\S]*?<\/[A-Z][a-zA-Z]*>)/g,
        replacement: '',
    },

    // Remove Tabs/TabItem completely - extract code blocks only
    {
        name: 'remove-tabs-wrapper',
        pattern: /<Tabs[^>]*>\s*/g,
        replacement: '',
    },
    {
        name: 'remove-tabs-close',
        pattern: /<\/Tabs>\s*/g,
        replacement: '',
    },
    {
        name: 'remove-tabitem-wrapper',
        pattern: /<TabItem[^>]*>\s*/g,
        replacement: '',
    },
    {
        name: 'remove-tabitem-close',
        pattern: /<\/TabItem>\s*/g,
        replacement: '',
    },

    // Remove remaining JSX-style tags
    {
        name: 'remove-jsx-tags',
        pattern: /<[A-Z][a-zA-Z]*[^>]*(?:\/>|>[\s\S]*?<\/[A-Z][a-zA-Z]*>)/g,
        replacement: '',
    },

    // Remove Snack player markers
    {
        name: 'remove-snack-markers',
        pattern: /```(?:SnackPlayer|snack)[^\n]*\n/g,
        replacement: '```tsx\n',
    },

    // Clean up code block language hints
    {
        name: 'normalize-codeblocks',
        pattern: /```(\w+)\s+(?:title|name)=["'][^"']*["']\s*\n/g,
        replacement: '```$1\n',
    },

    // Remove bare self-closing HTML tags
    {
        name: 'remove-self-closing-tags',
        pattern: /<(?:br|hr|img)[^>]*\/?>/gi,
        replacement: '',
    },

    // Remove orphaned JSX closing tags (like </View>, </FadeInView>)
    {
        name: 'remove-orphan-jsx-close',
        pattern: /^\s*<\/[A-Z][a-zA-Z]*>\s*$/gm,
        replacement: '',
    },

    // Remove orphaned JSX opening tags
    {
        name: 'remove-orphan-jsx-open',
        pattern: /^\s*<[A-Z][a-zA-Z.]*[^>]*>\s*$/gm,
        replacement: '',
    },

    // Remove platform-specific tabs, keep content
    {
        name: 'remove-platform-tabs',
        pattern: /<(?:PlatformTabs|PlatformSection)[^>]*>([\s\S]*?)<\/(?:PlatformTabs|PlatformSection)>/g,
        replacement: '$1',
    },

    // Remove inline styles
    {
        name: 'remove-inline-styles',
        pattern: /\s*style=\{[^}]+\}/g,
        replacement: '',
    },

    // Remove className attributes
    {
        name: 'remove-classnames',
        pattern: /\s*className=["'][^"']*["']/g,
        replacement: '',
    },

    // Simplify markdown links - keep just text if URL is relative page link
    {
        name: 'simplify-internal-links',
        pattern: /\[([^\]]+)\]\(\/[^)]*\)/g,
        replacement: '**$1**',
    },

    // Remove duplicate code blocks with identical language (from Tab extraction)
    {
        name: 'dedupe-codeblocks',
        pattern: /```(\w+)\n([\s\S]*?)```\n+```\1\n/g,
        replacement: '```$1\n$2```\n\n```$1\n',
    },

    // Remove empty or near-empty code blocks
    {
        name: 'remove-empty-codeblocks',
        pattern: /```\w*\n\s*\n*```/g,
        replacement: '',
    },

    // Remove code blocks that only have closing JSX/whitespace
    {
        name: 'remove-broken-codeblocks',
        pattern: /```tsx?\n[\s\S]{0,50}\);\s*\n\};\s*\n```/g,
        replacement: '',
    },

    // Remove excessive blank lines (more than 2)
    {
        name: 'reduce-blank-lines',
        pattern: /\n{4,}/g,
        replacement: '\n\n',
    },

    // Remove trailing whitespace
    {
        name: 'remove-trailing-whitespace',
        pattern: /[ \t]+$/gm,
        replacement: '',
    },

    // Remove admonition/callout syntax, keep content
    {
        name: 'simplify-admonitions',
        pattern: /:::(?:note|tip|info|warning|danger|caution|important)?\s*(?:\[.*?\])?\s*\n([\s\S]*?):::/g,
        replacement: '> $1',
    },

    // Remove blockquote emoji markers
    {
        name: 'simplify-blockquotes',
        pattern: /> (?:ℹ️|⚠️|💡|🚨|📝|✅|❌)\s*/g,
        replacement: '> ',
    },

    // Condense multiple spaces
    {
        name: 'condense-spaces',
        pattern: /  +/g,
        replacement: ' ',
    },

    // Remove empty links
    {
        name: 'remove-empty-links',
        pattern: /\[([^\]]*)\]\(\s*\)/g,
        replacement: '$1',
    },

    // Remove anchor links
    {
        name: 'remove-anchor-links',
        pattern: /\[([^\]]+)\]\(#[^)]*\)/g,
        replacement: '$1',
    },
];

// ============================================================================
// Functions
// ============================================================================

function shouldDelete(filePath: string): boolean {
    const fileName = path.basename(filePath);
    return DELETE_PATTERNS.some((pattern) => pattern.test(fileName));
}

function shouldSkipDir(dirName: string): boolean {
    return SKIP_DIRS.includes(dirName.toLowerCase()) || dirName.startsWith('_');
}

function optimizeContent(content: string): string {
    let result = content;

    for (const opt of optimizations) {
        if (typeof opt.replacement === 'function') {
            result = result.replace(opt.pattern, opt.replacement);
        } else {
            result = result.replace(opt.pattern, opt.replacement);
        }
    }

    // Final cleanup pass
    result = result.trim() + '\n';

    return result;
}

function processFile(filePath: string, stats: Stats): void {
    const content = fs.readFileSync(filePath, 'utf-8');
    const originalSize = Buffer.byteLength(content, 'utf-8');

    stats.originalSize += originalSize;

    // Check if file should be deleted
    if (shouldDelete(filePath)) {
        fs.unlinkSync(filePath);
        stats.filesDeleted++;
        return;
    }

    // Optimize content
    const optimized = optimizeContent(content);
    const optimizedSize = Buffer.byteLength(optimized, 'utf-8');

    // Only write if there are meaningful changes
    if (optimized !== content) {
        fs.writeFileSync(filePath, optimized, 'utf-8');
    }

    stats.optimizedSize += optimizedSize;
    stats.filesProcessed++;
}

function processDirectory(dir: string, stats: Stats): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (!shouldSkipDir(entry.name)) {
                processDirectory(fullPath, stats);
            } else {
                // Delete skipped directories
                fs.rmSync(fullPath, { recursive: true, force: true });
            }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
            processFile(fullPath, stats);
        }
    }

    // Remove empty directories
    try {
        const remaining = fs.readdirSync(dir);
        if (remaining.length === 0) {
            fs.rmdirSync(dir);
        }
    } catch {
        // Directory might have been deleted already
    }
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          Documentation Optimizer for LLM Context           ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    if (!fs.existsSync(DOCS_ROOT)) {
        console.error('❌ docs/ directory not found. Run fetch-docs first.');
        process.exit(1);
    }

    const startTime = Date.now();
    const stats: Stats = {
        filesProcessed: 0,
        filesDeleted: 0,
        originalSize: 0,
        optimizedSize: 0,
        savings: 0,
    };

    console.log('🔧 Optimizing documentation...');
    console.log('');

    // Process each source directory
    const sources = fs.readdirSync(DOCS_ROOT, { withFileTypes: true });
    for (const source of sources) {
        if (source.isDirectory()) {
            const sourceDir = path.join(DOCS_ROOT, source.name);
            const beforeFiles = stats.filesProcessed;
            const beforeDeleted = stats.filesDeleted;
            const beforeSize = stats.originalSize;

            processDirectory(sourceDir, stats);

            const filesChanged = stats.filesProcessed - beforeFiles;
            const filesDeleted = stats.filesDeleted - beforeDeleted;
            const sourceSizeBefore = stats.originalSize - beforeSize;

            console.log(
                `  📁 ${source.name.padEnd(20)} ${filesChanged} optimized, ${filesDeleted} deleted`
            );
        }
    }

    stats.savings = stats.originalSize - stats.optimizedSize;
    const savingsPercent = ((stats.savings / stats.originalSize) * 100).toFixed(1);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('');
    console.log('─'.repeat(62));
    console.log('📊 RESULTS');
    console.log('─'.repeat(62));
    console.log(`  Files processed:  ${stats.filesProcessed}`);
    console.log(`  Files deleted:    ${stats.filesDeleted}`);
    console.log(`  Original size:    ${formatBytes(stats.originalSize)}`);
    console.log(`  Optimized size:   ${formatBytes(stats.optimizedSize)}`);
    console.log(`  Token savings:    ~${savingsPercent}% (${formatBytes(stats.savings)})`);
    console.log(`  Time:             ${duration}s`);
    console.log('─'.repeat(62));
    console.log('');
}

main();
