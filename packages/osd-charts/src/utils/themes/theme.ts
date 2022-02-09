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

import { $Values } from 'utility-types';

import { Pixels, Ratio } from '../../common/geometry';
import { Color, ColorVariant, HorizontalAlignment, RecursivePartial, VerticalAlignment } from '../common';
import { Margins, SimplePadding } from '../dimensions';
import { Point } from '../point';

/** @public */
export interface Visible {
  visible: boolean;
}

/** @public */
export interface TextStyle {
  fontSize: number;
  fontFamily: string;
  fontStyle?: string;
  fill: Color;
  padding: number | SimplePadding;
}

/**
 * Offset in pixels
 * @public
 */
export interface TextOffset {
  /**
   * X offset of tick in px or string with % of height
   */
  x: number | string;
  /**
   * X offset of tick in px or string with % of height
   */
  y: number | string;
  /**
   * Offset coordinate system reference
   *
   * - `global` - aligns offset coordinate system to global (non-rotated) coordinate system
   * - `local` - aligns offset coordinate system to local rotated coordinate system
   */
  reference: 'global' | 'local';
}

/**
 * Text alignment
 * @public
 */
export interface TextAlignment {
  horizontal: HorizontalAlignment;
  vertical: VerticalAlignment;
}

/**
 * Shared style properties for varies geometries
 * @public
 */
export interface GeometryStyle {
  /**
   * Opacity multiplier
   *
   * if set to `0.5` all given opacities will be halfed
   */
  opacity: number;
}

/**
 * Shared style properties for varies geometries
 * @public
 */
export interface GeometryStateStyle {
  /**
   * Opacity multiplier
   *
   * if set to `0.5` all given opacities will be halfed
   */
  opacity: number;
}

/** @public */
export interface SharedGeometryStateStyle {
  default: GeometryStateStyle;
  highlighted: GeometryStateStyle;
  unhighlighted: GeometryStateStyle;
}

/**
 * The stroke color style
 * @public
 */
export interface StrokeStyle<C = Color> {
  /** The stroke color in hex, rgba, hsl */
  stroke: C;
  /** The stroke width in pixel */
  strokeWidth: number;
}

/** @public */
export type TickStyle = StrokeStyle &
  Visible & {
    /**
     * Amount of padding between tick line and labels
     */
    padding: number;
    /**
     * length of tick line
     */
    size: number;
  };

/**
 * The dash array for a stroke
 * @public
 */
export interface StrokeDashArray {
  /** The dash array for dashed strokes */
  dash: number[];
}
/** @public */
export interface FillStyle {
  /** The fill color in hex, rgba, hsl */
  fill: Color;
}
/** @public */
export interface Opacity {
  /** The opacity value from 0 to 1 */
  opacity: number;
}

/** @public */
export interface AxisStyle {
  axisTitle: TextStyle & Visible;
  axisPanelTitle: TextStyle & Visible;
  axisLine: StrokeStyle & Visible;
  tickLabel: TextStyle &
    Visible & {
      /** The degrees of rotation of the tick labels */
      rotation: number;
      /**
       * Offset in pixels to render text relative to anchor
       *
       * **Note:** rotation aligns to global cartesian coordinates
       */
      offset: TextOffset;
      alignment: TextAlignment;
    };
  tickLine: TickStyle;
  gridLine: {
    horizontal: GridLineStyle;
    vertical: GridLineStyle;
  };
}

/**
 * @public
 */
export interface GridLineStyle {
  visible: boolean;
  stroke: Color;
  strokeWidth: number;
  opacity: number;
  dash: number[];
}
/** @public */
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
/** @public */
export interface ColorConfig {
  vizColors: Color[];
  defaultVizColor: Color;
}
/**
 * The background style applied to the chart.
 * This is used to coordinate adequate contrast of the text in partition and treemap charts.
 * @public
 */
export interface BackgroundStyle {
  /**
   * The background color
   */
  color: string;
}
/** @public */
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
  /**
   * Legend padding. The Chart margins are independent of the legend.
   *
   * TODO: make SimplePadding when after axis changes are added
   */
  margin: number;
}
/** @public */
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
  axes: AxisStyle;
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
  /**
   * The background allows the consumer to provide a color of the background container of the chart.
   * This can then be used to calculate the contrast of the text for partition charts.
   */
  background: BackgroundStyle;
}

/** @public */
export type PartialTheme = RecursivePartial<Theme>;

