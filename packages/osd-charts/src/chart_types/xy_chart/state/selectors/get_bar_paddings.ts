import createCachedSelector from 're-reselect';
import { isHistogramModeEnabledSelector } from './is_histogram_mode_enabled';
import { getChartThemeSelector } from '../../../../state/selectors/get_chart_theme';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export const getBarPaddingsSelector = createCachedSelector(
  [isHistogramModeEnabledSelector, getChartThemeSelector],
  (isHistogramMode, chartTheme): number => {
    return isHistogramMode ? chartTheme.scales.histogramPadding : chartTheme.scales.barsPadding;
  },
)(getChartIdSelector);
