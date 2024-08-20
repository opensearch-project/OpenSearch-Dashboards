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
import { Dataset } from '../../../common/data_sets';
import { IDataPluginServices } from '../../types';
import { AdvancedSelector } from './advanced_selector';
import { mockDatasetManager } from './__mocks__/utils';

interface DataSetSelectorProps {
  selectedDataSet?: Dataset;
  setSelectedDataSet: (dataset?: Dataset) => void;
  services: IDataPluginServices;
}

export const DatasetSelector = ({
  selectedDataSet,
  setSelectedDataSet,
  services,
}: DataSetSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const togglePopover = () => setIsOpen(!isOpen);
  const closePopover = () => setIsOpen(false);
  const [cachedDatasets, setCachedDatasets] = useState<Dataset[]>([]);
  const {
    overlays,
    data: { indexPatterns },
  } = services;

  // Load the index patterns cache
  useEffect(() => {
    const init = async () => {
      const cachedIndexPatterns = await indexPatterns.getIdsWithTitle();
      setCachedDatasets(
        cachedIndexPatterns.map((indexPattern) => ({
          id: indexPattern.id,
          title: indexPattern.title,
          type: 'index-pattern',
        }))
      );
    };

    init();
  }, [indexPatterns]);
  const recents = mockDatasetManager.getRecentlyUsed();
  const datasetIcon = selectedDataSet
    ? mockDatasetManager.getType(selectedDataSet.type).config.icon.type
    : 'database';

  // Memoize the options
  const options = useMemo(() => {
    const newOptions: EuiSelectableOption[] = [];

    if (recents.length > 0) {
      // Add recently used datasets
      newOptions.push({
        label: 'Recently used',
        isGroupLabel: true,
      });

      recents
        .slice(0, 3) // Only show 3 recent datasets
        .forEach((dataset) => {
          newOptions.push({
            label: dataset.title,
            checked: dataset.id === selectedDataSet?.id ? 'on' : undefined,
            key: dataset.id,
            prepend: <EuiIcon type={mockDatasetManager.getType(dataset.type).config.icon.type} />,
          });
        });
    }

    // Add index pattern datasets
    newOptions.push({
      label: 'Index patterns',
      isGroupLabel: true,
    });

    cachedDatasets.forEach(({ id, title, type }) => {
      newOptions.push({
        label: title,
        checked: id === selectedDataSet?.id ? 'on' : undefined,
        key: id,
        prepend: <EuiIcon type={mockDatasetManager.getType(type).config.icon.type} />,
      });
    });

    return newOptions;
  }, [cachedDatasets, recents, selectedDataSet?.id]);

  // Handle option change
  const handleOptionChange = (newOptions: EuiSelectableOption[]) => {
    const selectedOption = newOptions.find((option) => option.checked === 'on');

    if (!selectedOption) {
      setSelectedDataSet(undefined);
      return;
    }

    const foundDataset =
      recents.find((dataset) => dataset.id === selectedOption.key) ||
      cachedDatasets.find((dataset) => dataset.id === selectedOption.key);

    closePopover();
    setSelectedDataSet(foundDataset || undefined);
  };

  return (
    <EuiPopover
      button={
        <EuiToolTip content={`${selectedDataSet?.title ?? 'Select data'}`}>
          <EuiButtonEmpty
            className="datasetSelector__button"
            iconType="arrowDown"
            iconSide="right"
            onClick={togglePopover}
          >
            <EuiIcon type={datasetIcon} className="dataSetNavigator__icon" />
            {selectedDataSet?.title ?? 'Select data'}
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
                  onSelect={(dataset?: Dataset) => {
                    overlay?.close();
                    setSelectedDataSet(dataset);
                  }}
                  onCancel={() => overlay?.close()}
                />
              )
            );
          }}
        >
          <FormattedMessage
            id="data.datasetSelector.advancedButton"
            defaultMessage="Open Advanced data selector for more data types"
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
