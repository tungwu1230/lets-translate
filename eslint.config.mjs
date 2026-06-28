import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import pluginPrettier from 'eslint-plugin-prettier'

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'react-hooks': pluginReactHooks,
      prettier: pluginPrettier,
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      'prettier/prettier': 'warn',
      // Disable strict React Hooks rules that may produce false positives
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
  {
    ignores: ['dist', 'node_modules', '*.config.js', 'scratch', 'server.js'],
  },
]
