import type { DocChunk, PreprocessingRules } from './types.js';

/**
 * Chunks markdown documentation into semantically meaningful pieces
 * for token-efficient delivery to LLMs.
 */
export class Chunker {
    private chunkSizeTokens: number;

    constructor(chunkSizeTokens: number = 2000) {
        this.chunkSizeTokens = chunkSizeTokens;
    }

    /**
     * Chunks a markdown document into semantic pieces.
     * Splits by headers, preserving context and code blocks.
     */
    chunk(
        content: string,
        library: string,
        version: string,
        topic: string
    ): DocChunk[] {
        // Preprocess content first
        const preprocessed = this.preprocess(content, {
            stripComments: true,
            removeNavigation: true,
            minifyWhitespace: true
        });

        // Split by major headers (## and ###)
        const sections = this.splitByHeaders(preprocessed);

        const chunks: DocChunk[] = [];
        let currentChunk = '';
        let currentHeadings: string[] = [];
        let chunkIndex = 0;

        for (const section of sections) {
            const estimatedTokens = this.estimateTokens(currentChunk + section.content);

            if (estimatedTokens > this.chunkSizeTokens && currentChunk.length > 0) {
                // Save current chunk and start new one
                chunks.push(this.createChunk(
                    currentChunk,
                    library,
                    version,
                    topic,
                    chunkIndex,
                    currentHeadings
                ));
                chunkIndex++;
                currentChunk = section.content;
                currentHeadings = section.headings;
            } else {
                // Add to current chunk
                currentChunk += section.content;
                currentHeadings = [...currentHeadings, ...section.headings];
            }
        }

        // Add final chunk
        if (currentChunk.length > 0) {
            chunks.push(this.createChunk(
                currentChunk,
                library,
                version,
                topic,
                chunkIndex,
                currentHeadings
            ));
        }

        // If no chunks were created, create a single chunk from original content
        if (chunks.length === 0) {
            chunks.push(this.createChunk(
                preprocessed,
                library,
                version,
                topic,
                0,
                []
            ));
        }

        // Update total chunks and navigation info
        return chunks.map((chunk, idx) => ({
            ...chunk,
            totalChunks: chunks.length,
            metadata: {
                ...chunk.metadata,
                hasNextChunk: idx < chunks.length - 1,
                hasPreviousChunk: idx > 0
            }
        }));
    }

    /**
     * Preprocesses markdown content to reduce token usage
     */
    preprocess(content: string, rules: PreprocessingRules): string {
        let processed = content;

        if (rules.stripComments) {
            // Remove HTML comments
            processed = processed.replace(/<!--[\s\S]*?-->/g, '');
        }

        if (rules.removeNavigation) {
            // Remove common navigation patterns
            processed = processed.replace(/\[.*?\]\(#.*?\)/g, ''); // Internal links
            processed = processed.replace(/^---\s*$/gm, ''); // Horizontal rules (often used for nav)
        }

        if (rules.minifyWhitespace) {
            // Reduce excessive blank lines but preserve code block formatting
            const codeBlocks: string[] = [];

            // Extract code blocks
            processed = processed.replace(/(```[\s\S]*?```)/g, (match) => {
                codeBlocks.push(match);
                return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
            });

            // Minify whitespace outside code blocks
            processed = processed.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
            processed = processed.replace(/[ \t]+$/gm, ''); // Trailing spaces

            // Restore code blocks
            processed = processed.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => {
                return codeBlocks[parseInt(idx)];
            });
        }

        return processed.trim();
    }

    /**
     * Splits content by headers while preserving structure
     */
    private splitByHeaders(content: string): Array<{ headings: string[]; content: string }> {
        const lines = content.split('\n');
        const sections: Array<{ headings: string[]; content: string }> = [];
        let currentSection = '';
        let currentHeadings: string[] = [];

        for (const line of lines) {
            const headerMatch = line.match(/^(#{2,3})\s+(.+)$/);

            if (headerMatch) {
                // Save previous section if it exists
                if (currentSection) {
                    sections.push({
                        headings: [...currentHeadings],
                        content: currentSection
                    });
                }

                // Start new section
                const headerText = headerMatch[2];
                currentHeadings.push(headerText);
                currentSection = line + '\n';
            } else {
                currentSection += line + '\n';
            }
        }

        // Add final section
        if (currentSection) {
            sections.push({
                headings: currentHeadings,
                content: currentSection
            });
        }

        return sections;
    }

    /**
     * Creates a DocChunk object
     */
    private createChunk(
        content: string,
        library: string,
        version: string,
        topic: string,
        chunkIndex: number,
        headings: string[]
    ): DocChunk {
        const codeBlocks = (content.match(/```/g) || []).length / 2;

        return {
            id: `${library}:${version}:${topic}:${chunkIndex}`,
            library,
            version,
            topic,
            chunkIndex,
            totalChunks: 1, // Will be updated later
            content: content.trim(),
            metadata: {
                headings,
                codeBlocks: Math.floor(codeBlocks),
                estimatedTokens: this.estimateTokens(content),
                hasNextChunk: false, // Will be updated later
                hasPreviousChunk: false // Will be updated later
            }
        };
    }

    /**
     * Estimates token count (rough approximation: 1 token ≈ 4 characters)
     */
    estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }

    /**
     * Extracts code examples from content
     */
    extractCodeExamples(content: string): Array<{ code: string; language: string }> {
        const examples: Array<{ code: string; language: string }> = [];
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

        let match;
        while ((match = codeBlockRegex.exec(content)) !== null) {
            examples.push({
                language: match[1] || 'plaintext',
                code: match[2].trim()
            });
        }

        return examples;
    }
}

// Export singleton
export const chunker = new Chunker();
