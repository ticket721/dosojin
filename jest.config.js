module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    coveragePathIgnorePatterns: [
        '<rootDir>/sources/log',
        '<rootDir>/dist/*',
        '<rootDir>/sources/tests/*',
        '<rootDir>/sources/mocks/*'
    ],
    testPathIgnorePatterns: [
        '<rootDir>/dist/'
    ]
};