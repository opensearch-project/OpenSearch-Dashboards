import createCachedSelector from 're-reselect';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { getSeriesSpecsSelector } from './get_specs';
import { mergeYCustomDomainsByGroupIdSelector } from './merge_y_custom_domains';
import { computeSeriesDomains } from '../utils';
import { SeriesDomainsAndData } from '../utils';
import { GlobalChartState } from '../../../../state/chart_state';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

const getDeselectedSeriesSelector = (state: GlobalChartState) => state.interactions.deselectedDataSeries;

export const computeSeriesDomainsSelector = createCachedSelector(
  [getSeriesSpecsSelector, mergeYCustomDomainsByGroupIdSelector, getDeselectedSeriesSelector, getSettingsSpecSelector],
  (seriesSpecs, customYDomainsByGroupId, deselectedDataSeries, settingsSpec): SeriesDomainsAndData => {
    const domains = computeSeriesDomains(
      seriesSpecs,
      customYDomainsByGroupId,
      deselectedDataSeries,
      settingsSpec.xDomain,
    );
    return domains;
  },
)(getChartIdSelector);
