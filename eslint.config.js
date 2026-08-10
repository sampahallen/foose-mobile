const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*'],
  },
  {
    // `src/types/api.ts` is a verbatim copy of `frontend/src/types/api.ts` so the two apps stay in
    // step with one diff. Do not reformat it here — change it in `frontend/` and copy it across.
    files: ['src/types/api.ts'],
    rules: { '@typescript-eslint/array-type': 'off' },
  },
])
