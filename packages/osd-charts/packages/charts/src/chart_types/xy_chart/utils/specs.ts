/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { ReactNode } from 'react';
import { $Values } from 'utility-types';

import { ChartType } from '../..';
import { TooltipPortalSettings } from '../../../components/portal/types';
import { ScaleContinuousType } from '../../../scales';
import { ScaleType } from '../../../scales/constants';
import { LogScaleOptions } from '../../../scales/scale_continuous';
import { Spec } from '../../../specs';
import { SpecType } from '../../../specs/constants';
import { Accessor, AccessorFormat, AccessorFn } from '../../../utils/accessor';
import { RecursivePartial, Color, Position, Datum } from '../../../utils/common';
import { CurveType } from '../../../utils/curves';
import { OrdinalDomain } from '../../../utils/domain';
import { AxisId, GroupId } from '../../../utils/ids';
import {
  AreaSeriesStyle,
  BarSeriesStyle,
  GridLineStyle,
  LineAnnotationStyle,
  LineSeriesStyle,
  PointStyle,
  RectAnnotationStyle,
  BubbleSeriesStyle,
  AxisStyle,
} from '../../../utils/themes/theme';
import { PrimitiveValue } from '../../partition_chart/layout/utils/group_by_rollup';
import {
  AnnotationTooltipFormatter,
  ComponentWithAnnotationDatum,
  CustomAnnotationTooltip,
} from '../annotations/types';
import { XYChartSeriesIdentifier, DataSeriesDatum } from './series';

/** @public */
export type BarStyleOverride = RecursivePartial<BarSeriesStyle> | Color | null;
/** @public */
export type PointStyleOverride = RecursivePartial<PointStyle> | Color | null;

/** @public */
export const SeriesType = Object.freeze({
  Area: 'area' as const,
  Bar: 'bar' as const,
  Line: 'line' as const,
  Bubble: 'bubble' as const,
});

/**
 * XY series type
 * @public
 */
export type SeriesType = $Values<typeof SeriesType>;

/**
 * The offset and mode applied when stacking values
 * @public
 */
export const StackMode = Object.freeze({
  /** Applies a zero baseline and normalizes the values for each point such that the topline is always one. */
  Percentage: 'percentage' as const,
  /** Shifts the baseline so as to minimize the weighted wiggle of layers. */
  Wiggle: 'wiggle' as const,
  /** Shifts the baseline down such that the center of the streamgraph is always at zero. */
  Silhouette: 'silhouette' as const,
});

/**
 * The offset and mode applied when stacking values
 * @public
 */
export type StackMode = $Values<typeof StackMode>;

/**
 * Override for bar styles per datum
 *
 * Return types:
 * - `Color`: Color value as a `string` will set the bar `fill` to that color
 * - `RecursivePartial<BarSeriesStyle>`: Style values to be merged with base bar styles
 * - `null`: Keep existing bar style
 * @public
 */
export type BarStyleAccessor = (datum: DataSeriesDatum, seriesIdentifier: XYChartSeriesIdentifier) => BarStyleOverride;
/**
 * Override for bar styles per datum
 *
 * Return types:
 * - `Color`: Color value as a `string` will set the point `stroke` to that color
 * - `RecursivePartial<PointStyle>`: Style values to be merged with base point styles
 * - `null`: Keep existing point style
 * @public
 */
export type PointStyleAccessor = (
  datum: DataSeriesDatum,
  seriesIdentifier: XYChartSeriesIdentifier,
) => PointStyleOverride;

/**
 * The global id used by default to group together series
 * @public
 */
export const DEFAULT_GLOBAL_ID = '__global__';

/** @public */
export type FilterPredicate = (series: XYChartSeriesIdentifier) => boolean;
/** @public */
export type SeriesName = string | number | null;
/**
 * Function to create custom series name for a given series
 * @public
 */
export type SeriesNameFn = (series: XYChartSeriesIdentifier, isTooltip: boolean) => SeriesName;
/**
 * Accessor mapping to replace names
 * @public
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
/** @public */
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
   * @defaultValue an hyphen with spaces ` - `
   */
  delimiter?: string;
}
/** @public */
export type SeriesNameAccessor = string | SeriesNameFn | SeriesNameConfigOptions;

/**
 * The fit function type
 * @public
 */
