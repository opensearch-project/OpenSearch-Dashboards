/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiContextMenu,
  EuiDescriptionList,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPopover,
  EuiPopoverFooter,
  EuiSelectable,
  EuiSelectableOption,
  EuiToolTip,
  EuiBadge,
  EuiHighlight,
  EuiText,
  EuiPopoverTitle,
  EuiSplitPanel,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  useOpenSearchDashboards,
  toMountPoint,
} from '../../../../opensearch_dashboards_react/public';
import { Dataset, DEFAULT_DATA, Query } from '../../../common';
import { IDataPluginServices } from '../../types';
import { DatasetDetails, DatasetDetailsBody, DatasetDetailsHeader } from './dataset_details';
import { AdvancedSelector } from '../dataset_selector/advanced_selector';
import './_index.scss';

export interface DetailedDataset extends Dataset {
  description?: string;
  displayName?: string;
}

export interface DatasetSelectProps {
  onSelect: (dataset: Dataset) => void;
  appName: string;
  supportedTypes?: string[];
}

/**
 * @experimental This component is experimental and may change in future versions
 */
const DatasetSelect: React.FC<DatasetSelectProps> = ({ onSelect, appName, supportedTypes }) => {
  const { services } = useOpenSearchDashboards<IDataPluginServices>();
  const isMounted = useRef(true);
  const [isOpen, setIsOpen] = useState(false);
  const [datasets, setDatasets] = useState<DetailedDataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DetailedDataset | undefined>();
  const [defaultDatasetId, setDefaultDatasetId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const { data, overlays } = services;
  const {
    dataViews,
    query: { queryString },
  } = data;
  const datasetService = queryString.getDatasetService();

  const currentQuery = queryString.getQuery();
  const currentDataset = currentQuery.dataset;

  useEffect(() => {
    const updateSelectedDataset = async () => {
      if (!currentDataset) {
        setSelectedDataset(undefined);
        return;
      }

      const matchingDataset = datasets.find((d) => d.id === currentDataset.id);
      if (matchingDataset) {
        setSelectedDataset(matchingDataset);
        return;
      }

      const dataView = await dataViews.get(
        currentDataset.id,
        currentDataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
      );

      setSelectedDataset({
        ...currentDataset,
        description: dataView.description,
        displayName: dataView.displayName,
      } as DetailedDataset);
    };
    updateSelectedDataset();
  }, [currentDataset, dataViews, datasets]);

  const datasetTypeConfig = datasetService.getType(
    selectedDataset?.sourceDatasetRef?.type || selectedDataset?.type || ''
  );
  const datasetIcon = datasetTypeConfig?.meta?.icon?.type || 'database';

  useEffect(() => {
    isMounted.current = true;
    const fetchDatasets = async () => {
      if (!isMounted.current) return;

      setIsLoading(true);

      try {
        const datasetIds = await dataViews.getIds(true);
        const fetchedDatasets: DetailedDataset[] = [];

        for (const id of datasetIds) {
          const dataView = await dataViews.get(id);
          const dataset = await dataViews.convertToDataset(dataView);

          fetchedDatasets.push({
            ...dataset,
            description: dataView.description,
            displayName: dataView.displayName,
          });
        }

        const defaultDataView = await dataViews.getDefault();
        if (defaultDataView) {
          setDefaultDatasetId(defaultDataView.id);
        }

        setDatasets(fetchedDatasets);

        if (!currentDataset && defaultDataView) {
          const defaultDataset = await dataViews.convertToDataset(defaultDataView);
          onSelect(defaultDataset);
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    fetchDatasets();
    return () => {
      isMounted.current = false;
    };
  }, [datasetService, dataViews, currentDataset, onSelect]);

  const togglePopover = useCallback(() => setIsOpen(!isOpen), [isOpen]);

  const closePopover = useCallback(() => {
    setIsOpen(false);
  }, []);

  const options = useMemo(() => {
    return datasets.map((dataset) => {
      const { id, title, type, description, displayName } = dataset;
      const isSelected = id === selectedDataset?.id;
      const isDefault = id === defaultDatasetId;
      const typeConfig = datasetService.getType(type);
      const iconType = typeConfig?.meta?.icon?.type || 'database';
      const label = displayName || title;
      // Prepending the label to the searchable label to allow for better search, render will strip it out
      const searchableLabel = `${label}${typeConfig?.title || DEFAULT_DATA.STRUCTURES.ROOT.title}${
        description && description.trim() !== '' ? ` - ${description}` : ''
      }`.trim();

      return {
        label,
        searchableLabel: searchableLabel || title,
        key: id,
        checked: isSelected ? ('on' as const) : undefined,
        prepend: <EuiIcon size="s" type={iconType} />,
        'data-test-subj': `datasetSelectOption-${title}`,
        append: isDefault ? (
          <EuiBadge>
            {i18n.translate('data.datasetSelect.defaultLabel', {
              defaultMessage: 'Default',
            })}
          </EuiBadge>
        ) : undefined,
      };
    });
  }, [datasets, selectedDataset?.id, defaultDatasetId, datasetService]);

  const handleOptionChange = useCallback(
    async (newOptions: EuiSelectableOption[]) => {
      const selectedOption = newOptions.find((option) => option.checked === 'on');
      if (selectedOption) {
        const dataset = datasets.find((d) => d.id === selectedOption.key);
        if (dataset) {
          closePopover();
          onSelect(dataset);
        }
      }
    },
    [datasets, closePopover, onSelect]
  );

  const datasetTitle = useMemo(() => {
    if (!selectedDataset) {
      return i18n.translate('data.datasetSelect.selectDataLabel', {
        defaultMessage: 'Select data',
      });
    }

    if (selectedDataset.displayName) {
      return selectedDataset.displayName;
    }

    return selectedDataset.title;
  }, [selectedDataset]);

  return (
    <EuiPopover
      className="datasetSelect"
      button={
        <EuiButtonEmpty
          className="datasetSelect__button"
          data-test-subj="datasetSelectButton"
          iconType="arrowDown"
          iconSide="right"
          size="xs"
          textProps={{ className: 'datasetSelect__textWrapper' }}
          onClick={togglePopover}
        >
          <EuiIcon type={datasetIcon} size="s" />
          <EuiText size="xs" className="datasetSelect__text">
            {datasetTitle}
          </EuiText>
        </EuiButtonEmpty>
      }
      isOpen={isOpen}
      closePopover={closePopover}
      anchorPosition="downLeft"
      panelPaddingSize="none"
    >
      <EuiPopoverTitle paddingSize="none">
        <EuiContextMenu
          className="datasetSelect__contextMenu"
          initialPanelId={0}
          panels={[
            {
              id: 0,
              items: [
                {
                  name: (
                    <EuiSplitPanel.Outer
                      className="datasetSelect__contextMenu"
                      hasBorder={false}
                      hasShadow={false}
                      onFocus={() => {}}
                      direction="column"
                    >
                      <EuiSplitPanel.Inner paddingSize="none">
                        <EuiText size="s">
                          <h5>{datasetTitle}</h5>
                        </EuiText>
                      </EuiSplitPanel.Inner>
                      <EuiSplitPanel.Inner paddingSize="none">
                        <EuiText size="xs" color="subdued">
                          <small>
                            {datasetTypeConfig?.title || DEFAULT_DATA.STRUCTURES.ROOT.title}
                          </small>
                        </EuiText>
                      </EuiSplitPanel.Inner>
                    </EuiSplitPanel.Outer>
                  ),
                  panel: 1,
                  icon: <EuiIcon type={datasetIcon} size="s" />,
                },
                {
                  name: (
                    <EuiSelectable
                      className="datasetSelect__selectable"
                      data-test-subj="datasetSelectSelectable"
                      options={options}
                      singleSelection="always"
                      searchable={true}
                      isLoading={isLoading}
                      onChange={handleOptionChange}
                      renderOption={(option, searchValue) => {
                        // Searchable label is prepended with the label (title/display name) for better searching, this will strip it out.
                        const description =
                          option.searchableLabel && option.searchableLabel !== option.label
                            ? option.searchableLabel.slice(option.label.length)
                            : undefined;

                        return (
                          <EuiToolTip
                            display="block"
                            className="datasetSelect__tooltip"
                            position="right"
                            content={
                              <DatasetDetails
                                dataset={
                                  option.key ? datasets.find((d) => d.id === option.key) : undefined
                                }
                                isDefault={option.key ? option.key === defaultDatasetId : false}
                              />
                            }
                          >
                            <EuiDescriptionList
                              compressed
                              listItems={
                                description
                                  ? [
                                      {
                                        title: (
                                          <EuiText size="s">
                                            <small>
                                              <EuiHighlight search={searchValue}>
                                                {option.label}
                                              </EuiHighlight>
                                            </small>
                                          </EuiText>
                                        ),
                                        description: (
                                          <EuiText size="xs" color="subdued">
                                            <small>
                                              <EuiHighlight search={searchValue}>
                                                {description}
                                              </EuiHighlight>
                                            </small>
                                          </EuiText>
                                        ),
                                      },
                                    ]
                                  : []
                              }
                            />
                          </EuiToolTip>
                        );
                      }}
                      listProps={{
                        showIcons: false,
                        rowHeight: 50,
                      }}
                      searchProps={{
                        placeholder: i18n.translate('data.datasetSelect.searchPlaceholder', {
                          defaultMessage: 'Search',
                        }),
                        compressed: true,
                      }}
                    >
                      {(list, search) => (
                        <>
                          <div className="datasetSelect__searchContainer">{search}</div>
                          {list}
                        </>
                      )}
                    </EuiSelectable>
                  ),
                },
              ],
            },
            {
              id: 1,
              title: (
                <DatasetDetailsHeader
                  className="datasetSelect__contextMenu"
                  dataset={selectedDataset}
                  isDefault={selectedDataset?.id === defaultDatasetId}
                />
              ),
              content: (
                <DatasetDetailsBody
                  className="datasetSelect__contextMenu"
                  dataset={selectedDataset}
                  isDefault={selectedDataset?.id === defaultDatasetId}
                />
              ),
            },
          ]}
        />
      </EuiPopoverTitle>

      <EuiPopoverFooter paddingSize="none">
        <EuiFlexGroup
          justifyContent="spaceBetween"
          alignItems="center"
          responsive={false}
          gutterSize="none"
          className="datasetSelect__footer"
        >
          <EuiFlexItem grow={false} className="datasetSelect__footerItem">
            <EuiButton
              className="datasetSelect__advancedButton"
              data-test-subj="datasetSelectAdvancedButton"
              iconType="gear"
              iconSide="right"
              size="s"
              isSelected={false}
              onClick={() => {
                closePopover();
                const overlay = overlays?.openModal(
                  toMountPoint(
                    <AdvancedSelector
                      services={services}
                      onSelect={async (query: Partial<Query>) => {
                        overlay?.close();
                        if (query?.dataset) {
                          try {
                            await datasetService.cacheDataset(query.dataset, services, false);
                            const dataView = await data.dataViews.get(
                              query.dataset.id,
                              query.dataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
                            );

                            if (dataView) {
                              onSelect(query.dataset);
                            }
                          } catch (error) {
                            services.notifications?.toasts.addError(error, {
                              title: i18n.translate('data.datasetSelect.errorTitle', {
                                defaultMessage: 'Error selecting dataset',
                              }),
                            });
                          }
                        }
                      }}
                      onCancel={() => overlay?.close()}
                      supportedTypes={supportedTypes}
                    />
                  ),
                  {
                    maxWidth: false,
                    className: 'datasetSelect__advancedModal',
                  }
                );
              }}
            >
              <FormattedMessage
                id="data.datasetSelect.advancedButton"
                defaultMessage="View all available data"
              />
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPopoverFooter>
    </EuiPopover>
  );
};

// eslint-disable-next-line import/no-default-export
export default DatasetSelect;
