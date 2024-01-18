module.exports = {
  root: true,
  extends: ['@elastic/eslint-config-kibana', 'plugin:@elastic/eui/recommended'],
  rules: {
    '@osd/eslint/require-license-header': 'off',
  },
};
