import { $Values } from 'utility-types';
import {
  AreaSeriesStyle,
  BarSeriesStyle,
  GridLineConfig,
  LineAnnotationStyle,
  LineSeriesStyle,
  PointStyle,
  RectAnnotationStyle,
} from '../../../utils/themes/theme';
import { Accessor, AccessorFormat, AccessorFn } from '../../../utils/accessor';
import { RecursivePartial, Color, Position, Datum } from '../../../utils/commons';
import { AxisId, GroupId } from '../../../utils/ids';
import { ScaleContinuousType, ScaleType } from '../../../scales';
import { CurveType } from '../../../utils/curves';
import { RawDataSeriesDatum, XYChartSeriesIdentifier } from './series';
import { AnnotationTooltipFormatter } from '../annotations/annotation_utils';
import { Spec, SpecTypes } from '../../..';
import { ChartTypes } from '../..';

export type BarStyleOverride = RecursivePartial<BarSeriesStyle> | Color | null;
export type PointStyleOverride = RecursivePartial<PointStyle> | Color | null;

export const SeriesTypes = Object.freeze({
  Area: 'area' as 'area',
  Bar: 'bar' as 'bar',
  Line: 'line' as 'line',
});

export type SeriesTypes = $Values<typeof SeriesTypes>;

/**
 * Override for bar styles per datum
 *
 * Return types:
 * - `Color`: Color value as a `string` will set the bar `fill` to that color
 * - `RecursivePartial<BarSeriesStyle>`: Style values to be merged with base bar styles
 * - `null`: Keep existing bar style
 */
export type BarStyleAccessor = (
  datum: RawDataSeriesDatum,
  seriesIdentifier: XYChartSeriesIdentifier,
) => BarStyleOverride;
/**
 * Override for bar styles per datum
 *
 * Return types:
 * - `Color`: Color value as a `string` will set the point `stroke` to that color
 * - `RecursivePartial<PointStyle>`: Style values to be merged with base point styles
 * - `null`: Keep existing point style
 */
export type PointStyleAccessor = (
  datum: RawDataSeriesDatum,
  seriesIdentifier: XYChartSeriesIdentifier,
) => PointStyleOverride;
export const DEFAULT_GLOBAL_ID = '__global__';

export type FilterPredicate = (series: XYChartSeriesIdentifier) => boolean;
export type SeriesName = string | number | null;
/**
 * Function to create custom series name for a given series
 */
export type SeriesNameFn = (series: XYChartSeriesIdentifier, isTooltip: boolean) => SeriesName;
/**
 * Accessor mapping to replace names
 */
export interface SeriesNameConfig {
  /**
   * accessor key (i.e. `yAccessors` and `seriesSplitAccessors`)
   */
  accessor: string | number;
  /**
   * Accessor value (i.e. values from `seriesSplitAccessors`)
   */
  value?: string | number;
  /**
   * New name for Accessor value
   *
   * If not provided, the original value will be used
   */
  name?: string | number;
  /**
   * Sort order of name, overrides order listed in array.
   *
   * lower values - left-most
   * higher values - right-most
   */
  sortIndex?: number;
}
export interface SeriesNameConfigOptions {
  /**
   * Array of accessor naming configs to replace series names
   *
   * Only provided configs will be included
   * (i.e. if you only provide a single mapping for `yAccessor`, all other series accessor names will be ignored)
   *
   * The order of configs is the order in which the resulting names will
   * be joined, if no `sortIndex` is specified.
   *
   * If no values are found for a giving mapping in a series, the mapping will be ignored.
   */
  names?: SeriesNameConfig[];
  /**
   * Delimiter to join values/names
   *
   * @default ' - '
   */
  delimiter?: string;
}
export type SeriesNameAccessor = string | SeriesNameFn | SeriesNameConfigOptions;

/**
 * The fit function type
 */
