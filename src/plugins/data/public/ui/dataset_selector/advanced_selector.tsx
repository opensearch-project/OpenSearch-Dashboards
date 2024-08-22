/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { Dataset, DataStructure } from '../../../common/datasets';
import { DatasetExplorer } from './dataset_explorer';
import { Configurator } from './configurator';
import { getQueryService } from '../../services';

export const AdvancedSelector = ({
  savedObjects,
  onSelect,
  onCancel,
}: {
  savedObjects: SavedObjectsClientContract;
  onSelect: (dataset: Dataset) => void;
  onCancel: () => void;
}) => {
  const queryService = getQueryService();
  const datasetManager = queryService.queryString.getDatasetManager();
  const [currentDataStructure, setCurrentDataStructure] = useState<DataStructure | undefined>();

  return currentDataStructure ? (
    <Configurator
      savedObjects={savedObjects}
      currentDataStructure={currentDataStructure}
      onConfirm={onSelect}
      onCancel={onCancel}
      onPrevious={() => setCurrentDataStructure(undefined)}
    />
  ) : (
    <DatasetExplorer
      savedObjects={savedObjects}
      datasetManager={datasetManager}
      onNext={(dataStructure) => setCurrentDataStructure(dataStructure)}
      onCancel={onCancel}
    />
  );
};
