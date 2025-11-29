import * as semver from 'semver';

/**
 * Resolves a semver range to the best matching version from available versions.
 * Handles React Native/Expo version strings with edge cases.
 */
export class SemverResolver {
    /**
     * Given a version range (e.g., "^0.72.0", "~1.2.3") and available versions,
     * returns the best matching version or falls back intelligently.
     * 
     * @param requestedVersion - The version range requested (can be exact, range, or "auto"/"latest")
     * @param availableVersions - List of available version strings
     * @param fallbackToLatest - If true, falls back to "latest" when no match found
     * @returns The best matching version string
     */
    resolve(
        requestedVersion: string,
        availableVersions: string[],
        fallbackToLatest: boolean = true
    ): string {
        // Handle special cases
        if (requestedVersion === 'latest' || requestedVersion === 'auto') {
            return 'latest';
        }

        // Clean the requested version (remove ^, ~, etc.)
        const cleanRequested = this.cleanVersion(requestedVersion);

        // Check for exact match first
        if (availableVersions.includes(cleanRequested)) {
            return cleanRequested;
        }

        // Try semver range matching
        const validVersions = availableVersions.filter(v => {
            const cleaned = this.cleanVersion(v);
            return semver.valid(cleaned);
        }).map(v => this.cleanVersion(v));

        if (validVersions.length === 0) {
            return fallbackToLatest ? 'latest' : availableVersions[0] || 'latest';
        }

        // Try to find best match using semver
        try {
            const maxSatisfying = semver.maxSatisfying(validVersions, requestedVersion);
            if (maxSatisfying) {
                // Return the original version string that corresponds to this
                const index = validVersions.indexOf(maxSatisfying);
                return availableVersions[index] || maxSatisfying;
            }
        } catch (error) {
            // Invalid semver range, fall through to fuzzy matching
        }

        // Fuzzy match: find closest version
        const closestVersion = this.findClosestVersion(cleanRequested, availableVersions);
        if (closestVersion) {
            return closestVersion;
        }

        // Last resort
        return fallbackToLatest ? 'latest' : availableVersions[0] || 'latest';
    }

    /**
     * Cleans a version string, removing semver operators (^, ~, >=, etc.)
     */
    private cleanVersion(version: string): string {
        return version.replace(/^[\^~>=<]+/, '').trim();
    }

    /**
     * Finds the closest version by comparing major.minor.patch components
     */
    private findClosestVersion(target: string, available: string[]): string | null {
        const targetParsed = semver.parse(target);
        if (!targetParsed) return null;

        let bestMatch: string | null = null;
        let bestScore = -1;

        for (const version of available) {
            const cleaned = this.cleanVersion(version);
            const parsed = semver.parse(cleaned);
            if (!parsed) continue;

            // Score: Major = 1000, Minor = 100, Patch = 1
            // Penalize if higher version
            const majorDiff = parsed.major - targetParsed.major;
            const minorDiff = parsed.minor - targetParsed.minor;
            const patchDiff = parsed.patch - targetParsed.patch;

            // Only consider versions <= target or very close
            if (majorDiff > 0 && majorDiff > 1) continue; // Skip if more than 1 major version ahead

            const score =
                (majorDiff === 0 ? 1000 : -1000 * Math.abs(majorDiff)) +
                (minorDiff === 0 ? 100 : -100 * Math.abs(minorDiff)) +
                (patchDiff === 0 ? 1 : -1 * Math.abs(patchDiff));

            if (score > bestScore) {
                bestScore = score;
                bestMatch = version;
            }
        }

        return bestMatch;
    }

    /**
     * Extracts the major.minor version (e.g., "0.72" from "0.72.5")
     */
    getMajorMinor(version: string): string | null {
        const cleaned = this.cleanVersion(version);
        const parsed = semver.parse(cleaned);
        if (!parsed) return null;
        return `${parsed.major}.${parsed.minor}`;
    }

    /**
     * Checks if a version satisfies a range
     */
    satisfies(version: string, range: string): boolean {
        try {
            const cleaned = this.cleanVersion(version);
            return semver.satisfies(cleaned, range);
        } catch {
            return false;
        }
    }
}

// Export singleton instance
export const semverResolver = new SemverResolver();
