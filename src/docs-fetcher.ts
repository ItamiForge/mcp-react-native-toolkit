/**
 * On-Demand Documentation Fetcher
 *
 * Fetches version-specific documentation when first requested.
 * Uses git sparse-checkout for fast, targeted downloads.
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Types
// ============================================================================

interface DocSource {
    id: string;
    name: string;
    repo: string;
    docsPath: string;
    branch: string;
    versionStrategy: 'none' | 'sdk-branch' | 'versioned-folder';
    versionBranchPattern?: string;
    preprocessingRules?: {
        stripComments?: boolean;
        removeNavigation?: boolean;
        minifyWhitespace?: boolean;
    };
}

interface FetchResult {
    success: boolean;
    source: string;
    version: string;
    fileCount: number;
    error?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const DOCS_ROOT = path.join(__dirname, '..', 'docs');
const TEMP_DIR = path.join(__dirname, '..', '.temp_fetch');
const SOURCES_FILE = path.join(__dirname, '..', 'docs-sources.json');

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

// Default timeout for git operations (60 seconds)
const GIT_TIMEOUT_MS = 60000;

/**
 * Checks if git is available on the system
 * @returns true if git is installed and accessible, false otherwise
 */
export async function checkGitAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
        const proc = spawn('git', ['--version'], { stdio: ['pipe', 'pipe', 'pipe'] });
        
        proc.on('close', (code) => {
            resolve(code === 0);
        });
        
        proc.on('error', () => {
            resolve(false);
        });
    });
}

/**
 * Executes a git command with timeout support
 * @param args - Git command arguments
 * @param cwd - Working directory
 * @param timeoutMs - Timeout in milliseconds (default: 60000)
 * @returns Promise resolving to stdout on success
 */
function gitAsync(args: string[], cwd: string, timeoutMs: number = GIT_TIMEOUT_MS): Promise<string> {
    return new Promise((resolve, reject) => {
        const proc = spawn('git', args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
        let stdout = '';
        let stderr = '';
        let settled = false;

        // Set up timeout
        const timeout = setTimeout(() => {
            if (settled) return;
            settled = true;
            proc.kill('SIGTERM');
            // Force kill after 5 seconds if SIGTERM doesn't work
            setTimeout(() => proc.kill('SIGKILL'), 5000);
            reject(new Error(`Git operation timed out after ${timeoutMs / 1000} seconds. The operation may be taking too long or the network connection may be slow.`));
        }, timeoutMs);

        proc.stdout.on('data', (data) => { stdout += data.toString(); });
        proc.stderr.on('data', (data) => { stderr += data.toString(); });

        proc.on('close', (code) => {
            clearTimeout(timeout);
            if (settled) return;
            settled = true;
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(stderr || `Git exited with code ${code}`));
            }
        });

        proc.on('error', (err) => {
            clearTimeout(timeout);
            if (settled) return;
            settled = true;
            // Check if it's a spawn error (git not found)
            if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                reject(new Error('Git is not installed or not found in PATH. Please install git to fetch documentation.'));
            } else {
                reject(err);
            }
        });
    });
}

function loadSources(): DocSource[] {
    const content = fs.readFileSync(SOURCES_FILE, 'utf-8');
    const config = JSON.parse(content);
    return config.sources;
}

function getSourceById(id: string): DocSource | undefined {
    return loadSources().find((s) => s.id === id);
}

// ============================================================================
// Version Resolution
// ============================================================================

/**
 * Extracts major version from a semver string
 * e.g., "^52.0.14" → 52, "~7.1.0" → 7
 */
export function extractMajorVersion(version: string): number | null {
    const cleaned = version.replace(/^[\^~>=<]+/, '');
    const match = cleaned.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : null;
}

/**
 * Gets the branch name for a specific version
 */
function getBranchForVersion(source: DocSource, majorVersion: number): string {
    if (source.versionStrategy === 'sdk-branch' && source.versionBranchPattern) {
        return source.versionBranchPattern.replace('{major}', majorVersion.toString());
    }
    return source.branch;
}

/**
 * Gets the docs path for a specific version
 */
function getDocsPathForVersion(source: DocSource, majorVersion: number): string {
    if (source.versionStrategy === 'versioned-folder') {
        return source.docsPath.replace('{major}', majorVersion.toString());
    }
    return source.docsPath;
}

/**
 * Checks if docs exist for a specific library and version
 */
export function docsExist(library: string, version: string): boolean {
    const docsPath = path.join(DOCS_ROOT, library, version);
    return fs.existsSync(docsPath) && fs.readdirSync(docsPath).length > 0;
}

// ============================================================================
// Preprocessing
// ============================================================================

