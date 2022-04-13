# opensearch-eslint-config-opensearch-dashboards

The eslint config used by the opensearch dashboards team

## Usage

To use this eslint config, just install the peer dependencies and reference it 
in your `.eslintrc`:

```javascript
{
  extends: [
    '@osd/eslint-config-opensearch-dashboards'
  ]
}
```

## Optional jest config

If the project uses the [jest test runner](https://facebook.github.io/jest/), 
the `@osd/eslint-config-opensearch-dashboards/jest` config can be extended as well to use 
`eslint-plugin-jest` and add settings specific to it:

```javascript
{
  extends: [
    '@osd/eslint-config-opensearch-dashboards',
    '@osd/eslint-config-opensearch-dashboards/jest'
  ]
}
```
