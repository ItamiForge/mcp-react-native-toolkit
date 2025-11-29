/**
 * Migration Guidance Module
 * 
 * Provides curated migration paths and breaking change information
 * for upgrading between library versions.
 */

import type { MigrationPath, MigrationStep } from './types.js';

/**
 * Normalize version string for consistent comparison
 * Removes patch version and 'v' prefix
 */
function normalizeVersion(version: string): string {
    return version
        .replace(/^v/, '')
        .replace(/^SDK\s*/i, '')
        .split('.')
        .slice(0, 2)
        .join('.');
}

/**
 * Create a migration key for lookup
 */
function createMigrationKey(library: string, fromVersion: string, toVersion: string): string {
    return `${library}:${normalizeVersion(fromVersion)}->${normalizeVersion(toVersion)}`;
}

/**
 * Curated migration paths for common version upgrades
 */
export const KNOWN_MIGRATIONS: Record<string, MigrationPath> = {
    // ============================================
    // React Native Migrations
    // ============================================
    'react-native:0.72->0.73': {
        library: 'react-native',
        fromVersion: '0.72',
        toVersion: '0.73',
        difficulty: 'moderate',
        estimatedTime: 60,
        steps: [
            {
                order: 1,
                title: 'Update React Native version',
                description: 'Update react-native in package.json to 0.73.x',
                codeExample: {
                    before: '"react-native": "0.72.x"',
                    after: '"react-native": "0.73.x"',
                    language: 'json',
                },
                automated: true,
                breaking: false,
                references: ['https://reactnative.dev/blog/2023/12/06/0.73-debugging-improvements-stable-symlinks'],
            },
            {
                order: 2,
                title: 'Update Metro config',
                description: 'Metro config now uses metro.config.js with updated resolver settings. The unstable_enableSymlinks option is now stable.',
                codeExample: {
                    before: `const {getDefaultConfig} = require('metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig();
  return config;
})();`,
                    after: `const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);`,
                    language: 'javascript',
                },
                automated: false,
                breaking: true,
                references: ['https://reactnative.dev/docs/metro'],
            },
            {
                order: 3,
                title: 'Update Babel config',
                description: 'Ensure babel.config.js uses the correct preset from @react-native/babel-preset',
                automated: false,
                breaking: false,
                references: ['https://reactnative.dev/docs/typescript'],
            },
            {
                order: 4,
                title: 'Android: Update Gradle',
                description: 'Update Android Gradle Plugin to 8.1.x and Gradle to 8.3',
                automated: false,
                breaking: true,
                references: ['https://reactnative.dev/docs/build-speed'],
            },
            {
                order: 5,
                title: 'iOS: Update Podfile',
                description: 'Run pod install --repo-update to update iOS dependencies',
                automated: true,
                breaking: false,
                references: ['https://reactnative.dev/docs/integration-with-existing-apps'],
            },
            {
                order: 6,
                title: 'Debugging improvements',
                description: 'React Native 0.73 introduces improved debugging with Hermes. Flipper is being deprecated in favor of Chrome DevTools.',
                automated: false,
                breaking: false,
                references: ['https://reactnative.dev/docs/debugging'],
            },
        ],
        breakingChanges: [
            'Metro config structure has changed - update to use mergeConfig',
            'Android Gradle Plugin 8.1+ required',
            'Minimum iOS deployment target is 13.4',
            'Flipper support is deprecated',
        ],
        deprecations: [
            'Flipper debugging (use Chrome DevTools instead)',
            'Legacy Metro config format',
        ],
        newFeatures: [
            'Stable symlink support in Metro',
            'Improved Hermes debugging experience',
            'Better TypeScript support',
            'Kotlin 1.9 support on Android',
        ],
        resources: [
            'https://reactnative.dev/blog/2023/12/06/0.73-debugging-improvements-stable-symlinks',
            'https://react-native-community.github.io/upgrade-helper/?from=0.72.0&to=0.73.0',
        ],
    },

    'react-native:0.73->0.74': {
        library: 'react-native',
        fromVersion: '0.73',
        toVersion: '0.74',
        difficulty: 'moderate',
        estimatedTime: 90,
        steps: [
            {
                order: 1,
                title: 'Update React Native version',
                description: 'Update react-native in package.json to 0.74.x',
                automated: true,
                breaking: false,
                references: ['https://reactnative.dev/blog/2024/04/22/release-0.74'],
            },
            {
                order: 2,
                title: 'Yoga 3.0 layout changes',
                description: 'React Native 0.74 uses Yoga 3.0 which has stricter layout behavior. Test your layouts carefully.',
                automated: false,
                breaking: true,
                references: ['https://www.yogalayout.dev/blog/announcing-yoga-3.0'],
            },
            {
                order: 3,
                title: 'Bridgeless mode (New Architecture)',
                description: 'Bridgeless mode is now available. Consider enabling it for better performance.',
                codeExample: {
                    before: '// No bridgeless configuration',
                    after: `// In react-native.config.js
module.exports = {
  // Enable bridgeless mode
  reactNativeArchitecture: 'bridgeless',
};`,
                    language: 'javascript',
                },
                automated: false,
                breaking: false,
                references: ['https://reactnative.dev/docs/the-new-architecture/landing-page'],
            },
            {
                order: 4,
                title: 'Android: Update build configuration',
                description: 'Update android/gradle.properties and build.gradle for 0.74 compatibility',
                automated: false,
                breaking: true,
                references: ['https://reactnative.dev/docs/build-speed'],
            },
            {
                order: 5,
                title: 'Remove PropTypes usage',
                description: 'PropTypes are no longer included. Use TypeScript for type checking.',
                automated: false,
                breaking: true,
                references: ['https://reactnative.dev/docs/typescript'],
            },
        ],
        breakingChanges: [
            'Yoga 3.0 may affect layouts with percentage values and aspect ratios',
            'PropTypes removed from React Native core',
            'Android minimum SDK raised to 23',
            'Some deprecated APIs removed',
        ],
        deprecations: [
            'PropTypes (use TypeScript)',
            'Legacy architecture without bridge',
        ],
        newFeatures: [
            'Bridgeless New Architecture',
            'Yoga 3.0 for improved layout',
            'React 18.2 support',
            'Improved Metro startup time',
        ],
        resources: [
            'https://reactnative.dev/blog/2024/04/22/release-0.74',
            'https://react-native-community.github.io/upgrade-helper/?from=0.73.0&to=0.74.0',
        ],
    },

    // ============================================
    // Expo SDK Migrations
    // ============================================
    'expo:49->50': {
        library: 'expo',
        fromVersion: '49',
        toVersion: '50',
        difficulty: 'moderate',
        estimatedTime: 45,
        steps: [
            {
                order: 1,
                title: 'Update Expo SDK',
                description: 'Run expo upgrade command or update expo package manually',
                codeExample: {
                    before: '"expo": "~49.0.0"',
                    after: '"expo": "~50.0.0"',
                    language: 'json',
                },
                automated: true,
                breaking: false,
                references: ['https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/'],
            },
            {
                order: 2,
                title: 'Update React Native',
                description: 'Expo SDK 50 uses React Native 0.73',
                automated: true,
                breaking: false,
                references: ['https://docs.expo.dev/versions/v50.0.0/'],
            },
            {
                order: 3,
                title: 'Migrate expo-constants',
                description: 'Constants.manifest is deprecated. Use Constants.expoConfig instead.',
                codeExample: {
                    before: `import Constants from 'expo-constants';
const version = Constants.manifest?.version;`,
                    after: `import Constants from 'expo-constants';
const version = Constants.expoConfig?.version;`,
                    language: 'typescript',
                },
                automated: false,
                breaking: true,
                references: ['https://docs.expo.dev/versions/v50.0.0/sdk/constants/'],
            },
            {
                order: 4,
                title: 'Update expo-router if used',
                description: 'Expo Router v3 has API changes. Update navigation patterns.',
                automated: false,
                breaking: true,
                references: ['https://docs.expo.dev/router/introduction/'],
            },
            {
                order: 5,
                title: 'Review deprecated packages',
                description: 'Some expo-* packages have been deprecated or merged.',
                automated: false,
                breaking: false,
                references: ['https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/'],
            },
        ],
        breakingChanges: [
            'Constants.manifest replaced with Constants.expoConfig',
            'expo-router v3 has navigation API changes',
            'Minimum iOS version is 13.4',
            'Minimum Android SDK is 23',
        ],
        deprecations: [
            'Constants.manifest (use expoConfig)',
            'expo-app-loading (use expo-splash-screen)',
            'Several legacy expo packages',
        ],
        newFeatures: [
            'React Native 0.73 support',
            'Expo Router v3 with improved performance',
            'Better debugging with Chrome DevTools',
            'Improved EAS Build speed',
        ],
        resources: [
            'https://expo.dev/changelog/2024/01-18-sdk-50',
            'https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/',
        ],
    },

    'expo:50->51': {
        library: 'expo',
        fromVersion: '50',
        toVersion: '51',
        difficulty: 'easy',
        estimatedTime: 30,
        steps: [
            {
                order: 1,
                title: 'Update Expo SDK',
                description: 'Run npx expo install expo@^51.0.0 or update manually',
                automated: true,
                breaking: false,
                references: ['https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/'],
            },
            {
                order: 2,
                title: 'Update React Native',
                description: 'Expo SDK 51 uses React Native 0.74',
                automated: true,
                breaking: false,
                references: ['https://docs.expo.dev/versions/v51.0.0/'],
            },
            {
                order: 3,
                title: 'Check Yoga layout changes',
                description: 'SDK 51 includes Yoga 3.0 which may affect some layouts',
                automated: false,
                breaking: true,
                references: ['https://www.yogalayout.dev/blog/announcing-yoga-3.0'],
            },
            {
                order: 4,
                title: 'Update dependencies',
                description: 'Run npx expo install --fix to update all Expo packages',
                automated: true,
                breaking: false,
                references: ['https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/'],
            },
        ],
        breakingChanges: [
            'Yoga 3.0 layout changes (percentage values, aspect ratios)',
            'React Native 0.74 deprecations apply',
        ],
        deprecations: [
            'Some legacy APIs deprecated in RN 0.74',
        ],
        newFeatures: [
            'React Native 0.74 with bridgeless support',
            'Improved Metro bundler',
            'Better TypeScript support',
            'New Architecture improvements',
        ],
        resources: [
            'https://expo.dev/changelog/2024/05-07-sdk-51',
            'https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/',
        ],
    },

    // ============================================
    // React Navigation Migrations
    // ============================================
    'react-navigation:6->7': {
        library: 'react-navigation',
        fromVersion: '6',
        toVersion: '7',
        difficulty: 'moderate',
        estimatedTime: 60,
        steps: [
            {
                order: 1,
                title: 'Update React Navigation packages',
                description: 'Update all @react-navigation/* packages to v7',
                codeExample: {
                    before: `"@react-navigation/native": "^6.x",
"@react-navigation/native-stack": "^6.x"`,
                    after: `"@react-navigation/native": "^7.x",
"@react-navigation/native-stack": "^7.x"`,
                    language: 'json',
                },
                automated: true,
                breaking: false,
                references: ['https://reactnavigation.org/docs/upgrading-from-6.x'],
            },
            {
                order: 2,
                title: 'Update NavigationContainer props',
                description: 'Some NavigationContainer props have been renamed or removed',
                automated: false,
                breaking: true,
                references: ['https://reactnavigation.org/docs/navigation-container'],
            },
            {
                order: 3,
                title: 'Update screen options',
                description: 'Some screen options have been renamed for consistency',
                automated: false,
                breaking: true,
                references: ['https://reactnavigation.org/docs/screen-options'],
            },
            {
                order: 4,
                title: 'Static TypeScript configuration',
                description: 'React Navigation 7 introduces static TypeScript configuration for better type inference',
                codeExample: {
                    before: `const Stack = createNativeStackNavigator<RootStackParamList>();`,
                    after: `const Stack = createNativeStackNavigator({
  screens: {
    Home: HomeScreen,
    Details: DetailsScreen,
  },
});`,
                    language: 'typescript',
                },
                automated: false,
                breaking: false,
                references: ['https://reactnavigation.org/docs/typescript'],
            },
            {
                order: 5,
                title: 'Update useNavigation typing',
                description: 'Navigation prop typing has improved with static configuration',
                automated: false,
                breaking: false,
                references: ['https://reactnavigation.org/docs/typescript'],
            },
        ],
        breakingChanges: [
            'Some NavigationContainer props renamed',
            'Screen options API changes',
            'Deprecated options removed',
        ],
        deprecations: [
            'Dynamic createNavigator pattern (prefer static config)',
            'Some legacy screen options',
        ],
        newFeatures: [
            'Static TypeScript configuration',
            'Improved type inference',
            'Better performance',
            'Simplified API',
        ],
        resources: [
            'https://reactnavigation.org/docs/upgrading-from-6.x',
            'https://reactnavigation.org/blog/',
        ],
    },

    // ============================================
    // Reanimated Migrations
    // ============================================
    'react-native-reanimated:2->3': {
        library: 'react-native-reanimated',
        fromVersion: '2',
        toVersion: '3',
        difficulty: 'moderate',
        estimatedTime: 45,
        steps: [
            {
                order: 1,
                title: 'Update Reanimated package',
                description: 'Update react-native-reanimated to v3',
                codeExample: {
                    before: '"react-native-reanimated": "^2.x"',
                    after: '"react-native-reanimated": "^3.x"',
                    language: 'json',
                },
                automated: true,
                breaking: false,
                references: ['https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-2.x/'],
            },
            {
                order: 2,
                title: 'Update Babel plugin',
                description: 'Ensure babel.config.js has the Reanimated plugin correctly configured',
                codeExample: {
                    before: `plugins: ['react-native-reanimated/plugin']`,
                    after: `plugins: ['react-native-reanimated/plugin']`,
                    language: 'javascript',
                },
                automated: false,
                breaking: false,
                references: ['https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/installation'],
            },
            {
                order: 3,
                title: 'Update shared value initialization',
                description: 'useSharedValue now requires initial value of correct type',
                automated: false,
                breaking: true,
                references: ['https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue'],
            },
            {
                order: 4,
                title: 'Update layout animations',
                description: 'Layout animations API has been simplified',
                codeExample: {
                    before: `<Animated.View entering={FadeIn.duration(500)} />`,
                    after: `<Animated.View entering={FadeIn.duration(500)} />`,
                    language: 'typescript',
                },
                automated: false,
                breaking: false,
                references: ['https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/entering-exiting-animations'],
            },
            {
                order: 5,
                title: 'iOS: Rebuild native modules',
                description: 'Run pod install and rebuild the app',
                automated: true,
                breaking: false,
                references: ['https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/installation'],
            },
        ],
        breakingChanges: [
            'Shared values must be initialized with correct types',
            'Some deprecated APIs removed',
            'Worklet syntax requirements stricter',
        ],
        deprecations: [
            'Reanimated 1 compatibility layer removed',
            'Some legacy animation patterns',
        ],
        newFeatures: [
            'Improved performance',
            'Better TypeScript support',
            'New shared element transitions',
            'Improved layout animations',
        ],
        resources: [
            'https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-2.x/',
            'https://github.com/software-mansion/react-native-reanimated/releases',
        ],
    },
};

