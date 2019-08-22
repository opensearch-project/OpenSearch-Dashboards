import {
  AreaSeriesStyle,
  GridLineConfig,
  LineAnnotationStyle,
  LineSeriesStyle,
  RectAnnotationStyle,
  BarSeriesStyle,
} from '../../../utils/themes/theme';
import { Accessor } from '../../../utils/accessor';
import { Omit, RecursivePartial } from '../../../utils/commons';
import { AnnotationId, AxisId, GroupId, SpecId } from '../../../utils/ids';
import { ScaleContinuousType, ScaleType } from '../../../utils/scales/scales';
import { CurveType } from '../../../utils/curves';
import { DataSeriesColorsValues, RawDataSeriesDatum } from './series';
import { GeometryId } from '../rendering/rendering';
import { AnnotationTooltipFormatter } from '../annotations/annotation_utils';

export type Datum = any;
export type Rotation = 0 | 90 | -90 | 180;
export type Rendering = 'canvas' | 'svg';
export type Color = string;
export type StyleOverride = RecursivePartial<BarSeriesStyle> | Color | null;
export type StyleAccessor = (datum: RawDataSeriesDatum, geometryId: GeometryId) => StyleOverride;

interface DomainMinInterval {
  /** Custom minInterval for the domain which will affect data bucket size.
   * The minInterval cannot be greater than the computed minimum interval between any two adjacent data points.
   * Further, if you specify a custom numeric minInterval for a timeseries, please note that due to the restriction
   * above, the specified numeric minInterval will be interpreted as a fixed interval.
   * This means that, for example, if you have yearly timeseries data that ranges from 2016 to 2019 and you manually
   * compute the interval between 2016 and 2017, you'll have 366 days due to 2016 being a leap year.  This will not
   * be a valid interval because it is greater than the computed minInterval of 365 days betwen the other years.
   */
  minInterval?: number;
}

interface LowerBound {
  /** Lower bound of domain range */
  min: number;
}

interface UpperBound {
  /** Upper bound of domain range */
  max: number;
}

export type LowerBoundedDomain = DomainMinInterval & LowerBound;
export type UpperBoundedDomain = DomainMinInterval & UpperBound;
export type CompleteBoundedDomain = DomainMinInterval & LowerBound & UpperBound;
export type UnboundedDomainWithInterval = DomainMinInterval;

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

export interface SeriesSpec {
  /** The ID of the spec, generated via getSpecId method */
  id: SpecId;
  /** The name or label of the spec */
  name?: string;
  /** The ID of the spec group, generated via getGroupId method
   * @default __global__
   */
  groupId: GroupId;
  /** An array of data */
  data: Datum[];
  /** The type of series you are looking to render */
  seriesType: 'bar' | 'line' | 'area';
  /** Custom colors for series */
  customSeriesColors?: CustomSeriesColorsMap;
  /** If the series should appear in the legend
   * @default false
   */
  hideInLegend?: boolean;
  /** Index per series to sort by */
  sortIndex?: number;
  displayValueSettings?: DisplayValueSpec;
}

export type CustomSeriesColorsMap = Map<DataSeriesColorsValues, string>;

