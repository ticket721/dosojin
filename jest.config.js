module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    coveragePathIgnorePatterns: [
        '<rootDir>/sources/log',
        '<rootDir>/dist/*',
        '<rootDir>/sources/tests/*'
    ],
    testPathIgnorePatterns: [
        '<rootDir>/dist/'
    ]
};