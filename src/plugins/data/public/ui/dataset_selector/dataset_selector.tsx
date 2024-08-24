/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  EuiButtonEmpty,
  EuiIcon,
  EuiPopover,
  EuiPopoverTitle,
  EuiSelectable,
  EuiSelectableOption,
  EuiToolTip,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { toMountPoint } from '../../../../opensearch_dashboards_react/public';
import { Dataset, DEFAULT_DATA } from '../../../common';
import { IDataPluginServices } from '../../types';
import { AdvancedSelector } from './advanced_selector';
import { getQueryService } from '../../services';

interface DatasetSelectorProps {
  selectedDataset?: Dataset;
  setSelectedDataset: (dataset?: Dataset) => void;
  services: IDataPluginServices;
}

export const DatasetSelector = ({
  selectedDataset,
  setSelectedDataset,
  services,
}: DatasetSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const togglePopover = () => setIsOpen(!isOpen);
  const closePopover = () => setIsOpen(false);
  const { overlays, savedObjects } = services;

  const queryService = getQueryService();
  const datasetManager = queryService.queryString.getDatasetManager();

  const datasetIcon = selectedDataset
    ? datasetManager.getCachedDataStructure(selectedDataset.id)?.meta?.icon || 'database'
    : 'database';

  useEffect(() => {
    const init = async () => {
      // setDatasets(
      //   (
      //     await datasetManager
      //       .getDatasetHandlerById(DEFAULT_DATA.SET_TYPES.INDEX_PATTERN)
      //       ?.fetch(savedObjects.client, [DEFAULT_DATA.STRUCTURES.NULL])!
      //   ).children
      // );
    };

    init();
  }, [datasetManager, savedObjects.client]);

  const options = useMemo(() => {
    const newOptions: EuiSelectableOption[] = [];
    // Add index pattern datasets
    newOptions.push({
      label: 'Index patterns',
      isGroupLabel: true,
    });

    datasets.forEach(({ id, title, type }) => {
      newOptions.push({
        label: title,
        checked: id === selectedDataset?.id ? 'on' : undefined,
        key: id,
        prepend: <EuiIcon type={datasetManager.getDatasetHandlerById(type)!.meta.icon.type} />,
      });
    });

    return newOptions;
  }, [datasetManager, datasets, selectedDataset?.id]);

  // Handle option change
  const handleOptionChange = (newOptions: EuiSelectableOption[]) => {
    const selectedOption = newOptions.find((option) => option.checked === 'on');

    if (!selectedOption) {
      setSelectedDataset(undefined);
      return;
    }

    const foundDataset = datasets.find((dataset) => dataset.id === selectedOption.key);

    closePopover();
    setSelectedDataset(foundDataset || undefined);
  };

  return (
    <EuiPopover
      button={
        <EuiToolTip content={`${selectedDataset?.title ?? 'Select data'}`}>
          <EuiButtonEmpty
            className="datasetSelector__button"
            iconType="arrowDown"
            iconSide="right"
            onClick={togglePopover}
          >
            <EuiIcon type={datasetIcon} className="dataSetNavigator__icon" />
            {selectedDataset?.title ?? 'Select data'}
          </EuiButtonEmpty>
        </EuiToolTip>
      }
      isOpen={isOpen}
      closePopover={closePopover}
      anchorPosition="downLeft"
      display="block"
      panelPaddingSize="none"
    >
      <EuiPopoverTitle paddingSize="s">
        <EuiButtonEmpty
          className="datasetSelector__advancedButton"
          iconType="gear"
          iconSide="right"
          iconSize="s"
          size="xs"
          isSelected={false}
          onClick={() => {
            closePopover();
            const overlay = overlays?.openModal(
              toMountPoint(
                <AdvancedSelector
                  savedObjects={savedObjects.client}
                  onSelect={(dataset?: Dataset) => {
                    overlay?.close();
                    setSelectedDataset(dataset);
                  }}
                  onCancel={() => overlay?.close()}
                />
              )
            );
          }}
        >
          <FormattedMessage
            id="data.datasetSelector.advancedButton"
            defaultMessage="View all available data"
          />
        </EuiButtonEmpty>
      </EuiPopoverTitle>
      <EuiSelectable
        className="datasetSelector__selectable"
        options={options}
        singleSelection={true}
        searchable={true}
        onChange={handleOptionChange}
        listProps={{
          showIcons: false,
        }}
        searchProps={{
          compressed: true,
        }}
      >
        {(list, search) => (
          <>
            {search}
            {list}
          </>
        )}
      </EuiSelectable>
    </EuiPopover>
  );
};
