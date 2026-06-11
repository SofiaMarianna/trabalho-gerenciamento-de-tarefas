module.exports = {
    testEnvironment: 'jsdom',
    collectCoverageFrom: [
        'script.js'
    ],
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50
        }
    },
    testMatch: ['**/*.test.js'],
    verbose: true
};
