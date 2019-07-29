import { GeometryStyle } from '../../../chart_types/xy_chart/rendering/rendering';
import { Rotation } from '../../../chart_types/xy_chart/utils/specs';
import {
  AreaStyle,
  DisplayValueStyle,
  LineStyle,
  PointStyle,
  RectBorderStyle,
  RectStyle,
} from '../../../utils/themes/theme';
import { Dimensions } from '../../../utils/dimensions';
import { GlobalKonvaElementProps } from '../globals';

export interface PointStyleProps {
  radius: number;
  stroke: string;
  strokeWidth: number;
  strokeEnabled: boolean;
  fill: string;
  opacity: number;
}

export function rotateBarValueProps(
  chartRotation: Rotation,
  chartDimensions: Dimensions,
  barDimensions: Dimensions,
  displayValueDimensions: Dimensions,
  displayValue: {
    text: string;
    width: number;
    height: number;
    isValueContainedInElement?: boolean;
  },
  props: DisplayValueStyle & {
    x: number;
    y: number;
    align: string;
    verticalAlign: string;
    text: string;
    width: number;
    height: number;
  },
) {
  const chartWidth = chartDimensions.width;
  const chartHeight = chartDimensions.height;

  const barWidth = barDimensions.width;
  const barHeight = barDimensions.height;
  const x = barDimensions.left;
  const y = barDimensions.top;

  const displayValueWidth = displayValueDimensions.width;
  const displayValueHeight = displayValueDimensions.height;
  const displayValueX = displayValueDimensions.left;
  const displayValueY = displayValueDimensions.top;

  const rotatedDisplayValueX =
    displayValueHeight > barWidth
      ? x - Math.abs(barWidth - displayValueHeight) / 2
      : x + Math.abs(barWidth - displayValueHeight) / 2;

  switch (chartRotation) {
    case 0:
      props.x = displayValueX;
      props.y = displayValueY;
      break;
    case 180:
      props.x = chartWidth - displayValueX - displayValueWidth;
      props.y = chartHeight - displayValueY - displayValueHeight;
      props.verticalAlign = 'bottom';
      break;
    case 90:
      props.x =
        barHeight >= displayValueWidth ? chartWidth - displayValueY - displayValueWidth : chartWidth - displayValueY;
      props.y = rotatedDisplayValueX;
      props.verticalAlign = 'middle';

      if (displayValue.isValueContainedInElement) {
        props.x = chartWidth - y - barHeight;
        props.y = x;
        props.width = barHeight >= displayValueWidth ? barHeight : 0;
        props.height = displayValue.height <= barWidth ? barWidth : 0;
        props.align = 'right';
      }
      break;
    case -90:
      props.x = barHeight >= displayValueWidth ? displayValueY : displayValueY - displayValueWidth;
      props.y = chartHeight - rotatedDisplayValueX - displayValueHeight;
      props.verticalAlign = 'middle';

      if (displayValue.isValueContainedInElement) {
        props.x = y;
        props.y = chartHeight - x - barWidth;
        props.width = barHeight >= displayValueWidth ? barHeight : 0;
        props.height = displayValue.height <= barWidth ? barWidth : 0;
        props.align = 'left';
      }
      break;
  }

  return props;
}

export function getBarValueClipDimensions(
  displayValue: { width: number; height: number; isValueContainedInElement?: boolean },
  computedDimensions: { width: number; height: number },
  barHeight: number,
  chartRotation: Rotation,
): { width: number; height: number; offsetX: number; offsetY: number } {
  const height = displayValue.isValueContainedInElement ? displayValue.height : computedDimensions.height;
  const width = displayValue.isValueContainedInElement ? displayValue.width : computedDimensions.width;

  const offsetY = chartRotation === 180 ? barHeight - displayValue.height : 0;
  const offsetX = chartRotation === 90 ? barHeight - displayValue.width : 0;

  return { height, width, offsetX, offsetY };
}

export function isBarValueOverflow(
  chartDimensions: Dimensions,
  clip: { width: number; height: number; offsetX: number; offsetY: number },
  valuePosition: { x: number; y: number; offsetX: number; offsetY: number },
  hideClippedValue?: boolean,
): boolean {
  const chartHeight = chartDimensions.height;
  const chartWidth = chartDimensions.width;

  const isOverflowX =
    valuePosition.x + clip.width - valuePosition.offsetX > chartWidth ||
    valuePosition.x + clip.offsetX - valuePosition.offsetX < 0;
  const isOverflowY =
    valuePosition.y + clip.height - valuePosition.offsetY > chartHeight ||
    valuePosition.y + clip.offsetY - valuePosition.offsetY < 0;

  return !!hideClippedValue && (isOverflowX || isOverflowY);
}

