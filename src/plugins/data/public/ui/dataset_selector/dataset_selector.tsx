/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiIcon,
  EuiPopover,
  EuiPopoverFooter,
  EuiSelectable,
  EuiSelectableOption,
  EuiSmallButtonEmpty,
  EuiToolTip,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toMountPoint } from '../../../../opensearch_dashboards_react/public';
import { Dataset, DEFAULT_DATA } from '../../../common';
import { IDataPluginServices } from '../../types';
import { AdvancedSelector } from './advanced_selector';
import { getQueryService } from '../../services';
import { DatasetServiceContract } from '../../query';

interface DatasetSelectorProps {
  selectedDataset?: Dataset;
  setSelectedDataset: (dataset: Dataset) => void;
  services: IDataPluginServices;
}

/**
 * This component provides a dropdown selector for datasets and an advanced selector modal.
 * It fetches datasets once on mount to populate the selector options.
 *
 * @remarks
 * The component uses several optimizations to prevent unnecessary re-renders:
 * 1. It uses `useRef` and `useEffect` to ensure datasets are fetched only once on mount.
 * 2. It uses `useMemo` and `useCallback` to memoize computed values and functions.
 * 3. It intentionally omits some dependencies from the `useEffect` dependency array to prevent re-fetching.
 */
export const DatasetSelector = ({
  selectedDataset,
  setSelectedDataset,
  services,
}: DatasetSelectorProps) => {
  const isMounted = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [datasets, setDatasets] = useState<Array<{ dataset: Dataset; recent: boolean }>>([]);
  const { overlays } = services;
  const datasetService = getQueryService().queryString.getDatasetService();
  const datasetIcon =
    datasetService.getType(selectedDataset?.type || '')?.meta.icon.type || 'database';

  useEffect(() => {
    isMounted.current = true;
    const fetchDatasets = async () => {
      if (!isMounted.current) return;

      const typeConfig = datasetService.getType(DEFAULT_DATA.SET_TYPES.INDEX_PATTERN);
      if (!typeConfig) return;

      const recentDatasets = datasetService.getRecentDatasets();

      const fetchedIndexPatternDataStructures = await typeConfig.fetch(services, []);
      const fetchedDatasets =
        fetchedIndexPatternDataStructures.children?.map((pattern) =>
          typeConfig.toDataset([pattern])
        ) ?? [];
      const filteredFetchedDatasets = fetchedDatasets.filter(
        (dataset) => !recentDatasets.some((ds) => ds.id === dataset.id)
      );
      const allDatasets = [
        ...recentDatasets.map((ds) => ({ dataset: ds, recent: true })),
        ...filteredFetchedDatasets.map((ds) => ({ dataset: ds, recent: false }))
      ]
      setDatasets(allDatasets);

      // If no dataset is selected, select the first one
      if (!selectedDataset && allDatasets.length > 0) {
        setSelectedDataset(allDatasets[0].dataset);
      }
    };

    fetchDatasets();

    return () => {
      isMounted.current = false;
    };
    // NOTE: Intentionally omitting dependencies which can cause unnecessary re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetService]);

  const togglePopover = useCallback(async () => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const closePopover = useCallback(() => setIsOpen(false), []);

  const options = useMemo(() => {
    const buildDatasetOptions = (
      groupLabel: string,
      ds: Dataset[],
      selectedDatasetId: string | undefined,
      dsService: DatasetServiceContract
    ): EuiSelectableOption[] => {
      const datasetOptions: EuiSelectableOption[] = [
        {
          label: groupLabel,
          isGroupLabel: true,
        },
      ];
      ds.forEach(({ id, title, type, dataSource }) => {
        const label = dataSource ? `${dataSource.title}::${title}` : title;
        datasetOptions.push({
          label,
          checked: id === selectedDatasetId ? 'on' : undefined,
          key: id,
          prepend: <EuiIcon type={datasetService.getType(type)!.meta.icon.type} />,
        });
      });
      return datasetOptions;
    };

    const recentDatasetOptions = buildDatasetOptions(
      'Recently selected data',
      datasets.filter((ds) => ds.recent).map((ds) => ds.dataset),
      selectedDataset?.id,
      datasetService
    );
    const indexPatternOptions = buildDatasetOptions(
      'Index patterns',
      datasets.filter((ds) => !ds.recent).map((ds) => ds.dataset),
      selectedDataset?.id,
      datasetService
    );
    return [...recentDatasetOptions, ...indexPatternOptions];
  }, [datasets, selectedDataset?.id, datasetService]);

  const handleOptionChange = useCallback(
    (newOptions: EuiSelectableOption[]) => {
      const selectedOption = newOptions.find((option) => option.checked === 'on');
      if (selectedOption) {
        const recentDatasets = datasets.filter((ds) => ds.recent).map((ds) => ds.dataset);
        const indexPatterns = datasets.filter((ds) => !ds.recent).map((ds) => ds.dataset);
        const foundDataset = [...recentDatasets, ...indexPatterns].find(
          (dataset) => dataset.id === selectedOption.key
        );
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
          <EuiSmallButtonEmpty
            className="datasetSelector__button"
            iconType="arrowDown"
            iconSide="right"
            onClick={togglePopover}
          >
            <EuiIcon type={datasetIcon} className="datasetSelector__icon" />
            {datasetTitle}
          </EuiSmallButtonEmpty>
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
                  onSelect={(dataset?: Dataset) => {
                    overlay?.close();
                    if (dataset) {
                      setSelectedDataset(dataset);
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
