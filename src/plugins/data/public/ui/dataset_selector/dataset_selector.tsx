/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiIcon,
  EuiPopover,
  EuiPopoverFooter,
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
  selectedDatasets: Dataset[];
  setSelectedDatasets: (datasets: Dataset[]) => void;
  services: IDataPluginServices;
}

export const DatasetSelector = ({
  selectedDatasets,
  setSelectedDatasets,
  services,
}: DatasetSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const { overlays } = services;

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const datasetService = getQueryService().queryString.getDatasetService();

  const datasetIcon =
    datasetService.getType(selectedDatasets[0]?.type || '')?.meta.icon.type || 'database';

  const fetchDatasets = useCallback(async () => {
    const typeConfig = datasetService.getType(DEFAULT_DATA.SET_TYPES.INDEX_PATTERN);
    if (!typeConfig) return;

    const fetchedIndexPatternDataStructures = await typeConfig.fetch(services, []);

    if (!isMounted.current) return;

    const fetchedDatasets =
      fetchedIndexPatternDataStructures.children?.map((pattern) =>
        typeConfig.toDataset([pattern])
      ) ?? [];
    setDatasets(fetchedDatasets);

    // If no datasets are selected, select the first one
    if (selectedDatasets.length === 0 && fetchedDatasets.length > 0) {
      setSelectedDatasets([fetchedDatasets[0]]);
    }
  }, [datasetService, selectedDatasets, services, setSelectedDatasets]);

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
        checked: selectedDatasets.some((dataset) => dataset.id === id) ? 'on' : undefined,
        key: id,
        prepend: <EuiIcon type={datasetService.getType(type)!.meta.icon.type} />,
      });
    });

    return newOptions;
  }, [datasets, selectedDatasets, datasetService]);

  const handleOptionChange = useCallback(
    (newOptions: EuiSelectableOption[]) => {
      const selectedOptions = newOptions.filter((option) => option.checked === 'on');
      const newSelectedDatasets = selectedOptions.map(
        (option) => datasets.find((dataset) => dataset.id === option.key)!
      );
      setSelectedDatasets(newSelectedDatasets);
    },
    [datasets, setSelectedDatasets]
  );

  const datasetTitle = useMemo(() => {
    if (selectedDatasets.length === 0) {
      return 'Select data';
    }

    if (selectedDatasets.length === 1) {
      const dataset = selectedDatasets[0];
      return dataset.dataSource ? `${dataset.dataSource.title}::${dataset.title}` : dataset.title;
    }

    return `${selectedDatasets.length} datasets selected`;
  }, [selectedDatasets]);

  return (
    <EuiPopover
      button={
        <EuiToolTip content={datasetTitle}>
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
      <EuiPopoverFooter paddingSize="none" className="datasetSelector__footer">
        <EuiButton
          className="datasetSelector__advancedButton"
          iconType="gear"
          iconSide="right"
          iconSize="s"
          size="s"
          isSelected={false}
          onClick={() => {
            closePopover();
            const overlay = overlays?.openModal(
              toMountPoint(
                <AdvancedSelector
                  services={services}
                  onSelect={(ds?: Dataset[]) => {
                    overlay?.close();
                    if (ds) {
                      setSelectedDatasets(ds);
                    }
                  }}
                  onCancel={() => overlay?.close()}
                />
              ),
              {
                maxWidth: false,
                className: 'datasetSelector__advancedModal',
              }
            );
          }}
        >
          <FormattedMessage
            id="data.datasetSelector.advancedButton"
            defaultMessage="View all available data"
          />
        </EuiButton>
      </EuiPopoverFooter>
    </EuiPopover>
  );
};
