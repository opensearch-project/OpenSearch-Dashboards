# OpenSearch Dashboards Visualizations

This directory contains the visualization components for the OpenSearch Dashboards Explore plugin. It provides a flexible, rule-based system for rendering different types of visualizations based on data structure.

## Structure

| Component                    | Description                                                        |
| ---------------------------- | ------------------------------------------------------------------ |
| **Visualization Registry**   | Manages the registration and retrieval of visualization rules      |
| **Rule Repository**          | Contains predefined rules for matching data to visualization types |
| **Visualization Container**  | Renders the selected visualization with its own styling options    |
| **Type-specific Components** | Implementation for each supported chart type                       |

## Supported Visualization Types

The system currently supports the following visualization types:

<table>
  <tr>
    <td><strong>Line Charts</strong></td>
    <td><strong>Bar Charts</strong></td>
    <td><strong>Pie Charts</strong></td>
  </tr>
  <tr>
    <td><strong>Heatmaps</strong></td>
    <td><strong>Scatter Plots</strong></td>
    <td><strong>Metric Visualizations</strong></td>
  </tr>
</table>

## Rule-Based Visualization Selection

### How Rules Work

Each visualization rule defines:

1. A unique identifier
2. A matching function that determines if the rule applies to the given set of data
3. A list of chart types with priorities
4. A function to convert the data to a vega expression for rendering

### Rule to Chart Type Mapping

**Key Feature:** Each rule can map to multiple chart types with different priorities

This allows for:

- Providing alternative visualization options for the same data structure
- Defining a default (highest priority) visualization while allowing users to switch to alternatives

For a complete reference of all currently defined rules, see the [Visualization Rules Reference](./RULES.md).

## Usage and Extension

### Basic Usage

The visualization container automatically selects and renders the appropriate visualization based on the data:

```tsx
<VisualizationContainer />
```

### Accessing Available Chart Types

```typescript
const visualizationData = getVisualizationType(rows, fieldSchema);
const availableChartTypes = visualizationData?.availableChartTypes;

// availableChartTypes contains all chart types that can be used with the current data
// sorted by priority
```

### Registering New Visualization Rules

To add a new visualization rule:

1. Define a new rule object that implements the `VisualizationRule` interface:

```typescript
const myCustomRule: VisualizationRule = {
  id: 'my-custom-rule',
  name: 'My Custom Rule',
  description: 'Description of when this rule applies',

  // Define when this rule should match
  matches: (numerical, categorical, date) => numerical.length === 2 && categorical.length === 1,

  // Define chart types with priorities (higher number = higher priority)
  chartTypes: [
    { type: 'scatter', priority: 100, name: 'Scatter Plot' },
    { type: 'bar', priority: 80, name: 'Bar Chart' },
  ],

  // Define how to convert data to an expression
  toExpression: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'scatter'
  ) => {
    switch (chartType) {
      case 'scatter':
        return createCustomScatterChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          styleOptions
        );
      case 'bar':
        return createCustomBarChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          styleOptions
        );
      default:
        return createCustomScatterChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          styleOptions
        );
    }
  },
};
```

2. Register the rule with the visualization registry:

```typescript
// Register a single rule
visualizationRegistry.registerRule(myCustomRule);

// Or register multiple rules
visualizationRegistry.registerRules([myCustomRule, anotherRule]);
```

### Adding a New Chart Type

To add a new chart type:

1. Create a new directory for your chart type:

```
visualizations/
└── my_chart_type/
    ├── my_chart_vis_config.ts     # Chart configuration
    ├── my_chart_vis_options.tsx   # UI options component
    ├── to_expression.ts           # Expression generation
    └── ... other files
```

2. Define the chart configuration in `my_chart_vis_config.ts`:

```typescript
export interface MyChartStyleControls {
  // Define style options specific to your chart
  showLegend: boolean;
  colors: string[];
  // ... other options
}

export const createMyChartConfig = () => {
  return {
    name: 'My Chart',
    type: 'my_chart_type',
    ui: {
      style: {
        defaults: {
          showLegend: true,
          colors: ['#1EA7FD', '#FF5733'],
          // ... default values for other options
        },
        render: (props: StyleControlsProps<MyChartStyleControls>) => (
          <MyChartVisOptions {...props} />
        ),
      },
    },
  };
};
```

3. Create the expression generator in `to_expression.ts`:

```typescript
export const createMyChartExpression = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: MyChartStyleControls
) => {
  // Generate the expression for your chart
  // ...

  return {
    type: 'expression',
    chain: [
      // Your expression chain
    ],
  };
};
```

4. Update the `ChartType` type and `ChartStyleControlMap` interface in `utils/use_visualization_types.ts`:

```typescript
export type ChartType = 'line' | 'pie' | /* ... */ | 'my_chart_type';

export interface ChartStyleControlMap {
  line: LineChartStyleControls;
  pie: PieChartStyleControls;
  // ... other chart types
  my_chart_type: MyChartStyleControls;
}
```

5. Update the `getVisualizationConfig` method in `visualization_registry.ts`:

```typescript
private getVisualizationConfig(type: string) {
  switch (type) {
    // ... existing cases
    case 'my_chart_type':
      return createMyChartConfig();
    default:
      return;
  }
}
```
