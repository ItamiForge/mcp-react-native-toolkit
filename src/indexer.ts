import fs from 'fs';
import path from 'path';
import type { SymbolIndexEntry, CodeExample, DocIndex } from './types.js';

/**
 * Builds and maintains an in-memory index of documentation for fast lookups.
 * Indexes symbols, code examples, and topics across all libraries and versions.
 */
export class Indexer {
    private index: DocIndex;
    private docsBasePath: string;

    constructor(docsBasePath: string) {
        this.docsBasePath = docsBasePath;
        this.index = {
            symbols: new Map(),
            examples: new Map(),
            topics: new Map()
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
     * Searches symbols with fuzzy matching
     */
    searchSymbols(query: string, limit: number = 10): SymbolIndexEntry[] {
        const results: Array<{ entry: SymbolIndexEntry; score: number }> = [];

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
            .slice(0, limit)
            .map(r => r.entry);
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
}
