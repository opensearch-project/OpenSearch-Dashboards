/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import React from 'react';
import { Dataset, Query, TimeRange } from '../../../common';
import { DatasetSelector } from './dataset_selector';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { IDataPluginServices } from '../../types';

interface ConnectedDatasetSelectorProps {
  onSubmit: ((query: Query, dateRange?: TimeRange | undefined) => void) | undefined;
}

const ConnectedDatasetSelector = ({ onSubmit }: ConnectedDatasetSelectorProps) => {
  const { services } = useOpenSearchDashboards<IDataPluginServices>();
  const queryString = services.data.query.queryString;
  const initialDatasets =
    queryString.getQuery().datasets.length > 0
      ? queryString.getQuery().datasets
      : queryString.getDefaultQuery().datasets;
  const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>(initialDatasets);

  useEffect(() => {
    const subscription = queryString.getUpdates$().subscribe((query) => {
      setSelectedDatasets(query.datasets);
    });

    return () => subscription.unsubscribe();
  }, [queryString]);

  const handleDatasetsChange = (datasets: Dataset[]) => {
    setSelectedDatasets(datasets);
    if (datasets) {
      const query = queryString.getInitialQueryByDataset(datasets[0]);
      queryString.setQuery(query);
      onSubmit!(queryString.getQuery());
    }
  };

  return (
    <DatasetSelector
      selectedDatasets={selectedDatasets}
      setSelectedDatasets={handleDatasetsChange}
      services={services}
    />
  );
};

export { ConnectedDatasetSelector as DatasetSelector };
