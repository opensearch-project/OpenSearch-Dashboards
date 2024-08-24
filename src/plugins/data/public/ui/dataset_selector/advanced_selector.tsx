/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import {
  BaseDataset,
  DATA_STRUCTURE_META_TYPES,
  Dataset,
  DataStructure,
  DEFAULT_DATA,
} from '../../../common';
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

  const [path, setPath] = useState<DataStructure[]>([
    {
      ...DEFAULT_DATA.STRUCTURES.ROOT,
      columnHeader: 'Select Data',
      isLeaf: false,
      children: datasetManager.getDatasetHandlers().map(
        (handler) =>
          ({
            id: handler.id,
            title: handler.title,
            type: handler.id,
            meta: {
              ...handler.meta,
              type: DATA_STRUCTURE_META_TYPES.TYPE,
            },
          } as DataStructure)
      ),
    },
  ]);
  const [selectedDataset, setSelectedDataset] = useState<BaseDataset | undefined>();

  return selectedDataset ? (
    <Configurator
      baseDataset={selectedDataset}
      onConfirm={onSelect}
      onCancel={onCancel}
      onPrevious={() => setSelectedDataset(undefined)}
    />
  ) : (
    <DatasetExplorer
      savedObjects={savedObjects}
      datasetManager={datasetManager}
      path={path}
      setPath={setPath}
      onNext={(dataset) => setSelectedDataset(dataset)}
      onCancel={onCancel}
    />
  );
};
