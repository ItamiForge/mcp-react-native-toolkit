import fs from 'fs';
import path from 'path';
import type { SymbolIndexEntry, CodeExample, DocIndex, ChunkEmbedding, SemanticSearchResult, HybridSearchResult, SymbolSearchResult, Settings } from './types.js';
import { EmbeddingGenerator } from './embeddings.js';
import { VectorStore } from './vector-store.js';
import { chunker } from './chunker.js';

/**
 * Builds and maintains an in-memory index of documentation for fast lookups.
 * Indexes symbols, code examples, and topics across all libraries and versions.
 */
export class Indexer {
    private index: DocIndex;
    private docsBasePath: string;
    private embeddingsEnabled: boolean;
    private embeddingBatchSize: number;
    private embeddingsReady: boolean = false;
    // Mapping from symbol to chunk IDs for hybrid search
    private symbolToChunkIds: Map<string, string[]> = new Map();
    // Embedding and vector store instances (created based on settings)
    private embeddingGenerator: EmbeddingGenerator | null = null;
    private vectorStore: VectorStore | null = null;

    constructor(docsBasePath: string, settings?: Settings) {
        this.docsBasePath = docsBasePath;
        this.embeddingsEnabled = settings?.semanticSearchEnabled ?? true;
        this.embeddingBatchSize = settings?.embeddingBatchSize ?? 32;
        
        // Create embedding generator and vector store instances if semantic search is enabled
        if (this.embeddingsEnabled) {
            this.embeddingGenerator = new EmbeddingGenerator(
                settings?.embeddingModel ?? 'Xenova/all-MiniLM-L6-v2',
                this.embeddingBatchSize
            );
            this.vectorStore = new VectorStore(
                settings?.vectorIndexPath ?? path.join(docsBasePath, '.vector-index')
            );
        }
        
        this.index = {
            symbols: new Map(),
            examples: new Map(),
            topics: new Map(),
            embeddings: new Map()
        };
    }

    /**
     * Builds the complete index by scanning all documentation files
     */
    async buildIndex(): Promise<void> {
        console.log('Building documentation index...');
        const startTime = Date.now();

        if (!fs.existsSync(this.docsBasePath)) {
            console.warn(`Docs path does not exist: ${this.docsBasePath}`);
            return;
        }

        // Scan each library folder
        const libraries = fs.readdirSync(this.docsBasePath, { withFileTypes: true })
            .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
            .map(entry => entry.name);

        for (const library of libraries) {
            await this.indexLibrary(library);
        }

        const duration = Date.now() - startTime;
        console.log(`Index built in ${duration}ms`);
        console.log(`- Symbols: ${this.index.symbols.size}`);
        console.log(`- Examples: ${this.index.examples.size}`);
        console.log(`- Topics: ${this.index.topics.size}`);

        // Generate embeddings for semantic search only if enabled
        if (this.embeddingsEnabled) {
            await this.generateEmbeddings();
        } else {
            console.log('Semantic search disabled - skipping embedding generation');
        }
    }

