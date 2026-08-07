# opensearch-eslint-config-opensearch-dashboards

The ESLint flat config used by the OpenSearch Dashboards team.

Requires ESLint 10+ (flat config format).

## Usage

Spread this config into your plugin's `eslint.config.js`, then append your own
overrides. You do **not** need to `require` or register any ESLint plugin: this
package registers every plugin it bundles (see `plugins.js`), so your override
blocks can reference any plugin rule — `@typescript-eslint/*`, `jest/*`,
`react-hooks/*`, `@osd/eslint/*`, ... — at any `files` scope.

```js
const osdConfig = require('@elastic/eslint-config-kibana');

module.exports = [
  ...osdConfig,
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 0,
    },
  },
];
```

### Ignores

ESLint 10 no longer reads `.eslintignore`. Put ignore patterns in a config
object with an `ignores` key:

```js
module.exports = [
  { ignores: ['build', 'target', '**/*.d.ts'] },
  ...osdConfig,
  // ...
];
```

### EUI rules (opt-in)

EUI linting is not part of the base config (OSD core does not lint against EUI
rules). Spread the ready-made EUI block, available from the `extras` module, if
your plugin wants it:

```js
const osdConfig = require('@elastic/eslint-config-kibana');
const { eui } = require('@elastic/eslint-config-kibana/extras');

module.exports = [...osdConfig, ...eui /*, your overrides */];
```

### License header

Enforce a license header via the `@osd/eslint/require-license-header` rule in
your own override block:

```js
const LICENSE_HEADER = `/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */`;

module.exports = [
  ...osdConfig,
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    rules: { '@osd/eslint/require-license-header': ['error', { licenses: [LICENSE_HEADER] }] },
  },
];
```

## Overriding a rule at a different file scope

The base config registers some plugins only for certain files (for example
`@typescript-eslint` for `**/*.{ts,tsx}`), but because all plugins are also
registered globally, you can reference their rules anywhere without doing
anything special.

If you want to register a plugin again in your own block (e.g. to apply a rule
to a broader `files` glob), get the instance from the `extras` module's
`plugins` rather than `require`-ing it yourself — flat config throws
`Cannot redefine plugin` if two *different* instances share a name, and reusing
this package's instance avoids that:

```js
const osdConfig = require('@elastic/eslint-config-kibana');
const { plugins } = require('@elastic/eslint-config-kibana/extras');

module.exports = [
  ...osdConfig,
  {
    files: ['**/*.{js,ts,tsx}'],
    plugins: { '@typescript-eslint': plugins.tsPlugin },
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
];
```

## Exports

| Subpath                                 | Contents                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| `@elastic/eslint-config-kibana`         | The flat config array (spread this).                                                  |
| `@elastic/eslint-config-kibana/extras`  | `{ eui, plugins, restrictedGlobals }` — the opt-in EUI block, bundled plugin instances (with `globalPluginRegistration`), and the restricted-globals list. |
