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
  EuiSmallButton,
  EuiToolTip,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { toMountPoint } from '../../../../opensearch_dashboards_react/public';
import { Dataset, DEFAULT_DATA, Query } from '../../../common';
import { getQueryService } from '../../services';
import { IDataPluginServices } from '../../types';
import { AdvancedSelector } from './advanced_selector';

export enum DatasetSelectorAppearance {
  Button = 'button',
  None = 'none',
}

type EuiSmallButtonProps = React.ComponentProps<typeof EuiSmallButton>;
type EuiSmallButtonEmptyProps = React.ComponentProps<typeof EuiSmallButtonEmpty>;

interface DatasetSelectorProps {
  selectedDataset?: Dataset;
  onSelect: (partialQuery: Partial<Query>) => void;
  services: IDataPluginServices;
}

export interface DatasetSelectorUsingButtonProps {
  appearance: DatasetSelectorAppearance.Button;
  buttonProps?: EuiSmallButtonProps;
}

export interface DatasetSelectorUsingButtonEmptyProps {
  appearance?: DatasetSelectorAppearance.None;
  buttonProps?: EuiSmallButtonEmptyProps;
}

const RootComponent: React.FC<
  (EuiSmallButtonEmptyProps | EuiSmallButtonProps) & { appearance?: DatasetSelectorAppearance }
> = (props) => {
  const { appearance, ...rest } = props;
  if (appearance === DatasetSelectorAppearance.Button) {
    return <EuiSmallButton {...(rest as EuiSmallButtonProps)} />;
  } else {
    return <EuiSmallButtonEmpty {...(rest as EuiSmallButtonEmptyProps)} />;
  }
};

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
  onSelect,
  services,
  appearance,
  buttonProps,
}: DatasetSelectorProps &
  (DatasetSelectorUsingButtonProps | DatasetSelectorUsingButtonEmptyProps)) => {
  const isMounted = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [indexPatterns, setIndexPatterns] = useState<Dataset[]>([]);
  const { overlays } = services;
  const datasetService = getQueryService().queryString.getDatasetService();
  const datasetIcon =
    datasetService.getType(selectedDataset?.sourceDatasetRef?.type || selectedDataset?.type || '')
      ?.meta.icon.type || 'database';

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
        onSelect({ dataset: fetchedDatasets[0] });
      }
    };

    fetchDatasets();

    return () => {
      isMounted.current = false;
    };
    // NOTE: Intentionally omitting dependencies which can cause unnecessary re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetService]);

  const recentDatasets = useMemo(() => {
    return datasetService.getRecentDatasets();
    // NOTE: Intentionally adding dependencies to ensure that we have the latest recentDatasets
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, datasetService]);

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
          'data-test-subj': `datasetOption-${id}`,
        });
      });
      return datasetOptions.length > 1 ? datasetOptions : [];
    };
    const recentDatasetOptions = buildDatasetOptions(
      i18n.translate('data.dataSelector.recentDatasetsGroupLabel', {
        defaultMessage: 'Recently selected data',
      }),
      recentDatasets,
      selectedDataset?.id
    );
    const indexPatternOptions = buildDatasetOptions(
      i18n.translate('data.dataSelector.indexPatternsGroupLabel', {
        defaultMessage: 'Index patterns',
      }),
      indexPatterns.filter(
        (dataset) => !recentDatasets.some((recentDataset) => recentDataset.id === dataset.id)
      ),
      selectedDataset?.id
    );

    return [...recentDatasetOptions, ...indexPatternOptions];
  }, [indexPatterns, selectedDataset?.id, datasetService, recentDatasets]);

  const handleOptionChange = useCallback(
    (newOptions: EuiSelectableOption[]) => {
      const selectedOption = newOptions.find((option) => option.checked === 'on');
      if (selectedOption) {
        const foundDataset =
          recentDatasets.find((dataset) => dataset.id === selectedOption.key) ||
          indexPatterns.find((dataset) => dataset.id === selectedOption.key);
        if (foundDataset) {
          closePopover();
          onSelect({ dataset: foundDataset });
        }
      }
    },
    [recentDatasets, indexPatterns, onSelect, closePopover]
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
        <EuiToolTip
          display="block"
          content={`${
            selectedDataset?.title ??
            i18n.translate('data.dataSelector.defaultTitle', {
              defaultMessage: 'Select data',
            })
          }`}
        >
          <RootComponent
            appearance={appearance}
            {...buttonProps}
            className="datasetSelector__button"
            data-test-subj="datasetSelectorButton"
            iconType="arrowDown"
            iconSide="right"
            onClick={togglePopover}
          >
            <EuiIcon
              type={datasetIcon}
              className="datasetSelector__icon"
              data-test-subj="datasetSelectorIcon"
            />
            {datasetTitle}
          </RootComponent>
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
        data-test-subj="datasetSelectorSelectable"
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
      <EuiPopoverFooter
        paddingSize="none"
        className="datasetSelector__footer"
        data-test-subj="datasetSelectorFooter"
      >
        <EuiButton
          className="datasetSelector__advancedButton"
          data-test-subj="datasetSelectorAdvancedButton"
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
                  onSelect={(query: Partial<Query>) => {
                    overlay?.close();
                    if (query) {
                      onSelect(query);
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
