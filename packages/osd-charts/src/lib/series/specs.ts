import { AnnotationLineStyle, GridLineConfig } from '../themes/theme';
import { Accessor } from '../utils/accessor';
import { AnnotationId, AxisId, GroupId, SpecId } from '../utils/ids';
import { ScaleContinuousType, ScaleType } from '../utils/scales/scales';
import { CurveType } from './curves';
import { DataSeriesColorsValues } from './series';

export type Datum = any;
export type Rotation = 0 | 90 | -90 | 180;
export type Rendering = 'canvas' | 'svg';

export interface LowerBoundedDomain {
  min: number;
}

export interface UpperBoundedDomain {
  max: number;
}

export interface CompleteBoundedDomain {
  min: number;
  max: number;
}

export type DomainRange = LowerBoundedDomain | UpperBoundedDomain | CompleteBoundedDomain;

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
  seriesType: 'bar' | 'line' | 'area' | 'basic';
  /** Custom colors for series */
  customSeriesColors?: CustomSeriesColorsMap;
  /** If the series should appear in the legend
   * @default false
   */
  hideInLegend?: boolean;
}

export type CustomSeriesColorsMap = Map<DataSeriesColorsValues, string>;

export interface SeriesAccessors {
  /** The field name of the x value on Datum object */
  xAccessor: Accessor;
  /** An array of field names one per y metric value */
  yAccessors: Accessor[];
  /** An array of fields thats indicates the datum series membership */
  splitSeriesAccessors?: Accessor[];
  /** An array of fields thats indicates the stack membership */
  stackAccessors?: Accessor[];
  /** An optional array of field name thats indicates the stack membership */
  colorAccessors?: Accessor[];
}

export interface SeriesScales {
  /**
   * The x axis scale type
   * @default ScaleType.Ordinal
   */
  xScaleType: ScaleType.Ordinal | ScaleType.Linear | ScaleType.Time;
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
  /** if true, the min y value is set to the minimum domain value, 0 otherwise */
  yScaleToDataExtent: boolean;
}

export type BasicSeriesSpec = SeriesSpec & SeriesAccessors & SeriesScales;

/**
 * This spec describe the dataset configuration used to display a bar series.
 */
export type BarSeriesSpec = BasicSeriesSpec & {
  /** @default bar */
  seriesType: 'bar';
};

/**
 * This spec describe the dataset configuration used to display a line series.
 */
export type LineSeriesSpec = BasicSeriesSpec & {
  /** @default line */
  seriesType: 'line';
  curve?: CurveType;
};

/**
 * This spec describe the dataset configuration used to display an area series.
 */
export type AreaSeriesSpec = BasicSeriesSpec & {
  /** @default area */
  seriesType: 'area';
  /** The type of interpolator to be used to interpolate values between points */
  curve?: CurveType;
};

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
  /** The axis title */
  title?: string;
  /** If specified, it constrains the domain for these values */
  domain?: DomainRange;
}

export type TickFormatter = (value: any) => string;

/**
 * The position of the axis relative to the chart.
 * A left or right positioned axis is a vertical axis.
 * A top or bottom positioned axis is an horizontal axis.
 */
export enum Position {
  Top = 'top',
  Bottom = 'bottom',
  Left = 'left',
  Right = 'right',
}

export const AnnotationTypes = Object.freeze({
  Line: 'line' as AnnotationType,
  Rectangle: 'rectangle' as AnnotationType,
  Text: 'text' as AnnotationType,
});

export type AnnotationType = 'line' | 'rectangle' | 'text';

export const AnnotationDomainTypes = Object.freeze({
  XDomain: 'xDomain' as AnnotationDomainType,
  YDomain: 'yDomain' as AnnotationDomainType,
});

export type AnnotationDomainType = 'xDomain' | 'yDomain';
export interface AnnotationDatum {
  dataValue: any;
  details?: string;
  header?: string;
}

export interface LineAnnotationSpec {
  /** The id of the annotation */
  annotationId: AnnotationId;
  /** Annotation type: line, rectangle, text */
  annotationType: AnnotationType;
  /** The ID of the axis group, generated via getGroupId method
   * @default __global__
   */
  groupId: GroupId; // defaults to __global__; needed for yDomain position
  /** Annotation domain type: AnnotationDomainTypes.XDomain or AnnotationDomainTypes.YDomain */
  domainType: AnnotationDomainType;
  /** Data values defined with value, details, and header */
  dataValues: AnnotationDatum[];
  /** Custom line styles */
  style?: Partial<AnnotationLineStyle>;
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
  /** Annotation tooltips are hidden */
  hideTooltips?: boolean;
}

// TODO: RectangleAnnotationSpec & TextAnnotationSpec
export type AnnotationSpec = LineAnnotationSpec;
