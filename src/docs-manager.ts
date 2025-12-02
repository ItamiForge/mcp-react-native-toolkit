import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ContextDetector } from './context-detector.js';
import { semverResolver } from './semver-resolver.js';
import { chunker } from './chunker.js';
import { Indexer } from './indexer.js';
import { fetchDocsForVersion, docsExist, extractMajorVersion } from './docs-fetcher.js';
import { configManager } from './config.js';
import type { DocChunk, SemanticSearchResult, HybridSearchResult, Settings, VersionDiff, SymbolIndexEntry, ModifiedAPI, DocSource } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCS_BASE_PATH = path.join(__dirname, '..', 'docs');

// Legacy interface for compatibility
export interface LegacyDocItem {
    library: string;
    version: string;
    topic: string;
    content: string;
}

export class DocsManager {
    private contextDetector = new ContextDetector();
    private indexer: Indexer;
    private indexBuilt = false;
    private fetchingVersions = new Map<string, Promise<void>>();
    private settings: Settings;

    constructor(private basePath: string = DOCS_BASE_PATH) {
        // Get settings from configManager
        this.settings = configManager.getSettings();
        
        // Create indexer with settings
        this.indexer = new Indexer(basePath, this.settings);
    }

    /**
     * Ensures the index is built before operations that need it
     */
    private async ensureIndex() {
        if (!this.indexBuilt) {
            await this.indexer.buildIndex();
            this.indexBuilt = true;
        }
    }

    /**
     * Ensures docs are available for a library/version, fetching on-demand if needed
     */
    private async ensureDocs(library: string, version: string): Promise<string> {
        const majorVersion = extractMajorVersion(version);
        const versionFolder = majorVersion ? majorVersion.toString() : 'latest';

        // Check if docs already exist
        if (docsExist(library, versionFolder)) {
            return versionFolder;
        }

        // Check if we're already fetching this version
        const fetchKey = `${library}:${versionFolder}`;
        if (this.fetchingVersions.has(fetchKey)) {
            await this.fetchingVersions.get(fetchKey);
            return versionFolder;
        }

        // Fetch docs on-demand
        const fetchPromise = (async () => {
            const result = await fetchDocsForVersion(library, version, { quiet: false });
            if (result.success) {
                // Rebuild index to include new docs
                this.indexBuilt = false;
                await this.ensureIndex();
            }
        })();

        this.fetchingVersions.set(fetchKey, fetchPromise);

        try {
            await fetchPromise;
        } finally {
            this.fetchingVersions.delete(fetchKey);
        }

        return versionFolder;
    }

    /**
     * Resolves the requested version to a concrete version string.
     * If 'auto' is requested, it tries to detect from the project context.
     * If detection fails or version is not found, falls back to 'latest'.
     */
    async resolveVersion(library: string, requestedVersion: string, cwd?: string): Promise<string> {
        let detectedVersion = requestedVersion;

        if (requestedVersion === 'auto' && cwd) {
            // Auto-detect from project
            const context = this.contextDetector.detectContext(cwd);
            if (context?.versions) {
                const versionKey = this.getVersionKey(library);
                detectedVersion = context.versions[versionKey] || 'latest';
            } else {
                detectedVersion = 'latest';
            }
        }

        // Ensure docs are available (fetch on-demand if needed)
        const versionFolder = await this.ensureDocs(library, detectedVersion);

        // Return the available version
        const availableVersions = this.getAvailableVersions(library);
        if (availableVersions.includes(versionFolder)) {
            return versionFolder;
        }

        return 'latest';
    }

    /**
     * Maps library ID to version key in project context
     */
    private getVersionKey(library: string): 'reactNative' | 'expo' | 'reactNavigation' | 'ignite' | 'reanimated' | 'gestureHandler' | 'mmkv' | 'skia' {
        const mapping: Record<string, any> = {
            'react-native': 'reactNative',
            'expo': 'expo',
            'react-navigation': 'reactNavigation',
            'ignite': 'ignite',
            'react-native-reanimated': 'reanimated',
            'react-native-gesture-handler': 'gestureHandler',
            'react-native-mmkv': 'mmkv',
            'react-native-skia': 'skia'
        };
        return mapping[library] || library as any;
    }

