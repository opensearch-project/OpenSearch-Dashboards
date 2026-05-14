/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MetricsDataTable } from './metrics_data_table';
import { useLastValidPrometheusResult } from './use_last_valid_metrics_results';

export const ExploreMetricsDataTable: React.FC = () => {
  const searchResult = useLastValidPrometheusResult();
  // @ts-expect-error TS2322 TODO(ts-error): fixme
  return <MetricsDataTable searchResult={searchResult} />;
};