function preprocessMarkdown(content: string): string {
    let processed = content;

    // Remove MDX imports and exports
    processed = processed.replace(/^import\s+.*?;?\s*$/gm, '');
    processed = processed.replace(/^export\s+(?:default\s+)?.*?(?:;|\n)/gm, '');

    // Remove HTML/JSX comments
    processed = processed.replace(/<!--[\s\S]*?-->/g, '');
    processed = processed.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

    // Remove MDX components
    processed = processed.replace(/<[A-Z][a-zA-Z]*[^>]*(?:\/>|>[\s\S]*?<\/[A-Z][a-zA-Z]*>)/g, '');

    // Remove Tabs/TabItem wrappers
    processed = processed.replace(/<\/?(?:Tabs|TabItem)[^>]*>\s*/g, '');

    // Remove orphaned JSX tags
    processed = processed.replace(/^\s*<\/[A-Z][a-zA-Z]*>\s*$/gm, '');
    processed = processed.replace(/^\s*<[A-Z][a-zA-Z.]*[^>]*>\s*$/gm, '');

    // Normalize code blocks
    processed = processed.replace(/```(?:SnackPlayer|snack)[^\n]*\n/g, '```tsx\n');

    // Remove excessive blank lines
    processed = processed.replace(/\n{4,}/g, '\n\n');

    // Remove trailing whitespace
    processed = processed.replace(/[ \t]+$/gm, '');

    return processed.trim() + '\n';
}

// ============================================================================
// Fetching
// ============================================================================

/**
 * Creates a descriptive error message for git clone failures
 */
function formatCloneError(repoUrl: string, branch: string, errorMsg: string): string {
    if (errorMsg.includes('could not find remote branch')) {
        return `Failed to clone repository: Branch '${branch}' not found in ${repoUrl}`;
    }
    if (errorMsg.includes('Repository not found') || errorMsg.includes('not found')) {
        return `Failed to clone repository: Repository not found at ${repoUrl}. Please verify the URL is correct and accessible.`;
    }
    if (errorMsg.includes('Authentication failed') || errorMsg.includes('could not read Username')) {
        return `Failed to clone repository: Authentication required for ${repoUrl}. This may be a private repository.`;
    }
    if (errorMsg.includes('timed out')) {
        return `Failed to clone repository: Operation timed out while accessing ${repoUrl}. Please check your network connection.`;
    }
    return `Failed to clone repository ${repoUrl} (branch: ${branch}): ${errorMsg}`;
}

/**
 * Creates a descriptive error message for missing docs path
 */
function formatDocsPathError(repoUrl: string, docsPath: string): string {
    return `Documentation path '${docsPath}' not found in repository ${repoUrl}. The repository structure may have changed or the path may be incorrect.`;
}

/**
 * Fetches docs for a specific library and version using sparse checkout
 */
export async function fetchDocsForVersion(
    library: string,
    version: string,
    options: { quiet?: boolean; timeoutMs?: number } = {}
): Promise<FetchResult> {
    const source = getSourceById(library);
    if (!source) {
        return {
            success: false,
            source: library,
            version,
            fileCount: 0,
            error: `Unknown library: ${library}`,
        };
    }

    // Check if git is available before attempting any git operations
    const gitAvailable = await checkGitAvailable();
    if (!gitAvailable) {
        const errorMsg = 'Git is not installed or not found in PATH. Please install git to fetch documentation. Visit https://git-scm.com/downloads for installation instructions.';
        if (!options.quiet) {
            console.error(`❌ [${library}] ${errorMsg}`);
        }
        return {
            success: false,
            source: library,
            version,
            fileCount: 0,
            error: errorMsg,
        };
    }

    const majorVersion = extractMajorVersion(version);
    const versionFolder = majorVersion ? majorVersion.toString() : 'latest';
    const targetDir = path.join(DOCS_ROOT, library, versionFolder);

    // Check if already cached
    if (docsExist(library, versionFolder)) {
        if (!options.quiet) {
            console.log(`📚 [${library}] Using cached docs (v${versionFolder})`);
        }
        const fileCount = countFiles(targetDir);
        return { success: true, source: library, version: versionFolder, fileCount };
    }

    if (!options.quiet) {
        console.log(`📥 [${library}] Fetching docs for version ${versionFolder}...`);
    }

    const startTime = Date.now();
    const cloneDir = path.join(TEMP_DIR, `${library}-${Date.now()}`);
    const timeoutMs = options.timeoutMs || GIT_TIMEOUT_MS;

    // Track branch and docsPath for error messages
    let branch = '';
    let docsPath = '';

    try {
        ensureDir(TEMP_DIR);
        ensureDir(targetDir);

        // Determine branch and path based on version strategy
        branch = getBranchForVersion(source, majorVersion || 0);
        docsPath = getDocsPathForVersion(source, majorVersion || 0);

        // Clone with sparse checkout
        await gitAsync(
            ['clone', '--filter=blob:none', '--no-checkout', '--sparse', '--depth=1',
             '--branch', branch, source.repo, cloneDir],
            TEMP_DIR,
            timeoutMs
        );

        // Set sparse checkout path
        await gitAsync(['sparse-checkout', 'set', docsPath], cloneDir, timeoutMs);

        // Checkout files
        await gitAsync(['checkout'], cloneDir, timeoutMs);

        // Copy and process markdown files
        const sourceDocsDir = path.join(cloneDir, docsPath);
        
        // Check if docs path exists after checkout
        if (!fs.existsSync(sourceDocsDir)) {
            removeDir(cloneDir);
            const errorMsg = formatDocsPathError(source.repo, docsPath);
            if (!options.quiet) {
                console.error(`❌ [${library}] ${errorMsg}`);
            }
            return { success: false, source: library, version: versionFolder, fileCount: 0, error: errorMsg };
        }
        
        const fileCount = await processMarkdownFiles(sourceDocsDir, targetDir);

        // Cleanup
        removeDir(cloneDir);

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        if (!options.quiet) {
            console.log(`✅ [${library}] Fetched ${fileCount} files in ${duration}s`);
        }

        return { success: true, source: library, version: versionFolder, fileCount };
    } catch (error) {
        removeDir(cloneDir);
        const rawErrorMsg = error instanceof Error ? error.message : String(error);
        
        // Format error message with repository context
        const errorMsg = formatCloneError(source.repo, branch, rawErrorMsg);

        // If version-specific branch doesn't exist, fall back to latest
        if (majorVersion && rawErrorMsg.includes('could not find remote branch')) {
            if (!options.quiet) {
                console.log(`⚠️ [${library}] Branch for v${majorVersion} not found, falling back to latest`);
            }
            return fetchDocsForVersion(library, 'latest', options);
        }

        if (!options.quiet) {
            console.error(`❌ [${library}] ${errorMsg}`);
        }
        return { success: false, source: library, version: versionFolder, fileCount: 0, error: errorMsg };
    }
}

async function processMarkdownFiles(sourceDir: string, targetDir: string): Promise<number> {
    if (!fs.existsSync(sourceDir)) {
        return 0;
    }

    let fileCount = 0;

    function processDir(currentSource: string, currentTarget: string): void {
        ensureDir(currentTarget);
        const entries = fs.readdirSync(currentSource, { withFileTypes: true });

        for (const entry of entries) {
            const sourcePath = path.join(currentSource, entry.name);
            let targetPath = path.join(currentTarget, entry.name);

            if (entry.isDirectory()) {
                // Skip non-doc directories
                if (['_', 'assets', 'static', 'img', 'images'].some(s => entry.name.startsWith(s))) {
                    continue;
                }
                processDir(sourcePath, targetPath);
            } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
                // Convert .mdx to .md
                if (entry.name.endsWith('.mdx')) {
                    targetPath = targetPath.replace(/\.mdx$/, '.md');
                }

                // Skip certain files
                if (/^_|changelog|index\.md$/i.test(entry.name)) {
                    continue;
                }

                const content = fs.readFileSync(sourcePath, 'utf-8');
                const processed = preprocessMarkdown(content);
                fs.writeFileSync(targetPath, processed, 'utf-8');
                fileCount++;
            }
        }
    }

    processDir(sourceDir, targetDir);
    return fileCount;
}

