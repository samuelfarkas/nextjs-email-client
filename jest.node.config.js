// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

const config = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.node.setup.js'],
  testMatch: [
    '**/api/**/*.test.ts',
    '**/app/api/**/*.test.ts',
    '**/services/**/*.test.ts',
  ],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/junit-reports',
        uniqueOutputName: 'false',
        suiteName: 'API tests',
        outputName: 'api-tests.xml',
        addFileAttribute: 'true',
        reportTestSuiteErrors: 'true',
        includeConsoleOutput: 'false',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' > ',
      },
    ],
  ],
};
module.exports = createJestConfig(config);
