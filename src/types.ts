/**
 * Central type definitions for the MCP React Native Toolkit
 */

// ============================================
// Documentation Types
// ============================================

export interface DocChunk {
    id: string;
    library: string;
    version: string;
    topic: string;
    chunkIndex: number;
    totalChunks: number;
    content: string;
    metadata: {
        headings: string[];
        codeBlocks: number;
        estimatedTokens: number;
        hasNextChunk: boolean;
        hasPreviousChunk: boolean;
    };
}

export interface DocSource {
    id: string;
    name: string;
    repo: string;
    docsPath: string;
    branch: string;
    versions: string[];
    locales: string[];
    description?: string;
    sparseCheckoutPaths?: string[];
    excludePaths?: string[];
    preprocessingRules?: PreprocessingRules;
}

export interface PreprocessingRules {
    stripComments: boolean;
    removeNavigation: boolean;
    minifyWhitespace: boolean;
}

export interface Settings {
    defaultLocale: string;
    enableSparseCheckout: boolean;
    cleanupTempDocs: boolean;
    preprocessMarkdown: boolean;
    chunkSizeTokens: number;
    cacheEnabled: boolean;
}

export interface Config {
    sources: DocSource[];
    settings?: Settings;
}

// ============================================
// Index Types
// ============================================

export type SymbolType = 'component' | 'hook' | 'api' | 'function' | 'type' | 'interface' | 'class';

export interface SymbolIndexEntry {
    library: string;
    version: string;
    symbol: string;
    type: SymbolType;
    file: string;
    lineStart: number;
    lineEnd: number;
    signature?: string;
    description?: string;
    source: 'docs' | 'node_modules';
}

export interface CodeExample {
    library: string;
    version: string;
    topic: string;
    code: string;
    language: string;
    file: string;
    lineStart: number;
    lineEnd: number;
}

export interface DocIndex {
    symbols: Map<string, SymbolIndexEntry[]>; // key: symbol name
    examples: Map<string, CodeExample[]>; // key: topic
    topics: Map<string, string[]>; // key: library/version, value: list of topics
}

// ============================================
// Context Detection Types
// ============================================

export interface ProjectContext {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    versions: {
        reactNative?: string;
        expo?: string;
        ignite?: string;
        reactNavigation?: string;
    };
}

// ============================================
// Tool Response Types
// ============================================

export interface PaginatedResponse<T> {
    data: T;
    pagination: {
        currentPage: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export interface ValidationResult {
    valid: boolean;
    symbol: string;
    library: string;
    version: string;
    signature?: string;
    docLink?: string;
    source?: 'docs' | 'node_modules';
    message: string;
}

export interface LibrarySearchResult {
    id: string;
    name: string;
    description?: string;
    versions: string[];
    match: 'exact' | 'fuzzy';
    score?: number;
}

// ============================================
// Best Practices Types
// ============================================

export interface BestPractice {
    title: string;
    description: string;
    link: string;
}
