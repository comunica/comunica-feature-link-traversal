import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    '/test/',
    '/node_modules/',
    'engine-default.js',
    'index.js',
  ],
  coverageProvider: 'babel',
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  moduleFileExtensions: [
    'ts',
    'js',
  ],
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/engines/*/test/**/*-test.ts',
    '<rootDir>/packages/*/test/**/*-test.ts',
  ],
  transform: {
    '\\.ts$': [ 'ts-jest', {
      // Enabling this can fix issues when using prereleases of typings packages
      // isolatedModules: true
    }],
  },
  // The test timeout can be increased if the tests take too long
  // testTimeout: 20_000,
};

export default config;