/**
 * Get a specific migration path
 */
export function getMigrationPath(
    library: string,
    fromVersion: string,
    toVersion: string
): MigrationPath | null {
    const key = createMigrationKey(library, fromVersion, toVersion);
    return KNOWN_MIGRATIONS[key] || null;
}

/**
 * Find a migration path, potentially chaining multiple migrations
 */
export function findMigrationPath(
    library: string,
    fromVersion: string,
    toVersion: string
): MigrationPath | null {
    // Try direct migration first
    const direct = getMigrationPath(library, fromVersion, toVersion);
    if (direct) return direct;

    // Try to find a chain of migrations
    const fromNorm = normalizeVersion(fromVersion);
    const toNorm = normalizeVersion(toVersion);

    // Get all migrations for this library
    const libraryMigrations = Object.values(KNOWN_MIGRATIONS)
        .filter(m => m.library === library)
        .sort((a, b) => parseFloat(a.fromVersion) - parseFloat(b.fromVersion));

    // Build a path
    const chain: MigrationPath[] = [];
    let currentVersion = fromNorm;

    for (const migration of libraryMigrations) {
        if (migration.fromVersion === currentVersion) {
            chain.push(migration);
            currentVersion = migration.toVersion;
            if (currentVersion === toNorm) break;
        }
    }

    if (chain.length === 0 || currentVersion !== toNorm) {
        return null;
    }

    // Combine chain into single migration path
    return combineMigrationPaths(chain, fromVersion, toVersion);
}

