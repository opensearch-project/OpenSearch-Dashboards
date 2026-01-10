/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { ExploreMetricsRawTable } from '../data_table/explore_metrics_raw_table';

/**
 * Metrics Raw tab component for displaying Prometheus metrics in raw format
 */
export const MetricsRawTab = () => {
  return (
    <div className="explore-metrics-raw-tab tab-container">
      <ExploreMetricsRawTable />
    </div>
  );
};
