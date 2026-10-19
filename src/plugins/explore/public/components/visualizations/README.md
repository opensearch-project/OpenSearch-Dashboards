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
  <tr>
    <td><strong>Sankey Charts</strong></td>
    <td></td>
    <td></td>
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

Axis roles include: `x`, `y`, `source`, `target`, `color`, `facet`, `size`, `y2`, `value`, `time`.

Field types include: `numerical`, `categorical`, `date`.

A single rule can have multiple mappings (e.g., allowing either X=Date/Y=Numerical or X=Numerical/Y=Date). The registry matches rules by comparing the required field type counts in each mapping against the available columns.

### Rule Matching

The `VisualizationRegistry` provides two levels of matching:

- **Exact match**: the mapping's required field counts equal the input column counts exactly
- **Compatible match**: the mapping's required field counts are less than or equal to the input counts (superset)

The `findBestMatch` method returns the highest-priority rule with an exact column-count match, optionally scoped to a specific chart type.

For a complete reference of all currently defined rules, see the [Visualization Rules Reference](./RULES.md).

## Table Data Links

A table column can carry data links (`table/data_link_options.tsx`). Each link has a URL template that `resolveDataLinkUrl` (`table/data_link_utils.ts`) fills in when a cell renders. The grammar follows Grafana data links:

| Placeholder                                                | Resolves to                                                                                                                                                                            |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `${__value.text}`                                          | The clicked cell value, at every occurrence                                                                                                                                            |
| `${__data.fields.<name>}`                                  | A field of the same row. Flat field names; dots are allowed (`resource.service.name`)                                                                                                  |
| `${__data.fields["<name>"]}`, `${__data.fields['<name>']}` | The same, for field names with spaces or other characters                                                                                                                              |
| `$var`, `${var}`                                           | The current value of a dashboard variable. A multi-value variable joins its values with `,`; with "All" selected it gives the `$__all` marker, so the target dashboard selects All too |
| `${...:rison}`                                             | Any of the above, encoded with `rison.encode_uri` instead of `encodeURIComponent`                                                                                                      |

Rules:

- All placeholders are resolved in one pass, so a substituted value is never expanded again.
- Each value is encoded on its own. The default is `encodeURIComponent`. Use `:rison` for a value placed inside dashboard URL state (`_a`, `_g`), because percent-encoding does not protect `'` and `!` there.
- An object value is JSON-stringified, as the cell displays it. `null` and `undefined` give an empty string.
- A placeholder for a field that is not in the row, an unknown variable, or an unknown suffix stays in the URL unchanged, and the cell shows no link for that URL (the cell's tooltip names the placeholder).

Example, a link that opens another dashboard with two variables set from the row and the clicked cell:

```
#/view/endpoint-dashboard?_a=(variables:!((id:service,current:!(${__data.fields.service:rison})),(id:endpoint,current:!(${__value.text:rison}))))
```

On a dashboard, the Explore embeddable passes the current variable values to `TableVis` through `SearchProps.variables`, and re-renders the panel when they change. In the in-context visualization editor, `useVariables` passes them through `VisualizationBuilder.setDataLinkVariables`, so the preview resolves the same links.

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
