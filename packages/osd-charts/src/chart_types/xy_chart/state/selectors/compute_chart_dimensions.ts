import createCachedSelector from 're-reselect';
import { getChartThemeSelector } from '../../../../state/selectors/get_chart_theme';
import { getAxisSpecsSelector } from './get_specs';
import { computeChartDimensions } from '../../utils/dimensions';
import { computeAxisTicksDimensionsSelector } from './compute_axis_ticks_dimensions';
import { Dimensions } from '../../../../utils/dimensions';
import { getChartContainerDimensionsSelector } from '../../../../state/selectors/get_chart_container_dimensions';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export const computeChartDimensionsSelector = createCachedSelector(
  [
    getChartContainerDimensionsSelector,
    getChartThemeSelector,
    computeAxisTicksDimensionsSelector,
    getAxisSpecsSelector,
  ],
  (
    chartContainerDimensions,
    chartTheme,
    axesTicksDimensions,
    axesSpecs,
  ): {
    chartDimensions: Dimensions;
    leftMargin: number;
  } => {
    return computeChartDimensions(chartContainerDimensions, chartTheme, axesTicksDimensions, axesSpecs);
  },
)(getChartIdSelector);
