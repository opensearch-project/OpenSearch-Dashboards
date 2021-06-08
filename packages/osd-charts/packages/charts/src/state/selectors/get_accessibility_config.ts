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

import createCachedSelector from 're-reselect';

import { DEFAULT_SETTINGS_SPEC } from '../../specs/constants';
import { SettingsSpec } from '../../specs/settings';
import { isDefined } from '../../utils/common';
import { GlobalChartState } from '../chart_state';
import { getChartIdSelector } from './get_chart_id';
import { getSettingsSpecSelector } from './get_settings_specs';

/** @internal */
export const getSpecs = (state: GlobalChartState) => state.specs;

/** @internal */
export type A11ySettings = {
  label?: string;
  labelId?: string;
  labelHeadingLevel: SettingsSpec['ariaLabelHeadingLevel'];
  description?: string;
  descriptionId?: string;
  defaultSummaryId?: string;
};

/** @internal */
export const DEFAULT_A11Y_SETTINGS: A11ySettings = {
  labelHeadingLevel: DEFAULT_SETTINGS_SPEC.ariaLabelHeadingLevel,
};

/** @internal */
export const getA11ySettingsSelector = createCachedSelector(
  [getSettingsSpecSelector, getChartIdSelector],
  (
    { ariaDescription, ariaDescribedBy, ariaLabel, ariaLabelledBy, ariaUseDefaultSummary, ariaLabelHeadingLevel },
    chartId,
  ) => {
    const defaultSummaryId = ariaUseDefaultSummary ? `${chartId}--defaultSummary` : undefined;
    // use ariaDescribedBy if present, or create a description element if ariaDescription is present.
    // concat also if default summary id if requested
    const describeBy = [ariaDescribedBy ?? (ariaDescription && `${chartId}--desc`), defaultSummaryId].filter(isDefined);

    return {
      // don't render a label if a labelledBy id is provided
      label: ariaLabelledBy ? undefined : ariaLabel,
      // use ariaLabelledBy if present, or create an internal label if ariaLabel is present
      labelId: ariaLabelledBy ?? (ariaLabel && `${chartId}--label`),
      labelHeadingLevel: isValidHeadingLevel(ariaLabelHeadingLevel)
        ? ariaLabelHeadingLevel
        : DEFAULT_A11Y_SETTINGS.labelHeadingLevel,
      // don't use a description if ariaDescribedBy id is provided
      description: ariaDescribedBy ? undefined : ariaDescription,
      // concat all the ids
      descriptionId: describeBy.length > 0 ? describeBy.join(' ') : undefined,
      defaultSummaryId,
    };
  },
)(getChartIdSelector);

function isValidHeadingLevel(ariaLabelHeadingLevel: SettingsSpec['ariaLabelHeadingLevel']): boolean {
  return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'].includes(ariaLabelHeadingLevel);
}
