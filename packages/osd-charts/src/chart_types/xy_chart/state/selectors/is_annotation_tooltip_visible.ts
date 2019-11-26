import { getAnnotationTooltipStateSelector } from './get_annotation_tooltip_state';
import createCachedSelector from 're-reselect';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export const isAnnotationTooltipVisibleSelector = createCachedSelector(
  [getAnnotationTooltipStateSelector],
  (annotationTooltipState): boolean => {
    return annotationTooltipState !== null && annotationTooltipState.isVisible;
  },
)(getChartIdSelector);