    /**
     * Gets available versions for a library
     */
    getAvailableVersions(library: string): string[] {
        const libraryPath = path.join(this.basePath, library);
        if (!fs.existsSync(libraryPath)) {
            return [];
        }

        return fs.readdirSync(libraryPath, { withFileTypes: true })
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);
    }

    /**
     * Gets only enabled documentation sources from configuration.
     * Sources without an explicit enabled field default to true.
     */
    getEnabledSources(): DocSource[] {
        return configManager.getEnabledSources();
    }

    /**
     * Checks if a library is enabled in the configuration.
     * Returns true if the library is not found in config (allows filesystem-only libraries).
     */
    isLibraryEnabled(libraryId: string): boolean {
        const sources = configManager.getSources();
        const source = sources.find(s => s.id === libraryId);
        // If source not found in config, assume enabled (filesystem-only)
        // If source found, check enabled flag (defaults to true)
        return source ? source.enabled !== false : true;
    }

    /**
     * Gets documentation with chunking support
     */
    async getDocChunked(
        library: string,
        version: string,
        topic: string,
        page: number = 1,
        cwd?: string
    ): Promise<DocChunk | null> {
        const targetVersion = await this.resolveVersion(library, version, cwd);
        const docPath = this.findDocPath(library, targetVersion, topic);

        if (!docPath || !fs.existsSync(docPath)) {
            return null;
        }

        const content = fs.readFileSync(docPath, 'utf-8');
        const chunks = chunker.chunk(content, library, targetVersion, topic);

        if (chunks.length === 0) {
            return null;
        }

        // Return the requested page (1-indexed)
        const chunkIndex = page - 1;
        if (chunkIndex < 0 || chunkIndex >= chunks.length) {
            return null;
        }

        return chunks[chunkIndex];
    }

    /**
     * Legacy method: Gets a full document (non-chunked)
     */
    async getDoc(library: string, version: string, topic: string, cwd?: string): Promise<LegacyDocItem | null> {
        const targetVersion = await this.resolveVersion(library, version, cwd);
        const docPath = this.findDocPath(library, targetVersion, topic);

        if (!docPath || !fs.existsSync(docPath)) {
            return null;
        }

        const content = fs.readFileSync(docPath, 'utf-8');
        return {
            library,
            version: targetVersion,
            topic,
            content
        };
    }

    /**
     * Finds the path to a documentation file
     */
    private findDocPath(library: string, version: string, topic: string): string | null {
        // Try exact match first
        let docPath = path.join(this.basePath, library, version, `${topic}.md`);
        if (fs.existsSync(docPath)) {
            return docPath;
        }

        // Try nested paths (topic might include directory structure)
        // Use path.sep for cross-platform compatibility
        const topicPath = topic.replace(/-/g, path.sep);
        docPath = path.join(this.basePath, library, version, `${topicPath}.md`);
        if (fs.existsSync(docPath)) {
            return docPath;
        }

        // Search recursively
        const versionPath = path.join(this.basePath, library, version);
        if (fs.existsSync(versionPath)) {
            const found = this.searchForTopic(versionPath, topic);
            if (found) {
                return found;
            }
        }

        // Fallback to latest if version doesn't exist
        if (version !== 'latest') {
            return this.findDocPath(library, 'latest', topic);
        }

        return null;
    }

    /**
     * Recursively searches for a topic
     */
    private searchForTopic(dir: string, topic: string): string | null {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isFile() && entry.name.endsWith('.md')) {
                const baseName = entry.name.replace('.md', '');
                if (baseName === topic || baseName.toLowerCase() === topic.toLowerCase()) {
                    return fullPath;
                }
            } else if (entry.isDirectory()) {
                const found = this.searchForTopic(fullPath, topic);
                if (found) {
                    return found;
                }
            }
        }

        return null;
    }

    /**
     * Lists all available topics for a library/version
     */
    async listDocs(library: string, version: string = 'latest', cwd?: string): Promise<string[]> {
        const targetVersion = await this.resolveVersion(library, version, cwd);
        await this.ensureIndex();
        return this.indexer.getTopics(library, targetVersion);
    }

    /**
     * Validates if a symbol exists in the documentation
     */
    async validateSymbol(symbol: string, library?: string, version?: string): Promise<boolean> {
        await this.ensureIndex();
        const entries = this.indexer.findSymbol(symbol, library, version);
        return entries.length > 0;
    }

    /**
     * Gets code examples for a topic
     */
    async getExamples(library: string, version: string, topic: string): Promise<Array<{ code: string; language: string }>> {
        await this.ensureIndex();
        const examples = this.indexer.getExamples(library, version, topic);
        return examples.map(ex => ({ code: ex.code, language: ex.language }));
    }

    /**
     * Searches for symbols with fuzzy matching
     */
    async searchSymbols(query: string, limit?: number) {
        await this.ensureIndex();
        return this.indexer.searchSymbols(query, limit);
    }

    /**
     * Gets the indexer instance (for advanced usage)
     */
    getIndexer(): Indexer {
        return this.indexer;
    }

    /**
     * Performs semantic search using embeddings
     * @param query - The search query
     * @param topK - Number of results to return
     * @param library - Optional library filter
     * @param version - Optional version filter
     * @returns Array of semantic search results
     */
    async semanticSearch(
        query: string,
        topK: number = 10,
        library?: string,
        version?: string
    ): Promise<SemanticSearchResult[]> {
        await this.ensureIndex();
        
        try {
            return await this.indexer.semanticSearch(query, topK, library, version);
        } catch (error) {
            console.error('Semantic search failed:', error);
            return [];
        }
    }

    /**
     * Performs hybrid search combining keyword and semantic search
     * @param query - The search query
     * @param topK - Number of results to return
     * @param library - Optional library filter
     * @param version - Optional version filter
     * @returns Array of hybrid search results
     */
    async hybridSearch(
        query: string,
        topK: number = 10,
        library?: string,
        version?: string
    ): Promise<HybridSearchResult[]> {
        await this.ensureIndex();
        
        try {
            return await this.indexer.hybridSearch(query, topK, library, version);
        } catch (error) {
            console.error('Hybrid search failed:', error);
            return [];
        }
    }

    /**
     * Checks if semantic search is enabled
     * @returns true if semantic search is enabled in settings
     */
    isSemanticSearchEnabled(): boolean {
        return this.indexer.isSemanticSearchEnabled();
    }

    /**
     * Checks if embeddings initialization failed
     * @returns true if embeddings were enabled but failed to initialize
     */
    didEmbeddingsInitFail(): boolean {
        return this.indexer.didEmbeddingsInitFail();
    }

    /**
     * Gets the error message from embeddings initialization failure
     * @returns error message or null if no failure occurred
     */
    getEmbeddingsInitError(): string | null {
        return this.indexer.getEmbeddingsInitError();
    }

    /**
     * Compares APIs between two versions of a library
     * @param library - The library to compare
     * @param fromVersion - Starting version
     * @param toVersion - Target version
     * @returns VersionDiff with added, removed, and modified APIs
     */
    async compareVersions(
        library: string,
        fromVersion: string,
        toVersion: string
    ): Promise<VersionDiff> {
        await this.ensureIndex();

        // Ensure both versions are available
        const resolvedFromVersion = await this.resolveVersion(library, fromVersion);
        const resolvedToVersion = await this.resolveVersion(library, toVersion);

        // Get all symbols for both versions
        const fromSymbols = new Map<string, SymbolIndexEntry>();
        const toSymbols = new Map<string, SymbolIndexEntry>();

        // Collect symbols from the index
        const index = this.indexer.getIndex();
        for (const [symbolName, entries] of index.symbols.entries()) {
            for (const entry of entries) {
                if (entry.library === library) {
                    if (entry.version === resolvedFromVersion) {
                        fromSymbols.set(symbolName, entry);
                    }
                    if (entry.version === resolvedToVersion) {
                        toSymbols.set(symbolName, entry);
                    }
                }
            }
        }

        // Calculate differences
        const added: SymbolIndexEntry[] = [];
        const removed: SymbolIndexEntry[] = [];
        const modified: ModifiedAPI[] = [];
        let unchanged = 0;

        // Find added and modified
        for (const [symbolName, toEntry] of toSymbols.entries()) {
            const fromEntry = fromSymbols.get(symbolName);
            if (!fromEntry) {
                added.push(toEntry);
            } else {
                // Check if signature changed
                if (fromEntry.signature !== toEntry.signature) {
                    modified.push({
                        symbol: symbolName,
                        fromSignature: fromEntry.signature,
                        toSignature: toEntry.signature,
                        changes: this.describeSignatureChange(fromEntry.signature, toEntry.signature),
                    });
                } else {
                    unchanged++;
                }
            }
        }

        // Find removed
        for (const [symbolName, fromEntry] of fromSymbols.entries()) {
            if (!toSymbols.has(symbolName)) {
                removed.push(fromEntry);
            }
        }

        return {
            library,
            fromVersion: resolvedFromVersion,
            toVersion: resolvedToVersion,
            added,
            removed,
            modified,
            unchanged,
        };
    }

    /**
     * Describe what changed between two signatures
     */
    private describeSignatureChange(from?: string, to?: string): string {
        if (!from && to) return 'New signature added';
        if (from && !to) return 'Signature removed';
        if (!from && !to) return 'Unknown change';
        return 'Signature modified';
    }

    /**
     * Get a formatted version diff with additional context
     */
    async getVersionDiff(
        library: string,
        fromVersion: string,
        toVersion: string
    ): Promise<VersionDiff> {
        const diff = await this.compareVersions(library, fromVersion, toVersion);
        
        // The diff is already computed, just return it
        // This method exists for API consistency and future enhancements
        return diff;
    }

    /**
     * Find migration-related documentation using semantic search
     */
    async findMigrationDocs(
        library: string,
        fromVersion: string,
        toVersion: string
    ): Promise<string[]> {
        await this.ensureIndex();

        const queries = [
            `migration guide ${fromVersion} to ${toVersion}`,
            `breaking changes ${toVersion}`,
            `upgrade guide ${library}`,
            `changelog ${toVersion}`,
        ];

        const topics = new Set<string>();

        for (const query of queries) {
            try {
                const results = await this.semanticSearch(query, 5, library);
                for (const result of results) {
                    topics.add(result.topic);
                }
            } catch {
                // Semantic search may not be available, try keyword search
                const symbolResults = await this.searchSymbols(query, 5);
                for (const result of symbolResults) {
                    if (result.library === library) {
                        topics.add(result.symbol);
                    }
                }
            }
        }

        return Array.from(topics);
    }

    /**
     * Get deprecated APIs for a library version
     */
    async getDeprecatedAPIs(
        library: string,
        version: string
    ): Promise<SymbolIndexEntry[]> {
        await this.ensureIndex();

        const deprecated: SymbolIndexEntry[] = [];
        const resolvedVersion = await this.resolveVersion(library, version);

        // Search for deprecated mentions in docs
        try {
            const results = await this.semanticSearch('deprecated API', 20, library, resolvedVersion);
            for (const result of results) {
                // Extract symbol names from deprecated content
                const symbols = this.indexer.findSymbol(result.topic, library, resolvedVersion);
                deprecated.push(...symbols);
            }
        } catch {
            // Fallback: search symbols with 'deprecated' in description
            const index = this.indexer.getIndex();
            for (const [, entries] of index.symbols.entries()) {
                for (const entry of entries) {
                    if (entry.library === library && entry.version === resolvedVersion) {
                        if (entry.description?.toLowerCase().includes('deprecated')) {
                            deprecated.push(entry);
                        }
                    }
                }
            }
        }

        return deprecated;
    }

    /**
     * Get new APIs introduced in a library version
     */
    async getNewAPIs(
        library: string,
        version: string
    ): Promise<SymbolIndexEntry[]> {
        await this.ensureIndex();

        const resolvedVersion = await this.resolveVersion(library, version);
        const availableVersions = this.getAvailableVersions(library);
        
        // Find previous version
        const versionIndex = availableVersions.indexOf(resolvedVersion);
        if (versionIndex <= 0) {
            // No previous version to compare
            return [];
        }

        const previousVersion = availableVersions[versionIndex - 1];
        const diff = await this.compareVersions(library, previousVersion, resolvedVersion);
        
        return diff.added;
    }

    /**
     * Get the signature/documentation for a specific API
     */
    async getAPISignature(
        library: string,
        version: string,
        symbol: string
    ): Promise<string | null> {
        await this.ensureIndex();

        const resolvedVersion = await this.resolveVersion(library, version);
        const entries = this.indexer.findSymbol(symbol, library, resolvedVersion);

        if (entries.length === 0) {
            return null;
        }

        const entry = entries[0];
        return entry.signature || entry.description || null;
    }
}
