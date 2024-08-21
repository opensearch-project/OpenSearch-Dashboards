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
import { Dataset, DataStructure, DEFAULT_DATA } from '../../../common';
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
  const togglePopover = () => setIsOpen(!isOpen);
  const closePopover = () => setIsOpen(false);
  const [categories, setCategories] = useState<DataStructure[]>([]);
  const { overlays, savedObjects } = services;

  const queryService = getQueryService();
  const datasetManager = queryService.queryString.getDatasetManager();

  // Load the category data structures
  useEffect(() => {
    const loadCategories = async () => {
      const dataStructures = await datasetManager.fetchOptions(
        savedObjects.client,
        DEFAULT_DATA.STRUCTURES.ROOT
      );
      setCategories(dataStructures);
    };

    loadCategories();
  }, [datasetManager, savedObjects.client]);

  const datasetIcon = selectedDataset
    ? datasetManager.getCachedDataStructure(selectedDataset.id)?.meta?.icon || 'database'
    : 'database';

  // Memoize the options
  const options = useMemo(() => {
    const newOptions: EuiSelectableOption[] = [];

    categories.forEach((category) => {
      newOptions.push({
        label: category.title,
        isGroupLabel: true,
      });

      if (category.children) {
        category.children.forEach((child) => {
          newOptions.push({
            label: child.title,
            checked: child.id === selectedDataset?.id ? 'on' : undefined,
            key: child.id,
            prepend: <EuiIcon type={child.meta?.icon || 'database'} />,
          });
        });
      }
    });

    return newOptions;
  }, [categories, selectedDataset?.id]);

  // Handle option change
  const handleOptionChange = (newOptions: EuiSelectableOption[]) => {
    const selectedOption = newOptions.find((option) => option.checked === 'on');

    if (!selectedOption) {
      setSelectedDataset(undefined);
      return;
    }

    const selectedDataStructure = categories
      .flatMap((category) => category.children || [])
      .find((child) => child.id === selectedOption.key);

    if (selectedDataStructure) {
      const dataset = datasetManager.toDataset(selectedDataStructure);
      closePopover();
      setSelectedDataset(dataset);
    }
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
            <EuiIcon type={datasetIcon} className="datasetSelector__icon" />
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
            defaultMessage="View all available categories"
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
