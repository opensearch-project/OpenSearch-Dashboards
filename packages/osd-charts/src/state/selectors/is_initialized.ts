import { GlobalChartState } from '../chart_state';
// import { getSeriesSpecsSelector } from '../../chart_types/xy_chart/state/selectors/get_specs';

export const isInitialized = (state: GlobalChartState) => {
  // return state.specsInitialized && getSeriesSpecsSelector(state).length > 0;
  // todo getSeriesSpecsSelector, at the time of merging `master` now, is specific to Cartesians, blocking non-Cartesians
  return state.specsInitialized;
};
