# opensearch-eslint-config-opensearch-dashboards

The ESLint flat config used by the OpenSearch Dashboards team.

## Usage

Install the peer dependencies listed in `package.json`, then spread this config
into your `eslint.config.js`:

```js
const osdConfig = require('@elastic/eslint-config-kibana');

module.exports = [
  ...osdConfig,
  // your project-specific overrides
];
```

Requires ESLint 10+ (flat config format).
