module.exports = {
  extends: [
    '../../.eslintrc.js',
    'next/core-web-vitals',
  ],
  env: {
    browser: true,
    node: true,
  },
  rules: {
    'react/no-unescaped-entities': 'off',
    '@next/next/no-page-custom-font': 'off',
  },
};