# Charts

The Charts plugin provides utility services for accessing shared colors and themes for visual consistency across all OpenSearch Dashboards charts and visualizations. It also provides a number of static utility functions and standard components for user-specified chart configuration.

## Services

### Theme service

A utility service for fetching `chartsTheme` and `chartsBaseTheme`.

For more, see Theme service [docs](public/services/theme/README.md)

### Color service
#### Static properties
##### `seedColors`

A list of colors chosen for visual appeal.

#### Static methods
##### `mappedColors`

Get a value-based mapping of colors.

##### `createColorLookupFunction`

Factory for color mapping function.

## Static functions and components
### Color maps
#### `colorSchemas`

Color mappings in `value`/`text` form

#### `getHeatmapColors`

Function to retrieve heatmap related colors based on `value` and `colorSchemaName`

#### `truncatedColorMaps`

Color mappings subset of `vislibColorMaps`

#### `truncatedColorSchemas`

Truncated color mappings in `value`/`text` form

#### `vislibColorMaps`

Color mappings related to vislib visualizations

### Components

Standardized React input UI components which can be used by visualization editors to specify various visualization options.

#### `BasicOptions`

Components for specifying legend and tooltip

#### `ColorRanges`

Component for specifying color range thresholds

#### `ColorSchemaOptions`

Component for specifying color schemas (palettes)

#### `NumberInputOption`

Deprecated in favor of `RequiredNumberInputOption`

#### `RangeOption`

Component for specifying a numerical value with a slider

#### `RequiredNumberInputOption`

Component for specifying numerical values, such as a threshold.

#### `SelectOption`

Basic select component

#### `SwitchOption`

Basic toggle component

#### `TextInputOption`

Basic text input component
