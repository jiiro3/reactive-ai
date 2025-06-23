import typescript from '@rollup/plugin-typescript';

export default [
  // Main bundle
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist'
      })
    ],
    external: ['@reactive-ai/core', 'openai', '@google/generative-ai']
  },
  // OpenAI provider
  {
    input: 'src/openai.ts',
    output: [
      {
        file: 'dist/openai.js',
        format: 'cjs',
        sourcemap: true
      },
      {
        file: 'dist/openai.esm.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist'
      })
    ],
    external: ['@reactive-ai/core', 'openai']
  },
  // Gemini provider
  {
    input: 'src/gemini.ts',
    output: [
      {
        file: 'dist/gemini.js',
        format: 'cjs',
        sourcemap: true
      },
      {
        file: 'dist/gemini.esm.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist'
      })
    ],
    external: ['@reactive-ai/core', '@google/generative-ai']
  }
];