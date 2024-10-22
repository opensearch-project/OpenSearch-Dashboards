/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
import { IDataPluginServices } from '../../types';

export const AdvancedSelector = ({
  services,
  onSelect,
  onCancel,
}: {
  services: IDataPluginServices;
  onSelect: (dataset: Dataset) => void;
  onCancel: () => void;
}) => {
  const queryString = getQueryService().queryString;

  const [path, setPath] = useState<DataStructure[]>([
    {
      ...DEFAULT_DATA.STRUCTURES.ROOT,
      columnHeader: 'Select data',
      hasNext: true,
      children: queryString
        .getDatasetService()
        .getTypes()
        .map((type) => {
          return {
            id: type.id,
            title: type.title,
            type: type.id,
            meta: {
              ...type.meta,
              type: DATA_STRUCTURE_META_TYPES.TYPE,
            },
          } as DataStructure;
        }),
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
      services={services}
      queryString={queryString}
      path={path}
      setPath={setPath}
      onNext={(dataset) => setSelectedDataset(dataset)}
      onCancel={onCancel}
    />
  );
};