export const Fit = Object.freeze({
  /**
   * Don't draw value on the graph. Slices out area between `null` values.
   *
   * Example:
   * ```js
   * [2, null, null, 8] => [2, null null, 8]
   * ```
   */
  None: 'none' as 'none',
  /**
   * Use the previous non-`null` value
   *
   * Example:
   * ```js
   * [2, null, null, 8] => [2, 2, 2, 8]
   * ```
   *
   * @opposite `Lookahead`
   */
  Carry: 'carry' as 'carry',
  /**
   * Use the next non-`null` value
   *
   * Example:
   * ```js
   * [2, null, null, 8] => [2, 8, 8, 8]
   * ```
   *
   * @opposite `Carry`
   */
  Lookahead: 'lookahead' as 'lookahead',
  /**
   * Use the closest non-`null` value (before or after)
   *
   * Example:
   * ```js
   * [2, null, null, 8] => [2, 2, 8, 8]
   * ```
   */
  Nearest: 'nearest' as 'nearest',
  /**
   * Average between the closest non-`null` values
   *
   * Example:
   * ```js
   * [2, null, null, 8] => [2, 5, 5, 8]
   * ```
   */
  Average: 'average' as 'average',
  /**
   * Linear interpolation between the closest non-`null` values
   *
   * Example:
   * ```js
   * [2, null, null, 8] => [2, 4, 6, 8]
   * ```
   */
  Linear: 'linear' as 'linear',
  /**
   * Sets all `null` values to `0`
   *
   * Example:
   * ```js
   * [2, null, null, 8] => [2, 0, 0, 8]
   * ```
   */
  Zero: 'zero' as 'zero',
  /**
   * Specify an explicit value `X`
   *
   * Example:
   * ```js
   * [2, null, null, 8] => [2, X, X, 8]
   * ```
   */
  Explicit: 'explicit' as 'explicit',
});

export type Fit = $Values<typeof Fit>;

interface DomainBase {
  /**
   * Custom minInterval for the domain which will affect data bucket size.
   * The minInterval cannot be greater than the computed minimum interval between any two adjacent data points.
   * Further, if you specify a custom numeric minInterval for a timeseries, please note that due to the restriction
   * above, the specified numeric minInterval will be interpreted as a fixed interval.
   * This means that, for example, if you have yearly timeseries data that ranges from 2016 to 2019 and you manually
   * compute the interval between 2016 and 2017, you'll have 366 days due to 2016 being a leap year.  This will not
   * be a valid interval because it is greater than the computed minInterval of 365 days betwen the other years.
   */
  minInterval?: number;
  /**
   * Whether to fit the domain to the data. ONLY applies to `yDomains`
   *
   * Setting `max` or `min` will override this functionality.
   */
  fit?: boolean;
}

interface LowerBound {
  /**
   * Lower bound of domain range
   */
  min: number;
}

interface UpperBound {
  /**
   * Upper bound of domain range
   */
  max: number;
}

export type LowerBoundedDomain = DomainBase & LowerBound;
export type UpperBoundedDomain = DomainBase & UpperBound;
export type CompleteBoundedDomain = DomainBase & LowerBound & UpperBound;
export type UnboundedDomainWithInterval = DomainBase;

export type DomainRange = LowerBoundedDomain | UpperBoundedDomain | CompleteBoundedDomain | UnboundedDomainWithInterval;

export interface DisplayValueSpec {
  /** Show value label in chart element */
  showValueLabel?: boolean;
  /** If value labels are shown, skips every other label */
  isAlternatingValueLabel?: boolean;
  /** Function for formatting values; will use axis tickFormatter if none specified */
  valueFormatter?: TickFormatter;
  /** If true will contain value label within element, else dimensions are computed based on value */
  isValueContainedInElement?: boolean;
  /** If true will hide values that are clipped at chart edges */
  hideClippedValue?: boolean;
}

export interface SeriesSpec extends Spec {
  specType: typeof SpecTypes.Series;
  chartType: typeof ChartTypes.XYAxis;
  /**
   * The name of the spec. Also a mechanism to provide custom series names.
   */
  name?: SeriesNameAccessor;
  /** The ID of the spec group
   * @default __global__
   */
  groupId: string;
  /** when using a different groupId this option will allow compute in the same domain of the global domain */
  useDefaultGroupDomain?: boolean;
  /** An array of data */
  data: Datum[];
  /** The type of series you are looking to render */
  seriesType: SeriesTypes;
  /** Set colors for specific series */
  color?: SeriesColorAccessor;
  /** If the series should appear in the legend
   * @default false
   */
  hideInLegend?: boolean;
  /** Index per series to sort by */
  sortIndex?: number;
  displayValueSettings?: DisplayValueSpec;
  /**
   * Postfix string or accessor function for y1 accessor when using `y0Accessors`
   *
   * @default ' - upper'
   */
  y0AccessorFormat?: AccessorFormat;
  /**
   * Postfix string or accessor function for y1 accessor when using `y0Accessors`
   *
   * @default ' - lower'
   */
  y1AccessorFormat?: AccessorFormat;
  /**
   * Hide series in tooltip
   */
  filterSeriesInTooltip?: FilterPredicate;
}