/**
 * Combine multiple migration paths into one
 */
function combineMigrationPaths(
    paths: MigrationPath[],
    fromVersion: string,
    toVersion: string
): MigrationPath {
    const allSteps: MigrationStep[] = [];
    let stepOrder = 1;

    for (const path of paths) {
        for (const step of path.steps) {
            allSteps.push({
                ...step,
                order: stepOrder++,
                title: `[${path.fromVersion} → ${path.toVersion}] ${step.title}`,
            });
        }
    }

    // Calculate combined difficulty
    const difficulties = paths.map(p => p.difficulty);
    let combinedDifficulty: 'easy' | 'moderate' | 'complex' = 'easy';
    if (difficulties.includes('complex')) combinedDifficulty = 'complex';
    else if (difficulties.includes('moderate')) combinedDifficulty = 'moderate';

    return {
        library: paths[0].library,
        fromVersion,
        toVersion,
        difficulty: combinedDifficulty,
        estimatedTime: paths.reduce((sum, p) => sum + p.estimatedTime, 0),
        steps: allSteps,
        breakingChanges: paths.flatMap(p => p.breakingChanges),
        deprecations: paths.flatMap(p => p.deprecations),
        newFeatures: paths.flatMap(p => p.newFeatures),
        resources: paths.flatMap(p => p.resources),
    };
}

