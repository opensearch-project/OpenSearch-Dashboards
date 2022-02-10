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
 * under the License.
 */

import { ScaleBand } from '../../../../scales';
import { DEFAULT_SM_PANEL_PADDING, RelativeBandsPadding } from '../../../../specs/small_multiples';
import { createCustomCachedSelector } from '../../../../state/create_selector';
import { getSmallMultiplesSpec } from '../../../../state/selectors/get_small_multiples_spec';
import { OrdinalDomain } from '../../../../utils/domain';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { computeSeriesDomainsSelector } from './compute_series_domains';

/** @internal */
export interface SmallMultipleScales {
  horizontal: ScaleBand;
  vertical: ScaleBand;
}

/**
 * Return the small multiple scales for horizontal and vertical grids
 * @internal
 */
export const computeSmallMultipleScalesSelector = createCustomCachedSelector(
  [computeSeriesDomainsSelector, computeChartDimensionsSelector, getSmallMultiplesSpec],
  ({ smHDomain, smVDomain }, { chartDimensions: { width, height } }, smSpec): SmallMultipleScales => {
    return {
      horizontal: getScale(smHDomain, width, smSpec && smSpec[0].style?.horizontalPanelPadding),
      vertical: getScale(smVDomain, height, smSpec && smSpec[0].style?.verticalPanelPadding),
    };
  },
);

/**
 * @internal
 */
export function getScale(
  domain: OrdinalDomain,
  maxRange: number,
  padding: RelativeBandsPadding = DEFAULT_SM_PANEL_PADDING,
) {
  const singlePanelSmallMultiple = domain.length <= 1;
  const defaultDomain = domain.length === 0 ? [undefined] : domain;
  return new ScaleBand(defaultDomain, [0, maxRange], undefined, singlePanelSmallMultiple ? 0 : padding);
}
