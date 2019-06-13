import { GeometryStyle } from '../../../lib/series/rendering';
import { Rotation } from '../../../lib/series/specs';
import { AreaStyle, DisplayValueStyle, LineStyle, PointStyle } from '../../../lib/themes/theme';
import { Dimensions } from '../../../lib/utils/dimensions';
import { GlobalKonvaElementProps } from '../globals';

export interface PointStyleProps {
  radius: number;
  strokeWidth: number;
  strokeEnabled: boolean;
  fill: string;
  opacity: number;
}

export function buildAreaPointProps({
  areaIndex,
  pointIndex,
  x,
  y,
  color,
  pointStyleProps,
}: {
  areaIndex: number;
  pointIndex: number;
  x: number;
  y: number;
  color: string;
  pointStyleProps: PointStyleProps;
}) {
  return {
    key: `area-point-${areaIndex}-${pointIndex}`,
    x,
    y,
    stroke: color,
    ...pointStyleProps,
    ...GlobalKonvaElementProps,
  };
}

export function buildPointStyleProps({
  radius,
  strokeWidth,
  opacity,
  seriesPointStyle,
}: {
  radius: number;
  strokeWidth: number;
  opacity: number;
  seriesPointStyle?: PointStyle;
}): PointStyleProps {
  const pointStrokeWidth = seriesPointStyle ? seriesPointStyle.strokeWidth : strokeWidth;
  return {
    radius: seriesPointStyle ? seriesPointStyle.radius : radius,
    strokeWidth: pointStrokeWidth,
    strokeEnabled: pointStrokeWidth !== 0,
    fill: 'white',
    opacity: seriesPointStyle ? seriesPointStyle.opacity : opacity,
  };
}

export function buildAreaProps({
  index,
  areaPath,
  xTransform,
  color,
  opacity,
  seriesAreaStyle,
}: {
  index: number;
  areaPath: string;
  xTransform: number;
  color: string;
  opacity: number;
  seriesAreaStyle?: AreaStyle;
}) {
  return {
    key: `area-${index}`,
    data: areaPath,
    x: xTransform,
    fill: color,
    lineCap: 'round',
    lineJoin: 'round',
    opacity: seriesAreaStyle ? seriesAreaStyle.opacity : opacity,
    ...GlobalKonvaElementProps,
  };
}

export function buildAreaLineProps({
  areaIndex,
  lineIndex,
  xTransform,
  linePath,
  color,
  strokeWidth,
  geometryStyle,
  seriesAreaLineStyle,
}: {
  areaIndex: number;
  lineIndex: number;
  xTransform: number;
  linePath: string;
  color: string;
  strokeWidth: number;
  geometryStyle: GeometryStyle;
  seriesAreaLineStyle?: LineStyle;
}) {
  return {
    key: `area-${areaIndex}-line-${lineIndex}`,
    data: linePath,
    x: xTransform,
    stroke: color,
    strokeWidth: seriesAreaLineStyle ? seriesAreaLineStyle.strokeWidth : strokeWidth,
    lineCap: 'round',
    lineJoin: 'round',
    ...geometryStyle,
    ...GlobalKonvaElementProps,
  };
}

export function buildBarProps({
  index,
  x,
  y,
  width,
  height,
  fill,
  stroke,
  strokeWidth,
  borderEnabled,
  geometryStyle,
}: {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderEnabled: boolean;
  geometryStyle: GeometryStyle;
}) {
  return {
    key: `bar-${index}`,
    x,
    y,
    width,
    height,
    fill,
    strokeWidth,
    stroke,
    strokeEnabled: borderEnabled,
    ...GlobalKonvaElementProps,
    ...geometryStyle,
  };
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

export function buildLinePointProps({
  lineIndex,
  pointIndex,
  x,
  y,
  color,
  pointStyleProps,
}: {
  lineIndex: number;
  pointIndex: number;
  x: number;
  y: number;
  color: string;
  pointStyleProps: PointStyleProps;
}) {
  return {
    key: `line-point-${lineIndex}-${pointIndex}`,
    x,
    y,
    stroke: color,
    ...pointStyleProps,
    ...GlobalKonvaElementProps,
  };
}

export function buildLineProps({
  index,
  xTransform,
  linePath,
  color,
  strokeWidth,
  geometryStyle,
  seriesLineStyle,
}: {
  index: number;
  xTransform: number;
  linePath: string;
  color: string;
  strokeWidth: number;
  geometryStyle: GeometryStyle;
  seriesLineStyle?: LineStyle;
}) {
  return {
    key: `line-${index}`,
    x: xTransform,
    data: linePath,
    stroke: color,
    strokeWidth: seriesLineStyle ? seriesLineStyle.strokeWidth : strokeWidth,
    lineCap: 'round',
    lineJoin: 'round',
    ...geometryStyle,
    ...GlobalKonvaElementProps,
  };
}