    /**
     * Generates embeddings for all documentation chunks using batch processing
     */
    private async generateEmbeddings(): Promise<void> {
        if (!this.embeddingGenerator || !this.vectorStore) {
            console.warn('Embeddings not configured, skipping embedding generation');
            return;
        }

        console.log('Generating embeddings for documentation chunks...');
        const embeddingsStartTime = Date.now();
        
        try {
            // Initialize vector store
            await this.vectorStore.initialize();
            
            // Collect all chunks first
            interface ChunkData {
                chunk: { id: string; content: string; metadata: { headings: string[]; codeBlocks: number; estimatedTokens: number } };
                library: string;
                version: string;
                topic: string;
            }
            
            const allChunks: ChunkData[] = [];

            // Iterate through all libraries and versions to collect chunks
            for (const [topicsKey] of this.index.topics.entries()) {
                const [library, version] = topicsKey.split(':');
                const versionPath = path.join(this.docsBasePath, library, version);

                if (!fs.existsSync(versionPath)) {
                    continue;
                }

                // Process each markdown file
                const markdownFiles = this.findMarkdownFiles(versionPath);
                
                for (const file of markdownFiles) {
                    try {
                        const content = fs.readFileSync(file, 'utf-8');
                        const relativePath = path.relative(versionPath, file);
                        const topic = relativePath.replace(/\.md$/, '').replace(/\//g, '-');
                        
                        // Generate chunks for this file
                        const chunks = chunker.chunk(content, library, version, topic);
                        
                        for (const chunk of chunks) {
                            allChunks.push({ chunk, library, version, topic });
                        }
                    } catch (error) {
                        console.error(`Failed to read ${file}:`, error);
                    }
                }
            }

            // Process chunks in batches
            const allChunkEmbeddings: ChunkEmbedding[] = [];
            const batchSize = this.embeddingBatchSize;
            
            for (let i = 0; i < allChunks.length; i += batchSize) {
                const batch = allChunks.slice(i, i + batchSize);
                const texts = batch.map(item => item.chunk.content);
                
                // Generate embeddings for the batch
                const embeddings = await this.embeddingGenerator.generateBatchEmbeddings(texts);
                
                // Pair embeddings with their chunks
                for (let j = 0; j < batch.length; j++) {
                    const { chunk, library, version, topic } = batch[j];
                    const embedding = embeddings[j];
                    
                    const chunkEmbedding: ChunkEmbedding = {
                        chunkId: chunk.id,
                        library,
                        version,
                        topic,
                        content: chunk.content,
                        embedding,
                        metadata: {
                            headings: chunk.metadata.headings,
                            codeBlocks: chunk.metadata.codeBlocks,
                            estimatedTokens: chunk.metadata.estimatedTokens
                        }
                    };
                    
                    // Store in memory index
                    this.index.embeddings.set(chunk.id, chunkEmbedding);
                    allChunkEmbeddings.push(chunkEmbedding);
                    
                    // Build symbol to chunk mapping for hybrid search
                    this.buildSymbolToChunkMapping(topic, chunk.id, library, version);
                }
                
                // Log progress
                const processed = Math.min(i + batchSize, allChunks.length);
                console.log(`Processed ${processed}/${allChunks.length} chunks...`);
            }

            // Batch add to vector store
            if (allChunkEmbeddings.length > 0) {
                await this.vectorStore.addBatchEmbeddings(allChunkEmbeddings);
                await this.vectorStore.endUpdate();
            }

            this.embeddingsReady = true;
            const embeddingsDuration = Date.now() - embeddingsStartTime;
            console.log(`Embeddings generated: ${allChunkEmbeddings.length} chunks in ${embeddingsDuration}ms`);
            console.log(`- Embeddings in index: ${this.index.embeddings.size}`);
        } catch (error) {
            console.error('Failed to generate embeddings:', error);
            // Continue without embeddings - semantic search will be unavailable
            this.embeddingsReady = false;
        }
    }
    
    /**
     * Build mapping from symbol/topic to chunk IDs for hybrid search
     */
    private buildSymbolToChunkMapping(topic: string, chunkId: string, library: string, version: string): void {
        // Map by topic
        const topicKey = `${library}:${version}:${topic}`;
        const existing = this.symbolToChunkIds.get(topicKey) || [];
        existing.push(chunkId);
        this.symbolToChunkIds.set(topicKey, existing);
        
        // Also map by topic name only for broader matching
        const simpleKey = topic.toLowerCase();
        const simpleExisting = this.symbolToChunkIds.get(simpleKey) || [];
        simpleExisting.push(chunkId);
        this.symbolToChunkIds.set(simpleKey, simpleExisting);
    }
    
    /**
     * Find chunk IDs for a symbol entry
     */
    private findChunkIdsForSymbol(entry: SymbolIndexEntry): string[] {
        // Try to find by file path converted to topic
        const filePath = entry.file;
        const baseName = path.basename(filePath, '.md');
        
        // Try various key formats
        const keys = [
            `${entry.library}:${entry.version}:${baseName}`,
            baseName.toLowerCase(),
            entry.symbol.toLowerCase()
        ];
        
        for (const key of keys) {
            const chunkIds = this.symbolToChunkIds.get(key);
            if (chunkIds && chunkIds.length > 0) {
                return chunkIds;
            }
        }
        
        return [];
    }

    /**
     * Check if semantic search is available
     */
    isSemanticSearchEnabled(): boolean {
        return this.embeddingsEnabled;
    }

    /**
     * Check if embeddings are ready for search
     */
    isEmbeddingsReady(): boolean {
        return this.embeddingsReady;
    }

    /**
     * Indexes a single library
     */
    private async indexLibrary(library: string): Promise<void> {
        const libraryPath = path.join(this.docsBasePath, library);

        // Get all versions
        const versions = fs.readdirSync(libraryPath, { withFileTypes: true })
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);

        for (const version of versions) {
            await this.indexVersion(library, version);
        }
    }

