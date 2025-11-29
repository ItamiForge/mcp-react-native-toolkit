import fs from 'fs';
import path from 'path';
import type { ProjectContext } from './types.js';

export class ContextDetector {
    /**
     * Detects the project context by looking for package.json in the given directory
     * or its parents.
     */
    detectContext(cwd: string): ProjectContext | null {
        const packageJsonPath = this.findPackageJson(cwd);
        if (!packageJsonPath) {
            return null;
        }

        try {
            const content = fs.readFileSync(packageJsonPath, 'utf-8');
            const pkg = JSON.parse(content);
            const dependencies = pkg.dependencies || {};
            const devDependencies = pkg.devDependencies || {};
            const scripts = pkg.scripts || {};

            // Detect Ignite via multiple signals
            const hasIgniteCli = !!devDependencies['ignite-cli'];
            const hasIgniteScripts = Object.keys(scripts).some(script =>
                script.includes('ignite') || scripts[script].includes('ignite')
            );
            const hasIgniteDeps = Object.keys(dependencies).some(dep =>
                dep.startsWith('react-native-') && pkg.generator === 'ignite-cli'
            );
            const igniteDetected = hasIgniteCli || hasIgniteScripts || hasIgniteDeps;

            return {
                dependencies,
                devDependencies,
                versions: {
                    reactNative: dependencies['react-native'] || devDependencies['react-native'],
                    expo: dependencies['expo'] || devDependencies['expo'],
                    reactNavigation: dependencies['@react-navigation/native'] || dependencies['react-navigation'],
                    ignite: igniteDetected ? (devDependencies['ignite-cli'] || 'detected') : undefined
                }
            };
        } catch (error) {
            if (error instanceof SyntaxError) {
                console.error(`Malformed package.json at ${packageJsonPath}:`, error.message);
            } else {
                console.error(`Failed to parse package.json at ${packageJsonPath}:`, error);
            }
            return null;
        }
    }

    private findPackageJson(startDir: string): string | null {
        let currentDir = startDir;
        const maxDepth = 10; // Prevent infinite loops
        let depth = 0;

        while (currentDir !== path.parse(currentDir).root && depth < maxDepth) {
            const pkgPath = path.join(currentDir, 'package.json');
            if (fs.existsSync(pkgPath)) {
                return pkgPath;
            }
            currentDir = path.dirname(currentDir);
            depth++;
        }
        return null;
    }
}

