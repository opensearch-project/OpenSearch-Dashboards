import { AnnotationDimensions } from '../../../annotations/annotation_utils';
import { AnnotationSpec, isLineAnnotation, isRectAnnotation } from '../../../utils/specs';
import { getSpecsById } from '../../../state/utils';
import { AnnotationId } from '../../../../../utils/ids';
import { mergeWithDefaultAnnotationLine, mergeWithDefaultAnnotationRect } from '../../../../../utils/themes/theme';
import { renderLineAnnotations } from './lines';
import { AnnotationLineProps } from '../../../annotations/line_annotation_tooltip';
import { renderRectAnnotations } from './rect';
import { AnnotationRectProps } from '../../../annotations/rect_annotation_tooltip';

interface AnnotationProps {
  annotationDimensions: Map<AnnotationId, AnnotationDimensions>;
  annotationSpecs: AnnotationSpec[];
}
export function renderAnnotations(
  ctx: CanvasRenderingContext2D,
  props: AnnotationProps,
  renderOnBackground: boolean = true,
) {
  const { annotationDimensions, annotationSpecs } = props;

  annotationDimensions.forEach((annotation, id) => {
    const spec = getSpecsById<AnnotationSpec>(annotationSpecs, id);
    if (!spec) {
      return null;
    }
    const isBackground = !spec.zIndex || (spec.zIndex && spec.zIndex <= 0);
    if ((isBackground && renderOnBackground) || (!isBackground && !renderOnBackground)) {
      if (isLineAnnotation(spec)) {
        const lineStyle = mergeWithDefaultAnnotationLine(spec.style);
        renderLineAnnotations(ctx, annotation as AnnotationLineProps[], lineStyle);
      } else if (isRectAnnotation(spec)) {
        const rectStyle = mergeWithDefaultAnnotationRect(spec.style);
        renderRectAnnotations(ctx, annotation as AnnotationRectProps[], rectStyle);
      }
    }
  });
}