    /**
     * Indexes a specific library version
     */
    private async indexVersion(library: string, version: string): Promise<void> {
        const versionPath = path.join(this.docsBasePath, library, version);
        const topicsKey = `${library}:${version}`;
        const topics: string[] = [];

        // Recursively scan for markdown files
        const markdownFiles = this.findMarkdownFiles(versionPath);

        for (const file of markdownFiles) {
            const relativePath = path.relative(versionPath, file);
            const topic = relativePath.replace(/\.md$/, '').replace(/\//g, '-');
            topics.push(topic);

            try {
                const content = fs.readFileSync(file, 'utf-8');
                this.indexFile(library, version, topic, file, content);
            } catch (error) {
                console.error(`Failed to index ${file}:`, error);
            }
        }

        this.index.topics.set(topicsKey, topics);
    }

    /**
     * Indexes a single markdown file
     */
    private indexFile(
        library: string,
        version: string,
        topic: string,
        filePath: string,
        content: string
    ): void {
        // Extract symbols (components, hooks, APIs)
        this.extractSymbols(library, version, filePath, content);

        // Extract code examples
        this.extractExamples(library, version, topic, filePath, content);
    }

    /**
     * Extracts symbol references from markdown content
     */
    private extractSymbols(
        library: string,
        version: string,
        filePath: string,
        content: string
    ): void {
        const lines = content.split('\n');

        // Look for common patterns:
        // - `SymbolName` in headers
        // - Function signatures
        // - Component definitions
        // - Hook patterns (use*)

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Header with backticks (# `Component`)
            const headerMatch = line.match(/^#+\s+`([^`]+)`/);
            if (headerMatch) {
                const symbol = headerMatch[1];
                this.addSymbol({
                    library,
                    version,
                    symbol,
                    type: this.inferSymbolType(symbol),
                    file: filePath,
                    lineStart: i + 1,
                    lineEnd: i + 1,
                    source: 'docs'
                });
            }

            // Hook pattern (useXxx)
            const hookMatch = line.match(/`(use[A-Z][a-zA-Z]+)`/);
            if (hookMatch) {
                const symbol = hookMatch[1];
                this.addSymbol({
                    library,
                    version,
                    symbol,
                    type: 'hook',
                    file: filePath,
                    lineStart: i + 1,
                    lineEnd: i + 1,
                    source: 'docs'
                });
            }

            // Component/API in inline code
            const inlineCodeMatches = line.matchAll(/`([A-Z][a-zA-Z]+)`/g);
            for (const match of inlineCodeMatches) {
                const symbol = match[1];
                if (symbol.length > 2) { // Skip short symbols
                    this.addSymbol({
                        library,
                        version,
                        symbol,
                        type: this.inferSymbolType(symbol),
                        file: filePath,
                        lineStart: i + 1,
                        lineEnd: i + 1,
                        source: 'docs'
                    });
                }
            }
        }
    }

    /**
     * Extracts code examples from markdown
     */
    private extractExamples(
        library: string,
        version: string,
        topic: string,
        filePath: string,
        content: string
    ): void {
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        const examplesKey = `${library}:${version}:${topic}`;

        let match;
        let blockIndex = 0;
        while ((match = codeBlockRegex.exec(content)) !== null) {
            const language = match[1] || 'plaintext';
            const code = match[2].trim();

            // Only index JavaScript/TypeScript code
            if (['javascript', 'typescript', 'jsx', 'tsx', 'js', 'ts'].includes(language.toLowerCase())) {
                const example: CodeExample = {
                    library,
                    version,
                    topic,
                    code,
                    language,
                    file: filePath,
                    lineStart: this.getLineNumber(content, match.index),
                    lineEnd: this.getLineNumber(content, match.index + match[0].length)
                };

                const existing = this.index.examples.get(examplesKey) || [];
                existing.push(example);
                this.index.examples.set(examplesKey, existing);
            }

            blockIndex++;
        }
    }

    /**
     * Adds a symbol to the index
     */
    private addSymbol(entry: SymbolIndexEntry): void {
        const existing = this.index.symbols.get(entry.symbol) || [];

        // Avoid duplicates from the same file
        const isDuplicate = existing.some(e =>
            e.library === entry.library &&
            e.version === entry.version &&
            e.file === entry.file
        );

        if (!isDuplicate) {
            existing.push(entry);
            this.index.symbols.set(entry.symbol, existing);
        }
    }

    /**
     * Infers symbol type from its name
     */
    private inferSymbolType(symbol: string): 'component' | 'hook' | 'api' | 'function' | 'type' {
        if (symbol.startsWith('use') && symbol.length > 3 && symbol[3] === symbol[3].toUpperCase()) {
            return 'hook';
        }
        if (symbol[0] === symbol[0].toUpperCase()) {
            return 'component'; // PascalCase is typically a component or type
        }
        return 'api';
    }

    /**
     * Gets line number from character index
     */
    private getLineNumber(content: string, charIndex: number): number {
        return content.substring(0, charIndex).split('\n').length;
    }

    /**
     * Finds all markdown files recursively
     */
    private findMarkdownFiles(dir: string): string[] {
        const files: string[] = [];

        if (!fs.existsSync(dir)) {
            return files;
        }

        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                files.push(...this.findMarkdownFiles(fullPath));
            } else if (entry.isFile() && entry.name.endsWith('.md')) {
                files.push(fullPath);
            }
        }

        return files;
    }

