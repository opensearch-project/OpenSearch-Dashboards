/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { ExploreMetricsDataTable } from '../data_table/explore_metrics_data_table';

/**
 * Metrics tab component for displaying Prometheus time-series data
 */
export const MetricsTab = () => {
  return (
    <div className="explore-metrics-tab tab-container">
      <ExploreMetricsDataTable />
    </div>
  );
};