export function buildBarValueProps({
  x,
  y,
  barHeight,
  barWidth,
  displayValueStyle,
  displayValue,
  chartRotation,
  chartDimensions,
}: {
  x: number;
  y: number;
  barHeight: number;
  barWidth: number;
  displayValueStyle: DisplayValueStyle;
  displayValue: {
    text: string;
    width: number;
    height: number;
    hideClippedValue?: boolean;
    isValueContainedInElement?: boolean;
  };
  chartRotation: Rotation;
  chartDimensions: Dimensions;
}): DisplayValueStyle & {
  x: number;
  y: number;
  align: string;
  text: string;
  width: number;
  height: number;
} {
  const { padding } = displayValueStyle;
  const elementHeight = displayValue.isValueContainedInElement ? barHeight : displayValue.height;

  const displayValueHeight = elementHeight + padding;
  const displayValueWidth = displayValue.width + padding;

  const displayValueY = barHeight >= displayValueHeight ? y : y - displayValueHeight;
  const displayValueX =
    displayValueWidth > barWidth
      ? x - Math.abs(barWidth - displayValueWidth) / 2
      : x + Math.abs(barWidth - displayValueWidth) / 2;

  const displayValueOffsetY = displayValueStyle.offsetY || 0;
  const displayValueOffsetX = displayValueStyle.offsetX || 0;

  const baseProps = {
    align: 'center',
    verticalAlign: 'top',
    ...displayValueStyle,
    text: displayValue.text,
    width: displayValueWidth,
    height: displayValueHeight,
    offsetY: displayValueOffsetY,
    x: displayValueX,
    y: displayValueY,
  };

  const barDimensions = {
    width: barWidth,
    height: barHeight,
    left: x,
    top: y,
  };

  const displayValueDimensions = {
    width: displayValueWidth,
    height: displayValueHeight,
    left: displayValueX,
    top: displayValueY,
  };

  const props = rotateBarValueProps(
    chartRotation,
    chartDimensions,
    barDimensions,
    displayValueDimensions,
    displayValue,
    baseProps,
  );

  const clip = getBarValueClipDimensions(displayValue, props, barHeight, chartRotation);

  const hideOverflow = isBarValueOverflow(
    chartDimensions,
    clip,
    { x: props.x, y: props.y, offsetX: displayValueOffsetX, offsetY: displayValueOffsetY },
    displayValue.hideClippedValue,
  );

  if (hideOverflow) {
    props.width = 0;
    props.height = 0;
  }

  return props;
}

/**
 * Return the style of a point.
 * The color value is used for stroke or fill if they are undefind in the PointStyle
 * @param color the series color
 * @param pointStyle the merged point style
 */
export function buildPointStyleProps(color: string, pointStyle: PointStyle): PointStyleProps {
  const { strokeWidth, opacity } = pointStyle;
  const stroke = pointStyle.stroke || color;
  const fill = pointStyle.fill || color;
  return {
    radius: pointStyle.radius,
    stroke,
    strokeWidth,
    strokeEnabled: strokeWidth !== 0,
    fill: fill,
    opacity,
  };
}

/**
 * Return the rendering props for a point
 * @param x the x position of the point
 * @param y the y position of the point
 * @param pointStyleProps the style props of the point
 */
export function buildPointRenderProps(x: number, y: number, pointStyleProps: PointStyleProps) {
  return {
    x,
    y,
    ...pointStyleProps,
    ...GlobalKonvaElementProps,
  };
}

/**
 * Return the rendering props for a line. The color of the line will be overwritten
 * by the stroke color of the lineStyle parameter if present
 * @param x the horizontal offset to place the line
 * @param linePath the SVG line path
 * @param color the computed color of the line for this series
 * @param lineStyle the line style
 * @param geometryStyle the highlight geometry style
 */
export function buildLineRenderProps(
  x: number,
  linePath: string,
  color: string,
  lineStyle: LineStyle,
  geometryStyle: GeometryStyle,
) {
  return {
    x,
    data: linePath,
    stroke: lineStyle.stroke || color,
    strokeWidth: lineStyle.strokeWidth,
    lineCap: 'round',
    lineJoin: 'round',
    ...geometryStyle,
    ...GlobalKonvaElementProps,
  };
}

/**
 * Return the rendering props for an area. The color of the area will be overwritten
 * by the fill color of the areaStyle parameter if present
 * @param areaPath the SVG area path
 * @param x the horizontal offset to place the area
 * @param color the computed color of the line for this series
 * @param areaStyle the area style
 * @param geometryStyle the highlight geometry style
 */
export function buildAreaRenderProps(
  xTransform: number,
  areaPath: string,
  color: string,
  areaStyle: AreaStyle,
  geometryStyle: GeometryStyle,
) {
  return {
    x: xTransform,
    data: areaPath,
    fill: areaStyle.fill || color,
    lineCap: 'round',
    lineJoin: 'round',
    ...geometryStyle,
    ...GlobalKonvaElementProps,
  };
}

/**
 * Return the rendering props for a bar. The color of the bar will be overwritten
 * by the fill color of the rectStyle parameter if present
 * @param x the x position of the rect
 * @param y the y position of the rect
 * @param width the width of the rect
 * @param height the height of the rect
 * @param color the computed color of the rect for this series
 * @param rectStyle the rect style
 * @param borderStyle the border rect style
 * @param geometryStyle the highlight geometry style
 */
export function buildBarRenderProps(
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  rectStyle: RectStyle,
  borderStyle: RectBorderStyle,
  geometryStyle: GeometryStyle,
) {
  return {
    x,
    y,
    width,
    height,
    fill: rectStyle.fill || color,
    strokeWidth: borderStyle.strokeWidth,
    stroke: borderStyle.stroke || 'transparent',
    strokeEnabled: borderStyle.visible && borderStyle.strokeWidth > 0,
    ...geometryStyle,
    ...GlobalKonvaElementProps,
  };
}
