import createCachedSelector from 're-reselect';
import { Point } from '../../../../utils/point';
import { GlobalChartState, PointerStates } from '../../../../state/chart_state';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { getProjectedPointerPositionSelector } from './get_projected_pointer_position';
import { getTooltipInfoSelector } from './get_tooltip_values_highlighted_geoms';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { TooltipType, getTooltipType } from '../../../../specs';
import { isAnnotationTooltipVisibleSelector } from './is_annotation_tooltip_visible';
import { TooltipInfo } from '../../../../components/tooltip/types';

const hasTooltipTypeDefinedSelector = (state: GlobalChartState): TooltipType | undefined => {
  return getTooltipType(getSettingsSpecSelector(state));
};

const getPointerSelector = (state: GlobalChartState) => state.interactions.pointer;

export const isTooltipVisibleSelector = createCachedSelector(
  [
    hasTooltipTypeDefinedSelector,
    getPointerSelector,
    getProjectedPointerPositionSelector,
    getTooltipInfoSelector,
    isAnnotationTooltipVisibleSelector,
  ],
  isTooltipVisible,
)(getChartIdSelector);

function isTooltipVisible(
  tooltipType: TooltipType | undefined,
  pointer: PointerStates,
  projectedPointerPosition: Point,
  tooltip: TooltipInfo,
  isAnnotationTooltipVisible: boolean,
) {
  return (
    tooltipType !== TooltipType.None &&
    pointer.down === null &&
    projectedPointerPosition.x > -1 &&
    projectedPointerPosition.y > -1 &&
    tooltip.values.length > 0 &&
    !isAnnotationTooltipVisible
  );
}
