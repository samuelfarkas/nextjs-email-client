/** @type {import("prettier").Config} */
const config = {
  // Match ESLint: 'quotes': ['error', 'single', { 'avoidEscape': true }]
  singleQuote: true,

  // Match ESLint: 'semi': ['error', 'always']
  semi: true,

  // Match ESLint: 'comma-dangle': ['error', 'always-multiline']
  trailingComma: 'all',

  // Match ESLint: 'indent': ['error', 2]
  tabWidth: 2,
  useTabs: false,

  // Match ESLint: 'eol-last': ['error', 'always']
  // Prettier always adds a final newline by default

  // Match ESLint: 'no-trailing-spaces': 'error'
  // Prettier automatically removes trailing whitespace

  // Additional sensible defaults
  printWidth: 80,
  bracketSpacing: true, // Match ESLint: 'object-curly-spacing': ['error', 'always']
};

export default config;
