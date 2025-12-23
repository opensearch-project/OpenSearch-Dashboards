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
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiBasicTable,
  EuiFieldSearch,
  EuiSpacer,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  useOpenSearchDashboards,
  toMountPoint,
} from '../../../../opensearch_dashboards_react/public';
import { CORE_SIGNAL_TYPES, Dataset, DEFAULT_DATA, Query } from '../../../common';
import { IDataPluginServices } from '../../types';
import { DatasetDetails } from './dataset_details';
import { AdvancedSelector } from '../dataset_selector/advanced_selector';
import './_index.scss';

export interface DetailedDataset extends Dataset {
  description?: string;
  displayName?: string;
  signalType?: string;
}

export interface DatasetSelectProps {
  onSelect: (dataset: Dataset | undefined) => void;
  supportedTypes?: string[];
  signalType: string | null;
}

interface ViewDatasetsModalProps {
  datasets: DetailedDataset[];
  isLoading: boolean;
  onClose: () => void;
  services: IDataPluginServices;
}

const ViewDatasetsModal: React.FC<ViewDatasetsModalProps> = ({
  datasets,
  isLoading,
  onClose,
  services,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data, application } = services;
  const { queryString } = data.query;
  const datasetService = queryString.getDatasetService();

  const filteredDatasets = useMemo(() => {
    if (!searchQuery) return datasets;
    const lowerSearch = searchQuery.toLowerCase();
    return datasets.filter(
      (dataset) =>
        (dataset.displayName || dataset.title).toLowerCase().includes(lowerSearch) ||
        dataset.description?.toLowerCase().includes(lowerSearch)
    );
  }, [datasets, searchQuery]);

  const handleDatasetClick = useCallback(
    (dataset: DetailedDataset) => {
      onClose();
      application.navigateToApp('datasets', {
        path: `/patterns/${dataset.id}`,
      });
    },
    [onClose, application]
  );

  const columns = [
    {
      field: 'displayName',
      name: i18n.translate('data.datasetSelect.viewModal.nameColumn', {
        defaultMessage: 'Name',
      }),
      render: (displayName: string, dataset: DetailedDataset) => {
        const typeConfig = datasetService.getType(dataset.type);
        const iconType = typeConfig?.meta?.icon?.type || 'database';
        return (
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiIcon type={iconType} size="m" />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText size="s">
                <strong>{displayName || dataset.title}</strong>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        );
      },
      sortable: true,
    },
    {
      field: 'type',
      name: i18n.translate('data.datasetSelect.viewModal.typeColumn', {
        defaultMessage: 'Type',
      }),
      render: (type: string) => {
        const typeConfig = datasetService.getType(type);
        return typeConfig?.title || type;
      },
      sortable: true,
    },
    {
      field: 'title',
      name: i18n.translate('data.datasetSelect.viewModal.dataColumn', {
        defaultMessage: 'Data',
      }),
      render: (title: string) => title,
      sortable: true,
    },
    {
      field: 'description',
      name: i18n.translate('data.datasetSelect.viewModal.descriptionColumn', {
        defaultMessage: 'Description',
      }),
      render: (description: string) => description || '—',
      truncateText: true,
    },
  ];

  return (
    <EuiModal onClose={onClose} maxWidth="800px">
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <FormattedMessage
            id="data.datasetSelect.viewModal.title"
            defaultMessage="Workspace datasets"
          />
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        <EuiText size="s" color="subdued">
          <FormattedMessage
            id="data.datasetSelect.viewModal.description"
            defaultMessage="Create and manage the datasets that help you retrieve your data from OpenSearch."
          />
        </EuiText>
        <EuiSpacer size="m" />
        <EuiFieldSearch
          placeholder={i18n.translate('data.datasetSelect.viewModal.searchPlaceholder', {
            defaultMessage: 'Search...',
          })}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          isClearable
          fullWidth
        />
        <EuiSpacer size="m" />
        <EuiBasicTable
          items={filteredDatasets}
          columns={columns}
          loading={isLoading}
          rowProps={(dataset) => ({
            onClick: () => handleDatasetClick(dataset),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            pageSize: 10,
            pageSizeOptions: [10],
          }}
        />
      </EuiModalBody>
    </EuiModal>
  );
};

/**
 * @experimental This component is experimental and may change in future versions
 */
const DatasetSelect: React.FC<DatasetSelectProps> = ({ onSelect, supportedTypes, signalType }) => {
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
        // Check if matching dataset is compatible with current signal type
        let isCompatible = true;
        if (signalType === CORE_SIGNAL_TYPES.TRACES) {
          isCompatible = matchingDataset.signalType === CORE_SIGNAL_TYPES.TRACES;
        } else if (signalType === CORE_SIGNAL_TYPES.LOGS) {
          isCompatible =
            matchingDataset.signalType === CORE_SIGNAL_TYPES.LOGS || !matchingDataset.signalType;
        } else if (signalType === CORE_SIGNAL_TYPES.METRICS) {
          isCompatible =
            matchingDataset.signalType === CORE_SIGNAL_TYPES.METRICS || !matchingDataset.signalType;
        }

        if (isCompatible) {
          setSelectedDataset(matchingDataset);
        } else {
          // Clear incompatible dataset - call onSelect to update Redux state
          setSelectedDataset(undefined);
          onSelect(undefined);
        }
        return;
      }

      const onlyCheckCache = currentDataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN;
      const dataView = await dataViews.get(currentDataset.id, onlyCheckCache);

      // If dataView is not in cache (onlyCheckCache returns undefined), fallback to currentDataset
      if (!dataView) {
        setSelectedDataset(currentDataset as DetailedDataset);
        return;
      }

      const detailedDataset = {
        ...currentDataset,
        description: dataView.description,
        displayName: dataView.displayName,
        signalType: dataView.signalType,
      } as DetailedDataset;

      // Check if dataset is compatible with current signal type before setting it
      let isCompatible = true;
      if (signalType === CORE_SIGNAL_TYPES.TRACES) {
        isCompatible = detailedDataset.signalType === CORE_SIGNAL_TYPES.TRACES;
      } else if (signalType === CORE_SIGNAL_TYPES.LOGS) {
        isCompatible =
          detailedDataset.signalType === CORE_SIGNAL_TYPES.LOGS || !detailedDataset.signalType;
      } else if (signalType === CORE_SIGNAL_TYPES.METRICS) {
        isCompatible =
          detailedDataset.signalType === CORE_SIGNAL_TYPES.METRICS || !detailedDataset.signalType;
      }

      if (isCompatible) {
        setSelectedDataset(detailedDataset);
      } else {
        // Clear incompatible dataset
        queryString.setQuery({
          query: '',
          language: currentQuery.language,
        });
        setSelectedDataset(undefined);
      }
    };
    updateSelectedDataset();
  }, [
    currentDataset,
    dataViews,
    datasets,
    signalType,
    queryString,
    currentQuery.language,
    onSelect,
  ]);

  const datasetTypeConfig = datasetService.getType(
    selectedDataset?.sourceDatasetRef?.type || selectedDataset?.type || ''
  );
  const datasetIcon = datasetTypeConfig?.meta?.icon?.type || 'database';

  const fetchDatasets = useCallback(async () => {
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
          signalType: dataView.signalType,
        });
      }

      const onFilter = (detailedDataset: DetailedDataset) => {
        // Filter by signal type
        let signalTypeMatch = false;

        if (signalType === CORE_SIGNAL_TYPES.TRACES) {
          // Traces page: ONLY show datasets with signalType='traces' (strict)
          signalTypeMatch = detailedDataset.signalType === CORE_SIGNAL_TYPES.TRACES;
        } else if (signalType === CORE_SIGNAL_TYPES.LOGS) {
          // Logs page: Show datasets with signalType='logs' OR null (permissive)
          signalTypeMatch =
            detailedDataset.signalType === CORE_SIGNAL_TYPES.LOGS || !detailedDataset.signalType;
        } else if (signalType === CORE_SIGNAL_TYPES.METRICS) {
          // Metrics page: Show datasets with signalType='metrics' OR null (permissive)
          signalTypeMatch =
            detailedDataset.signalType === CORE_SIGNAL_TYPES.METRICS || !detailedDataset.signalType;
        } else {
          // Regular Discover page: Show only datasets without a signal type
          // (null or undefined) - these are regular index patterns
          signalTypeMatch = !detailedDataset.signalType;
        }

        if (!signalTypeMatch) {
          return false;
        }

        // Filter by supportedAppNames
        const typeConfig = datasetService.getType(detailedDataset.type);
        const appNameMatch =
          !typeConfig?.meta?.supportedAppNames ||
          typeConfig.meta.supportedAppNames.includes(services.appName);

        return appNameMatch;
      };

      const filteredDatasets = fetchedDatasets.filter(onFilter);

      let defaultDataView;
      try {
        defaultDataView = await dataViews.getDefault();
        if (defaultDataView) {
          setDefaultDatasetId(defaultDataView.id);
        }
      } catch (error) {
        // Default dataset not found (stale reference), continue without it
        // eslint-disable-next-line no-console
        console.warn('[DatasetSelect] Default dataset not found, using first available:', error);
      }
      const defaultDataset =
        filteredDatasets.find((d) => d.id === defaultDataView?.id) ?? filteredDatasets[0];
      // Get fresh current dataset value at execution time
      const currentlySelectedDataset = queryString.getQuery().dataset;

      // Check if currently selected dataset is compatible with current signal type filter
      const isCurrentDatasetValid = currentlySelectedDataset
        ? filteredDatasets.some((d) => d.id === currentlySelectedDataset.id)
        : false;

      // If current dataset is incompatible with the signal type filter, clear it or select default
      if (currentlySelectedDataset && !isCurrentDatasetValid) {
        if (defaultDataset) {
          // Select the first valid dataset
          onSelect(defaultDataset);
        } else {
          // No valid datasets available, clear the selection by setting to empty query
          queryString.setQuery({
            query: '',
            language: queryString.getQuery().language,
          });
        }
      } else if (!currentlySelectedDataset && defaultDataset) {
        // No dataset selected but default is available
        onSelect(defaultDataset);
      }
      setDatasets(filteredDatasets);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [dataViews, signalType, onSelect, queryString, datasetService, services.appName]);

  useEffect(() => {
    isMounted.current = true;
    fetchDatasets();
    return () => {
      isMounted.current = false;
    };
  }, [fetchDatasets]);

  const togglePopover = useCallback(() => setIsOpen(!isOpen), [isOpen]);
  const closePopover = useCallback(() => {
    setIsOpen(false);
  }, []);

  const options = datasets.map((dataset) => {
    const { id, title, type, description, displayName, dataSource, timeFieldName } = dataset;
    const isSelected = id === selectedDataset?.id;
    const isDefault = id === defaultDatasetId;
    const typeConfig = datasetService.getType(type);
    const iconType = typeConfig?.meta?.icon?.type || 'database';
    const label = displayName || title;

    // Build subtitle with data source and time field
    const subtitleParts = [];
    if (dataSource?.title) {
      subtitleParts.push(dataSource.title);
    } else {
      // For local data sources (no dataSourceRef), show "Local cluster"
      subtitleParts.push(
        i18n.translate('data.datasetSelect.localCluster', {
          defaultMessage: 'Local cluster',
        })
      );
    }
    if (timeFieldName) {
      subtitleParts.push(
        i18n.translate('data.datasetSelect.timeField', {
          defaultMessage: 'Time field: {timeField}',
          values: { timeField: timeFieldName },
        })
      );
    }
    const subtitle = subtitleParts.length > 0 ? subtitleParts.join(' • ') : '';

    // Prepending the label to the searchable label to allow for better search, render will strip it out
    // Adding a separator before subtitle if it exists so renderOption can parse it correctly
    const searchableLabel = subtitle
      ? `${label} ${subtitle}${description && description.trim() !== '' ? ` - ${description}` : ''}`
      : `${label}${description && description.trim() !== '' ? ` - ${description}` : ''}`;

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
          isLoading={isLoading}
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
                            {(() => {
                              const parts = [];
                              if (selectedDataset?.dataSource?.title) {
                                parts.push(selectedDataset.dataSource.title);
                              } else if (selectedDataset) {
                                // For local data sources (no dataSourceRef), show "Local cluster"
                                parts.push(
                                  i18n.translate('data.datasetSelect.localCluster', {
                                    defaultMessage: 'Local cluster',
                                  })
                                );
                              }
                              if (selectedDataset?.timeFieldName) {
                                parts.push(
                                  i18n.translate('data.datasetSelect.timeField', {
                                    defaultMessage: 'Time field: {timeField}',
                                    values: { timeField: selectedDataset.timeFieldName },
                                  })
                                );
                              }
                              return parts.length > 0
                                ? parts.join(' • ')
                                : datasetTypeConfig?.title || DEFAULT_DATA.STRUCTURES.ROOT.title;
                            })()}
                          </small>
                        </EuiText>
                      </EuiSplitPanel.Inner>
                    </EuiSplitPanel.Outer>
                  ),
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
          ]}
        />
      </EuiPopoverTitle>

      <EuiPopoverFooter paddingSize="none">
        <EuiFlexGroup
          justifyContent="spaceBetween"
          alignItems="center"
          responsive={false}
          gutterSize="s"
          className="datasetSelect__footer"
        >
          <EuiFlexItem grow={false} className="datasetSelect__footerItem">
            <EuiButton
              className="datasetSelect__createButton"
              data-test-subj="datasetSelectCreateButton"
              iconType="plus"
              iconSide="left"
              size="s"
              fill
              onClick={() => {
                closePopover();
                const overlay = overlays?.openModal(
                  toMountPoint(
                    <AdvancedSelector
                      useConfiguratorV2
                      signalType={signalType || undefined}
                      services={services}
                      onSelect={async (query: Partial<Query>, saveDataset) => {
                        overlay?.close();
                        if (query?.dataset) {
                          try {
                            if (saveDataset) {
                              await datasetService.saveDataset(
                                query.dataset,
                                services,
                                signalType || undefined
                              );
                            } else {
                              await datasetService.cacheDataset(
                                query.dataset,
                                services,
                                false,
                                signalType || undefined
                              );
                            }
                            const dataView = await data.dataViews.get(
                              query.dataset.id,
                              query.dataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
                            );

                            if (dataView) {
                              // Refresh datasets list if a new dataset was saved
                              if (saveDataset) {
                                // Convert dataView back to dataset to get the correct type
                                const updatedDataset = await dataViews.convertToDataset(dataView);
                                onSelect(updatedDataset);
                                // Clear cache to ensure getIds() returns fresh results including the newly saved dataset
                                dataViews.clearCache();
                                await fetchDatasets();
                              } else {
                                onSelect(query.dataset);
                              }
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
                id="data.datasetSelect.createDatasetButton"
                defaultMessage="Create dataset"
              />
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false} className="datasetSelect__footerItem">
            <EuiButton
              className="datasetSelect__viewDatasetsButton"
              data-test-subj="datasetSelectViewDatasetsButton"
              size="s"
              onClick={() => {
                closePopover();
                const overlay = overlays?.openModal(
                  toMountPoint(
                    <ViewDatasetsModal
                      datasets={datasets}
                      isLoading={isLoading}
                      onClose={() => overlay?.close()}
                      services={services}
                    />
                  ),
                  {
                    maxWidth: '800px',
                    className: 'datasetSelect__viewDatasetsModal',
                  }
                );
              }}
            >
              <FormattedMessage
                id="data.datasetSelect.viewDatasetsButton"
                defaultMessage="View datasets"
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
