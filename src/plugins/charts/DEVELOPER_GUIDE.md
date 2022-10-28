# Usage

The goal of this doc is to map out current (as of 2022-10-28) usage

## Current usage

### Lifecycle methods/services

#### `ChartsPluginStart`

1. `ChartsPluginStart['theme']` used by `discover` plugin to fetch `chartsTheme` and `chartsBaseTheme` for use in styling the histogram.

#### `ChartsPluginSetup`

1. `ChartsPluginSetup` declared as one of `MetricVisPluginSetupDependencies` in the `vis_type_metric` plugin, but isn't actually used.
2. `ChartsPluginSetup['colors']` used by `vis_type_tagcloud` plugin. Only the seed colors are used: `d3.scale.ordinal().range(colors.seedColors)`
3. `ChartsPluginSetup.colors` and `ChartsPluginSetup.theme` used by the `vis_type_timeseries` plugin.
	1. `themeService.useChartsBaseTheme()` is used only as a fallback; otherwise theme (dark or light) is calculated from the user-specified background color
	2. `colors.mappedColors` used to fetch mapped colors only if user has not specified a color for a particular series label (and there's no color from the server).
4. `ChartsPluginSetup.colors.createColorLookupFunction()` is used by the `vis_type_vislib` plugin, ultimately, as part of `getColorFunc()` and `getPieColorFunc()`; the former also uses fallback for default and overwritten colors from `uiState`.
5. Set as a dependency in stub plugin `vis_type_xy`, but not actually used.

### `uiSettings` in advanced settings `visualization:colorMapping`

Appears to only be used by the telemetry plugin: https://github.com/opensearch-project/OpenSearch-Dashboards/blob/95f4fd5c6a6cd59bd555bf0ec120843ef6a93566/src/plugins/telemetry/schema/oss_plugins.json#L1363

### Static functions and components

#### Color Maps

##### `ColorSchemas` enum

1. `region_map` plugin
2. `tile_map` plugin
3. `vis_type_metric` plugin
4. `vis_type_vislib` plugin
5. `wizard` plugin

##### `ColorSchema` interface

1. `maps_legacy` plugin
2. `region_map` plugin
3. `tile_map` plugin
4. `vis_type_metric` plugin
5. `vis_type_vislib` plugin
6. `visualizations` plugin
7. `visualize` plugin
8. `wizard` plugin

##### `RawColorSchema` interface

Not used by any core plugins

##### `ColorMap` interface

1. `region_map` plugin
2. `tile_map` plugin
3. `timeline` plugin
4. `vis_type_metric` plugin
5. `vis_type_timeline` plugin

##### `vislibColorMaps` object

1. `vis_type_metric` plugin

##### `colorSchemas` array of objects

1. `region_map` plugin
2. `tile_map` plugin
3. `vis_type_metric` plugin
4. `vis_type_vislib` plugin
5. `wizard` plugin

##### `getHeatmapColors` function

1. `vis_type_metric` plugin
2. `vis_type_vislib` plugin

##### `truncatedColorMaps` object

1. `region_map` plugin
2. `tile_map` plugin

##### `truncatedColorSchemas` array of objects

1. `region_map` plugin
2. `tile_map` plugin

#### React components

##### `BasicOptions` component

1. `tile_map` plugin
2. `vis_type_vislib` plugin
3. `wizard` plugin

##### `ColorModes` object

1. `vis_type_metric` plugin
2. `vis_type_vislib` plugin
3. `wizard` plugin

##### `Rotates` object

1. `vis_type_vislib` plugin

##### `ColorRanges` component

1. `vis_type_metric` plugin
2. `vis_type_vislib` plugin
3. `wizard` plugin

##### `ColorSchemaOptions` component

Accounts for customized `vis.colors` in the `uiState`. Supports setting custom colors via legend, and resetting.

1. `vis_type_metric` plugin. Doesn't actually support custom colors
2. `vis_type_vislib` plugin
3. `wizard` plugin (metric visualization). Doesn't support custom colors

##### `NumberInputOption` component

1. `region_map` plugin
2. `vis_type_table` plugin
3. `vis_type_vislib` plugin

##### `RangeOption` component

1. `tile_map` plugin
2. `vis_type_markdown` plugin
3. `vis_type_metric` plugin
4. `vis_type_timeseries` plugin
5. `wizard` plugin

##### `SelectOption` component

1. `index_pattern_management` plugin
2. `maps_legacy` plugin
3. `region_map` plugin
4. `tile_map` plugin
5. `vis_type_table` plugin
6. `vis_type_tagcloud` plugin
7. `vis_type_timeseries` plugin
8. `vis_type_vislib` plugin
9. `wizard` plugin

##### `SwitchOption` component

1. `maps_legacy` plugin
2. `region_map` plugin
3. `tile_map` plugin
4. `vis_type_markdown` plugin
5. `vis_type_metric` plugin
6. `vis_type_table` plugin
7. `vis_type_tagcloud` plugin
8. `vis_type_vislib` plugin
9. `wizard` plugin

##### `TextInputOption` component

1. `maps_legacy` plugin
2. `vis_type_vislib` plugin

## OUI chart colors

An alternative to using color schemas and maps provided by this plugin is to use [color palettes from OUI](https://github.com/opensearch-project/oui/blob/main/src/services/color/oui_palettes.ts).

### `ouiPaletteColorBlind()`

1. `index_pattern_management` plugin
2. `vis_type_vega` plugin
3. `vis_type_vislib` plugin

### Other quantitative palettes

Not currently used

### `colorPalette`

Not currently used
