import createCachedSelector from 're-reselect';
import { GlobalChartState } from '../../../../state/chart_state';
import { getSpecsFromStore } from '../../../../state/utils';
import { AxisSpec, BasicSeriesSpec, AnnotationSpec, SpecTypes } from '../../utils/specs';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { ChartTypes } from '../../..';

const getSpecs = (state: GlobalChartState) => state.specs;

export const getAxisSpecsSelector = createCachedSelector([getSpecs], (specs): AxisSpec[] => {
  return getSpecsFromStore<AxisSpec>(specs, ChartTypes.XYAxis, SpecTypes.Axis);
})(getChartIdSelector);

export const getSeriesSpecsSelector = createCachedSelector([getSpecs], (specs) => {
  const seriesSpec = getSpecsFromStore<BasicSeriesSpec>(specs, ChartTypes.XYAxis, SpecTypes.Series);
  return seriesSpec;
})(getChartIdSelector);

export const getAnnotationSpecsSelector = createCachedSelector([getSpecs], (specs) => {
  return getSpecsFromStore<AnnotationSpec>(specs, ChartTypes.XYAxis, SpecTypes.Annotation);
})(getChartIdSelector);
