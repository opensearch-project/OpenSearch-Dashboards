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
  const initialDataset = queryString.getQuery().dataset || queryString.getDefaultQuery().dataset;
  const [selectedDataset, setSelectedDataset] = useState<Dataset | undefined>(initialDataset);

  useEffect(() => {
    const subscription = queryString.getUpdates$().subscribe((query) => {
      setSelectedDataset(query.dataset);
    });

    return () => subscription.unsubscribe();
  }, [queryString]);

  const handleDatasetChange = (dataset?: Dataset) => {
    setSelectedDataset(dataset);
    if (dataset) {
      const query = queryString.getInitialQueryByDataset(dataset);
      queryString.setQuery(query);
      onSubmit!(queryString.getQuery());
    }
  };

  return (
    <DatasetSelector
      selectedDataset={selectedDataset}
      setSelectedDataset={handleDatasetChange}
      services={services}
    />
  );
};

export { ConnectedDatasetSelector as DatasetSelector };
