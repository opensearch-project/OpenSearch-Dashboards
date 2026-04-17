# OpenSearch Dashboards Visualizations

This directory contains the visualization components for the OpenSearch Dashboards Explore plugin. It provides a flexible, registry-based system for rendering different types of visualizations based on axis-role mappings and data column types.

## Structure

| Component                  | Description                                                                  |
| -------------------------- | ---------------------------------------------------------------------------- |
| **Visualization Registry** | Manages registration and retrieval of `VisualizationType` configurations     |
| **Visualization Builder**  | Orchestrates chart selection, axis mapping, style management, and rendering  |
| **Type-specific Configs**  | Each chart type defines its rules, axis mappings, defaults, and render logic |
| **Style Panel**            | Shared and chart-specific style controls (axes, legend, thresholds, etc.)    |
| **ECharts Render**         | Common ECharts rendering component used by most chart types                  |

## Supported Visualization Types

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
  <tr>
    <td><strong>Area Charts</strong></td>
    <td><strong>Tables</strong></td>
    <td><strong>Gauges</strong></td>
  </tr>
  <tr>
    <td><strong>Bar Gauges</strong></td>
    <td><strong>Histograms</strong></td>
    <td><strong>State Timelines</strong></td>
  </tr>
</table>

## Architecture

### VisualizationType

Each chart type is defined as a `VisualizationType<T>` object containing:

- `name` / `type` / `icon` — metadata
- `getRules()` — returns an array of `VisRule<T>` objects
- `ui.style.defaults` — default style options
- `ui.style.render` — React component for the style panel

### VisRule and Axis Mappings

Each `VisRule` defines:

1. A **priority** (higher = preferred when multiple rules match)
2. One or more **mappings** — each mapping is a `Record<AxisRole, { type: VisFieldType }>` that declares which axis roles map to which field types
3. A **render** function that produces the chart's React output

```typescript
interface VisRule<T extends ChartType> {
  priority: number;
  mappings: AxisTypeMapping[];
  render: (props: VisRenderProps<T>) => React.ReactNode;
}
```

Axis roles include: `x`, `y`, `color`, `facet`, `size`, `y2`, `value`, `time`.

Field types include: `numerical`, `categorical`, `date`.

A single rule can have multiple mappings (e.g., allowing either X=Date/Y=Numerical or X=Numerical/Y=Date). The registry matches rules by comparing the required field type counts in each mapping against the available columns.

### Rule Matching

The `VisualizationRegistry` provides two levels of matching:

- **Exact match**: the mapping's required field counts equal the input column counts exactly
- **Compatible match**: the mapping's required field counts are less than or equal to the input counts (superset)

The `findBestMatch` method returns the highest-priority rule with an exact column-count match, optionally scoped to a specific chart type.

For a complete reference of all currently defined rules, see the [Visualization Rules Reference](./RULES.md).

## Usage and Extension

### Basic Usage

The `VisualizationBuilder` handles chart selection and rendering automatically:

```tsx
<VisualizationContainer />
```

### Accessing the Registry

```typescript
// Via React hook (preferred)
const registry = useVisualizationRegistry();

// Via plugin services
const registry = services.visualizationRegistry.getRegistry();
```

### Registering a New Visualization Type

1. Define a config factory that returns a `VisualizationType`:

```typescript
export const createMyChartConfig = (): VisualizationType<'my_chart'> => ({
  name: 'My Chart',
  type: 'my_chart',
  icon: 'visMyChart',
  getRules: () => [
    {
      priority: 100,
      mappings: [
        {
          [AxisRole.X]: { type: VisFieldType.Categorical },
          [AxisRole.Y]: { type: VisFieldType.Numerical },
        },
      ],
      render(props) {
        const spec = createMyChartSpec(
          props.transformedData,
          props.styleOptions,
          props.axisColumnMappings
        );
        return <EchartsRender spec={spec} />;
      },
    },
  ],
  ui: {
    style: {
      defaults: defaultMyChartStyles,
      render: (props) => React.createElement(MyChartVisOptions, props),
    },
  },
});
```

2. Register it via the `VisualizationRegistryService` setup contract:

```typescript
visualizationRegistry.register(createMyChartConfig());
```

3. Add the new chart type to the `ChartType` union and `ChartStylesMapping` interface in `utils/use_visualization_types.ts`.

### Adding a New Chart Type Directory

```
visualizations/
└── my_chart/
    ├── my_chart_vis_config.tsx      # VisualizationType factory + style types + defaults
    ├── my_chart_vis_options.tsx      # Style panel component
    ├── to_expression.ts             # ECharts spec generation
    └── ... other files (utils, tests, exclusive options)
```
