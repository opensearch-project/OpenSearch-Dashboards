# Visualization Examples

This plugin provides examples of how to use the Visualization component from the explore plugin in OpenSearch Dashboards.

## Overview

The Visualization component allows you to easily render different types of visualizations (charts, tables, metrics, etc.) in your OpenSearch Dashboards plugin. This example plugin demonstrates how to use the Visualization component with different chart types and data.

## Features

- Examples of all supported chart types:

  - Bar Chart
  - Line Chart
  - Pie Chart
  - Metric
  - Heatmap
  - Area Chart
  - Scatter Plot
  - Gauge
  - Table

- Interactive UI to switch between different chart types
- Sample data for each chart type
- Usage documentation

## Getting Started

### Prerequisites

- OpenSearch Dashboards development environment

### Running the Examples

1. Clone the OpenSearch Dashboards repository
2. Navigate to the OpenSearch Dashboards directory
3. Install dependencies: `yarn`
4. Start OpenSearch Dashboards in development mode: `yarn start`
5. Access the examples at: `http://localhost:5601/app/visualizationExamples`

## Usage

To use the Visualization component in your own plugin:

1. Add the explore plugin as a dependency in your plugin's `opensearch_dashboards.json`:

```json
{
  "requiredPlugins": ["explore"]
}
```

2. Access the Visualization component from the explore plugin's setup contract:

```typescript
// In your plugin's setup method
public setup(core: CoreSetup, { explore }: SetupDeps) {
  const { ui } = explore;
  const { Visualization } = ui;

  // Now you can use the Visualization component in your React components
}
```

3. Use the Visualization component in your React components:

```tsx
// Sample data
const data = [
  { category: 'A', value: 10 },
  { category: 'B', value: 20 },
  { category: 'C', value: 15 },
];

// Render the visualization
<Visualization data={data} type={'bar'} />;
```

## Chart Types

The Visualization component supports the following chart types:

- `bar`: Bar chart
- `line`: Line chart
- `pie`: Pie chart
- `metric`: Metric visualization
- `heatmap`: Heatmap
- `area`: Area chart
- `scatter`: Scatter plot
- `gauge`: Gauge chart
- `table`: Table visualization

## Data Format

The data format depends on the chart type you're using. Here are some examples:

### Bar Chart

```typescript
const barData = [
  { category: 'A', value: 10 },
  { category: 'B', value: 20 },
  { category: 'C', value: 15 },
];
```

### Line Chart

```typescript
const lineData = [
  { date: '2023-01-01', value: 10 },
  { date: '2023-02-01', value: 15 },
  { date: '2023-03-01', value: 7 },
];
```

### Pie Chart

```typescript
const pieData = [
  { category: 'Category A', value: 30 },
  { category: 'Category B', value: 25 },
  { category: 'Category C', value: 15 },
];
```

## License

This code is licensed under the Apache License 2.0.
