# Expressions Plugin

## Overview

The Expressions plugin for OpenSearch Dashboards provides a powerful and flexible way to create, manipulate, and render data using a custom expression language. It allows developers to chain functions together, create custom visualizations, and build interactive data-driven applications.

## Table of Contents

1. [Getting Started](docs/getting-started.md)
2. [Core Concepts](docs/core-concepts.md)
3. [Expression Functions](docs/expression-functions.md)
4. [Expression Renderers](docs/expression-renderers.md)
5. [Execution Contract](docs/execution-contract.md)
6. [Nested Expressions](docs/nested-expressions.md)
7. [Debugging](docs/debugging.md)
8. [Inspector Adapters](docs/inspector-adapters.md)
9. [Examples](docs/examples.md)

## Features

- Custom expression language for data manipulation and visualization
- Chainable functions for complex data transformations
- Extensible architecture for adding custom functions and renderers
- Support for nested expressions
- Built-in debugging tools and inspector adapters
- Integration with OpenSearch Dashboards' plugin ecosystem

## Installation

The Expressions plugin is included by default in OpenSearch Dashboards. No additional installation steps are required.

## Usage

To use the Expressions plugin in your OpenSearch Dashboards development:

1. Import the necessary modules from the expressions plugin
2. Register custom functions and renderers (if needed)
3. Use the expression language to create data pipelines and visualizations

For detailed usage instructions and examples, please refer to the documentation linked above.

## Playground

Working with expressions can sometimes be a little tricky. To make this easier we have an example plugin with some examples, a playground to run your own expression functions and explorer to view all the registered expression functions and their properties. It can be started up using the `--run-examples` flag and found under the `Developer examples` option in the main menu.

```sh
yarn start --run-examples
```

Then navigate to the "Developer Examples" section in the main menu.

## Integration

The Expressions plugin is tightly integrated with OpenSearch Dashboards and is used extensively in:

- Visualizations
- Dashboard rendering
- Data processing pipelines
- Custom plugin development

It provides a flexible foundation for building complex data processing and visualization workflows within the OpenSearch Dashboards ecosystem.
