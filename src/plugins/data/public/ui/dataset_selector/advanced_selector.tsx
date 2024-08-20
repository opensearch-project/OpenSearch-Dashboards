/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { mockDatasetManager } from './__mocks__/utils';
import { DATA_STRUCTURE_META_TYPES, Dataset, DatasetPathItem } from '../../../common/data_sets';
import { DatasetExplorer } from './dataset_explorer';
import { Configurator } from './configurator';

export const AdvancedSelector = ({
  onSelect,
  onCancel,
}: {
  onSelect: (dataset: Dataset) => void;
  onCancel: () => void;
}) => {
  const datasetTypes = mockDatasetManager.getTypes();
  const [path, setPath] = useState<DatasetPathItem[]>([
    {
      id: 'root',
      title: 'Root',
      type: 'root',
      children: datasetTypes.map((type) => ({
        id: type.id,
        title: type.title,
        type: type.id,
        meta: {
          type: DATA_STRUCTURE_META_TYPES.TYPE,
          icon: type.config.icon,
          tooltip: `Languages available: ${type.config.supportedLanguages.join(', ')}`,
        },
      })),
      isLoadable: true,
      columnHeader: 'Available data types',
    },
  ]);
  const [selectedDataSet, setSelectedDataSet] = useState<Dataset | undefined>();

  return selectedDataSet ? (
    <Configurator
      dataset={selectedDataSet}
      path={path}
      onConfirm={onSelect}
      onCancel={onCancel}
      onPrevious={() => setSelectedDataSet(undefined)}
    />
  ) : (
    <DatasetExplorer
      onNext={(dataset) => setSelectedDataSet(dataset)}
      setPath={setPath}
      path={path}
      onCancel={onCancel}
    />
  );
};
