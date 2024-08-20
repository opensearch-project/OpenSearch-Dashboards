/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import React from 'react';
import { Dataset } from '../../../common/data_sets';
import { DatasetSelector } from './dataset_selector';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { IDataPluginServices } from '../../types';
import { mockDatasetManager } from './__mocks__/utils';

const ConnectedDatasetSelector = () => {
  const [selectedDataSet, setSelectedDataSet] = useState<Dataset | undefined>();
  const { services } = useOpenSearchDashboards<IDataPluginServices>();

  return (
    <DatasetSelector
      selectedDataSet={selectedDataSet}
      setSelectedDataSet={(dataset?: Dataset) => {
        setSelectedDataSet(dataset);

        // TODO: Only adding this here to test recents. Should be hooked up in the future
        if (dataset) {
          mockDatasetManager.setDataSet(dataset);
        }
      }}
      services={services}
    />
  );
};

export { ConnectedDatasetSelector as DatasetSelector };
