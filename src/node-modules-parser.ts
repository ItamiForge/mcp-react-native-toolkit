import fs from 'fs';
import path from 'path';
import type { SymbolIndexEntry } from './types.js';

/**
 * Parses TypeScript definition files (.d.ts) from node_modules
 * to extract API signatures for hybrid validation.
 */
export class NodeModulesParser {
    private cache: Map<string, SymbolIndexEntry[]> = new Map();

    /**
     * Parses a library's type definitions from node_modules
     */
    parseLibrary(
        libraryName: string,
        nodeModulesPath: string
    ): SymbolIndexEntry[] {
        // Check cache first
        const cacheKey = `${libraryName}:${nodeModulesPath}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const entries: SymbolIndexEntry[] = [];
        const libraryPath = path.join(nodeModulesPath, libraryName);

        if (!fs.existsSync(libraryPath)) {
            return entries;
        }

        // Find the main .d.ts file
        const packageJsonPath = path.join(libraryPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                const version = pkg.version || 'unknown';

                // Look for type definitions
                const typesEntry = pkg.types || pkg.typings || 'index.d.ts';
                const typesPath = path.join(libraryPath, typesEntry);

                if (fs.existsSync(typesPath)) {
                    const parsed = this.parseTypeFile(typesPath, libraryName, version);
                    entries.push(...parsed);
                }
            } catch (error) {
                console.error(`Failed to parse ${libraryName} package.json:`, error);
            }
        }

        // Also check for @types packages
        const typesPackage = `@types/${libraryName.replace('@', '').replace('/', '__')}`;
        const typesPath = path.join(nodeModulesPath, typesPackage);

        if (fs.existsSync(typesPath)) {
            const indexPath = path.join(typesPath, 'index.d.ts');
            if (fs.existsSync(indexPath)) {
                const parsed = this.parseTypeFile(indexPath, libraryName, 'types');
                entries.push(...parsed);
            }
        }

        this.cache.set(cacheKey, entries);
        return entries;
    }

    /**
     * Parses a single TypeScript definition file
     */
    private parseTypeFile(
        filePath: string,
        library: string,
        version: string
    ): SymbolIndexEntry[] {
        const entries: SymbolIndexEntry[] = [];

        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                // Export declarations
                if (line.startsWith('export ')) {
                    const entry = this.parseExportLine(line, filePath, library, version, i + 1);
                    if (entry) {
                        entries.push(entry);
                    }
                }

                // Declare statements
                if (line.startsWith('declare ')) {
                    const entry = this.parseDeclareLine(line, filePath, library, version, i + 1);
                    if (entry) {
                        entries.push(entry);
                    }
                }
            }
        } catch (error) {
            console.error(`Failed to parse ${filePath}:`, error);
        }

        return entries;
    }

    /**
     * Parses an export line to extract symbol information
     */
    private parseExportLine(
        line: string,
        file: string,
        library: string,
        version: string,
        lineNumber: number
    ): SymbolIndexEntry | null {
        // export function FunctionName
        const funcMatch = line.match(/export\s+(function|const)\s+([A-Za-z_][A-Za-z0-9_]*)/);
        if (funcMatch) {
            return {
                library,
                version,
                symbol: funcMatch[2],
                type: funcMatch[1] === 'function' ? 'function' : 'api',
                file,
                lineStart: lineNumber,
                lineEnd: lineNumber,
                signature: line,
                source: 'node_modules'
            };
        }

        // export class ClassName
        const classMatch = line.match(/export\s+class\s+([A-Za-z_][A-Za-z0-9_]*)/);
        if (classMatch) {
            return {
                library,
                version,
                symbol: classMatch[1],
                type: 'class',
                file,
                lineStart: lineNumber,
                lineEnd: lineNumber,
                signature: line,
                source: 'node_modules'
            };
        }

        // export interface InterfaceName
        const interfaceMatch = line.match(/export\s+interface\s+([A-Za-z_][A-Za-z0-9_]*)/);
        if (interfaceMatch) {
            return {
                library,
                version,
                symbol: interfaceMatch[1],
                type: 'interface',
                file,
                lineStart: lineNumber,
                lineEnd: lineNumber,
                signature: line,
                source: 'node_modules'
            };
        }

        // export type TypeName
        const typeMatch = line.match(/export\s+type\s+([A-Za-z_][A-Za-z0-9_]*)/);
        if (typeMatch) {
            return {
                library,
                version,
                symbol: typeMatch[1],
                type: 'type',
                file,
                lineStart: lineNumber,
                lineEnd: lineNumber,
                signature: line,
                source: 'node_modules'
            };
        }

        return null;
    }

    /**
     * Parses a declare line
     */
    private parseDeclareLine(
        line: string,
        file: string,
        library: string,
        version: string,
        lineNumber: number
    ): SymbolIndexEntry | null {
        // Similar to parseExportLine
        const match = line.match(/declare\s+(function|class|const|var|let)\s+([A-Za-z_][A-Za-z0-9_]*)/);
        if (match) {
            return {
                library,
                version,
                symbol: match[2],
                type: match[1] === 'function' ? 'function' : match[1] === 'class' ? 'class' : 'api',
                file,
                lineStart: lineNumber,
                lineEnd: lineNumber,
                signature: line,
                source: 'node_modules'
            };
        }

        return null;
    }

    /**
     * Finds a symbol in the parsed node_modules
     */
    findSymbol(
        symbol: string,
        libraryName: string,
        nodeModulesPath: string
    ): SymbolIndexEntry | null {
        const entries = this.parseLibrary(libraryName, nodeModulesPath);
        return entries.find(e => e.symbol === symbol) || null;
    }

    /**
     * Validates if a symbol exists in node_modules
     */
    validateSymbol(
        symbol: string,
        libraryName: string,
        nodeModulesPath: string
    ): { valid: boolean; signature?: string } {
        const entry = this.findSymbol(symbol, libraryName, nodeModulesPath);
        return {
            valid: entry !== null,
            signature: entry?.signature
        };
    }

    /**
     * Clears the cache
     */
    clearCache(): void {
        this.cache.clear();
    }
}

// Export singleton
export const nodeModulesParser = new NodeModulesParser();
