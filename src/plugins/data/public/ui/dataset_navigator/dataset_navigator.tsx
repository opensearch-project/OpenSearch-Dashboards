/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiContextMenu,
  EuiContextMenuPanelItemDescriptor,
  EuiForm,
  EuiFormRow,
  EuiLoadingSpinner,
  EuiPanel,
  EuiPopover,
  EuiSelect,
} from '@elastic/eui';
import { HttpStart, SavedObjectsClientContract } from 'opensearch-dashboards/public';
import _ from 'lodash';
import { i18n } from '@osd/i18n';
import {
  createDataFrame,
  dataFrameToSpec,
  IndexPattern,
  SIMPLE_DATA_SET_TYPES,
  SIMPLE_DATA_SOURCE_TYPES,
  SimpleDataSet,
  SimpleDataSource,
  SimpleObject,
} from '../../../common';
import {
  useLoadDatabasesToCache,
  useLoadExternalDataSourcesToCache,
  useLoadTablesToCache,
} from './lib/catalog_cache/cache_loader';
import { CatalogCacheManager } from './lib/catalog_cache/cache_manager';
import { CachedDataSourceStatus, DirectQueryLoadingStatus } from './lib/types';
import {
  getIndexPatterns,
  getNotifications,
  getQueryService,
  getSearchService,
  getUiService,
} from '../../services';
import {
  fetchDataSources,
  fetchIndexPatterns,
  fetchIndices,
  isCatalogCacheFetching,
  fetchIfExternalDataSourcesEnabled,
} from './lib';

export interface DataSetNavigatorProps {
  dataSetId: string | undefined;
  savedObjectsClient?: SavedObjectsClientContract;
  http?: HttpStart;
  onSelectDataSet: (dataSet: SimpleDataSet) => void;
}

interface DataSetNavigatorState {
  isMounted: boolean;
  isOpen: boolean;
  isLoading: boolean;
  isExternalDataSourcesEnabled: boolean;
  indexPatterns: any[];
  dataSources: SimpleDataSource[];
  externalDataSources: SimpleDataSource[];
  cachedDatabases: any[];
  cachedTables: any[];
}

interface SelectedDataSetState {
  isExternal: boolean;
  dataSource?: SimpleDataSource | undefined; // dataSource or externalDataSource
  database: any | undefined;
  object: SimpleDataSet | undefined; // index or table
  timeFieldName: string | undefined;
}

