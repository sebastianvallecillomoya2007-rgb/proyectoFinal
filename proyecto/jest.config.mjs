export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['<rootDir>/src/**/*.jest.test.js'],
  clearMocks: true,
  collectCoverageFrom: ['src/categories.js', 'src/service/api.js', 'src/service/semanticRanking.js'],
  coverageDirectory: 'artifacts/jest-coverage',
}
