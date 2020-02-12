import { renderRect } from '../primitives/rect';
import { Rect, Fill, Stroke } from '../../../../../geoms/types';
import { AnnotationRectProps } from '../../../annotations/rect_annotation_tooltip';
import { RectAnnotationStyle } from '../../../../../utils/themes/theme';
import { stringToRGB } from '../../../../partition_chart/layout/utils/d3_utils';
import { withContext } from '../../../../../renderers/canvas';

export function renderRectAnnotations(
  ctx: CanvasRenderingContext2D,
  annotations: AnnotationRectProps[],
  rectStyle: RectAnnotationStyle,
) {
  const rects = annotations.map<Rect>((annotation) => {
    return annotation.rect;
  });
  const fillColor = stringToRGB(rectStyle.fill);
  fillColor.opacity = fillColor.opacity * rectStyle.opacity;
  const fill: Fill = {
    color: fillColor,
  };
  const strokeColor = stringToRGB(rectStyle.stroke);
  strokeColor.opacity = strokeColor.opacity * rectStyle.opacity;
  const stroke: Stroke = {
    color: strokeColor,
    width: rectStyle.strokeWidth,
  };

  const rectsLength = rects.length;

  for (let i = 0; i < rectsLength; i++) {
    const rect = rects[i];
    withContext(ctx, (ctx) => {
      renderRect(ctx, rect, fill, stroke);
    });
  }
}
