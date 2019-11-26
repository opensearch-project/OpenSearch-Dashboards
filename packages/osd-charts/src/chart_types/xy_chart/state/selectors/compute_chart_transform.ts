import createCachedSelector from 're-reselect';
import { computeChartTransform, Transform } from '../utils';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export const computeChartTransformSelector = createCachedSelector(
  [computeChartDimensionsSelector, getSettingsSpecSelector],
  (chartDimensions, settingsSpecs): Transform => {
    return computeChartTransform(chartDimensions.chartDimensions, settingsSpecs.rotation);
  },
)(getChartIdSelector);
