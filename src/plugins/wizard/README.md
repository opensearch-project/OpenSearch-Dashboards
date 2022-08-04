# Wizard

An OpenSearch Dashboards plugin for a visualization experience that makes exploring data and creating visualizations much easier. It will act as an additional way to create visualizations alongside the exiting tools within the current visualizations plugin. The tool will be incremental to the visualization tools available to users in OpenSearch Dashboards today.

## Usage

To use this plugin, navigate to:

Visualize -> Create Visualization -> Wizard

## Add a visualization

All new visualizations currently reside in [public/visualizations](./public/visualizations). To add a new one, create a new visualization directory and add the required code (below) to setup and register a new vis type.

### Anatomy of a visualization

```
metric/
├─ index.ts
├─ metric_viz_type.ts
├─ to_expression.ts
├─ components/
   ├─ metric_viz_options.tsx
```

Outline:
- `index.ts`: Exposes the `create<Viz>Config` function that is used to register the viz type
- `<vizName>_viz_type.ts`: Contains the config that the type service needs to register the new vis type
- `to_expression.ts`: The expression function that the plugin will use to render the visualization given the state of the plugin
- `<vizName>_viz_options.tsx`: The component that will render the other properties that user can set in the `Style` tab

**Notes:**

- Currently only the metric viz is defined, so schema properties that other vis types might need may be missing and require further setup.
- `to_expression` has not yet been abstracted into a common utility for different visualizations. Adding more visualization types should make it easier to identify which parts of expression creation are common, and which are visualization-specific.

