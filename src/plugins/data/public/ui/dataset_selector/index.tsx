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
  const datasetManager = services.data.query.queryString.getDatasetManager();

  useEffect(() => {
    const initialDataset = datasetManager.getDataset() || datasetManager.getDefaultDataset();
    setSelectedDataset(initialDataset);

    const subscription = datasetManager.getUpdates$().subscribe((updatedDataset) => {
      setSelectedDataset(updatedDataset);
    });

    return () => subscription.unsubscribe();
  }, [datasetManager]);

  const handleDatasetChange = (dataset?: Dataset) => {
    setSelectedDataset(dataset);
    if (dataset) {
      datasetManager.setDataset(dataset);
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
