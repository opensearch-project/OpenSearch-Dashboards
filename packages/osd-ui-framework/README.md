# OpenSearch Dashboards UI Framework - Deprecation Notice

The UI Framework package is on a deprecation path and is actively being removed from OpenSearch Dashboards. Progress on this project can be followed in [#1060](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1060).

This framework was used to build legacy layouts in Kibana 5.x and 6.x and is replaced by EUI.

## Documentation

Compile the CSS with `yarn uiFramework:compileCss`.

You can run `node scripts/jest --watch` to watch for changes and run the tests as you code.

You can run `node scripts/jest --coverage` to generate a code coverage report to see how
fully-tested the code is.

See the documentation in [`scripts/jest.js`](../scripts/jest.js) for more options.