export interface Postfixes {
  /**
   * Postfix for y1 accessor when using `y0Accessors`
   *
   * @default 'upper'
   */
  y0AccessorFormat?: string;
  /**
   * Postfix for y1 accessor when using `y0Accessors`
   *
   * @default 'lower'
   */
  y1AccessorFormat?: string;
}

export type SeriesColorsArray = string[];
export type SeriesColorAccessorFn = (seriesIdentifier: XYChartSeriesIdentifier) => string | null;
export type SeriesColorAccessor = string | SeriesColorsArray | SeriesColorAccessorFn;

export interface SeriesAccessors {
  /** The field name of the x value on Datum object */
  xAccessor: Accessor | AccessorFn;
  /** An array of field names one per y metric value */
  yAccessors: Accessor[];
  /** An optional accessor of the y0 value: base point for area/bar charts  */
  y0Accessors?: Accessor[];
  /** An array of fields thats indicates the datum series membership */
  splitSeriesAccessors?: Accessor[];
  /** An array of fields thats indicates the stack membership */
  stackAccessors?: Accessor[];
}

export interface SeriesScales {
  /**
   * The x axis scale type
   * @default ScaleType.Ordinal
   */
  xScaleType: typeof ScaleType.Ordinal | typeof ScaleType.Linear | typeof ScaleType.Time;
  /**
   * If using a ScaleType.Time this timezone identifier is required to
   * compute a nice set of xScale ticks. Can be any IANA zone supported by
   * the host environment, or a fixed-offset name of the form 'utc+3',
   * or the strings 'local' or 'utc'.
   */
  timeZone?: string;
  /**
   * The y axis scale type
   * @default ScaleType.Linear
   */
  yScaleType: ScaleContinuousType;
  /**
   * if true, the min y value is set to the minimum domain value, 0 otherwise
   * @default false
   */
  yScaleToDataExtent: boolean;
}

export type BasicSeriesSpec = SeriesSpec & SeriesAccessors & SeriesScales;

export type SeriesSpecs<S extends BasicSeriesSpec = BasicSeriesSpec> = Array<S>;

/**
 * This spec describe the dataset configuration used to display a bar series.
 */
export type BarSeriesSpec = BasicSeriesSpec &
  Postfixes & {
    /** @default bar */
    seriesType: typeof SeriesTypes.Bar;
    /** If true, will stack all BarSeries and align bars to ticks (instead of centered on ticks) */
    enableHistogramMode?: boolean;
    barSeriesStyle?: RecursivePartial<BarSeriesStyle>;
    /**
     * Stack each series in percentage for each point.
     */
    stackAsPercentage?: boolean;
    /**
     * Functional accessor to return custom color or style for bar datum
     */
    styleAccessor?: BarStyleAccessor;
    /**
     * Min height to render bars for highly variable data
     *
     * i.e. ranges from 100,000 to 1
     *
     * @units pixel
     */
    minBarHeight?: number;
  };

/**
 * This spec describe the dataset configuration used to display a histogram bar series.
 * A histogram bar series is identical to a bar series except that stackAccessors are not allowed.
 */
export type HistogramBarSeriesSpec = Omit<BarSeriesSpec, 'stackAccessors'> & {
  enableHistogramMode: true;
};

export type FitConfig = {
  /**
   * Fit type for data with null values
   */
  type: Fit;
  /**
   * Fit value used when `type` is set to `Fit.Explicit`
   */
  value?: number;
  /**
   * Value used for first and last point if fitting is not possible
   *
   * `'nearest'` will set indeterminate end values to the closes _visible_ point.
   *
   * Note: Computed fit values will always take precedence over `endValues`
   */
  endValue?: number | 'nearest';
};

