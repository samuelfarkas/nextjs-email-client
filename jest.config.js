module.exports = {
  projects: ['<rootDir>/jest.node.config.js', '<rootDir>/jest.react.config.js'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'junit-reports',
      },
    ],
  ],
};
