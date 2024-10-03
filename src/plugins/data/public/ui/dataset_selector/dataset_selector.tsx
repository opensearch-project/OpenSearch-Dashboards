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
import { getQueryService } from '../../services';
import { IDataPluginServices } from '../../types';
import { AdvancedSelector } from './advanced_selector';

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
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [indexPatterns, setIndexPatterns] = useState<Dataset[]>([]);
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

      const fetchedIndexPatternDataStructures = await typeConfig.fetch(services, []);

      const fetchedDatasets =
        fetchedIndexPatternDataStructures.children?.map((pattern) =>
          typeConfig.toDataset([pattern])
        ) ?? [];
      setIndexPatterns(fetchedDatasets);

      // If no dataset is selected, select the first one
      if (!selectedDataset && fetchedDatasets.length > 0) {
        setSelectedDataset(fetchedDatasets[0]);
      }
    };

    fetchDatasets();

    return () => {
      isMounted.current = false;
    };
    // NOTE: Intentionally omitting dependencies which can cause unnecessary re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetService]);

  useEffect(() => {
    const recentDatasets = datasetService.getRecentDatasets();
    setDatasets([...recentDatasets, ...indexPatterns]);
  }, [isOpen, datasetService, indexPatterns]);

  const togglePopover = useCallback(async () => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const closePopover = useCallback(() => setIsOpen(false), []);

  const options = useMemo(() => {
    const buildDatasetOptions = (
      groupLabel: string,
      ds: Dataset[],
      selectedDatasetId: string | undefined
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
      return datasetOptions.length > 1 ? datasetOptions : [];
    };
    const recentDatasetOptions = buildDatasetOptions(
      'Recently selected data',
      datasetService.getRecentDatasets(),
      selectedDataset?.id
    );
    const indexPatternOptions = buildDatasetOptions(
      'Index patterns',
      indexPatterns.filter((indexPattern) => !datasetService.getRecentDataset(indexPattern.id)),
      selectedDataset?.id
    );

    return [...recentDatasetOptions, ...indexPatternOptions];
  }, [indexPatterns, selectedDataset?.id, datasetService]);

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
