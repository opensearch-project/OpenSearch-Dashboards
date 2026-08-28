/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DashboardServices } from '../../../../types';
import { DEFAULT_DATA, CORE_SIGNAL_TYPES } from '../../../../../../data/common';
import './variable_query_panel.scss';

export const DatasetSelectWidget: React.FC<{
  selectedDataset: any;
  onDatasetChange: (dataset: any) => void;
  language?: string;
}> = ({ selectedDataset, onDatasetChange, language }) => {
  const { services } = useOpenSearchDashboards<DashboardServices>();
  const {
    data: {
      ui: { DatasetSelect },
    },
  } = services;

  const isPromQL = language?.toUpperCase() === 'PROMQL';

  // PromQL queries Prometheus data connections; other languages query indices.
  const supportedTypes = useMemo(() => {
    if (isPromQL) return ['PROMETHEUS'];
    return [DEFAULT_DATA.SET_TYPES.INDEX, DEFAULT_DATA.SET_TYPES.INDEX_PATTERN];
  }, [isPromQL]);

  const signalType = useMemo(() => {
    if (isPromQL) return CORE_SIGNAL_TYPES.METRICS;
    return [CORE_SIGNAL_TYPES.LOGS, CORE_SIGNAL_TYPES.METRICS];
  }, [isPromQL]);

  return (
    <div className="variableDatasetSelectWrapper">
      <DatasetSelect
        onSelect={onDatasetChange}
        appName="dashboard"
        supportedTypes={supportedTypes}
        signalType={signalType}
        showNonTimeFieldDatasets={false}
        controlledSelectedDataset={selectedDataset}
        // Force controlled mode: an undefined selection must not fall back to the
        // global dashboard dataset (which would show an index pattern under PromQL).
        isControlled
      />
    </div>
  );
};