/**
 * This spec describe the dataset configuration used to display a line series.
 */
export type LineSeriesSpec = BasicSeriesSpec &
  HistogramConfig & {
    /** @default line */
    seriesType: typeof SeriesTypes.Line;
    curve?: CurveType;
    lineSeriesStyle?: RecursivePartial<LineSeriesStyle>;
    /**
     * An optional functional accessor to return custom color or style for point datum
     */
    pointStyleAccessor?: PointStyleAccessor;
    /**
     * Fit config to fill `null` values in dataset
     */
    fit?: Exclude<Fit, 'explicit'> | FitConfig;
  };

/**
 * This spec describe the dataset configuration used to display an area series.
 */
export type AreaSeriesSpec = BasicSeriesSpec &
  HistogramConfig &
  Postfixes & {
    /** @default area */
    seriesType: typeof SeriesTypes.Area;
    /** The type of interpolator to be used to interpolate values between points */
    curve?: CurveType;
    areaSeriesStyle?: RecursivePartial<AreaSeriesStyle>;
    /**
     * Stack each series in percentage for each point.
     */
    stackAsPercentage?: boolean;
    /**
     * An optional functional accessor to return custom color or style for point datum
     */
    pointStyleAccessor?: PointStyleAccessor;
    /**
     * Fit config to fill `null` values in dataset
     */
    fit?: Exclude<Fit, 'explicit'> | FitConfig;
  };

export interface HistogramConfig {
  /**  Determines how points in the series will align to bands in histogram mode
   * @default 'start'
   */
  histogramModeAlignment?: HistogramModeAlignment;
}

export const HistogramModeAlignments = Object.freeze({
  Start: 'start' as HistogramModeAlignment,
  Center: 'center' as HistogramModeAlignment,
  End: 'end' as HistogramModeAlignment,
});

export type HistogramModeAlignment = 'start' | 'center' | 'end';

/**
 * This spec describe the configuration for a chart axis.
 */
export interface AxisSpec extends Spec {
  specType: typeof SpecTypes.Axis;
  chartType: typeof ChartTypes.XYAxis;
  /** The ID of the spec */
  id: AxisId;
  /** Style options for grid line */
  gridLineStyle?: GridLineConfig;
  /** The ID of the axis group
   * @default __global__
   */
  groupId: GroupId;
  /** Hide this axis */
  hide: boolean;
  /** shows all ticks, also the one from the overlapping labels */
  showOverlappingTicks: boolean;
  /** Shows all labels, also the overlapping ones */
  showOverlappingLabels: boolean;
  /** Shows grid lines for axis; default false */
  showGridLines?: boolean;
  /** Where the axis appear on the chart */
  position: Position;
  /** The length of the tick line */
  tickSize: number;
  /** The padding between the label and the tick */
  tickPadding: number;
  /** A function called to format each single tick label */
  tickFormat: TickFormatter;
  /** The degrees of rotation of the tick labels */
  tickLabelRotation?: number;
  /** An approximate count of how many ticks will be generated */
  ticks?: number;
  /** The axis title */
  title?: string;
  /** If specified, it constrains the domain for these values */
  domain?: DomainRange;
  /** Object to hold custom styling */
  style?: AxisStyle;
  /** Show only integar values **/
  integersOnly?: boolean;
}

export type TickFormatterOptions = {
  timeZone?: string;
};
export type TickFormatter = (value: any, options?: TickFormatterOptions) => string;

export interface AxisStyle {
  /** Specifies the amount of padding on the tick label bounding box */
  tickLabelPadding?: number;
}

export const AnnotationTypes = Object.freeze({
  Line: 'line' as 'line',
  Rectangle: 'rectangle' as 'rectangle',
  Text: 'text' as 'text',
});

export type AnnotationType = $Values<typeof AnnotationTypes>;

export const AnnotationDomainTypes = Object.freeze({
  XDomain: 'xDomain' as 'xDomain',
  YDomain: 'yDomain' as 'yDomain',
});

export type AnnotationDomainType = $Values<typeof AnnotationDomainTypes>;

/**
 * The descriptive object of a line annotation
 */
