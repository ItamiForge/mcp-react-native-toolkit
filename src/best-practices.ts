/**
 * Best Practices Module
 *
 * Curated performance and architecture recommendations for React Native
 * and Expo development. These are surfaced to AI agents to help them
 * suggest optimal patterns.
 */

import type { BestPractice } from './types.js';

/**
 * Best practices organized by library.
 * Each practice includes a title, description, and reference link.
 */
export const BEST_PRACTICES: Record<string, BestPractice[]> = {
    "react-native": [
        {
            title: "Use FlashList instead of FlatList",
            description: "For long lists, FlashList from Shopify is significantly more performant than React Native's built-in FlatList. It recycles components and maintains consistent 60fps scrolling.",
            link: "https://shopify.github.io/flash-list/"
        },
        {
            title: "Avoid Anonymous Functions in Render",
            description: "Passing anonymous functions as props causes child components to re-render unnecessarily. Use useCallback or define functions outside the render method.",
            link: "https://reactnative.dev/docs/performance"
        },
        {
            title: "Use React.memo for Pure Components",
            description: "Wrap functional components that render often with React.memo to prevent unnecessary re-renders when props haven't changed.",
            link: "https://reactnative.dev/docs/performance"
        },
        {
            title: "Optimize Images",
            description: "Use appropriately sized images, leverage caching, and consider using WebP format. For Expo, use expo-image. For bare RN, consider react-native-fast-image.",
            link: "https://reactnative.dev/docs/images"
        },
        {
            title: "Avoid Expensive Operations in Render",
            description: "Move expensive computations to useMemo, use InteractionManager for deferred work, and avoid synchronous operations that block the JS thread.",
            link: "https://reactnative.dev/docs/performance"
        }
    ],
    "expo": [
        {
            title: "Use Expo Image",
            description: "Expo Image is a cross-platform, highly performant image component that supports caching, placeholders, blur hashes, and smooth transitions.",
            link: "https://docs.expo.dev/versions/latest/sdk/image/"
        },
        {
            title: "Use Expo Router for Navigation",
            description: "Expo Router provides file-based routing with automatic deep linking, TypeScript support, and optimized bundle splitting.",
            link: "https://docs.expo.dev/router/introduction/"
        },
        {
            title: "Enable Hermes",
            description: "Hermes is enabled by default in Expo SDK 50+. It significantly improves startup time and reduces memory usage.",
            link: "https://docs.expo.dev/guides/using-hermes/"
        },
        {
            title: "Use EAS Build for Production",
            description: "EAS Build provides optimized production builds with proper signing, better caching, and consistent build environments.",
            link: "https://docs.expo.dev/build/introduction/"
        }
    ],
    "react-navigation": [
        {
            title: "Use Native Stack Navigator",
            description: "Prefer @react-navigation/native-stack over @react-navigation/stack for better performance. It uses native navigation primitives.",
            link: "https://reactnavigation.org/docs/native-stack-navigator/"
        },
        {
            title: "Avoid Passing Functions as Params",
            description: "Navigation params should be serializable. Pass IDs instead of objects, and fetch data in the target screen.",
            link: "https://reactnavigation.org/docs/params/"
        }
    ]
};

/**
 * Retrieves best practices for a specific library.
 *
 * @param library - The library identifier (e.g., "react-native", "expo")
 * @returns Array of best practice recommendations
 */
export function getBestPractices(library: string): BestPractice[] {
    return BEST_PRACTICES[library] || [];
}

/**
 * Retrieves all best practices across all libraries.
 *
 * @returns Record of all best practices by library
 */
export function getAllBestPractices(): Record<string, BestPractice[]> {
    return BEST_PRACTICES;
}