export const Fit = Object.freeze({
  /**
   * Don't draw value on the graph. Slices out area between `null` values.
   *
   * @example
   * ```js
   * [2, null, null, 8] => [2, null null, 8]
   * ```
   */
  None: 'none' as const,
  /**
   * Use the previous non-`null` value
   *
   * @remarks
   * This is the opposite of `Fit.Lookahead`
   *
   * @example
   * ```js
   * [2, null, null, 8] => [2, 2, 2, 8]
   * ```
   */
  Carry: 'carry' as const,
  /**
   * Use the next non-`null` value
   *
   * @remarks
   * This is the opposite of `Fit.Carry`
   *
   * @example
   * ```js
   * [2, null, null, 8] => [2, 8, 8, 8]
   * ```
   */
  Lookahead: 'lookahead' as const,
  /**
   * Use the closest non-`null` value (before or after)
   *
   * @example
   * ```js
   * [2, null, null, 8] => [2, 2, 8, 8]
   * ```
   */
  Nearest: 'nearest' as const,
  /**
   * Average between the closest non-`null` values
   *
   * @example
   * ```js
   * [2, null, null, 8] => [2, 5, 5, 8]
   * ```
   */
  Average: 'average' as const,
  /**
   * Linear interpolation between the closest non-`null` values
   *
   * @example
   * ```js
   * [2, null, null, 8] => [2, 4, 6, 8]
   * ```
   */
  Linear: 'linear' as const,
  /**
   * Sets all `null` values to `0`
   *
   * @example
   * ```js
   * [2, null, null, 8] => [2, 0, 0, 8]
   * ```
   */
  Zero: 'zero' as const,
  /**
   * Specify an explicit value `X`
   *
   * @example
   * ```js
   * [2, null, null, 8] => [2, X, X, 8]
   * ```
   */
  Explicit: 'explicit' as const,
});

/** @public */
export type Fit = $Values<typeof Fit>;

interface DomainBase {
  /**
   * Custom minInterval for the domain which will affect data bucket size.
   * The minInterval cannot be greater than the computed minimum interval between any two adjacent data points.
   * Further, if you specify a custom numeric minInterval for a time-series, please note that due to the restriction
   * above, the specified numeric minInterval will be interpreted as a fixed interval.
   * This means that, for example, if you have yearly time-series data that ranges from 2016 to 2019 and you manually
   * compute the interval between 2016 and 2017, you'll have 366 days due to 2016 being a leap year.  This will not
   * be a valid interval because it is greater than the computed minInterval of 365 days between the other years.
   */
  minInterval?: number;
}

/**
 * Padding unit for domain
 * @public
 */
export const DomainPaddingUnit = Object.freeze({
  /**
   * Raw value in the domain space.
   *
   * Example:
   *
   * If your domain is `[20, 40]` and your padding value is `10`.
   * The resulting domain would be `[10, 50]`
   */
  Domain: 'domain' as const,
  /**
   * Spatial pixel value (aka screenspace) not dependent on domain.
   *
   * @alpha
   */
  Pixel: 'pixel' as const,
  /**
   * Ratio of total domain relative to domain space
   *
   * Example:
   *
   * If your domain is `[20, 40]` and your padding value is `0.1`.
   * The resulting padding would be 2 (i.e. `0.1 * (40 - 20)`)
   * resulting in a domain of `[18, 42]`
   */
  DomainRatio: 'domainRatio' as const,
});
/**
 * Padding unit
 * @public
 */
export type DomainPaddingUnit = $Values<typeof DomainPaddingUnit>;

/**
 * Domain option that **only** apply to `yDomains`.
 * @public
 */
