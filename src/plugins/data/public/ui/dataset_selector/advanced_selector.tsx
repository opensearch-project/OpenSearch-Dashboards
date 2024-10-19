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
import { IDataPluginServices } from '../../types';

export const AdvancedSelector = ({
  services,
  onSelect,
  onCancel,
  selectedDataset,
  setSelectedDataset,
  setIndexPattern,
  direct = false,
}: {
  services: IDataPluginServices;
  onSelect: (dataset: Dataset) => void;
  onCancel: () => void;
  selectedDataset?: Dataset;
  setSelectedDataset: (data: Dataset | undefined) => void;
  setIndexPattern: (id: string | undefined) => void;
  direct?: boolean;
}) => {
  const queryService = services.data.query;
  const queryString = queryService.queryString;

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

  const [currentSelectedDataset, setCurrentSelectedDataset] = useState<BaseDataset | undefined>(
    selectedDataset
  );

  return currentSelectedDataset ? (
    <Configurator
      baseDataset={currentSelectedDataset}
      onConfirm={onSelect}
      onCancel={onCancel}
      onPrevious={() => {
        setSelectedDataset(undefined);
        setCurrentSelectedDataset(undefined);
      }}
      queryService={queryService}
    />
  ) : (
    <DatasetExplorer
      services={services}
      queryString={queryString}
      path={path}
      setPath={setPath}
      onNext={(dataset) => {
        setSelectedDataset(dataset);
        setIndexPattern(dataset.id);
        setCurrentSelectedDataset(dataset);
        if (direct) {
          const query = queryString.getInitialQueryByDataset(dataset);
          queryString.setQuery(query);
          queryString.getDatasetService().addRecentDataset(dataset);
        }
      }}
      onCancel={onCancel}
    />
  );
};
