/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { Dataset } from '../../../common/datasets';
import { DatasetExplorer } from './dataset_explorer';
import { Configurator } from './configurator';
import { getIndexPatterns, getQueryService } from '../../services';

export const AdvancedSelector = ({
  savedObjects,
  onSelect,
  onCancel,
}: {
  savedObjects: SavedObjectsClientContract;
  onSelect: (dataset: Dataset) => void;
  onCancel: () => void;
}) => {
  const indexPatternsService = getIndexPatterns();
  const queryService = getQueryService();
  const datasetManager = queryService.queryString.getDatasetManager();
  const [selectedDataSet, setSelectedDataSet] = useState<Dataset | undefined>();

  return selectedDataSet ? (
    <Configurator
      indexPatternsService={indexPatternsService}
      dataset={selectedDataSet}
      onConfirm={onSelect}
      onCancel={onCancel}
      onPrevious={() => setSelectedDataSet(undefined)}
    />
  ) : (
    <DatasetExplorer
      savedObjects={savedObjects}
      datasetManager={datasetManager}
      onNext={(dataset) => setSelectedDataSet(dataset)}
      onCancel={onCancel}
    />
  );
};
