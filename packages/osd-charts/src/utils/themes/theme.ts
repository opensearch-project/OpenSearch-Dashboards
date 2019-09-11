import { mergePartial, RecursivePartial } from '../commons';
import { GeometryStyle } from '../../chart_types/xy_chart/rendering/rendering';
import { Margins } from '../dimensions';
import { LIGHT_THEME } from './light_theme';

interface Visible {
  visible: boolean;
}

export interface TextStyle {
  fontSize: number;
  fontFamily: string;
  fontStyle?: string;
  fill: string;
  padding: number;
}
export interface GeometryStyle {
  stroke: string;
  strokeWidth: number;
  fill?: string;
  opacity?: number;
}

export interface SharedGeometryStyle {
  default: GeometryStyle;
  highlighted: GeometryStyle;
  unhighlighted: GeometryStyle;
}

export interface StrokeStyle {
  /** The stroke color in hex, rgba, hsl */
  stroke: string;
  /** The stroke width in pixel */
  strokeWidth: number;
}
export interface StrokeDashArray {
  /** The dash array for dashed strokes */
  dash: number[];
}
export interface FillStyle {
  /** The fill color in hex, rgba, hsl */
  fill: string;
}
export interface Opacity {
  /** The opacity value from 0 to 1 */
  opacity: number;
}

export interface AxisConfig {
  axisTitleStyle: TextStyle;
  axisLineStyle: StrokeStyle;
  tickLabelStyle: TextStyle;
  tickLineStyle: StrokeStyle;
  gridLineStyle: {
    horizontal: GridLineConfig;
    vertical: GridLineConfig;
  };
}
export interface GridLineConfig {
  visible?: boolean;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  dash?: number[];
}
export interface ScalesConfig {
  /**
   * The proportion of the range that is reserved for blank space between bands.
   * A value of 0 means no blank space between bands, and a value of 1 means a bandwidth of zero.
   * A number between 0 and 1.
   */
  barsPadding: number;
  /**
   * The proportion of the range that is reserved for blank space between bands in histogramMode.
   * A value of 0 means no blank space between bands, and a value of 1 means a bandwidth of zero.
   * A number between 0 and 1.
   */
  histogramPadding: number;
}
export interface ColorConfig {
  vizColors: string[];
  defaultVizColor: string;
}
export interface LegendStyle {
  /**
   * Max width used for left/right legend
   *
   * or
   *
   * Width of `LegendItem` for top/bottom legend
   */
  verticalWidth: number;
  /**
   * Max height used for top/bottom legend
   */
  horizontalHeight: number;
  /**
   * Added buffer between label and value.
   *
   * Smaller values render a more compact legend
   */
  spacingBuffer: number;
}
export interface Theme {
  /**
   * Space btw parent DOM element and first available element of the chart (axis if exists, else the chart itself)
   */
  chartMargins: Margins;
  /**
   * Space btw the chart geometries and axis; if no axis, pads space btw chart & container
   */
  chartPaddings: Margins;
  lineSeriesStyle: LineSeriesStyle;
  areaSeriesStyle: AreaSeriesStyle;
  barSeriesStyle: BarSeriesStyle;
  sharedStyle: SharedGeometryStyle;
  axes: AxisConfig;
  scales: ScalesConfig;
  colors: ColorConfig;
  legend: LegendStyle;
  crosshair: CrosshairStyle;
}

export type PartialTheme = RecursivePartial<Theme>;

export type DisplayValueStyle = TextStyle & {
  offsetX: number;
  offsetY: number;
};

export interface PointStyle {
  /** is the point visible or hidden */
  visible: boolean;
  /** a static stroke color if defined, if not it will use the color of the series */
  stroke?: string;
  /** the stroke width of the point */
  strokeWidth: number;
  /**  a static fill color if defined, if not it will use the color of the series */
  fill?: string;
  /** the opacity of each point on the theme/series */
  opacity: number;
  /** the radius of each point of the theme/series */
  radius: number;
}

export interface LineStyle {
  /** is the line visible or hidden ? */
  visible: boolean;
  /** a static stroke color if defined, if not it will use the color of the series */
  stroke?: string;
  /** the stroke width of the line */
  strokeWidth: number;
  /** the opacity of each line on the theme/series */
  opacity: number;
}

