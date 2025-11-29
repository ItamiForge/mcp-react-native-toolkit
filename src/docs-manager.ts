import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ContextDetector } from './context-detector.js';
import { semverResolver } from './semver-resolver.js';
import { chunker } from './chunker.js';
import { Indexer } from './indexer.js';
import { fetchDocsForVersion, docsExist, extractMajorVersion } from './docs-fetcher.js';
import type { DocChunk } from './types.js';

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

    constructor(private basePath: string = DOCS_BASE_PATH) {
        this.indexer = new Indexer(basePath);
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
    private getVersionKey(library: string): 'reactNative' | 'expo' | 'reactNavigation' | 'ignite' {
        const mapping: Record<string, any> = {
            'react-native': 'reactNative',
            'expo': 'expo',
            'react-navigation': 'reactNavigation',
            'ignite': 'ignite'
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
        const topicPath = topic.replace(/-/g, '/');
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
}
