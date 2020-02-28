// polyfill for Path2D canvas
import 'path2d-polyfill';

export { ChartTypes } from './chart_types';
export { Chart } from './components/chart';
export { ChartSize, ChartSizeArray, ChartSizeObject } from './utils/chart_size';

export { SpecId, GroupId, AxisId, AnnotationId } from './utils/ids';

// Everything related to the specs types and react-components
export * from './specs';
export { CurveType } from './utils/curves';
export { timeFormatter, niceTimeFormatter, niceTimeFormatByDay } from './utils/data/formatters';
export { SeriesCollectionValue } from './chart_types/xy_chart/utils/series';
export { Datum, Position, Rendering, Rotation } from './utils/commons';
export { SeriesIdentifier, XYChartSeriesIdentifier } from './chart_types/xy_chart/utils/series';
export { AnnotationTooltipFormatter } from './chart_types/xy_chart/annotations/annotation_utils';
export { GeometryValue } from './utils/geometry';
export {
  Config as PartitionConfig,
  FillLabelConfig as PartitionFillLabel,
  PartitionLayout,
} from './chart_types/partition_chart/layout/types/config_types';
export { Layer as PartitionLayer } from './chart_types/partition_chart/specs/index';
export { AccessorFn, IndexedAccessorFn } from './utils/accessor';
export { SpecTypes } from './specs/settings';

// scales
export { ScaleType } from './scales';

// theme
export * from './utils/themes/theme';
export * from './utils/themes/theme_commons';
export { LIGHT_THEME } from './utils/themes/light_theme';
export { DARK_THEME } from './utils/themes/dark_theme';

// utilities
export { RecursivePartial } from './utils/commons';
export { DataGenerator } from './utils/data_generators/data_generator';