export interface AreaStyle {
  /** is the area is visible or hidden ? */
  visible: boolean;
  /** a static fill color if defined, if not it will use the color of the series */
  fill?: string;
  /** the opacity of each area on the theme/series */
  opacity: number;
}

export interface RectStyle {
  /** a static fill color if defined, if not it will use the color of the series */
  fill?: string;
  /** the opacity of each rect on the theme/series */
  opacity: number;
}

export interface RectBorderStyle {
  /**
   * Border visibility
   */
  visible: boolean;
  /**
   * Border stroke color
   */
  stroke?: string;
  /**
   * Border stroke width
   */
  strokeWidth: number;
  /**
   * Border stroke opacity
   */
  strokeOpacity?: number;
}
export interface BarSeriesStyle {
  rect: RectStyle;
  rectBorder: RectBorderStyle;
  displayValue: DisplayValueStyle;
}

export interface LineSeriesStyle {
  line: LineStyle;
  point: PointStyle;
}

export interface AreaSeriesStyle {
  area: AreaStyle;
  line: LineStyle;
  point: PointStyle;
}

export interface CrosshairStyle {
  band: FillStyle & Visible;
  line: StrokeStyle & Visible & Partial<StrokeDashArray>;
}

export interface LineAnnotationStyle {
  line: StrokeStyle & Opacity;
  details: TextStyle;
}

export type RectAnnotationStyle = StrokeStyle & FillStyle & Opacity;

export const DEFAULT_ANNOTATION_LINE_STYLE: LineAnnotationStyle = {
  line: {
    stroke: '#777',
    strokeWidth: 1,
    opacity: 1,
  },
  details: {
    fontSize: 10,
    fontFamily: 'sans-serif',
    fontStyle: 'normal',
    fill: '#777',
    padding: 0,
  },
};

export const DEFAULT_ANNOTATION_RECT_STYLE: RectAnnotationStyle = {
  stroke: '#FFEEBC',
  strokeWidth: 0,
  opacity: 0.25,
  fill: '#FFEEBC',
};

export function mergeGridLineConfigs(axisSpecConfig: GridLineConfig, themeConfig: GridLineConfig): GridLineConfig {
  const visible = axisSpecConfig.visible != null ? axisSpecConfig.visible : themeConfig.visible;
  const strokeWidth = axisSpecConfig.strokeWidth != null ? axisSpecConfig.strokeWidth : themeConfig.strokeWidth;
  const opacity = axisSpecConfig.opacity != null ? axisSpecConfig.opacity : themeConfig.opacity;

  return {
    visible,
    stroke: axisSpecConfig.stroke || themeConfig.stroke,
    dash: axisSpecConfig.dash || themeConfig.dash,
    strokeWidth,
    opacity,
  };
}

export function mergeWithDefaultAnnotationLine(config?: Partial<LineAnnotationStyle>): LineAnnotationStyle {
  const defaultLine = DEFAULT_ANNOTATION_LINE_STYLE.line;
  const defaultDetails = DEFAULT_ANNOTATION_LINE_STYLE.details;
  const mergedConfig: LineAnnotationStyle = { ...DEFAULT_ANNOTATION_LINE_STYLE };

  if (!config) {
    return mergedConfig;
  }

  if (config.line) {
    mergedConfig.line = {
      ...defaultLine,
      ...config.line,
    };
  }

  if (config.details) {
    mergedConfig.details = {
      ...defaultDetails,
      ...config.details,
    };
  }

  return mergedConfig;
}

export function mergeWithDefaultAnnotationRect(config?: Partial<RectAnnotationStyle>): RectAnnotationStyle {
  if (!config) {
    return DEFAULT_ANNOTATION_RECT_STYLE;
  }

  return {
    ...DEFAULT_ANNOTATION_RECT_STYLE,
    ...config,
  };
}

/**
 * Merge theme or themes with a base theme
 *
 * priority is based on spatial order
 *
 * @param theme - primary partial theme
 * @param defaultTheme - base theme
 * @param axillaryThemes - additional themes to be merged
 */
export function mergeWithDefaultTheme(
  theme: PartialTheme,
  defaultTheme: Theme = LIGHT_THEME,
  axillaryThemes: PartialTheme[] = [],
): Theme {
  return mergePartial(defaultTheme, theme, { mergeOptionalPartialValues: true }, axillaryThemes);
}
