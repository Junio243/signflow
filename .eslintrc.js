module.exports = {
  root: true,
  parser: require.resolve('next/dist/compiled/babel/eslint-parser'),
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      presets: [
        require.resolve('next/dist/compiled/babel/preset-env'),
        [require.resolve('next/dist/compiled/babel/preset-react'), { runtime: 'automatic' }],
        require.resolve('next/dist/compiled/babel/preset-typescript'),
      ],
    },
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  rules: {
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'no-undef': 'off',
  },
}
