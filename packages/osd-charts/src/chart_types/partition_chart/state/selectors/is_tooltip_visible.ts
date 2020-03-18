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

import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { TooltipType, getTooltipType } from '../../../../specs';
import { getTooltipInfoSelector } from './tooltip';

/**
 * The brush is available only for Ordinal xScales charts and
 * if we have configured an onBrushEnd listener
 * @internal
 */
export const isTooltipVisibleSelector = createCachedSelector(
  [getSettingsSpecSelector, getTooltipInfoSelector],
  (settingsSpec, tooltipInfo): boolean => {
    if (getTooltipType(settingsSpec) === TooltipType.None) {
      return false;
    }
    return tooltipInfo.values.length > 0;
  },
)(getChartIdSelector);
