export default {
    preset: 'ts-jest/presets/default-esm',
    extensionsToTreatAsEsm: ['.ts'],
    testEnvironment: 'node',
    roots: ['<rootDir>/test', '<rootDir>/src'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
            },
        ],
    },
    testMatch: [
        '**/test/**/*.test.ts'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/temp_docs/',
        '/docs/',
        '/dist/'
    ],
    modulePathIgnorePatterns: [
        '<rootDir>/temp_docs',
        '<rootDir>/docs'
    ],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/*.test.ts'
    ],
    coverageDirectory: 'coverage',
    verbose: true
};
