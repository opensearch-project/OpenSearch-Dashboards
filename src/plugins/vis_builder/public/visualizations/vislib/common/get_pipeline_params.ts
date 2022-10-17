/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BuildPipelineParams } from '../../../../../visualizations/public';
import { getTimeFilter } from '../../../plugin_services';

export const getPipelineParams = (): BuildPipelineParams => {
  const timeFilter = getTimeFilter();
  return {
    timefilter: timeFilter,
    timeRange: timeFilter.getTime(),
  };
};
