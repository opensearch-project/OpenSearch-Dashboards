/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import React from 'react';
import { Dataset } from '../../../common/datasets';
import { DatasetSelector } from './dataset_selector';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { IDataPluginServices } from '../../types';

const ConnectedDatasetSelector = () => {
  const [selectedDataset, setSelectedDataset] = useState<Dataset | undefined>();
  const { services } = useOpenSearchDashboards<IDataPluginServices>();
  const queryString = services.data.query.queryString;

  useEffect(() => {
    const initialDataset = queryString.getQuery().dataset || queryString.getDefaultQuery().dataset;
    setSelectedDataset(initialDataset);

    const subscription = queryString.getUpdates$().subscribe((query) => {
      setSelectedDataset(query.dataset);
    });

    return () => subscription.unsubscribe();
  }, [queryString]);

  const handleDatasetChange = (dataset?: Dataset) => {
    setSelectedDataset(dataset);
    if (dataset) {
      const query = queryString.getQuery();
      queryString.setQuery({ ...query, dataset });
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