function countFiles(dir: string): number {
    if (!fs.existsSync(dir)) return 0;

    let count = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory()) {
            count += countFiles(path.join(dir, entry.name));
        } else if (entry.name.endsWith('.md')) {
            count++;
        }
    }

    return count;
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Fetches docs for multiple libraries at once
 */
export async function fetchDocsForProject(
    versions: {
        reactNative?: string;
        expo?: string;
        reactNavigation?: string;
        ignite?: boolean;
        reanimated?: string;
        gestureHandler?: string;
        mmkv?: string;
        skia?: string;
    },
    options: { quiet?: boolean } = {}
): Promise<FetchResult[]> {
    const fetches: Promise<FetchResult>[] = [];

    if (versions.reactNative) {
        fetches.push(fetchDocsForVersion('react-native', versions.reactNative, options));
    }
    if (versions.expo) {
        fetches.push(fetchDocsForVersion('expo', versions.expo, options));
    }
    if (versions.reactNavigation) {
        fetches.push(fetchDocsForVersion('react-navigation', versions.reactNavigation, options));
    }
    if (versions.ignite) {
        fetches.push(fetchDocsForVersion('ignite', 'latest', options));
    }
    if (versions.reanimated) {
        fetches.push(fetchDocsForVersion('react-native-reanimated', versions.reanimated, options));
    }
    if (versions.gestureHandler) {
        fetches.push(fetchDocsForVersion('react-native-gesture-handler', versions.gestureHandler, options));
    }
    if (versions.mmkv) {
        fetches.push(fetchDocsForVersion('react-native-mmkv', versions.mmkv, options));
    }
    if (versions.skia) {
        fetches.push(fetchDocsForVersion('react-native-skia', versions.skia, options));
    }

    return Promise.all(fetches);
}

/**
 * Cleans up temporary fetch directory
 */
export function cleanupTemp(): void {
    removeDir(TEMP_DIR);
}