export const DataSetNavigator = (props: DataSetNavigatorProps) => {
  const { savedObjectsClient, http, onSelectDataSet } = props;
  const searchService = getSearchService();
  const queryService = getQueryService();
  const uiService = getUiService();
  const indexPatternsService = getIndexPatterns();
  const notifications = getNotifications();

  const [navigatorState, setNavigatorState] = useState<DataSetNavigatorState>({
    isOpen: false,
    isLoading: false,
    isMounted: false,
    isExternalDataSourcesEnabled: false,
    dataSources: [],
    externalDataSources: [],
    indexPatterns: [],
    cachedDatabases: [],
    cachedTables: [],
  });

  const [selectedDataSetState, setSelectedDataSetState] = useState<SelectedDataSetState>({
    isExternal: false,
    dataSource: undefined,
    database: undefined,
    object: undefined,
    timeFieldName: undefined,
  });

  const {
    loadStatus: dataSourcesLoadStatus,
    loadExternalDataSources: startLoadingDataSources,
  } = useLoadExternalDataSourcesToCache(http!, notifications);
  const {
    loadStatus: databasesLoadStatus,
    startLoading: startLoadingDatabases,
  } = useLoadDatabasesToCache(http!, notifications);
  const { loadStatus: tablesLoadStatus, startLoading: startLoadingTables } = useLoadTablesToCache(
    http!,
    notifications
  );

  const onClick = () => {
    setNavigatorState((prevState) => ({
      ...prevState,
      isOpen: !prevState.isOpen,
    }));
  };

  const isLoading = (loading: boolean) => {
    setNavigatorState((prevState) => ({
      ...prevState,
      isLoading: loading,
    }));
  };

  const closePopover = () => {
    setNavigatorState((prevState) => ({
      ...prevState,
      isOpen: false,
      externalDataSources: [],
      cachedDatabases: [],
      cachedTables: [],
    }));
  };

  const onRefresh = () => {
    if (!isCatalogCacheFetching(dataSourcesLoadStatus) && navigatorState.dataSources.length > 0) {
      startLoadingDataSources(navigatorState.dataSources.map((dataSource) => dataSource.id));
    }
  };

  useEffect(() => {
    setNavigatorState((prevState) => ({ ...prevState, isMounted: true, isLoading: true }));
    Promise.all([
      fetchIndexPatterns(savedObjectsClient!, ''),
      fetchDataSources(savedObjectsClient!),
      fetchIfExternalDataSourcesEnabled(http!),
    ])
      .then(([indexPatterns, dataSources, isExternalDataSourcesEnabled]) => {
        if (!navigatorState.isMounted) return;
        setNavigatorState((prevState) => ({
          ...prevState,
          isExternalDataSourcesEnabled,
          indexPatterns,
          dataSources,
        }));
        const selectedPattern = indexPatterns.find((pattern) => pattern.id === props.dataSetId);
        if (selectedPattern) {
          setSelectedDataSetState({
            object: {
              id: selectedPattern.id,
              title: selectedPattern.title,
              type: SIMPLE_DATA_SET_TYPES.INDEX_PATTERN,
              timeFieldName: selectedPattern.timeFieldName,
              fields: selectedPattern.fields,
            },
            ...(selectedPattern.dataSource
              ? {
                  dataSource: {
                    id: selectedPattern.dataSource.id,
                    name: selectedPattern.dataSource.name,
                    type: selectedPattern.dataSource.type,
                  },
                }
              : { dataSource: undefined }),
            database: undefined,
            isExternal: false,
            timeFieldName: selectedPattern.timeFieldName,
          });
        }
      })
      .finally(() => {
        isLoading(false);
      });
    return () => {
      setNavigatorState((prevState) => ({ ...prevState, isMounted: false }));
    };
  }, [savedObjectsClient, http, onSelectDataSet, navigatorState.isMounted, props.dataSetId]);

  useEffect(() => {
    const status = dataSourcesLoadStatus.toLowerCase();
    const externalDataSourcesCache = CatalogCacheManager.getExternalDataSourcesCache();
    if (status === DirectQueryLoadingStatus.SUCCESS) {
      setNavigatorState((prevState) => ({
        ...prevState,
        externalDataSources: externalDataSourcesCache.externalDataSources.map((ds) => ({
          id: ds.dataSourceRef,
          name: ds.name,
          type: SIMPLE_DATA_SOURCE_TYPES.EXTERNAL,
        })),
      }));
    } else if (
      status === DirectQueryLoadingStatus.CANCELED ||
      status === DirectQueryLoadingStatus.FAILED
    ) {
      setNavigatorState((prevState) => ({ ...prevState, failed: true }));
    }
  }, [dataSourcesLoadStatus]);

  useEffect(() => {
    const status = databasesLoadStatus.toLowerCase();
    if (selectedDataSetState.isExternal && selectedDataSetState.dataSource) {
      const dataSourceCache = CatalogCacheManager.getOrCreateDataSource(
        selectedDataSetState.dataSource.name,
        selectedDataSetState.dataSource.id
      );
      if (status === DirectQueryLoadingStatus.SUCCESS) {
        setNavigatorState((prevState) => ({
          ...prevState,
          cachedDatabases: dataSourceCache.databases,
        }));
      } else if (
        status === DirectQueryLoadingStatus.CANCELED ||
        status === DirectQueryLoadingStatus.FAILED
      ) {
        setNavigatorState((prevState) => ({ ...prevState, failed: true }));
      }
    }
  }, [databasesLoadStatus, selectedDataSetState.isExternal, selectedDataSetState.dataSource]);

  const handleSelectExternalDataSource = useCallback(
    async (dataSource) => {
      if (selectedDataSetState.isExternal && dataSource) {
        const dataSourceCache = CatalogCacheManager.getOrCreateDataSource(
          dataSource.name,
          dataSource.id
        );
        if (
          (dataSourceCache.status === CachedDataSourceStatus.Empty ||
            dataSourceCache.status === CachedDataSourceStatus.Failed) &&
          !isCatalogCacheFetching(databasesLoadStatus)
        ) {
          await startLoadingDatabases({
            dataSourceName: dataSource.name,
            dataSourceMDSId: dataSource.id,
          });
        } else if (dataSourceCache.status === CachedDataSourceStatus.Updated) {
          setNavigatorState((prevState) => ({
            ...prevState,
            cachedDatabases: dataSourceCache.databases,
          }));
          setSelectedDataSetState((prevState) => ({
            ...prevState,
            dataSource,
            isExternal: true,
          }));
        }
      }
    },
    [databasesLoadStatus, selectedDataSetState.isExternal, startLoadingDatabases]
  );

  // Start loading tables for selected database
  const handleSelectExternalDatabase = useCallback(
    (externalDatabase: SimpleDataSource) => {
      if (selectedDataSetState.dataSource && externalDatabase) {
        let databaseCache;
        try {
          databaseCache = CatalogCacheManager.getDatabase(
            selectedDataSetState.dataSource.name,
            externalDatabase.name,
            selectedDataSetState.dataSource.id
          );
        } catch (error) {
          return;
        }
        if (
          databaseCache.status === CachedDataSourceStatus.Empty ||
          (databaseCache.status === CachedDataSourceStatus.Failed &&
            !isCatalogCacheFetching(tablesLoadStatus))
        ) {
          startLoadingTables({
            dataSourceName: selectedDataSetState.dataSource.name,
            databaseName: externalDatabase.name,
            dataSourceMDSId: selectedDataSetState.dataSource.id,
          });
          setSelectedDataSetState((prevState) => ({
            ...prevState,
            database: externalDatabase,
          }));
        } else if (databaseCache.status === CachedDataSourceStatus.Updated) {
          setNavigatorState((prevState) => ({
            ...prevState,
            cachedTables: databaseCache.tables,
          }));
        }
      }
    },
    [tablesLoadStatus, selectedDataSetState.dataSource, startLoadingTables]
  );

  // Retrieve tables from cache upon success
  useEffect(() => {
    if (
      selectedDataSetState.dataSource &&
      selectedDataSetState.isExternal &&
      selectedDataSetState.database
    ) {
      const tablesStatus = tablesLoadStatus.toLowerCase();
      let databaseCache;
      try {
        databaseCache = CatalogCacheManager.getDatabase(
          selectedDataSetState.dataSource.name,
          selectedDataSetState.database,
          selectedDataSetState.dataSource.id
        );
      } catch (error) {
        return;
      }
      if (tablesStatus === DirectQueryLoadingStatus.SUCCESS) {
        setNavigatorState((prevState) => ({
          ...prevState,
          cachedTables: databaseCache.tables,
        }));
      } else if (
        tablesStatus === DirectQueryLoadingStatus.CANCELED ||
        tablesStatus === DirectQueryLoadingStatus.FAILED
      ) {
        notifications.toasts.addWarning('Error loading tables');
      }
    }
  }, [
    tablesLoadStatus,
    selectedDataSetState.dataSource,
    selectedDataSetState.isExternal,
    selectedDataSetState.database,
    notifications.toasts,
  ]);

  const handleSelectedDataSource = useCallback(
    async (source: SimpleDataSource) => {
      if (source) {
        isLoading(true);
        const indices = await fetchIndices(searchService, source.id);
        const objects = indices.map((indexName: string) => ({
          id: indexName,
          title: indexName,
          dataSourceRef: {
            id: source.id,
            name: source.name,
            type: source.type,
          },
        }));
        source.indices = objects;
        setSelectedDataSetState((prevState) => ({
          ...prevState,
          isExternal: false,
          dataSource: source,
        }));
        isLoading(false);
      }
    },
    [searchService]
  );

  const handleSelectedObject = useCallback(
    async (object) => {
      isLoading(true);
      if (object) {
        const fields = await indexPatternsService.getFieldsForWildcard({
          pattern: object.title,
          dataSourceId: object.dataSourceRef?.id,
        });

        const timeFields = fields.filter((field: any) => field.type === 'date');
        const timeFieldName = timeFields?.length > 0 ? timeFields[0].name : undefined;
        object.timeFields = timeFields;
        setSelectedDataSetState((prevState) => ({
          ...prevState,
          object,
          timeFieldName,
          type: SIMPLE_DATA_SET_TYPES.TEMPORARY,
        }));
        isLoading(false);
      }
    },
    [indexPatternsService]
  );

  const handleSelectedDataSet = useCallback(async () => {
    if (!selectedDataSetState.object) return;
    if (
      selectedDataSetState.object.type === SIMPLE_DATA_SET_TYPES.TEMPORARY ||
      selectedDataSetState.object.type === SIMPLE_DATA_SET_TYPES.TEMPORARY_ASYNC
    ) {
      const dataFrame = createDataFrame({
        name: selectedDataSetState.object.title!,
        fields: [],
        meta: {
          dataSourceRef: {
            id: selectedDataSetState.dataSource?.id!,
            name: selectedDataSetState.dataSource?.name!,
            type: selectedDataSetState.dataSource?.type!,
          },
        },
      });
      const temporaryIndexPattern = await indexPatternsService.create(
        dataFrameToSpec(dataFrame),
        true
      );
      indexPatternsService.saveToCache(temporaryIndexPattern.title, temporaryIndexPattern);
    }

    CatalogCacheManager.addRecentDataSet({
      id: selectedDataSetState.object.id!,
      name: selectedDataSetState.object.title ?? selectedDataSetState.object.id!,
      dataSourceRef: selectedDataSetState.dataSource?.id,
    });
    searchService.df.clear();
    const language = uiService.Settings.getUserQueryLanguage();
    const input = uiService.Settings.getQueryEnhancements(language)?.searchBar?.queryStringInput
      ?.initialValue;

    const query =
      !input || !selectedDataSetState.object
        ? ''
        : input.replace('<data_source>', selectedDataSetState.object.title!);
    uiService.Settings.setUserQueryString(query);

    queryService.queryString.setQuery({ query, language });
    queryService.dataSet.setDataSet({
      ...selectedDataSetState.object,
      timeFieldName: selectedDataSetState.timeFieldName,
    });
    onSelectDataSet(selectedDataSetState.object);
    closePopover();
  }, [
    indexPatternsService,
    onSelectDataSet,
    queryService.dataSet,
    queryService.queryString,
    searchService.df,
    selectedDataSetState.dataSource,
    selectedDataSetState.object,
    selectedDataSetState.timeFieldName,
    uiService.Settings,
  ]);

  const RefreshButton = (
    <EuiButtonEmpty
      iconType="refresh"
      onClick={onRefresh}
      isLoading={isCatalogCacheFetching(databasesLoadStatus, tablesLoadStatus)}
    />
  );

  const LoadingSpinner = (
    <EuiPanel hasShadow={false} hasBorder={false}>
      <EuiLoadingSpinner className="dataSetNavigator__loading" size="m" />
    </EuiPanel>
  );

  const indexPatternsLabel = i18n.translate('data.query.dataSetNavigator.indexPatternsName', {
    defaultMessage: 'Index patterns',
  });
  const indicesLabel = i18n.translate('data.query.dataSetNavigator.indicesName', {
    defaultMessage: 'Indexes',
  });
  const S3DataSourcesLabel = i18n.translate('data.query.dataSetNavigator.S3DataSourcesLabel', {
    defaultMessage: 'S3',
  });

  return (
    <EuiPopover
      button={
        <EuiButtonEmpty
          className="dataExplorerDSSelect"
          color="text"
          iconType="arrowDown"
          iconSide="right"
          onClick={onClick}
        >
          {selectedDataSetState.dataSource?.name
            ? `${selectedDataSetState.dataSource?.name}::${selectedDataSetState.object?.title}`
            : selectedDataSetState.object?.title}
        </EuiButtonEmpty>
      }
      isOpen={navigatorState.isOpen}
      closePopover={closePopover}
      anchorPosition="downLeft"
      panelPaddingSize="none"
    >
      <EuiContextMenu
        initialPanelId={0}
        className="datasetNavigator"
        size="s"
        panels={[
          {
            id: 0,
            items: [
              ...(CatalogCacheManager.getRecentDataSets().length > 0
                ? [
                    {
                      name: 'Recently Used',
                      panel: 8,
                    },
                  ]
                : []),
              {
                name: indexPatternsLabel,
                panel: 1,
              },
              {
                name: indicesLabel,
                panel: 2,
              },
              ...(navigatorState.isExternalDataSourcesEnabled
                ? [
                    {
                      name: S3DataSourcesLabel,
                      panel: 4,
                      onClick: async () => {
                        const externalDataSourcesCache = CatalogCacheManager.getExternalDataSourcesCache();
                        if (
                          (externalDataSourcesCache.status === CachedDataSourceStatus.Empty ||
                            externalDataSourcesCache.status === CachedDataSourceStatus.Failed) &&
                          !isCatalogCacheFetching(dataSourcesLoadStatus) &&
                          navigatorState.dataSources.length > 0
                        ) {
                          startLoadingDataSources(
                            navigatorState.dataSources.map((dataSource) => dataSource.id)
                          );
                        } else if (
                          externalDataSourcesCache.status === CachedDataSourceStatus.Updated
                        ) {
                          await handleSelectExternalDataSource(
                            externalDataSourcesCache.externalDataSources.map((ds) => ({
                              id: ds.dataSourceRef,
                              name: ds.name,
                              type: SIMPLE_DATA_SOURCE_TYPES.EXTERNAL,
                            }))
                          );
                        }
                      },
                    },
                  ]
                : []),
            ],
          },
          {
            id: 1,
            title: indexPatternsLabel,
            items: navigatorState.indexPatterns.flatMap((indexPattern, indexNum, arr) => [
              {
                name: indexPattern.title,
                onClick: async () => {
                  setSelectedDataSetState({
                    object: {
                      id: indexPattern.id,
                      title: indexPattern.title,
                      type: SIMPLE_DATA_SET_TYPES.INDEX_PATTERN,
                      timeFieldName: indexPattern.timeFieldName,
                      timeFields: indexPattern.timeFields,
                      fields: indexPattern.fields,
                    },
                    dataSource: indexPattern.dataSource,
                    database: undefined,
                    isExternal: false,
                    timeFieldName: indexPattern.timeFieldName,
                  });
                  await handleSelectedDataSet();
                },
              },
              ...(indexNum < arr.length - 1 ? [{ isSeparator: true }] : []),
            ]) as EuiContextMenuPanelItemDescriptor[],
            content: <div>{navigatorState.isLoading && LoadingSpinner}</div>,
          },
          {
            id: 2,
            title: 'Clusters',
            items: [
              ...navigatorState.dataSources.map((dataSource) => ({
                name: dataSource.name,
                panel: 3,
                onClick: async () => await handleSelectedDataSource(dataSource),
              })),
            ],
            content: <div>{navigatorState.isLoading && LoadingSpinner}</div>,
          },
          {
            id: 3,
            title: selectedDataSetState.dataSource?.name ?? indicesLabel,
            items: selectedDataSetState.dataSource?.indices?.map((object) => ({
              name: object.title,
              panel: 7,
              onClick: async () =>
                await handleSelectedObject({ ...object, type: SIMPLE_DATA_SET_TYPES.TEMPORARY }),
            })),
            content: <div>{navigatorState.isLoading && LoadingSpinner}</div>,
          },
          {
            id: 4,
            title: (
              <div>
                {S3DataSourcesLabel}
                {CatalogCacheManager.getExternalDataSourcesCache().status ===
                  CachedDataSourceStatus.Updated && RefreshButton}
              </div>
            ),
            items: [
              ...navigatorState.externalDataSources.map((dataSource) => ({
                name: dataSource.name,
                onClick: async () => await handleSelectExternalDataSource(dataSource),
                panel: 5,
              })),
            ],
            content: <div>{dataSourcesLoadStatus && LoadingSpinner}</div>,
          },
          {
            id: 5,
            title: selectedDataSetState.dataSource?.name
              ? selectedDataSetState.dataSource?.name
              : 'Databases',
            items: [
              ...navigatorState.externalDataSources.map((db) => ({
                name: db.name,
                onClick: async () => {
                  await handleSelectExternalDatabase(db);
                },
                panel: 6,
              })),
            ],
            content: <div>{isCatalogCacheFetching(databasesLoadStatus) && LoadingSpinner}</div>,
          },
          {
            id: 6,
            title: selectedDataSetState.database ? selectedDataSetState.database : 'Tables',
            items: [
              ...navigatorState.cachedTables.map((table) => ({
                name: table.name,
                onClick: async () => {
                  setSelectedDataSetState((prevState) => ({
                    ...prevState,
                    object: {
                      id: `${selectedDataSetState.dataSource!.name}.${
                        selectedDataSetState.database
                      }.${table.name}`,
                      title: `${selectedDataSetState.dataSource!.name}.${
                        selectedDataSetState.database
                      }.${table.name}`,
                      dataSource: {
                        id: selectedDataSetState.dataSource!.id,
                        name: selectedDataSetState.dataSource!.name,
                        type: selectedDataSetState.dataSource!.type,
                      },
                      type: SIMPLE_DATA_SET_TYPES.TEMPORARY_ASYNC,
                    },
                  }));
                },
              })),
            ],
            content: <div>{isCatalogCacheFetching(tablesLoadStatus) && LoadingSpinner}</div>,
          },
          {
            id: 7,
            title: selectedDataSetState.object?.title,
            content:
              navigatorState.isLoading || !selectedDataSetState.object ? (
                <div>{LoadingSpinner}</div>
              ) : (
                <EuiForm className="dataSetNavigatorFormWrapper">
                  <EuiFormRow
                    label="Time field"
                    helpText="Select the field you want to use for the time filter."
                  >
                    <EuiSelect
                      id="dateFieldSelector"
                      compressed
                      value={selectedDataSetState.timeFieldName}
                      options={[
                        ...(selectedDataSetState.object!.timeFields &&
                        selectedDataSetState.object!.timeFields!.length > 0
                          ? [
                              ...selectedDataSetState.object!.timeFields!.map((field: any) => ({
                                value: field.name,
                                text: field.name,
                              })),
                            ]
                          : []),
                        { value: 'no-time-filter', text: "I don't want to use a time filter" },
                      ]}
                      onChange={(event) => {
                        setNavigatorState((prevState) => ({
                          ...prevState,
                          timeFieldName:
                            event.target.value !== 'no-time-filter'
                              ? event.target.value
                              : undefined,
                        }));
                      }}
                      aria-label="Select a date field"
                    />
                  </EuiFormRow>
                  <EuiButton
                    size="s"
                    fullWidth
                    onClick={async () => {
                      await handleSelectedDataSet();
                    }}
                  >
                    Select
                  </EuiButton>
                </EuiForm>
              ),
          },
          {
            id: 8,
            title: 'Recently Used',
            items: CatalogCacheManager.getRecentDataSets().map((ds) => ({
              name: ds.name,
              onClick: async () => {
                setSelectedDataSetState({
                  object: {
                    id: ds.id ?? ds.name,
                    title: ds.name,
                  },
                  dataSource: {
                    id: ds.dataSourceRef!,
                    name: ds.dataSourceRef!,
                    type: ds.dataSourceRef!.startsWith('data-source')
                      ? SIMPLE_DATA_SOURCE_TYPES.DEFAULT
                      : SIMPLE_DATA_SOURCE_TYPES.EXTERNAL,
                  },
                  database: undefined,
                  isExternal: ds.dataSourceRef!.startsWith('data-source'),
                  timeFieldName: '',
                });
                await handleSelectedDataSet();
              },
            })),
          },
        ]}
      />
    </EuiPopover>
  );
};

// eslint-disable-next-line import/no-default-export
export default DataSetNavigator;
