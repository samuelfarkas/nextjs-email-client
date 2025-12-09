// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.react.setup.js'],
  testPathIgnorePatterns: ['/api/', '/app/api/', '/services/'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/junit-reports',
        uniqueOutputName: 'false',
        suiteName: 'React tests',
        outputName: 'nextjs-template.xml',
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
