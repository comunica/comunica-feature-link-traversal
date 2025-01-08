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
  // The system tests from engines require a timeout longer than the default 5 seconds
  testTimeout: 20_000,
};

export default config;
