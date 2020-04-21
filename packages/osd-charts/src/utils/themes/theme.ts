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
 * under the License. */

import { mergePartial, RecursivePartial, Color, ColorVariant } from '../commons';
import { Margins } from '../dimensions';
import { LIGHT_THEME } from './light_theme';

interface Visible {
  visible: boolean;
}

export interface TextStyle {
  fontSize: number;
  fontFamily: string;
  fontStyle?: string;
  fill: Color;
  padding: number;
}

/** Shared style properties for varies geometries */
export interface GeometryStyle {
  /**
   * Opacity multiplier
   *
   * if set to `0.5` all given opacities will be halfed
   */
  opacity: number;
}

/** Shared style properties for varies geometries */
export interface GeometryStateStyle {
  /**
   * Opacity multiplier
   *
   * if set to `0.5` all given opacities will be halfed
   */
  opacity: number;
}

export interface SharedGeometryStateStyle {
  default: GeometryStateStyle;
  highlighted: GeometryStateStyle;
  unhighlighted: GeometryStateStyle;
}

export interface StrokeStyle<C = Color> {
  /** The stroke color in hex, rgba, hsl */
  stroke: C;
  /** The stroke width in pixel */
  strokeWidth: number;
}

export type TickStyle = StrokeStyle & Visible;

export interface StrokeDashArray {
  /** The dash array for dashed strokes */
  dash: number[];
}
export interface FillStyle {
  /** The fill color in hex, rgba, hsl */
  fill: Color;
}
export interface Opacity {
  /** The opacity value from 0 to 1 */
  opacity: number;
}

export interface AxisConfig {
  axisTitleStyle: TextStyle;
  axisLineStyle: StrokeStyle;
  tickLabelStyle: TextStyle;
  tickLineStyle: TickStyle;
  gridLineStyle: {
    horizontal: GridLineConfig;
    vertical: GridLineConfig;
  };
}
export interface GridLineConfig {
  visible?: boolean;
  stroke?: Color;
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
  vizColors: Color[];
  defaultVizColor: Color;
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
  /**
   * Global line styles.
   *
   * __Note:__ This is not used to set the color of a specific series. As such, any changes to the styles will not be reflected in the tooltip, legend, etc..
   *
   * You may use `SeriesColorAccessor` to assign colors to a given series or replace the `theme.colors.vizColors` colors to your desired colors.
   */
  lineSeriesStyle: LineSeriesStyle;
  /**
   * Global area styles.
   *
   * __Note:__ This is not used to set the color of a specific series. As such, any changes to the styles will not be reflected in the tooltip, legend, etc..
   *
   * You may use `SeriesColorAccessor` to assign colors to a given series or replace the `theme.colors.vizColors` colors to your desired colors.
   */
  areaSeriesStyle: AreaSeriesStyle;
  /**
   * Global bar styles.
   *
   * __Note:__ This is not used to set the color of a specific series. As such, any changes to the styles will not be reflected in the tooltip, legend, etc..
   *
   * You may use `SeriesColorAccessor` to assign colors to a given series or replace the `theme.colors.vizColors` colors to your desired colors.
   */
  barSeriesStyle: BarSeriesStyle;
  /**
   * Global bubble styles.
   *
   * __Note:__ This is not used to set the color of a specific series. As such, any changes to the styles will not be reflected in the tooltip, legend, etc..
   *
   * You may use `SeriesColorAccessor` to assign colors to a given series or replace the `theme.colors.vizColors` colors to your desired colors.
   */
  bubbleSeriesStyle: BubbleSeriesStyle;
  arcSeriesStyle: ArcSeriesStyle;
  sharedStyle: SharedGeometryStateStyle;
  axes: AxisConfig;
  scales: ScalesConfig;
  colors: ColorConfig;
  legend: LegendStyle;
  crosshair: CrosshairStyle;
  /**
   * Used to scale radius with `markSizeAccessor`
   *
   * value from 1 to 100
   */
  markSizeRatio?: number;
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
  stroke?: Color | ColorVariant;
  /** the stroke width of the point */
  strokeWidth: number;
  /**  a static fill color if defined, if not it will use the color of the series */
  fill?: Color | ColorVariant;
  /** the opacity of each point on the theme/series */
  opacity: number;
  /** the radius of each point of the theme/series */
  radius: number;
}

export interface LineStyle {
  /** is the line visible or hidden ? */
  visible: boolean;
  /** a static stroke color if defined, if not it will use the color of the series */
  stroke?: Color | ColorVariant;
  /** the stroke width of the line */
  strokeWidth: number;
  /** the opacity of each line on the theme/series */
  opacity: number;
  /** the dash array */
  dash?: number[];
}

export interface AreaStyle {
  /** is the area is visible or hidden ? */
  visible: boolean;
  /** a static fill color if defined, if not it will use the color of the series */
  fill?: Color | ColorVariant;
  /** the opacity of each area on the theme/series */
  opacity: number;
}

export interface ArcStyle {
  /** is the arc is visible or hidden ? */
  visible: boolean;
  /** a static fill color if defined, if not it will use the color of the series */
  fill?: Color | ColorVariant;
  /** a static stroke color if defined, if not it will use the color of the series */
  stroke?: Color | ColorVariant;
  /** the stroke width of the line */
  strokeWidth: number;
  /** the opacity of each arc on the theme/series */
  opacity: number;
}

export interface RectStyle {
  /** a static fill color if defined, if not it will use the color of the series */
  fill?: Color | ColorVariant;
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
  stroke?: Color | ColorVariant;
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

export interface BubbleSeriesStyle {
  point: PointStyle;
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

export interface ArcSeriesStyle {
  arc: ArcStyle;
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
