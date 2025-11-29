/**
 * Embedding Generator Module
 * 
 * Generates vector embeddings using Hugging Face Transformers.
 * Uses the all-MiniLM-L6-v2 model for 384-dimensional embeddings.
 */

import type { EmbeddingVector } from './types.js';

// Dynamic import for transformers (ESM module)
let pipeline: any = null;

/**
 * Generates and manages text embeddings for semantic search
 */
export class EmbeddingGenerator {
    private extractor: any = null;
    private modelName: string;
    private batchSize: number;
    private initialized: boolean = false;
    private initializing: Promise<void> | null = null;

    constructor(modelName: string = 'Xenova/all-MiniLM-L6-v2', batchSize: number = 32) {
        this.modelName = modelName;
        this.batchSize = batchSize;
    }

    /**
     * Configure the embedding generator with settings
     */
    configure(modelName: string, batchSize: number): void {
        // Only reconfigure if not yet initialized
        if (!this.initialized) {
            this.modelName = modelName;
            this.batchSize = batchSize;
        }
    }

    /**
     * Get the configured batch size
     */
    getBatchSize(): number {
        return this.batchSize;
    }

    /**
     * Initializes the embedding model
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
                console.log(`Loading embedding model: ${this.modelName}...`);
                
                // Dynamic import of @huggingface/transformers
                if (!pipeline) {
                    const transformers = await import('@huggingface/transformers');
                    pipeline = transformers.pipeline;
                }

                this.extractor = await pipeline('feature-extraction', this.modelName, {
                    quantized: true // Use quantized model for faster loading
                });

                this.initialized = true;
                console.log('Embedding model loaded successfully');
            } catch (error) {
                console.error('Failed to initialize embedding model:', error);
                throw error;
            }
        })();

        return this.initializing;
    }

    /**
     * Ensures the model is initialized before use
     */
    private async ensureInitialized(): Promise<void> {
        if (!this.initialized) {
            await this.initialize();
        }
    }

    /**
     * Generates an embedding vector for the given text
     * @param text - The text to embed
     * @returns 384-dimensional embedding vector
     */
    async generateEmbedding(text: string): Promise<EmbeddingVector> {
        try {
            await this.ensureInitialized();

            // Preprocess text
            const cleanedText = text
                .trim()
                .replace(/\s+/g, ' ')
                .slice(0, 512); // Limit input length for efficiency

            if (!cleanedText) {
                return new Array(384).fill(0);
            }

            // Generate embedding with mean pooling and normalization
            const output = await this.extractor(cleanedText, {
                pooling: 'mean',
                normalize: true
            });

            // Convert tensor to flat array
            const embedding = Array.from(output.tolist()[0]) as number[];
            
            return embedding;
        } catch (error) {
            console.error('Failed to generate embedding:', error);
            // Return zero vector as fallback
            return new Array(384).fill(0);
        }
    }

    /**
     * Generates embeddings for multiple texts in batch
     * @param texts - Array of texts to embed
     * @returns Array of 384-dimensional embedding vectors
     */
    async generateBatchEmbeddings(texts: string[]): Promise<EmbeddingVector[]> {
        await this.ensureInitialized();
        
        const embeddings: EmbeddingVector[] = [];

        // Process in batches using configured batch size
        for (let i = 0; i < texts.length; i += this.batchSize) {
            const batch = texts.slice(i, i + this.batchSize);
            const batchEmbeddings = await Promise.all(
                batch.map(text => this.generateEmbedding(text))
            );
            embeddings.push(...batchEmbeddings);
        }

        return embeddings;
    }

    /**
     * Computes cosine similarity between two vectors
     * @param vecA - First vector
     * @param vecB - Second vector
     * @returns Similarity score between 0 and 1
     */
    cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length) {
            throw new Error('Vectors must have the same dimension');
        }

        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            magnitudeA += vecA[i] * vecA[i];
            magnitudeB += vecB[i] * vecB[i];
        }

        magnitudeA = Math.sqrt(magnitudeA);
        magnitudeB = Math.sqrt(magnitudeB);

        if (magnitudeA === 0 || magnitudeB === 0) {
            return 0;
        }

        // Normalize to 0-1 range (cosine similarity is -1 to 1)
        return (dotProduct / (magnitudeA * magnitudeB) + 1) / 2;
    }

    /**
     * Cleans up resources
     */
    dispose(): void {
        this.extractor = null;
        this.initialized = false;
        this.initializing = null;
    }
}

// Export singleton instance
export const embeddingGenerator = new EmbeddingGenerator();
