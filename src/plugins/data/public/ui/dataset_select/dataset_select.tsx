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
  EuiCallOut,
  EuiLink,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  useOpenSearchDashboards,
  toMountPoint,
} from '../../../../opensearch_dashboards_react/public';
import { CORE_SIGNAL_TYPES, Dataset, DEFAULT_DATA, DataStructure, Query } from '../../../common';
import { IDataPluginServices } from '../../types';
import { DatasetDetails } from './dataset_details';
import { AdvancedSelector } from '../dataset_selector/advanced_selector';
import './_index.scss';

interface TimeBasedDatasetDisclaimerProps {
  onClick: () => void;
}

const TimeBasedDatasetDisclaimer: React.FC<TimeBasedDatasetDisclaimerProps> = ({ onClick }) => (
  <EuiCallOut
    color="primary"
    size="s"
    className="datasetSelect__timeBasedDisclaimer"
    data-test-subj="TimeBasedDatasetCallout"
  >
    <EuiText size="xs">
      <EuiIcon type="iInCircle" size="s" />{' '}
      <FormattedMessage
        id="data.datasetSelect.timeBasedDatasetDisclaimer.message"
        defaultMessage="Only time-based Datasets are supported."
      />{' '}
      <EuiLink onClick={onClick} data-test-subj="TimeBasedDatasetCalloutDatasetNavigationButton">
        <FormattedMessage
          id="data.datasetSelect.timeBasedDatasetDisclaimer.createLink"
          defaultMessage="Create a time-based Dataset here."
        />
      </EuiLink>
    </EuiText>
  </EuiCallOut>
);

export interface DetailedDataset extends Dataset {
  description?: string;
  displayName?: string;
  signalType?: string;
}

export interface DatasetSelectProps {
  onSelect: (dataset: Dataset | undefined) => void;
  supportedTypes?: string[];
  signalType: string | null;
  showNonTimeFieldDatasets?: boolean;
  appName?: string;
}

interface ViewDatasetsModalProps {
  datasets: DetailedDataset[];
  isLoading: boolean;
  onClose: () => void;
  services: IDataPluginServices;
}

