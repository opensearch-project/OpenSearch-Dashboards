/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
  setSelectedDataset: (dataset: Dataset) => void;
  services: IDataPluginServices;
}

export const DatasetSelector = ({
  selectedDataset,
  setSelectedDataset,
  services,
}: DatasetSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const { overlays, savedObjects } = services;

  const datasetService = getQueryService().queryString.getDatasetService();

  const datasetIcon =
    datasetService.getType(selectedDataset?.type || '')?.meta.icon.type || 'database';

  const fetchDatasets = useCallback(async () => {
    const typeConfig = datasetService.getType(DEFAULT_DATA.SET_TYPES.INDEX_PATTERN);
    if (!typeConfig) return;

    const fetchedIndexPatternDataStructures = await typeConfig.fetch(savedObjects.client, []);

    const fetchedDatasets =
      fetchedIndexPatternDataStructures.children?.map((pattern) =>
        typeConfig.toDataset([pattern])
      ) ?? [];
    setDatasets(fetchedDatasets);

    // If no dataset is selected, select the first one
    if (!selectedDataset && fetchedDatasets.length > 0) {
      setSelectedDataset(fetchedDatasets[0]);
    }
  }, [datasetService, savedObjects.client, selectedDataset, setSelectedDataset]);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const togglePopover = useCallback(async () => {
    if (!isOpen) {
      await fetchDatasets();
    }
    setIsOpen(!isOpen);
  }, [isOpen, fetchDatasets]);

  const closePopover = useCallback(() => setIsOpen(false), []);

  const options = useMemo(() => {
    const newOptions: EuiSelectableOption[] = [
      {
        label: 'Index patterns',
        isGroupLabel: true,
      },
    ];

    datasets.forEach(({ id, title, type, dataSource }) => {
      const label = dataSource ? `${dataSource.title}::${title}` : title;
      newOptions.push({
        label,
        checked: id === selectedDataset?.id ? 'on' : undefined,
        key: id,
        prepend: <EuiIcon type={datasetService.getType(type)!.meta.icon.type} />,
      });
    });

    return newOptions;
  }, [datasets, selectedDataset?.id, datasetService]);

  const handleOptionChange = useCallback(
    (newOptions: EuiSelectableOption[]) => {
      const selectedOption = newOptions.find((option) => option.checked === 'on');
      if (selectedOption) {
        const foundDataset = datasets.find((dataset) => dataset.id === selectedOption.key);
        if (foundDataset) {
          closePopover();
          setSelectedDataset(foundDataset);
        }
      }
    },
    [datasets, setSelectedDataset, closePopover]
  );

  const datasetTitle = useMemo(() => {
    if (!selectedDataset) {
      return 'Select data';
    }

    if (selectedDataset.dataSource) {
      return `${selectedDataset.dataSource.title}::${selectedDataset.title}`;
    }

    return selectedDataset.title;
  }, [selectedDataset]);

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
            {datasetTitle}
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
                    if (dataset) {
                      setSelectedDataset(dataset);
                    }
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
        singleSelection="always"
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
