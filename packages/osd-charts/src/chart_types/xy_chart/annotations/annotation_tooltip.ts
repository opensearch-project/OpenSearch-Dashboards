import { Dimensions } from '../../../utils/dimensions';

export function getFinalAnnotationTooltipPosition(
  /** the dimensions of the chart parent container */
  container: Dimensions,
  chartDimensions: Dimensions,
  /** the dimensions of the tooltip container */
  tooltip: Dimensions,
  /** the tooltip computed position not adjusted within chart bounds */
  tooltipAnchor: { top: number; left: number },
  padding = 10,
): {
  left: string | null;
  top: string | null;
} {
  let left = 0;

  const annotationXOffset = window.pageXOffset + container.left + chartDimensions.left + tooltipAnchor.left;
  if (chartDimensions.left + tooltipAnchor.left + tooltip.width + padding >= container.width) {
    left = annotationXOffset - tooltip.width - padding;
  } else {
    left = annotationXOffset + padding;
  }
  let top = window.pageYOffset + container.top + chartDimensions.top + tooltipAnchor.top;
  if (chartDimensions.top + tooltipAnchor.top + tooltip.height + padding >= container.height) {
    top -= tooltip.height + padding;
  } else {
    top += padding;
  }

  return {
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`,
  };
}
