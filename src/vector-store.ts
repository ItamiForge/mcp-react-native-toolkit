/**
 * Vector Store Module
 * 
 * Persistent vector storage using Vectra for semantic search.
 * Stores embeddings with metadata for efficient similarity search.
 */

import { LocalIndex } from 'vectra';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { ChunkEmbedding, SemanticSearchResult } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Manages vector storage and retrieval using Vectra
 */
export class VectorStore {
    private index: LocalIndex | null = null;
    private indexPath: string;
    private initialized: boolean = false;
    private initializing: Promise<void> | null = null;

    constructor(indexPath?: string) {
        this.indexPath = indexPath || path.join(__dirname, '..', 'docs', '.vector-index');
    }

    /**
     * Configure the vector store with a new index path
     * Must be called before initialization
     */
    configure(indexPath: string): void {
        if (!this.initialized) {
            this.indexPath = indexPath;
        }
    }

    /**
     * Get the current index path
     */
    getIndexPath(): string {
        return this.indexPath;
    }

    /**
     * Initializes the vector store
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        if (this.initializing) {
            return this.initializing;
        }

        this.initializing = (async () => {
            try {
                // Ensure directory exists
                if (!fs.existsSync(this.indexPath)) {
                    fs.mkdirSync(this.indexPath, { recursive: true });
                }

                // Initialize Vectra index
                this.index = new LocalIndex(this.indexPath);

                // Check if index exists
                const indexExists = await this.index.isIndexCreated();
                
                if (!indexExists) {
                    await this.index.createIndex();
                    console.log('Created new vector index');
                } else {
                    console.log('Loaded existing vector index');
                }

                this.initialized = true;
            } catch (error) {
                console.error('Failed to initialize vector store:', error);
                throw error;
            }
        })();

        return this.initializing;
    }

    /**
     * Ensures the store is initialized
     */
    private async ensureInitialized(): Promise<void> {
        if (!this.initialized) {
            await this.initialize();
        }
    }

    /**
     * Adds an embedding to the store
     * @param chunkEmbedding - The chunk embedding to add
     */
    async addEmbedding(chunkEmbedding: ChunkEmbedding): Promise<void> {
        await this.ensureInitialized();

        if (!this.index) {
            throw new Error('Vector store not initialized');
        }

        try {
            await this.index.insertItem({
                id: chunkEmbedding.chunkId,
                vector: chunkEmbedding.embedding,
                metadata: {
                    library: chunkEmbedding.library,
                    version: chunkEmbedding.version,
                    topic: chunkEmbedding.topic,
                    content: chunkEmbedding.content.slice(0, 1000), // Limit content size in metadata
                    headings: JSON.stringify(chunkEmbedding.metadata.headings),
                    codeBlocks: chunkEmbedding.metadata.codeBlocks,
                    estimatedTokens: chunkEmbedding.metadata.estimatedTokens
                }
            });
        } catch (error) {
            // Ignore duplicate key errors
            if (!(error instanceof Error && error.message.includes('already exists'))) {
                console.error(`Failed to add embedding ${chunkEmbedding.chunkId}:`, error);
            }
        }
    }

    /**
     * Adds multiple embeddings in batch
     * @param embeddings - Array of chunk embeddings to add
     */
    async addBatchEmbeddings(embeddings: ChunkEmbedding[]): Promise<void> {
        await this.ensureInitialized();

        // Process in batches to avoid memory issues
        const batchSize = 100;
        for (let i = 0; i < embeddings.length; i += batchSize) {
            const batch = embeddings.slice(i, i + batchSize);
            await Promise.all(batch.map(e => this.addEmbedding(e)));
        }
    }

    /**
     * Searches for similar embeddings
     * @param queryEmbedding - The query embedding vector
     * @param query - The original query text (for hybrid search)
     * @param topK - Number of results to return
     * @param filter - Optional metadata filter (library, version)
     * @returns Array of semantic search results
     */
    async search(
        queryEmbedding: number[],
        query: string,
        topK: number = 10,
        filter?: { library?: string; version?: string }
    ): Promise<SemanticSearchResult[]> {
        await this.ensureInitialized();

        if (!this.index) {
            throw new Error('Vector store not initialized');
        }

        try {
            const results = await this.index.queryItems(queryEmbedding, query, topK * 2); // Get more results for filtering

            // Filter and map results
            const filteredResults = results
                .filter(result => {
                    if (filter?.library && result.item.metadata.library !== filter.library) {
                        return false;
                    }
                    if (filter?.version && result.item.metadata.version !== filter.version) {
                        return false;
                    }
                    return true;
                })
                .slice(0, topK)
                .map(result => {
                    // Parse headings from JSON string
                    let headings: string[] = [];
                    try {
                        const headingsData = result.item.metadata.headings;
                        if (typeof headingsData === 'string') {
                            headings = JSON.parse(headingsData);
                        }
                    } catch {
                        headings = [];
                    }

                    return {
                        chunkId: result.item.id,
                        library: result.item.metadata.library as string,
                        version: result.item.metadata.version as string,
                        topic: result.item.metadata.topic as string,
                        content: result.item.metadata.content as string,
                        score: result.score,
                        metadata: {
                            headings,
                            codeBlocks: (result.item.metadata.codeBlocks as number) || 0,
                            estimatedTokens: (result.item.metadata.estimatedTokens as number) || 0
                        }
                    };
                });

            return filteredResults;
        } catch (error) {
            console.error('Search failed:', error);
            return [];
        }
    }

    /**
     * Deletes an embedding by ID
     * @param chunkId - The chunk ID to delete
     */
    async delete(chunkId: string): Promise<void> {
        await this.ensureInitialized();

        if (!this.index) {
            throw new Error('Vector store not initialized');
        }

        try {
            await this.index.deleteItem(chunkId);
        } catch (error) {
            console.error(`Failed to delete embedding ${chunkId}:`, error);
        }
    }

    /**
     * Clears all embeddings from the store
     */
    async clear(): Promise<void> {
        await this.ensureInitialized();

        try {
            // Delete and recreate the index
            if (fs.existsSync(this.indexPath)) {
                fs.rmSync(this.indexPath, { recursive: true, force: true });
            }
            
            this.initialized = false;
            this.initializing = null;
            
            await this.initialize();
            console.log('Vector store cleared');
        } catch (error) {
            console.error('Failed to clear vector store:', error);
        }
    }

    /**
     * Finalizes batch updates (commits to disk)
     */
    async endUpdate(): Promise<void> {
        // Vectra handles persistence automatically
        console.log('Vector index update completed');
    }

    /**
     * Gets statistics about the vector index
     */
    async getStats(): Promise<{ totalItems: number; indexPath: string }> {
        await this.ensureInitialized();

        if (!this.index) {
            return { totalItems: 0, indexPath: this.indexPath };
        }

        try {
            const items = await this.index.listItems();
            return {
                totalItems: items.length,
                indexPath: this.indexPath
            };
        } catch (error) {
            return { totalItems: 0, indexPath: this.indexPath };
        }
    }
}

// Export singleton instance
export const vectorStore = new VectorStore();