    /**
     * Looks up a symbol across all libraries/versions
     */
    findSymbol(symbol: string, library?: string, version?: string): SymbolIndexEntry[] {
        const entries = this.index.symbols.get(symbol) || [];

        return entries.filter(entry => {
            if (library && entry.library !== library) return false;
            if (version && entry.version !== version) return false;
            return true;
        });
    }

    /**
     * Gets all topics for a library/version
     */
    getTopics(library: string, version: string): string[] {
        return this.index.topics.get(`${library}:${version}`) || [];
    }

    /**
     * Gets code examples for a topic
     */
    getExamples(library: string, version: string, topic: string): CodeExample[] {
        return this.index.examples.get(`${library}:${version}:${topic}`) || [];
    }

    /**
     * Searches symbols with fuzzy matching, returns entries only (legacy)
     */
    searchSymbols(query: string, limit: number = 10): SymbolIndexEntry[] {
        return this.searchSymbolsWithScores(query, limit).map(r => r.entry);
    }

    /**
     * Searches symbols with fuzzy matching, returns entries with scores
     */
    searchSymbolsWithScores(query: string, limit: number = 10): SymbolSearchResult[] {
        const results: SymbolSearchResult[] = [];

        for (const [symbol, entries] of this.index.symbols.entries()) {
            const score = this.fuzzyScore(query.toLowerCase(), symbol.toLowerCase());
            if (score > 0) {
                for (const entry of entries) {
                    results.push({ entry, score });
                }
            }
        }

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    /**
     * Simple fuzzy matching score
     */
    private fuzzyScore(query: string, target: string): number {
        if (target === query) return 100;
        if (target.startsWith(query)) return 90;
        if (target.includes(query)) return 70;

        // Check if all characters in query appear in order in target
        let queryIndex = 0;
        for (const char of target) {
            if (char === query[queryIndex]) {
                queryIndex++;
                if (queryIndex === query.length) return 50;
            }
        }

        return 0;
    }

    /**
     * Gets the current index (for debugging/inspection)
     */
    getIndex(): DocIndex {
        return this.index;
    }

    /**
     * Performs semantic search using embeddings
     * @param query - The search query
     * @param topK - Number of results to return
     * @param library - Optional library filter
     * @param version - Optional version filter
     * @returns Array of semantic search results sorted by similarity
     */
    async semanticSearch(
        query: string,
        topK: number = 10,
        library?: string,
        version?: string
    ): Promise<SemanticSearchResult[]> {
        if (!this.embeddingsEnabled) {
            return [];
        }

        if (!this.embeddingsReady || !this.embeddingGenerator || !this.vectorStore) {
            console.warn('Embeddings not ready for semantic search');
            return [];
        }

        try {
            // Generate embedding for the query
            const queryEmbedding = await this.embeddingGenerator.generateEmbedding(query);

            // Search the vector store
            const filter = library || version ? { library, version } : undefined;
            const results = await this.vectorStore.search(queryEmbedding, topK, filter);

            return results;
        } catch (error) {
            console.error('Semantic search failed:', error);
            return [];
        }
    }

    /**
     * Performs hybrid search combining keyword and semantic search
     * Uses symbolToChunkIds mapping to properly correlate keyword and semantic results
     * @param query - The search query
     * @param topK - Number of results to return
     * @param library - Optional library filter
     * @param version - Optional version filter
     * @returns Array of hybrid search results sorted by combined score
     */
    async hybridSearch(
        query: string,
        topK: number = 10,
        library?: string,
        version?: string
    ): Promise<HybridSearchResult[]> {
        // Perform both searches in parallel
        // Use searchSymbolsWithScores to get actual fuzzy match scores
        const [keywordResults, semanticResults] = await Promise.all([
            Promise.resolve(this.searchSymbolsWithScores(query, topK * 2)),
            this.semanticSearch(query, topK * 2, library, version)
        ]);

        // Create a map to combine results by chunkId
        const combinedResults = new Map<string, HybridSearchResult>();

        // Normalize keyword scores to 0-1 range (fuzzyScore returns 0-100)
        const maxKeywordScore = Math.max(...keywordResults.map(r => r.score), 1);

        // Process keyword results - use symbolToChunkIds to find associated chunks
        for (const { entry, score } of keywordResults) {
            // Filter by library/version if specified
            if (library && entry.library !== library) continue;
            if (version && entry.version !== version) continue;

            const normalizedKeywordScore = score / maxKeywordScore;
            
            // Use symbolToChunkIds mapping to find associated chunk IDs
            const chunkIds = this.findChunkIdsForSymbol(entry);
            
            if (chunkIds.length > 0) {
                // Add each associated chunk
                for (const chunkId of chunkIds) {
                    if (!combinedResults.has(chunkId)) {
                        const hybridResult: HybridSearchResult = {
                            chunkId,
                            library: entry.library,
                            version: entry.version,
                            topic: entry.symbol,
                            content: entry.description || entry.symbol,
                            score: 0,
                            keywordScore: normalizedKeywordScore,
                            semanticScore: 0,
                            combinedScore: 0.4 * normalizedKeywordScore,
                            matchType: 'keyword',
                            metadata: {
                                headings: [],
                                codeBlocks: 0,
                                estimatedTokens: 0
                            }
                        };
                        combinedResults.set(chunkId, hybridResult);
                    } else {
                        // Update existing with higher keyword score if needed
                        const existing = combinedResults.get(chunkId)!;
                        if (normalizedKeywordScore > existing.keywordScore) {
                            existing.keywordScore = normalizedKeywordScore;
                            existing.combinedScore = 0.4 * normalizedKeywordScore + 0.6 * existing.semanticScore;
                        }
                    }
                }
            } else {
                // Fallback: create a synthetic chunk ID for symbols without chunk mapping
                const chunkId = `${entry.library}-${entry.version}-${entry.symbol}-keyword`;
                
                if (!combinedResults.has(chunkId)) {
                    const hybridResult: HybridSearchResult = {
                        chunkId,
                        library: entry.library,
                        version: entry.version,
                        topic: entry.symbol,
                        content: entry.description || entry.symbol,
                        score: 0,
                        keywordScore: normalizedKeywordScore,
                        semanticScore: 0,
                        combinedScore: 0.4 * normalizedKeywordScore,
                        matchType: 'keyword',
                        metadata: {
                            headings: [],
                            codeBlocks: 0,
                            estimatedTokens: 0
                        }
                    };
                    combinedResults.set(chunkId, hybridResult);
                }
            }
        }

        // Process semantic results
        for (const result of semanticResults) {
            const existing = combinedResults.get(result.chunkId);
            
            if (existing) {
                // Combine with existing keyword result
                existing.semanticScore = result.score;
                existing.combinedScore = 0.4 * existing.keywordScore + 0.6 * result.score;
                existing.matchType = 'hybrid';
                existing.content = result.content;
                existing.metadata = result.metadata;
            } else {
                // Add new semantic-only result
                const hybridResult: HybridSearchResult = {
                    ...result,
                    keywordScore: 0,
                    semanticScore: result.score,
                    combinedScore: 0.6 * result.score,
                    matchType: 'semantic'
                };
                combinedResults.set(result.chunkId, hybridResult);
            }
        }

        // Sort by combined score and return top K
        const sortedResults = Array.from(combinedResults.values())
            .sort((a, b) => b.combinedScore - a.combinedScore)
            .slice(0, topK);

        // Update the score field to be the combined score
        for (const result of sortedResults) {
            result.score = result.combinedScore;
        }

        return sortedResults;
    }
}
