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
    versions?: string[];
    locales?: string[];
    description?: string;
    sparseCheckoutPaths?: string[];
    excludePaths?: string[];
    preprocessingRules?: PreprocessingRules;
    /** Whether this source is enabled (defaults to true) */
    enabled?: boolean;
    /** Version strategy for documentation sources */
    versionStrategy?: 'none' | 'sdk-branch' | 'versioned-folder';
    /** Pattern for version branch names (e.g., 'sdk-{major}') */
    versionBranchPattern?: string;
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
    semanticSearchEnabled: boolean;
    embeddingModel: string;
    vectorIndexPath: string;
    embeddingBatchSize: number;
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
    embeddings: Map<string, ChunkEmbedding>; // key: chunkId
}

// ============================================
// Semantic Search Types
// ============================================

/** 384-dimensional embedding vector */
export type EmbeddingVector = number[];

export interface ChunkEmbedding {
    chunkId: string;
    library: string;
    version: string;
    topic: string;
    content: string;
    embedding: EmbeddingVector;
    metadata: {
        headings: string[];
        codeBlocks: number;
        estimatedTokens: number;
    };
}

export interface SemanticSearchResult {
    chunkId: string;
    library: string;
    version: string;
    topic: string;
    content: string;
    score: number; // similarity score 0-1
    metadata: {
        headings: string[];
        codeBlocks: number;
        estimatedTokens: number;
    };
}

export interface HybridSearchResult extends SemanticSearchResult {
    keywordScore: number;
    semanticScore: number;
    combinedScore: number;
    matchType: 'keyword' | 'semantic' | 'hybrid';
}

/** Result from symbol search with score */
export interface SymbolSearchResult {
    entry: SymbolIndexEntry;
    score: number;
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
        reanimated?: string;
        gestureHandler?: string;
        mmkv?: string;
        skia?: string;
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

// ============================================
// Scaffold Types
// ============================================

/** Category for organizing scaffold templates */
export type ScaffoldCategory = 'list' | 'navigation' | 'form' | 'api' | 'storage' | 'animation' | 'image' | 'other';

/** Scaffold template definition */
export interface ComponentScaffold {
    /** Unique identifier (e.g., 'flatlist-basic') */
    id: string;
    /** Display name */
    name: string;
    /** Description of what the scaffold does */
    description: string;
    /** Target library */
    library: 'react-native' | 'expo' | 'react-navigation' | 'ignite' | 'react-native-reanimated' | 'react-native-gesture-handler' | 'react-native-mmkv' | 'react-native-skia';
    /** Scaffold category */
    category: ScaffoldCategory;
    /** Template language */
    language: 'typescript' | 'javascript';
    /** Template code with placeholders */
    code: string;
    /** Required npm dependencies */
    dependencies: string[];
    /** Import statements */
    imports: string[];
    /** Usage notes and instructions */
    notes: string[];
}

/** Options for generating a scaffold */
export interface ScaffoldGenerationOptions {
    /** ID of the scaffold template */
    scaffoldId: string;
    /** Target language */
    language: 'typescript' | 'javascript';
    /** Include explanatory comments */
    includeComments: boolean;
    /** Include TypeScript types (for TS) */
    includeTypes: boolean;
    /** Styling approach */
    styleApproach: 'stylesheet' | 'inline' | 'styled-components';
    /** Custom variable substitutions */
    customizations?: Record<string, string>;
}

// ============================================
// Version Comparison Types
// ============================================

/** Represents a modified API between versions */
export interface ModifiedAPI {
    symbol: string;
    fromSignature?: string;
    toSignature?: string;
    changes: string;
}

/** Represents differences between two library versions */
export interface VersionDiff {
    library: string;
    fromVersion: string;
    toVersion: string;
    /** APIs added in the new version */
    added: SymbolIndexEntry[];
    /** APIs removed in the new version */
    removed: SymbolIndexEntry[];
    /** APIs with signature changes */
    modified: ModifiedAPI[];
    /** Count of unchanged APIs */
    unchanged: number;
}

// ============================================
// Migration Types
// ============================================

/** Individual migration step */
export interface MigrationStep {
    /** Step order/number */
    order: number;
    /** Step title */
    title: string;
    /** Detailed description */
    description: string;
    /** Optional before/after code example */
    codeExample?: {
        before?: string;
        after?: string;
        language: string;
    };
    /** Whether this step can be automated */
    automated: boolean;
    /** Whether this is a breaking change */
    breaking: boolean;
    /** Reference documentation links */
    references: string[];
}

/** Complete migration guide between versions */
export interface MigrationPath {
    library: string;
    fromVersion: string;
    toVersion: string;
    /** Migration difficulty level */
    difficulty: 'easy' | 'moderate' | 'complex';
    /** Estimated time in minutes */
    estimatedTime: number;
    /** Ordered migration steps */
    steps: MigrationStep[];
    /** Summary of breaking changes */
    breakingChanges: string[];
    /** List of deprecated APIs */
    deprecations: string[];
    /** New features available */
    newFeatures: string[];
    /** Helpful resource links */
    resources: string[];
}