export interface LineAnnotationDatum {
  /**
   * The value on the x or y axis accordingly to the domainType configured
   */
  dataValue: any;
  /**
   * A textual description of the annotation
   */
  details?: string;
  /**
   * An header of the annotation. If undefined, than the formatted dataValue will be used
   */
  header?: string;
}

export type LineAnnotationSpec = BaseAnnotationSpec<
  typeof AnnotationTypes.Line,
  LineAnnotationDatum,
  LineAnnotationStyle
> & {
  domainType: AnnotationDomainType;
  /** Custom marker */
  marker?: JSX.Element;
  /**
   * Custom marker dimensions; will be computed internally
   * Any user-supplied values will be overwritten
   */
  markerDimensions?: {
    width: number;
    height: number;
  };
  /** Annotation lines are hidden */
  hideLines?: boolean;
  /** Hide tooltip when hovering over the line
   * @default true
   */
  hideLinesTooltips?: boolean;
  /** z-index of the annotation relative to other elements in the chart
   * @default 1
   */
  zIndex?: number;
};

/**
 * The descriptive object of a rectangular annotation
 */
export interface RectAnnotationDatum {
  /**
   * The coordinates for the 4 rectangle points.
   */
  coordinates: {
    /**
     * The minuimum value on the x axis. If undefined, the minuimum value of the x domain will be used.
     */
    x0?: any;
    /**
     * The maximum value on the x axis. If undefined, the maximum value of the x domain will be used.
     */
    x1?: any;
    /**
     * The minimum value on the y axis. If undefined, the minimum value of the y domain will be used.
     */
    y0?: any;
    /**
     * The maximum value on the y axis. If undefined, the maximum value of the y domain will be used.
     */
    y1?: any;
  };
  /**
   * A textual description of the annotation
   */
  details?: string;
}

export type RectAnnotationSpec = BaseAnnotationSpec<
  typeof AnnotationTypes.Rectangle,
  RectAnnotationDatum,
  RectAnnotationStyle
> & {
  /** Custom rendering function for tooltip */
  renderTooltip?: AnnotationTooltipFormatter;
  /** z-index of the annotation relative to other elements in the chart
   * @default -1
   */
  zIndex?: number;
};

export interface BaseAnnotationSpec<
  T extends typeof AnnotationTypes.Rectangle | typeof AnnotationTypes.Line,
  D extends RectAnnotationDatum | LineAnnotationDatum,
  S extends RectAnnotationStyle | LineAnnotationStyle
> extends Spec {
  chartType: ChartTypes;
  specType: typeof SpecTypes.Annotation;
  /**
   * Annotation type: line, rectangle, text
   */
  annotationType: T;
  /**
   * The ID of the axis group
   * @default __global__
   */
  groupId: GroupId; // defaults to __global__; needed for yDomain position
  /**
   * Data values defined with coordinates and details
   */
  dataValues: D[];
  /**
   * Custom annotation style
   */
  style?: Partial<S>;
  /**
   * Toggles tooltip annotation visibility
   */
  hideTooltips?: boolean;
  /**
   * z-index of the annotation relative to other elements in the chart
   * Default specified per specific annotation spec.
   */
  zIndex?: number;
}

export type AnnotationSpec = LineAnnotationSpec | RectAnnotationSpec;

export function isLineAnnotation(spec: AnnotationSpec): spec is LineAnnotationSpec {
  return spec.annotationType === AnnotationTypes.Line;
}

export function isRectAnnotation(spec: AnnotationSpec): spec is RectAnnotationSpec {
  return spec.annotationType === AnnotationTypes.Rectangle;
}

export function isBarSeriesSpec(spec: BasicSeriesSpec): spec is BarSeriesSpec {
  return spec.seriesType === SeriesTypes.Bar;
}

export function isLineSeriesSpec(spec: BasicSeriesSpec): spec is LineSeriesSpec {
  return spec.seriesType === SeriesTypes.Line;
}

export function isAreaSeriesSpec(spec: BasicSeriesSpec): spec is AreaSeriesSpec {
  return spec.seriesType === SeriesTypes.Area;
}

export function isBandedSpec(y0Accessors: SeriesAccessors['y0Accessors']): boolean {
  return Boolean(y0Accessors && y0Accessors.length > 0);
}
