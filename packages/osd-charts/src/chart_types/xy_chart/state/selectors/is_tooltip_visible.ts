import createCachedSelector from 're-reselect';
import { TooltipType, isTooltipType, isTooltipProps } from '../../utils/interactions';
import { Point } from '../../../../utils/point';
import { GlobalChartState, PointerStates } from '../../../../state/chart_state';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { getProjectedPointerPositionSelector } from './get_projected_pointer_position';
import { getTooltipValuesSelector, TooltipData } from './get_tooltip_values_highlighted_geoms';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

const getTooltipType = (state: GlobalChartState): TooltipType | undefined => {
  const tooltip = getSettingsSpecSelector(state).tooltip;
  if (!tooltip) {
    return undefined;
  }
  if (isTooltipType(tooltip)) {
    return tooltip;
  }
  if (isTooltipProps(tooltip)) {
    return tooltip.type;
  }
};
const getPointerSelector = (state: GlobalChartState) => state.interactions.pointer;

export const isTooltipVisibleSelector = createCachedSelector(
  [getTooltipType, getPointerSelector, getProjectedPointerPositionSelector, getTooltipValuesSelector],
  isTooltipVisible,
)(getChartIdSelector);

function isTooltipVisible(
  tooltipType: TooltipType | undefined,
  pointer: PointerStates,
  projectedPointerPosition: Point,
  tooltip: TooltipData,
) {
  return (
    tooltipType !== TooltipType.None &&
    pointer.down === null &&
    projectedPointerPosition.x > -1 &&
    projectedPointerPosition.y > -1 &&
    tooltip.values.length > 0
  );
}
