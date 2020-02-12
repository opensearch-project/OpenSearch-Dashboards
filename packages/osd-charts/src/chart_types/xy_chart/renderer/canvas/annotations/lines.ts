import { Stroke, Line } from '../../../../../geoms/types';
import { stringToRGB } from '../../../../partition_chart/layout/utils/d3_utils';
import { AnnotationLineProps } from '../../../annotations/line_annotation_tooltip';
import { LineAnnotationStyle } from '../../../../../utils/themes/theme';
import { renderMultiLine } from '../primitives/line';

export function renderLineAnnotations(
  ctx: CanvasRenderingContext2D,
  annotations: AnnotationLineProps[],
  lineStyle: LineAnnotationStyle,
) {
  const lines = annotations.map<Line>((annotation) => {
    const {
      start: { x1, y1 },
      end: { x2, y2 },
    } = annotation.linePathPoints;
    return {
      x1,
      y1,
      x2,
      y2,
    };
  });
  const strokeColor = stringToRGB(lineStyle.line.stroke);
  strokeColor.opacity = strokeColor.opacity * lineStyle.line.opacity;
  const stroke: Stroke = {
    color: strokeColor,
    width: lineStyle.line.strokeWidth,
  };

  renderMultiLine(ctx, lines, stroke);
}
