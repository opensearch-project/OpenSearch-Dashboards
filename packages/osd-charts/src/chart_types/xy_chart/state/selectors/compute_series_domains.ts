/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import createCachedSelector from 're-reselect';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { getSeriesSpecsSelector } from './get_specs';
import { mergeYCustomDomainsByGroupIdSelector } from './merge_y_custom_domains';
import { computeSeriesDomains, SeriesDomainsAndData } from '../utils';
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