/**
 * Get just the breaking changes for a migration
 */
export function getBreakingChanges(
    library: string,
    fromVersion: string,
    toVersion: string
): string[] {
    const migration = findMigrationPath(library, fromVersion, toVersion);
    return migration?.breakingChanges || [];
}

/**
 * Get deprecated APIs for a migration
 */
export function getDeprecatedAPIs(
    library: string,
    fromVersion: string,
    toVersion: string
): string[] {
    const migration = findMigrationPath(library, fromVersion, toVersion);
    return migration?.deprecations || [];
}

/**
 * Generate a markdown checklist from migration steps
 */
export function generateMigrationChecklist(migration: MigrationPath): string {
    const lines: string[] = [
        `# Migration Checklist: ${migration.library} ${migration.fromVersion} → ${migration.toVersion}`,
        '',
        `**Difficulty:** ${migration.difficulty}`,
        `**Estimated Time:** ${migration.estimatedTime} minutes`,
        '',
        '## Steps',
        '',
    ];

    for (const step of migration.steps) {
        const breaking = step.breaking ? ' ⚠️ BREAKING' : '';
        const automated = step.automated ? ' 🤖 Automated' : '';
        lines.push(`- [ ] **${step.order}. ${step.title}**${breaking}${automated}`);
        lines.push(`  ${step.description}`);
        lines.push('');
    }

    if (migration.breakingChanges.length > 0) {
        lines.push('## ⚠️ Breaking Changes');
        lines.push('');
        for (const change of migration.breakingChanges) {
            lines.push(`- ${change}`);
        }
        lines.push('');
    }

    if (migration.newFeatures.length > 0) {
        lines.push('## ✨ New Features');
        lines.push('');
        for (const feature of migration.newFeatures) {
            lines.push(`- ${feature}`);
        }
        lines.push('');
    }

    if (migration.resources.length > 0) {
        lines.push('## 📚 Resources');
        lines.push('');
        for (const resource of migration.resources) {
            lines.push(`- ${resource}`);
        }
    }

    return lines.join('\n');
}

/**
 * Estimate migration complexity based on version gap
 */
export function estimateMigrationComplexity(
    library: string,
    fromVersion: string,
    toVersion: string
): 'easy' | 'moderate' | 'complex' {
    const migration = findMigrationPath(library, fromVersion, toVersion);
    if (migration) return migration.difficulty;

    // Estimate based on version gap
    const fromNum = parseFloat(normalizeVersion(fromVersion));
    const toNum = parseFloat(normalizeVersion(toVersion));
    const gap = toNum - fromNum;

    if (gap <= 0.01) return 'easy';
    if (gap <= 0.02) return 'moderate';
    return 'complex';
}

/**
 * List all available migrations for a library
 */
export function listMigrationsForLibrary(library: string): MigrationPath[] {
    return Object.values(KNOWN_MIGRATIONS).filter(m => m.library === library);
}
