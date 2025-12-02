import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import type { Config, DocSource, Settings } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// Zod Schemas for Validation
// ============================================

const PreprocessingRulesSchema = z.object({
    stripComments: z.boolean().default(true),
    removeNavigation: z.boolean().default(true),
    minifyWhitespace: z.boolean().default(true)
});

const DocSourceSchema = z.object({
    id: z.string(),
    name: z.string(),
    repo: z.string().url(),
    docsPath: z.string(),
    branch: z.string().default('main'),
    versions: z.array(z.string()).optional(),
    locales: z.array(z.string()).optional(),
    description: z.string().optional(),
    sparseCheckoutPaths: z.array(z.string()).optional(),
    excludePaths: z.array(z.string()).optional(),
    preprocessingRules: PreprocessingRulesSchema.optional(),
    enabled: z.boolean().default(true),
    versionStrategy: z.enum(['none', 'sdk-branch', 'versioned-folder']).default('none'),
    versionBranchPattern: z.string().optional()
});

const SettingsSchema = z.object({
    defaultLocale: z.string().default('en'),
    enableSparseCheckout: z.boolean().default(true),
    cleanupTempDocs: z.boolean().default(true),
    preprocessMarkdown: z.boolean().default(true),
    chunkSizeTokens: z.number().default(2000),
    cacheEnabled: z.boolean().default(true),
    semanticSearchEnabled: z.boolean().default(true),
    embeddingModel: z.string().default('Xenova/all-MiniLM-L6-v2'),
    vectorIndexPath: z.string().default('./docs/.vector-index'),
    embeddingBatchSize: z.number().default(32)
});

const ConfigSchema = z.object({
    sources: z.array(DocSourceSchema),
    settings: SettingsSchema.optional()
});

// ============================================
// Configuration Manager
// ============================================

/**
 * Configuration manager for the MCP React Native Toolkit.
 * Loads and validates configuration from docs-sources.json.
 */
export class ConfigManager {
    private config: Config | null = null;
    private configPath: string;

    constructor(configPath?: string) {
        this.configPath = configPath || path.join(__dirname, '..', 'docs-sources.json');
    }

    /**
     * Loads the configuration file and validates it using Zod.
     * Throws an error if the file is missing or invalid.
     */
    load(): Config {
        if (this.config) {
            return this.config;
        }

        if (!fs.existsSync(this.configPath)) {
            throw new Error(`Configuration file not found: ${this.configPath}`);
        }

        try {
            const content = fs.readFileSync(this.configPath, 'utf-8');
            const raw = JSON.parse(content);
            this.config = ConfigSchema.parse(raw);
            return this.config;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
                throw new Error(`Invalid configuration: ${issues}`);
            }
            if (error instanceof SyntaxError) {
                throw new Error(`Invalid JSON in configuration file: ${error.message}`);
            }
            throw new Error(`Failed to load configuration: ${error}`);
        }
    }

    /**
     * Gets a specific documentation source by ID.
     */
    getSource(id: string): DocSource | undefined {
        const config = this.load();
        return config.sources.find(source => source.id === id);
    }

    /**
     * Gets all documentation sources.
     */
    getSources(): DocSource[] {
        const config = this.load();
        return config.sources;
    }

    /**
     * Gets only enabled documentation sources (enabled !== false).
     * Sources without an explicit enabled field default to true.
     */
    getEnabledSources(): DocSource[] {
        const config = this.load();
        return config.sources.filter(source => source.enabled !== false);
    }

    /**
     * Gets the settings object with defaults.
     */
    getSettings(): Settings {
        const config = this.load();
        return config.settings || {
            defaultLocale: 'en',
            enableSparseCheckout: true,
            cleanupTempDocs: true,
            preprocessMarkdown: true,
            chunkSizeTokens: 2000,
            cacheEnabled: true,
            semanticSearchEnabled: true,
            embeddingModel: 'Xenova/all-MiniLM-L6-v2',
            vectorIndexPath: './docs/.vector-index',
            embeddingBatchSize: 32
        };
    }

    /**
     * Reloads the configuration from disk.
     */
    reload(): Config {
        this.config = null;
        return this.load();
    }

    /**
     * Validates that all required sources are present.
     */
    validateSources(): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const config = this.load();

        if (config.sources.length === 0) {
            errors.push('No documentation sources configured');
        }

        for (const source of config.sources) {
            if (!source.repo.startsWith('https://')) {
                errors.push(`Source ${source.id}: repo must be an HTTPS URL`);
            }
            if (source.versions && source.versions.length === 0) {
                errors.push(`Source ${source.id}: versions array cannot be empty`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Export a singleton instance
export const configManager = new ConfigManager();