export interface YDomainBase {
  /**
   * Whether to fit the domain to the data.
   *
   * Setting `max` or `min` will override this functionality.
   * @defaultValue false
   */
  fit?: boolean;
  /**
   * Padding for computed domain as positive number.
   * Applied to domain __before__ nicing
   *
   * Setting `max` or `min` will override this functionality.
   */
  padding?: number;
  /**
   * Unit of padding dimension
   *
   * @defaultValue 'domain'
   */
  paddingUnit?: DomainPaddingUnit;
  /**
   * Constrains padded domain to the zero baseline.
   *
   * e.g. If your domain is `[10, 100]` and `[-10, 120]` with padding.
   * The domain would be `[0, 120]` if **constrained** or `[-10, 120]` if **unconstrained**.
   *
   * @defaultValue true
   */
  constrainPadding?: boolean;
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

/** @public */
export type LowerBoundedDomain = DomainBase & LowerBound;
/** @public */
export type UpperBoundedDomain = DomainBase & UpperBound;
/** @public */
export type CompleteBoundedDomain = DomainBase & LowerBound & UpperBound;
/** @public */
export type UnboundedDomainWithInterval = DomainBase;

/** @public */
export type DomainRange = LowerBoundedDomain | UpperBoundedDomain | CompleteBoundedDomain | UnboundedDomainWithInterval;
/** @public */
export type YDomainRange = YDomainBase & DomainRange & LogScaleOptions;

/** @public */
export type CustomXDomain = (DomainRange & Pick<LogScaleOptions, 'logBase'>) | OrdinalDomain;

/** @public */
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

/** @public */
export interface SeriesSpec extends Spec {
  specType: typeof SpecType.Series;
  chartType: typeof ChartType.XYAxis;
  /**
   * The name of the spec. Also a mechanism to provide custom series names.
   */
  name?: SeriesNameAccessor;
  /**
   * The ID of the spec group
   * @defaultValue {@link DEFAULT_GLOBAL_ID}
   */
  groupId: string;
  /**
   * When specify a groupId on this series, this option can be used to compute this series domain as it was part
   * of the default group (when using the boolean value true)
   * or as the series was part of the specified group (when issuing a string)
   */
  useDefaultGroupDomain?: boolean | string;
  /** An array of data */
  data: Datum[];
  /** The type of series you are looking to render */
  seriesType: SeriesType;
  /** Set colors for specific series */
  color?: SeriesColorAccessor;
  /**
   * If the series should appear in the legend
   * @defaultValue `false`
   */
  hideInLegend?: boolean;
  /**
   * Index per series to sort by
   * @deprecated This prop is not currently used and will
   * soon be removed.
   */
  sortIndex?: number;
  displayValueSettings?: DisplayValueSpec;
  /**
   * Postfix string or accessor function for y1 accessor when using `y0Accessors`
   *
   * @defaultValue ` - upper`
   */
  y0AccessorFormat?: AccessorFormat;
  /**
   * Postfix string or accessor function for y1 accessor when using `y0Accessors`
   *
   * @defaultValue ` - lower`
   */
  y1AccessorFormat?: AccessorFormat;
  /**
   * Hide series in tooltip
   */
  filterSeriesInTooltip?: FilterPredicate;
  /**
   * A function called to format every value label.
   * Uses axis `tickFormat` when not provided.
   */
  tickFormat?: TickFormatter;
}

/** @public */
export interface Postfixes {
  /**
   * Postfix for y1 accessor when using `y0Accessors`
   *
   * @defaultValue `upper`
   */
  y0AccessorFormat?: string;
  /**
   * Postfix for y1 accessor when using `y0Accessors`
   *
   * @defaultValue `lower`
   */
  y1AccessorFormat?: string;
}

/** @public */
export type SeriesColorsArray = string[];
/** @public */
export type SeriesColorAccessorFn = (seriesIdentifier: XYChartSeriesIdentifier) => string | null;
/** @public */
export type SeriesColorAccessor = string | SeriesColorsArray | SeriesColorAccessorFn;

/** @public */
export interface SeriesAccessors {
  /** The field name of the x value on Datum object */
  xAccessor: Accessor | AccessorFn;
  /** An array of field names one per y metric value */
  yAccessors: (Accessor | AccessorFn)[];
  /** An optional accessor of the y0 value: base point for area/bar charts  */
  y0Accessors?: (Accessor | AccessorFn)[];
  /** An array of fields thats indicates the datum series membership */
  splitSeriesAccessors?: (Accessor | AccessorFn)[];
  /** An array of fields thats indicates the stack membership */
  stackAccessors?: (Accessor | AccessorFn)[];
  /**
   * Field name of mark size metric on `Datum`
   *
   * Only used with line/area series
   */
  markSizeAccessor?: Accessor | AccessorFn;
}

/** @public */
export type XScaleType = typeof ScaleType.Ordinal | ScaleContinuousType;

/** @public */
export interface SeriesScales {
  /**
   * The x axis scale type
   * @defaultValue `ordinal` {@link (ScaleType:type) | ScaleType.Ordinal}
   */
  xScaleType: XScaleType;
  /**
   * Extends the x domain so that it starts and ends on nice round values.
   * @defaultValue `false`
   */
  xNice?: boolean;
  /**
   * If using a ScaleType.Time this timezone identifier is required to
   * compute a nice set of xScale ticks. Can be any IANA zone supported by
   * the host environment, or a fixed-offset name of the form 'utc+3',
   * or the strings 'local' or 'utc'.
   */
  timeZone?: string;
  /**
   * The y axis scale type
   * @defaultValue `linear` {@link (ScaleType:type) | ScaleType.Linear}
   */
  yScaleType: ScaleContinuousType;
  /**
   * Extends the y domain so that it starts and ends on nice round values.
   * @defaultValue `false`
   */
  yNice?: boolean;
}

/** @public */

export type BasicSeriesSpec = SeriesSpec &
  SeriesAccessors &
  SeriesScales & {
    /**
     * A function called to format every single mark value
     *
     * Only used with line/area series
     */
    markFormat?: TickFormatter<number>;
  };

/** @public */
export type SeriesSpecs<S extends BasicSeriesSpec = BasicSeriesSpec> = Array<S>;

/**
 * This spec describe the dataset configuration used to display a bar series.
 * @public
 */
export type BarSeriesSpec = BasicSeriesSpec &
  Postfixes & {
    /** @defaultValue `bar` {@link (SeriesType:type) | SeriesType.Bar} */
    seriesType: typeof SeriesType.Bar;
    /** If true, will stack all BarSeries and align bars to ticks (instead of centered on ticks) */
    enableHistogramMode?: boolean;
    barSeriesStyle?: RecursivePartial<BarSeriesStyle>;
    /**
     * Stack each series using a specific mode: Percentage, Wiggle, Silhouette.
     * The last two modes are generally used for stream graphs
     */
    stackMode?: StackMode;
    /**
     * Functional accessor to return custom color or style for bar datum
     */
    styleAccessor?: BarStyleAccessor;
    /**
     * Min height to render bars for highly variable data
     *
     * @remarks
     * i.e. ranges from 100,000 to 1.
     *
     * The unit is expressed in `pixel`
     */
    minBarHeight?: number;
  };

/**
 * This spec describe the dataset configuration used to display a histogram bar series.
 * A histogram bar series is identical to a bar series except that stackAccessors are not allowed.
 * @public
 */
export type HistogramBarSeriesSpec = Omit<BarSeriesSpec, 'stackAccessors'> & {
  enableHistogramMode: true;
};

/** @public */
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
 * @public
 */
export type LineSeriesSpec = BasicSeriesSpec &
  HistogramConfig & {
    /** @defaultValue `line` {@link (SeriesType:type) | SeriesType.Line} */
    seriesType: typeof SeriesType.Line;
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
 * This spec describe the dataset configuration used to display a line series.
 *
 * @alpha
 */
export type BubbleSeriesSpec = BasicSeriesSpec & {
  /** @defaultValue `bubble` {@link (SeriesType:type) | SeriesType.Bubble} */
  seriesType: typeof SeriesType.Bubble;
  bubbleSeriesStyle?: RecursivePartial<BubbleSeriesStyle>;
  /**
   * An optional functional accessor to return custom color or style for point datum
   */
  pointStyleAccessor?: PointStyleAccessor;
};

/**
 * This spec describe the dataset configuration used to display an area series.
 * @public
 */
export type AreaSeriesSpec = BasicSeriesSpec &
  HistogramConfig &
  Postfixes & {
    /** @defaultValue `area` {@link (SeriesType:type) | SeriesType.Area} */
    seriesType: typeof SeriesType.Area;
    /** The type of interpolator to be used to interpolate values between points */
    curve?: CurveType;
    areaSeriesStyle?: RecursivePartial<AreaSeriesStyle>;
    /**
     * Stack each series using a specific mode: Percentage, Wiggle, Silhouette.
     * The last two modes are generally used for stream graphs
     */
    stackMode?: StackMode;
    /**
     * An optional functional accessor to return custom color or style for point datum
     */
    pointStyleAccessor?: PointStyleAccessor;
    /**
     * Fit config to fill `null` values in dataset
     */
    fit?: Exclude<Fit, 'explicit'> | FitConfig;
  };

/** @public */
export interface HistogramConfig {
  /**
   *  Determines how points in the series will align to bands in histogram mode
   * @defaultValue `start`
   */
  histogramModeAlignment?: HistogramModeAlignment;
}

/** @public */
export const HistogramModeAlignments = Object.freeze({
  Start: 'start' as HistogramModeAlignment,
  Center: 'center' as HistogramModeAlignment,
  End: 'end' as HistogramModeAlignment,
});

/** @public */
export type HistogramModeAlignment = 'start' | 'center' | 'end';

/**
 * This spec describe the configuration for a chart axis.
 * @public
 */
export interface AxisSpec extends Spec {
  specType: typeof SpecType.Axis;
  chartType: typeof ChartType.XYAxis;
  /** The ID of the spec */
  id: AxisId;
  /** Style options for grid line */
  gridLine?: Partial<GridLineStyle>;
  /**
   * The ID of the axis group
   * @defaultValue {@link DEFAULT_GLOBAL_ID}
   */
  groupId: GroupId;
  /** Hide this axis */
  hide: boolean;
  /** shows all ticks, also the one from the overlapping labels */
  showOverlappingTicks: boolean;
  /** Shows all labels, also the overlapping ones */
  showOverlappingLabels: boolean;
  /**
   * Shows grid lines for axis
   * @defaultValue `false`
   * @deprecated use `gridLine.visible`
   */
  showGridLines?: boolean;
  /** Where the axis appear on the chart */
  position: Position;
  /**
   * A function called to format every tick value label.
   * Uses first series spec `tickFormat` when not provided.
   *
   * used in tooltip when no `tickFormat` is provided from series spec
   */
  tickFormat?: TickFormatter;
  /**
   * A function called to format every label  (excludes tooltip)
   *
   * overrides tickFormat for axis labels
   */
  labelFormat?: TickFormatter;
  /** An approximate count of how many ticks will be generated */
  ticks?: number;
  /** The axis title */
  title?: string;
  /** Custom style overrides */
  style?: RecursivePartial<Omit<AxisStyle, 'gridLine'>>;
  /** If specified, it constrains the domain for these values */
  domain?: YDomainRange;
  /** Show only integar values * */
  integersOnly?: boolean;
  /**
   * Show duplicated ticks
   * @defaultValue `false`
   */
  showDuplicatedTicks?: boolean;
}

/** @public */
export type TickFormatterOptions = {
  timeZone?: string;
};

/** @public */
export type TickFormatter<V = any> = (value: V, options?: TickFormatterOptions) => string;

/** @public */
export const AnnotationType = Object.freeze({
  Line: 'line' as const,
  Rectangle: 'rectangle' as const,
  Text: 'text' as const,
});
/** @public */
export type AnnotationType = $Values<typeof AnnotationType>;

/**
 * The domain type enum that can be associated with an annotation
 * @public
 */
export const AnnotationDomainType = Object.freeze({
  XDomain: 'xDomain' as const,
  YDomain: 'yDomain' as const,
});

/**
 * The domain type that can be associated with an annotation
 * @public
 */
export type AnnotationDomainType = $Values<typeof AnnotationDomainType>;

/**
 * The descriptive object of a line annotation
 * @public
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

/** @public */
export type LineAnnotationSpec = BaseAnnotationSpec<
  typeof AnnotationType.Line,
  LineAnnotationDatum,
  LineAnnotationStyle
> & {
  domainType: AnnotationDomainType;
  /** Optional Custom marker icon centered on data value */
  marker?: ReactNode | ComponentWithAnnotationDatum;
  /** Optional marker body, always contained within chart area */
  markerBody?: ReactNode | ComponentWithAnnotationDatum;
  /**
   * Custom marker dimensions; will be computed internally
   * Any user-supplied values will be overwritten
   */
  markerDimensions?: {
    width: number;
    height: number;
  };
  /**
   * An optional marker position.
   *
   * @remarks
   * The default position, if this property is not specified, falls back to the linked axis position (if available).
   * If no axis present on the chart, the marker position is positioned by default on the bottom on the X domain
   * and on the left of the chart for the Y domain. The specified position is an absolute position and reflect
   * the spatial position of the marker independently from the chart rotation.
   */
  markerPosition?: Position;
  /** Annotation lines are hidden */
  hideLines?: boolean;
  /**
   * Hide tooltip when hovering over the line
   * @defaultValue `true`
   */
  hideLinesTooltips?: boolean;
  /**
   * z-index of the annotation relative to other elements in the chart
   * @defaultValue 1
   */
  zIndex?: number;
};

/**
 * The descriptive object of a rectangular annotation
 * @public
 */
export interface RectAnnotationDatum {
  /**
   * The coordinates for the 4 rectangle points.
   */
  coordinates: {
    /**
     * The minuimum value on the x axis. If undefined, the minuimum value of the x domain will be used.
     */
    x0?: PrimitiveValue;
    /**
     * The maximum value on the x axis. If undefined, the maximum value of the x domain will be used.
     */
    x1?: PrimitiveValue;
    /**
     * The minimum value on the y axis. If undefined, the minimum value of the y domain will be used.
     */
    y0?: PrimitiveValue;
    /**
     * The maximum value on the y axis. If undefined, the maximum value of the y domain will be used.
     */
    y1?: PrimitiveValue;
  };
  /**
   * A textual description of the annotation
   */
  details?: string;
}

/** @public */
export type RectAnnotationSpec = BaseAnnotationSpec<
  typeof AnnotationType.Rectangle,
  RectAnnotationDatum,
  RectAnnotationStyle
> & {
  /**
   * @deprecated use customTooltipDetails
   */
  renderTooltip?: AnnotationTooltipFormatter;
  /**
   * z-index of the annotation relative to other elements in the chart
   * @defaultValue -1
   */
  zIndex?: number;
};

/**
 * Portal settings for annotation tooltips
 *
 * @public
 */
export type AnnotationPortalSettings = TooltipPortalSettings<'chart'> & {
  /**
   * The react component used to render a custom tooltip
   * @public
   */
  customTooltip?: CustomAnnotationTooltip;
  /**
   * The react component used to render a custom tooltip details
   * @public
   */
  customTooltipDetails?: AnnotationTooltipFormatter;
};

/** @public */
export interface BaseAnnotationSpec<
  T extends typeof AnnotationType.Rectangle | typeof AnnotationType.Line,
  D extends RectAnnotationDatum | LineAnnotationDatum,
  S extends RectAnnotationStyle | LineAnnotationStyle
> extends Spec,
    AnnotationPortalSettings {
  chartType: typeof ChartType.XYAxis;
  specType: typeof SpecType.Annotation;
  /**
   * Annotation type: line, rectangle
   */
  annotationType: T;
  /**
   * The ID of the axis group, needed for yDomain position
   * @defaultValue {@link DEFAULT_GLOBAL_ID}
   */
  groupId: GroupId;
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

/** @public */
export type AnnotationSpec = LineAnnotationSpec | RectAnnotationSpec;

/** @internal */
export function isLineAnnotation(spec: AnnotationSpec): spec is LineAnnotationSpec {
  return spec.annotationType === AnnotationType.Line;
}

/** @internal */
export function isRectAnnotation(spec: AnnotationSpec): spec is RectAnnotationSpec {
  return spec.annotationType === AnnotationType.Rectangle;
}

/** @internal */
export function isBarSeriesSpec(spec: BasicSeriesSpec): spec is BarSeriesSpec {
  return spec.seriesType === SeriesType.Bar;
}

/** @internal */
export function isBubbleSeriesSpec(spec: BasicSeriesSpec): spec is BubbleSeriesSpec {
  return spec.seriesType === SeriesType.Bubble;
}

/** @internal */
export function isLineSeriesSpec(spec: BasicSeriesSpec): spec is LineSeriesSpec {
  return spec.seriesType === SeriesType.Line;
}

/** @internal */
export function isAreaSeriesSpec(spec: BasicSeriesSpec): spec is AreaSeriesSpec {
  return spec.seriesType === SeriesType.Area;
}

/** @internal */
export function isBandedSpec(y0Accessors: SeriesAccessors['y0Accessors']): boolean {
  return Boolean(y0Accessors && y0Accessors.length > 0);
}