const isDatasetCompatibleWithSignalType = (
  dataset: DetailedDataset,
  signalType: string | null
): boolean => {
  if (!signalType) return true;

  if (signalType === CORE_SIGNAL_TYPES.TRACES) {
    return dataset.signalType === CORE_SIGNAL_TYPES.TRACES;
  } else if (signalType === CORE_SIGNAL_TYPES.LOGS) {
    return dataset.signalType === CORE_SIGNAL_TYPES.LOGS || !dataset.signalType;
  } else if (signalType === CORE_SIGNAL_TYPES.METRICS) {
    return dataset.signalType === CORE_SIGNAL_TYPES.METRICS || !dataset.signalType;
  }
  return true;
};

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
    return datasets.filter((dataset) => {
      const displayName = (dataset.displayName || dataset.title).toLowerCase();
      const description = dataset.description?.toLowerCase() || '';
      const signalType = dataset.signalType?.toLowerCase() || '';
      const dataSourceName = dataset.dataSource?.title?.toLowerCase() || 'local cluster';
      const indexPattern = dataset.title.toLowerCase();

      return (
        displayName.includes(lowerSearch) ||
        description.includes(lowerSearch) ||
        signalType.includes(lowerSearch) ||
        dataSourceName.includes(lowerSearch) ||
        indexPattern.includes(lowerSearch)
      );
    });
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
        defaultMessage: 'Dataset',
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
      field: 'signalType',
      name: i18n.translate('data.datasetSelect.viewModal.typeColumn', {
        defaultMessage: 'Type',
      }),
      render: (signalType: string | undefined) => {
        if (!signalType) {
          return '—';
        }
        // Capitalize first letter for display
        return signalType.charAt(0).toUpperCase() + signalType.slice(1).toLowerCase();
      },
      sortable: true,
    },
    {
      field: 'title',
      name: i18n.translate('data.datasetSelect.viewModal.dataColumn', {
        defaultMessage: 'Datasource',
      }),
      render: (title: string, dataset: DetailedDataset) => {
        const dataSourceName = dataset.dataSource?.title || 'Local cluster';
        return (
          <div>
            <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiIcon type="database" size="s" />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText size="s">{dataSourceName}</EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiText size="s" color="subdued">
              {title}
            </EuiText>
          </div>
        );
      },
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
        <TimeBasedDatasetDisclaimer
          onClick={() => {
            onClose();
            services.application?.navigateToApp('datasets');
          }}
        />
        <EuiFieldSearch
          placeholder={i18n.translate('data.datasetSelect.viewModal.searchPlaceholder', {
            defaultMessage: 'Search...',
          })}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          isClearable
          fullWidth
        />
        <EuiSpacer size="s" />
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
const DatasetSelect: React.FC<DatasetSelectProps> = ({
  onSelect,
  supportedTypes,
  signalType,
  showNonTimeFieldDatasets = true,
}) => {
  const { services } = useOpenSearchDashboards<IDataPluginServices>();
  const isMounted = useRef(true);
  const hasCompletedInitialLoad = useRef(false);
  const previousSignalType = useRef(signalType);
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

  // Handle signal type changes (e.g., navigating from logs to traces)
  useEffect(() => {
    const signalTypeChanged = previousSignalType.current !== signalType;
    if (signalTypeChanged) {
      previousSignalType.current = signalType;
      // Reset initial load flag AND clear datasets to force refetch with new signal type
      hasCompletedInitialLoad.current = false;
      setDatasets([]);
    }
  }, [signalType]);

  useEffect(() => {
    const updateSelectedDataset = async () => {
      if (!currentDataset) {
        setSelectedDataset(undefined);
        return;
      }

      // If datasets array is empty during a refetch, don't update selection
      // This prevents clearing the dataset when fetchDatasets temporarily clears the array
      if (datasets.length === 0 && hasCompletedInitialLoad.current) {
        return;
      }

      const matchingDataset = datasets.find((d) => d.id === currentDataset.id);
      if (matchingDataset) {
        const isCompatible = isDatasetCompatibleWithSignalType(matchingDataset, signalType);

        if (isCompatible) {
          setSelectedDataset(matchingDataset);
        } else {
          // Don't clear incompatible dataset - just ignore it
          // This handles cases where flyouts temporarily change the query dataset
          // Keep the current UI state - don't update
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

      const isCompatible = isDatasetCompatibleWithSignalType(detailedDataset, signalType);

      if (isCompatible) {
        setSelectedDataset(detailedDataset);
      } else {
        // Don't clear incompatible dataset - just ignore it
        // This handles cases where flyouts temporarily change the query dataset
        // (e.g., trace flyout querying related logs changes dataset from traces to logs)
        // Keep the current UI state - don't update selectedDataset
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
    setDatasets([]);

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

      // Check if we need to fetch from dataset types that do not use data views (e.g., PROMETHEUS)
      // These types have their own fetch mechanism via the type config
      await Promise.all(
        supportedTypes?.map(async (type) => {
          if ([DEFAULT_DATA.SET_TYPES.INDEX_PATTERN, DEFAULT_DATA.SET_TYPES.INDEX].includes(type))
            return;
          const typeConfig = datasetService.getType(type);
          if (!typeConfig?.fetch) return;
          const datasetRoot: DataStructure = { id: typeConfig.id, title: typeConfig.title, type };
          const result = await typeConfig.fetch(services, [datasetRoot]);
          result.children?.forEach((child) => {
            const dataset = typeConfig.toDataset([datasetRoot, child]);
            fetchedDatasets.push({
              ...dataset,
              displayName: child.title,
              signalType: dataset.signalType,
            });
          });
        }) || []
      );

      const onFilter = (detailedDataset: DetailedDataset) => {
        // Filter by signal type
        const signalTypeMatch =
          signalType === CORE_SIGNAL_TYPES.TRACES
            ? detailedDataset.signalType === CORE_SIGNAL_TYPES.TRACES
            : signalType === CORE_SIGNAL_TYPES.METRICS
            ? detailedDataset.signalType === CORE_SIGNAL_TYPES.METRICS
            : detailedDataset.signalType !== CORE_SIGNAL_TYPES.TRACES;

        if (!signalTypeMatch) {
          return false;
        }

        // Filter by time field requirement
        if (!showNonTimeFieldDatasets && !detailedDataset.timeFieldName) {
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

      // Deduplicate datasets by id to prevent duplicates from multiple sources
      const deduplicatedDatasets = Array.from(
        new Map(filteredDatasets.map((dataset) => [dataset.id, dataset])).values()
      );

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
        deduplicatedDatasets.find((d) => d.id === defaultDataView?.id) ?? deduplicatedDatasets[0];
      // Get fresh current dataset value at execution time
      const currentlySelectedDataset = queryString.getQuery().dataset;

      // Only auto-select datasets on initial load when there's no dataset selected
      // During refetches (e.g., when flyouts open), we don't want to trigger dataset changes
      // IMPORTANT: Don't run auto-select when signalType is null (component is still mounting)
      // IMPORTANT: Don't override a dataset that's already selected - it may have been set by
      // a saved query, test, or manual selection, and may not be in the fetched list
      if (
        !hasCompletedInitialLoad.current &&
        signalType !== null &&
        !currentlySelectedDataset &&
        defaultDataset
      ) {
        // No dataset selected but default is available - select it
        onSelect(defaultDataset);
      }
      if (isMounted.current) {
        setDatasets(deduplicatedDatasets);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[DatasetSelect] Error fetching datasets:', error);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        hasCompletedInitialLoad.current = true;
      }
    }
  }, [
    dataViews,
    signalType,
    onSelect,
    queryString,
    datasetService,
    services,
    supportedTypes,
    showNonTimeFieldDatasets,
  ]);

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
        defaultMessage: 'Select dataset',
      });
    }

    if (selectedDataset.displayName) {
      return selectedDataset.displayName;
    }

    return selectedDataset.title;
  }, [selectedDataset]);

  const metricsFooterContent = (
    <EuiFlexItem grow={false} className="datasetSelect__footerItem">
      <EuiButton
        className="datasetSelect__associateButton"
        data-test-subj="datasetSelectorAssociateDataSourcesButton"
        iconType="popout"
        iconSide="left"
        size="s"
        onClick={() => {
          closePopover();
          window.open(
            `${services.http.basePath.get()}/app/management/opensearch-dashboards/dataSources`,
            '_blank',
            'noopener,noreferrer'
          );
        }}
      >
        <FormattedMessage
          id="data.datasetSelect.manageDataSourcesButton"
          defaultMessage="Manage data sources"
        />
      </EuiButton>
    </EuiFlexItem>
  );

  const defaultFooterContent = (
    <>
      <EuiFlexItem grow={false} className="datasetSelect__footerItem">
        <EuiButton
          className="datasetSelect__createButton"
          data-test-subj="datasetSelectorAdvancedButton"
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
                  alwaysShowDatasetFields
                  signalType={signalType || undefined}
                  services={services}
                  showNonTimeFieldDatasets={showNonTimeFieldDatasets}
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
    </>
  );

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
          {signalType === CORE_SIGNAL_TYPES.METRICS ? metricsFooterContent : defaultFooterContent}
        </EuiFlexGroup>
      </EuiPopoverFooter>
    </EuiPopover>
  );
};

// eslint-disable-next-line import/no-default-export
export default DatasetSelect;
