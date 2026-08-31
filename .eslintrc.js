// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'expo',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  ignorePatterns: ['/dist/*', '/node_modules/*'],
  rules: {
    'prettier/prettier': 'error',
    'no-duplicate-imports': 'error',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    // These "React Compiler readiness" rules (added to eslint-config-expo's
    // react-hooks preset in SDK 56) assume patterns that don't apply here:
    // react-native-reanimated's SharedValue.value mutation and
    // react-native-gesture-handler's ref-based builder API are both
    // idiomatic in this codebase, and neither is compatible with React
    // Compiler's mutation model. This project does not use React Compiler.
    'react-hooks/refs': 'off',
    'react-hooks/immutability': 'off',
  },
  root: true,
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
};
