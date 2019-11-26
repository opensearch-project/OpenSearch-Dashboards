import createCachedSelector from 're-reselect';
import { getSettingsSpecSelector } from './get_settings_specs';
import { getLegendSizeSelector } from './get_legend_size';
import { GlobalChartState } from '../chart_state';
import { Dimensions } from '../../utils/dimensions';
import { isVerticalAxis } from '../../chart_types/xy_chart/utils/axis_utils';
import { getChartIdSelector } from './get_chart_id';

const getParentDimension = (state: GlobalChartState) => state.parentDimensions;

export const getChartContainerDimensionsSelector = createCachedSelector(
  [getSettingsSpecSelector, getLegendSizeSelector, getParentDimension],
  (settings, legendSize, parentDimensions): Dimensions => {
    if (!settings.showLegend) {
      return parentDimensions;
    }
    if (isVerticalAxis(settings.legendPosition)) {
      return {
        left: 0,
        top: 0,
        width: parentDimensions.width - legendSize.width,
        height: parentDimensions.height,
      };
    } else {
      return {
        left: 0,
        top: 0,
        width: parentDimensions.width,
        height: parentDimensions.height - legendSize.height,
      };
    }
  },
)(getChartIdSelector);
