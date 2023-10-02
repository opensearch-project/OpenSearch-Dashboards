# osd-stylelint-config

The Stylelint config used by OpenSearch Dashboards. This package is created to enable the modification of rules with the JSON files in `config/` and any consumer of the `@osd/stylelint-plugin-stylelint` can just extend this config within its `.stylelintrc`.

The ideal state being that this package is maintained externally from the OpenSearch Dashboards repo so that the configs can be modified with rules without being blocked by processes within OpenSearch Dashboards.

Issue:
https://github.com/opensearch-project/oui/issues/845

## Usage

To use this stylelint config, just install the peer dependencies and reference it
in your `.stylelintrc`:

```javascript
{
  extends: [
    '@osd/stylelint-config'
  ]
}
```

This JSON configs that are sent through the compliance engine are expected to follow the schema:

```json
{
  "cssProperty": {
    "regexOfSelector": [
      {
        "approved": "OUICompliantValue1",
        "rejected": [
          "OUIViolationValue1",
          "OUIViolationValue2",
        ]
      },
      {
        "approved": "OUICompliantValue2",
        "rejected": [
          "OUIViolationValue3"
        ]
      }
    ]
  }
}
```
