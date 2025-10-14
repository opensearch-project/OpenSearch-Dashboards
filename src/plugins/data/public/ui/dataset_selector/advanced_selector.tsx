/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BaseDataset,
  DATA_STRUCTURE_META_TYPES,
  DataStructure,
  DEFAULT_DATA,
  Query,
} from '../../../common';
import { getQueryService } from '../../services';
import { IDataPluginServices } from '../../types';
import { Configurator } from './configurator/configurator';
import { ConfiguratorV2 } from './configurator/configurator_v2';
import { DatasetExplorer } from './dataset_explorer';

export const AdvancedSelector = ({
  services,
  onSelect,
  onCancel,
  supportedTypes,
  useConfiguratorV2,
  alwaysShowDatasetFields,
  signalType,
}: {
  services: IDataPluginServices;
  onSelect: (query: Partial<Query>, saveDataset?: boolean) => void;
  onCancel: () => void;
  supportedTypes?: string[];
  useConfiguratorV2?: boolean;
  alwaysShowDatasetFields?: boolean;
  signalType?: string;
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
        .filter(
          (type) =>
            (!supportedTypes?.length || supportedTypes.includes(type.id)) &&
            (type.meta.supportedAppNames === undefined ||
              type.meta.supportedAppNames.includes(services.appName))
        )
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

  const ConfiguratorComponent = useConfiguratorV2 ? ConfiguratorV2 : Configurator;

  return selectedDataset ? (
    <ConfiguratorComponent
      services={services}
      baseDataset={selectedDataset}
      onConfirm={onSelect}
      onCancel={onCancel}
      onPrevious={() => setSelectedDataset(undefined)}
      alwaysShowDatasetFields={alwaysShowDatasetFields}
      signalType={signalType}
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