/** @public */
export type DisplayValueStyle = Omit<TextStyle, 'fill' | 'fontSize'> & {
  offsetX: number;
  offsetY: number;
  fontSize:
    | number
    | {
        min: number;
        max: number;
      };
  fill:
    | Color
    | { color: Color; borderColor?: Color; borderWidth?: number }
    | {
        textInvertible: boolean;
        textContrast?: number | boolean;
        textBorder?: number;
      };
  alignment?: {
    horizontal: Exclude<HorizontalAlignment, 'far' | 'near'>;
    vertical: Exclude<VerticalAlignment, 'far' | 'near'>;
  };
};

/** @public */
export const PointShape = Object.freeze({
  Circle: 'circle' as const,
  Square: 'square' as const,
  Diamond: 'diamond' as const,
  Plus: 'plus' as const,
  X: 'x' as const,
  Triangle: 'triangle' as const,
});
/** @public */
export type PointShape = $Values<typeof PointShape>;

/** @public */
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
  /** shape for the point, default to circle */
  shape?: PointShape;
}

/** @public */
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

/** @public */
export const TextureShape = Object.freeze({
  ...PointShape,
  Line: 'line' as const,
});
/** @public */
export type TextureShape = $Values<typeof TextureShape>;

/** @public */
export interface TexturedStylesBase {
  /** polygon fill color for texture */
  fill?: Color | ColorVariant;
  /** polygon stroke color for texture */
  stroke?: Color | ColorVariant;
  /** polygon stroke width for texture  */
  strokeWidth?: number;
  /** polygon opacity for texture  */
  opacity?: number;
  /** polygon opacity for texture  */
  dash?: number[];
  /** polygon opacity for texture  */
  size?: number;
  /**
   * The angle of rotation for entire texture
   * in degrees
   */
  rotation?: number;
  /**
   * The angle of rotation for polygons
   * in degrees
   */
  shapeRotation?: number;
  /** texture spacing between polygons */
  spacing?: Partial<Point> | number;
  /** overall origin offset of pattern */
  offset?: Partial<Point> & {
    /** apply offset along global coordinate axes */
    global?: boolean;
  };
}

/** @public */
export interface TexturedShapeStyles extends TexturedStylesBase {
  /** typed of texture designs currently supported */
  shape: TextureShape;
}

/** @public */
export interface TexturedPathStyles extends TexturedStylesBase {
  /** path for polygon texture */
  path: string | Path2D;
}

/**
 * @public
 *
 * Texture style config for area spec
 */
export type TexturedStyles = TexturedPathStyles | TexturedShapeStyles;

/** @public */
export interface AreaStyle {
  /** applying textures to the area on the theme/series */
  texture?: TexturedStyles;
  /** is the area is visible or hidden ? */
  visible: boolean;
  /** a static fill color if defined, if not it will use the color of the series */
  fill?: Color | ColorVariant;
  /** the opacity of each area on the theme/series */
  opacity: number;
}

/** @public */
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

/** @public */
export interface RectStyle {
  /** a static fill color if defined, if not it will use the color of the series */
  fill?: Color | ColorVariant;
  /** the opacity of each rect on the theme/series */
  opacity: number;
  /** The width of the rect in pixel. If expressed together with `widthRatio` then the `widthRatio`
   * will express the max available size, where the `widthPixel` express the derived/min width. */
  widthPixel?: Pixels;
  /** The ratio of the width limited to [0,1]. If expressed together with `widthPixel` then the `widthRatio`
   * will express the max available size, where the `widthPixel` express the derived/min width. */
  widthRatio?: Ratio;
  /** applying textures to the bar on the theme/series */
  texture?: TexturedStyles;
}

/** @public */
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
/** @public */
export interface BarSeriesStyle {
  rect: RectStyle;
  rectBorder: RectBorderStyle;
  displayValue: DisplayValueStyle;
}

/** @public */
export interface BubbleSeriesStyle {
  point: PointStyle;
}

/** @public */
export interface LineSeriesStyle {
  line: LineStyle;
  point: PointStyle;
}

/** @public */
export interface AreaSeriesStyle {
  area: AreaStyle;
  line: LineStyle;
  point: PointStyle;
}

/** @public */
export interface ArcSeriesStyle {
  arc: ArcStyle;
}

/** @public */
export interface CrosshairStyle {
  band: FillStyle & Visible;
  line: StrokeStyle & Visible & Partial<StrokeDashArray>;
  crossLine: StrokeStyle & Visible & Partial<StrokeDashArray>;
}

/**
 * The style for a linear annotation
 * @public
 */
export interface LineAnnotationStyle {
  /**
   * The style for the line geometry
   */
  line: StrokeStyle & Opacity & Partial<StrokeDashArray>;
  /**
   * The style for the text shown on the tooltip.
   * @deprecated This style is not currently used and will
   * soon be removed.
   */
  details: TextStyle;
}

/** @public */
export type RectAnnotationStyle = StrokeStyle & FillStyle & Opacity & Partial<StrokeDashArray>;
