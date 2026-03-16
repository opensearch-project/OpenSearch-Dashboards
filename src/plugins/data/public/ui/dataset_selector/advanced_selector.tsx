/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

/**
 * AdvancedSelector component for dataset selection and configuration.
 *
 * This component provides a two-step interface:
 * 1. DatasetExplorer - Browse and select datasets
 * 2. ConfiguratorV2 - Configure the selected dataset (language, time field, schema mappings, etc.)
 *
 * Usage with modals:
 * When rendering this component inside a modal, apply the className 'datasetSelector__advancedModal'
 * to the modal container for consistent sizing (1200px × 800px) and layout.
 *
 * Example:
 * ```tsx
 * overlays.openModal(
 *   toMountPoint(<AdvancedSelector {...props} />),
 *   { maxWidth: false, className: 'datasetSelector__advancedModal' }
 * );
 * ```
 */
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
  showNonTimeFieldDatasets,
}: {
  services: IDataPluginServices;
  onSelect: (query: Partial<Query>, saveDataset?: boolean) => void;
  onCancel: () => void;
  supportedTypes?: string[];
  useConfiguratorV2?: boolean;
  alwaysShowDatasetFields?: boolean;
  signalType?: string;
  showNonTimeFieldDatasets?: boolean;
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
              type.meta.supportedAppNames.includes(services.appName)) &&
            (!useConfiguratorV2 || type.id !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN)
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

  const ConfiguratorComponent =
    useConfiguratorV2 && selectedDataset?.type === DEFAULT_DATA.SET_TYPES.INDEX
      ? ConfiguratorV2
      : Configurator;

  return selectedDataset ? (
    <ConfiguratorComponent
      services={services}
      baseDataset={selectedDataset}
      onConfirm={onSelect}
      onCancel={onCancel}
      onPrevious={() => setSelectedDataset(undefined)}
      alwaysShowDatasetFields={alwaysShowDatasetFields}
      signalType={signalType}
      showNonTimeFieldDatasets={showNonTimeFieldDatasets}
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