export interface SeriesAccessors {
  /** The field name of the x value on Datum object */
  xAccessor: Accessor;
  /** An array of field names one per y metric value */
  yAccessors: Accessor[];
  /** An optional accessor of the y0 value: base point for area/bar charts  */
  y0Accessors?: Accessor[];
  /** An array of fields thats indicates the datum series membership */
  splitSeriesAccessors?: Accessor[];
  /** An array of fields thats indicates the stack membership */
  stackAccessors?: Accessor[];
  /** An optional functional accessor to return custom datum color or style */
  styleAccessor?: StyleAccessor;
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

/**
 * This spec describe the dataset configuration used to display a bar series.
 */
export type BarSeriesSpec = BasicSeriesSpec & {
  /** @default bar */
  seriesType: 'bar';
  /** If true, will stack all BarSeries and align bars to ticks (instead of centered on ticks) */
  enableHistogramMode?: boolean;
  barSeriesStyle?: RecursivePartial<BarSeriesStyle>;
  /**
   * Stack each series in percentage for each point.
   */
  stackAsPercentage?: boolean;
};

/**
 * This spec describe the dataset configuration used to display a histogram bar series.
 * A histogram bar series is identical to a bar series except that stackAccessors are not allowed.
 */
export type HistogramBarSeriesSpec = Omit<BarSeriesSpec, 'stackAccessors'> & {
  enableHistogramMode: true;
};

/**
 * This spec describe the dataset configuration used to display a line series.
 */
export type LineSeriesSpec = BasicSeriesSpec &
  HistogramConfig & {
    /** @default line */
    seriesType: 'line';
    curve?: CurveType;
    lineSeriesStyle?: RecursivePartial<LineSeriesStyle>;
  };

/**
 * This spec describe the dataset configuration used to display an area series.
 */
export type AreaSeriesSpec = BasicSeriesSpec &
  HistogramConfig & {
    /** @default area */
    seriesType: 'area';
    /** The type of interpolator to be used to interpolate values between points */
    curve?: CurveType;
    areaSeriesStyle?: RecursivePartial<AreaSeriesStyle>;
    /**
     * Stack each series in percentage for each point.
     */
    stackAsPercentage?: boolean;
  };

interface HistogramConfig {
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
export interface AxisSpec {
  /** The ID of the spec, generated via getSpecId method */
  id: AxisId;
  /** Style options for grid line */
  gridLineStyle?: GridLineConfig;
  /** The ID of the axis group, generated via getGroupId method
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
}

export type TickFormatter = (value: any) => string;

export interface AxisStyle {
  /** Specifies the amount of padding on the tick label bounding box */
  tickLabelPadding?: number;
}

/**
 * The position of the axis relative to the chart.
 * A left or right positioned axis is a vertical axis.
 * A top or bottom positioned axis is an horizontal axis.
 */
export const Position = Object.freeze({
  Top: 'top' as 'top',
  Bottom: 'bottom' as 'bottom',
  Left: 'left' as 'left',
  Right: 'right' as 'right',
});

export type Position = typeof Position.Top | typeof Position.Bottom | typeof Position.Left | typeof Position.Right;

export const AnnotationTypes = Object.freeze({
  Line: 'line' as 'line',
  Rectangle: 'rectangle' as 'rectangle',
  Text: 'text' as 'text',
});

export type AnnotationType =
  | typeof AnnotationTypes.Line
  | typeof AnnotationTypes.Rectangle
  | typeof AnnotationTypes.Text;

export const AnnotationDomainTypes = Object.freeze({
  XDomain: 'xDomain' as 'xDomain',
  YDomain: 'yDomain' as 'yDomain',
});

export type AnnotationDomainType = typeof AnnotationDomainTypes.XDomain | typeof AnnotationDomainTypes.YDomain;

export interface LineAnnotationDatum {
  dataValue: any;
  details?: string;
  header?: string;
}

export type LineAnnotationSpec = BaseAnnotationSpec & {
  annotationType: 'line';
  domainType: AnnotationDomainType;
  /** Data values defined with value, details, and header */
  dataValues: LineAnnotationDatum[];
  /** Custom line styles */
  style?: Partial<LineAnnotationStyle>;
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
  /** Hide tooltip when hovering over the line */
  hideLinesTooltips?: boolean;
  /** z-index of the annotation relative to other elements in the chart
   * @default 1
   */
  zIndex?: number;
};

export interface RectAnnotationDatum {
  coordinates: {
    x0?: any;
    x1?: any;
    y0?: any;
    y1?: any;
  };
  details?: string;
}

export type RectAnnotationSpec = BaseAnnotationSpec & {
  annotationType: 'rectangle';
  /** Custom rendering function for tooltip */
  renderTooltip?: AnnotationTooltipFormatter;
  /** Data values defined with coordinates and details */
  dataValues: RectAnnotationDatum[];
  /** Custom annotation style */
  style?: Partial<RectAnnotationStyle>;
  /** z-index of the annotation relative to other elements in the chart
   * @default -1
   */
  zIndex?: number;
};

export interface BaseAnnotationSpec {
  /** The id of the annotation */
  annotationId: AnnotationId;
  /** Annotation type: line, rectangle, text */
  annotationType: AnnotationType;
  /** The ID of the axis group, generated via getGroupId method
   * @default __global__
   */
  groupId: GroupId; // defaults to __global__; needed for yDomain position
  /** Data values defined with coordinates and details */
  dataValues: AnnotationDatum[];
  /** Custom annotation style */
  style?: Partial<AnnotationStyle>;
  /** Toggles tooltip annotation visibility */
  hideTooltips?: boolean;
  /** z-index of the annotation relative to other elements in the chart
   * Default specified per specific annotation spec.
   */
  zIndex?: number;
}

export type AnnotationDatum = LineAnnotationDatum | RectAnnotationDatum;
export type AnnotationStyle = LineAnnotationStyle | RectAnnotationStyle;

// TODO:  TextAnnotationSpec
export type AnnotationSpec = LineAnnotationSpec | RectAnnotationSpec;

export function isLineAnnotation(spec: AnnotationSpec): spec is LineAnnotationSpec {
  return spec.annotationType === AnnotationTypes.Line;
}

export function isRectAnnotation(spec: AnnotationSpec): spec is RectAnnotationSpec {
  return spec.annotationType === AnnotationTypes.Rectangle;
}

export function isBarSeriesSpec(spec: BasicSeriesSpec): spec is BarSeriesSpec {
  return spec.seriesType === 'bar';
}

export function isLineSeriesSpec(spec: BasicSeriesSpec): spec is LineSeriesSpec {
  return spec.seriesType === 'line';
}

export function isAreaSeriesSpec(spec: BasicSeriesSpec): spec is AreaSeriesSpec {
  return spec.seriesType === 'area';
}
