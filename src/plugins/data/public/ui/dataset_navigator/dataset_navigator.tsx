/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiContextMenu,
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
import { CachedDataSourceStatus, CachedDatabase, DirectQueryLoadingStatus } from './lib/types';
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
import { useDataSetManager } from '../search_bar/lib/use_dataset_manager';
import { DataSetContract } from '../../query';

export interface DataSetNavigatorProps {
  savedObjectsClient?: SavedObjectsClientContract;
  http?: HttpStart;
  dataSet?: DataSetContract;
}

interface DataSetNavigatorState {
  isMounted: boolean;
  isOpen: boolean;
  isLoading: boolean;
  isExternalDataSourcesEnabled: boolean;
  indexPatterns: any[];
  dataSources: SimpleDataSource[];
  externalDataSources: SimpleDataSource[];
  currentDataSourceRef?: SimpleDataSource;
  currentDataSet?: SimpleDataSet;
  cachedDatabases: SimpleObject[];
  cachedTables: SimpleObject[];
}

interface SelectedDataSetState extends SimpleDataSet {
  database?: SimpleObject | undefined;
}

export const DataSetNavigator = (props: DataSetNavigatorProps) => {
  const { savedObjectsClient, http, dataSet: dataSetManager } = props;
  const searchService = getSearchService();
  const queryService = getQueryService();
  const uiService = getUiService();
  const indexPatternsService = getIndexPatterns();
  const notifications = getNotifications();

  const { dataSet } = useDataSetManager({ dataSetManager: dataSetManager! });

  const [navigatorState, setNavigatorState] = useState<DataSetNavigatorState>({
    isOpen: false,
    isLoading: false,
    isMounted: false,
    isExternalDataSourcesEnabled: false,
    dataSources: [],
    externalDataSources: [],
    currentDataSourceRef: undefined,
    currentDataSet: undefined,
    indexPatterns: [],
    cachedDatabases: [],
    cachedTables: [],
  });

  const [selectedDataSetState, setSelectedDataSetState] = useState<SelectedDataSetState>();

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
      currentDataSet: undefined,
      currentDataSourceRef: undefined,
      cachedDatabases: [],
      cachedTables: [],
    }));
  };

  const onRefresh = () => {
    if (!isCatalogCacheFetching(dataSourcesLoadStatus) && navigatorState.dataSources.length > 0) {
      startLoadingDataSources(navigatorState.dataSources.map((dataSource) => dataSource.id));
    }
  };

  const handleSelectedDataSet = useCallback(
    async (ds?: SimpleDataSet) => {
      const selectedDataSet = ds ?? navigatorState.currentDataSet;
      if (!selectedDataSet || !selectedDataSet.id) return;

      const language = uiService.Settings.getUserQueryLanguage();
      const queryEnhancements = uiService.Settings.getQueryEnhancements(language);
      const initialInput = queryEnhancements?.searchBar?.queryStringInput?.initialValue;

      // Update query
      const query = initialInput
        ? initialInput.replace('<data_source>', selectedDataSet.title!)
        : '';
      uiService.Settings.setUserQueryString(query);
      queryService.queryString.setQuery({ query, language });

      // Update dataset
      queryService.dataSet.setDataSet(selectedDataSet);

      // Add to recent datasets
      CatalogCacheManager.addRecentDataSet({
        id: selectedDataSet.id,
        title: selectedDataSet.title ?? selectedDataSet.id!,
        dataSourceRef: selectedDataSet.dataSourceRef,
        timeFieldName: selectedDataSet.timeFieldName,
        type: selectedDataSet.type,
      });

      // Update data set manager
      dataSetManager!.setDataSet({
        id: selectedDataSet.id,
        title: selectedDataSet.title,
        ...(selectedDataSet.dataSourceRef && {
          dataSourceRef: {
            id: selectedDataSet.dataSourceRef?.id,
            name: selectedDataSet.dataSourceRef?.name,
            type: selectedDataSet.dataSourceRef?.type,
          },
        }),
        timeFieldName: selectedDataSet.timeFieldName,
        type: selectedDataSet.type,
      });

      closePopover();
    },
    [
      dataSetManager,
      navigatorState.currentDataSet,
      queryService.dataSet,
      queryService.queryString,
      uiService.Settings,
    ]
  );

  useEffect(() => {
    setNavigatorState((prevState) => ({ ...prevState, isMounted: true, isLoading: true }));
    Promise.all([
      dataSetManager?.init(indexPatternsService),
      fetchIndexPatterns(savedObjectsClient!, ''),
      fetchDataSources(savedObjectsClient!),
      fetchIfExternalDataSourcesEnabled(http!),
    ])
      .then(([defaultDataSet, indexPatterns, dataSources, isExternalDataSourcesEnabled]) => {
        if (!navigatorState.isMounted) return;
        setNavigatorState((prevState) => ({
          ...prevState,
          isExternalDataSourcesEnabled,
          indexPatterns,
          dataSources,
        }));

        const selectedPattern = dataSet ?? defaultDataSet;

        if (selectedPattern) {
          setSelectedDataSetState({
            id: selectedPattern.id,
            title: selectedPattern.title,
            type: selectedPattern.type,
            timeFieldName: selectedPattern.timeFieldName,
            fields: selectedPattern.fields,
            ...(selectedPattern.dataSourceRef
              ? {
                  dataSourceRef: {
                    id: selectedPattern.dataSourceRef.id,
                    name: selectedPattern.dataSourceRef.name,
                    type: selectedPattern.dataSourceRef.type,
                  },
                }
              : { dataSourceRef: undefined }),
            database: undefined,
          });
        }
      })
      .finally(() => {
        isLoading(false);
      });
    return () => {
      setNavigatorState((prevState) => ({ ...prevState, isMounted: false }));
    };
  }, [
    dataSet,
    dataSetManager,
    http,
    indexPatternsService,
    navigatorState.isMounted,
    savedObjectsClient,
  ]);

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
    if (
      selectedDataSetState?.dataSourceRef &&
      selectedDataSetState.dataSourceRef.type === SIMPLE_DATA_SOURCE_TYPES.EXTERNAL
    ) {
      const dataSourceCache = CatalogCacheManager.getOrCreateDataSource(
        selectedDataSetState.dataSourceRef.name,
        selectedDataSetState.dataSourceRef.id
      );
      if (status === DirectQueryLoadingStatus.SUCCESS) {
        setNavigatorState((prevState) => ({
          ...prevState,
          cachedDatabases: dataSourceCache.databases.map((database) => ({
            id: database.name,
            title: database.name,
          })),
        }));
      } else if (
        status === DirectQueryLoadingStatus.CANCELED ||
        status === DirectQueryLoadingStatus.FAILED
      ) {
        setNavigatorState((prevState) => ({ ...prevState, failed: true }));
      }
    }
  }, [databasesLoadStatus, selectedDataSetState?.dataSourceRef]);

  const handleSelectExternalDataSource = useCallback(
    async (dataSource: SimpleDataSource) => {
      if (dataSource && dataSource.type === SIMPLE_DATA_SOURCE_TYPES.EXTERNAL) {
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
            cachedDatabases: dataSourceCache.databases.map((database) => ({
              id: database.name,
              title: database.name,
            })),
          }));
        }
        setSelectedDataSetState((prevState) => ({
          ...prevState!,
          dataSourceRef: dataSource,
        }));
      }
    },
    [databasesLoadStatus, startLoadingDatabases]
  );

  // Start loading tables for selected database
  const handleSelectExternalDatabase = useCallback(
    (externalDatabase: SimpleObject) => {
      if (selectedDataSetState?.dataSourceRef && externalDatabase && externalDatabase.title) {
        let databaseCache: CachedDatabase;
        try {
          databaseCache = CatalogCacheManager.getDatabase(
            selectedDataSetState.dataSourceRef.name,
            externalDatabase.title,
            selectedDataSetState.dataSourceRef.id
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
            dataSourceName: selectedDataSetState.dataSourceRef.name,
            databaseName: externalDatabase.title,
            dataSourceMDSId: selectedDataSetState.dataSourceRef.id,
          });
        } else if (databaseCache.status === CachedDataSourceStatus.Updated) {
          setNavigatorState((prevState) => ({
            ...prevState,
            cachedTables: databaseCache.tables.map((table) => ({
              id: table.name,
              title: table.name,
            })),
          }));
        }
      }
    },
    [selectedDataSetState?.dataSourceRef, tablesLoadStatus, startLoadingTables]
  );

  // Retrieve tables from cache upon success
  useEffect(() => {
    if (
      selectedDataSetState?.dataSourceRef &&
      selectedDataSetState.dataSourceRef?.type === SIMPLE_DATA_SOURCE_TYPES.EXTERNAL &&
      selectedDataSetState.database
    ) {
      const tablesStatus = tablesLoadStatus.toLowerCase();
      let databaseCache: CachedDatabase;
      try {
        databaseCache = CatalogCacheManager.getDatabase(
          selectedDataSetState.dataSourceRef.name,
          selectedDataSetState.database.title!,
          selectedDataSetState.dataSourceRef.id
        );
      } catch (error) {
        return;
      }
      if (tablesStatus === DirectQueryLoadingStatus.SUCCESS) {
        setNavigatorState((prevState) => ({
          ...prevState,
          cachedTables: databaseCache.tables.map((table) => ({
            id: table.name,
            title: table.name,
          })),
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
    selectedDataSetState?.dataSourceRef,
    selectedDataSetState?.database,
    notifications.toasts,
  ]);

  const handleSelectedDataSource = useCallback(
    async (source: SimpleDataSource) => {
      if (source) {
        isLoading(true);
        const indices = await fetchIndices(searchService, source.id);
        setNavigatorState((prevState) => ({
          ...prevState,
          currentDataSourceRef: {
            ...source,
            indices: indices.map((indexName: string) => ({
              id: indexName,
              title: indexName,
              dataSourceRef: {
                id: source.id,
                name: source.name,
                type: source.type,
              },
            })),
          },
        }));
        isLoading(false);
      }
    },
    [searchService]
  );

  const handleSelectedObject = useCallback(
    async (object) => {
      if (object) {
        isLoading(true);
        const fields = await indexPatternsService.getFieldsForWildcard({
          pattern: object.title,
          dataSourceId: object.dataSourceRef?.id,
        });

        const timeFields = fields.filter((field: any) => field.type === 'date');
        const timeFieldName = timeFields?.length > 0 ? timeFields[0].name : undefined;
        setNavigatorState((prevState) => ({
          ...prevState,
          currentDataSet: {
            id: `${object.dataSourceRef ? object.dataSourceRef.id : ''}.${object.id}`,
            title: object.title,
            fields,
            timeFields,
            timeFieldName,
            dataSourceRef: object.dataSourceRef,
            type: SIMPLE_DATA_SET_TYPES.TEMPORARY,
          },
        }));
        isLoading(false);
      }
    },
    [indexPatternsService]
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

  const createRefreshButton = () => (
    <EuiButtonEmpty
      iconType="refresh"
      onClick={onRefresh}
      isLoading={isCatalogCacheFetching(databasesLoadStatus, tablesLoadStatus)}
    />
  );

  const createLoadingSpinner = () => (
    <EuiPanel hasShadow={false} hasBorder={false}>
      <EuiLoadingSpinner className="dataSetNavigator__loading" size="m" />
    </EuiPanel>
  );

  const createIndexPatternsPanel = () => ({
    id: 1,
    title: indexPatternsLabel,
    items: navigatorState.indexPatterns.map((indexPattern) => ({
      name: indexPattern.title,
      onClick: async () => await handleSelectedDataSet(indexPattern),
    })),
    content: <div>{navigatorState.indexPatterns.length === 0 && createLoadingSpinner()}</div>,
  });

  const createIndexesPanel = () => ({
    id: 2,
    title: indicesLabel,
    items: [
      ...navigatorState.dataSources.map((dataSource) => ({
        name: dataSource.name,
        panel: 3,
        onClick: async () => await handleSelectedDataSource(dataSource),
      })),
    ],
    content: <div>{navigatorState.isLoading && createLoadingSpinner()}</div>,
  });

  const createDataSourcesPanel = () => ({
    id: 3,
    title: navigatorState.currentDataSourceRef?.name ?? indicesLabel,
    items: navigatorState.currentDataSourceRef?.indices?.map((object) => ({
      name: object.title,
      panel: 7,
      onClick: async () => await handleSelectedObject(object),
    })),
    content: (
      <div>
        {navigatorState.isLoading && !navigatorState.currentDataSourceRef && createLoadingSpinner()}
      </div>
    ),
  });

  const createS3DataSourcesPanel = () => ({
    id: 4,
    title: (
      <div>
        {S3DataSourcesLabel}
        {CatalogCacheManager.getExternalDataSourcesCache().status ===
          CachedDataSourceStatus.Updated && createRefreshButton()}
      </div>
    ),
    items: [
      ...navigatorState.externalDataSources.map((dataSource) => ({
        name: dataSource.name,
        onClick: async () => await handleSelectExternalDataSource(dataSource),
        panel: 5,
      })),
    ],
    content: <div>{dataSourcesLoadStatus && createLoadingSpinner()}</div>,
  });

  const createDatabasesPanel = () => ({
    id: 5,
    title: selectedDataSetState?.dataSourceRef?.name
      ? selectedDataSetState.dataSourceRef?.name
      : 'Databases',
    items: [
      ...navigatorState.cachedDatabases.map((db) => ({
        name: db.title,
        onClick: async () => {
          setSelectedDataSetState((prevState) => ({
            ...prevState!,
            database: db,
          }));
          await handleSelectExternalDatabase(db);
        },
        panel: 6,
      })),
    ],
    content: <div>{isCatalogCacheFetching(databasesLoadStatus) && createLoadingSpinner()}</div>,
  });

  return (
    <EuiPopover
      button={
        <EuiButtonEmpty
          className="dataExplorerDSSelect"
          color="text"
          iconType="arrowDown"
          iconSide="right"
          flush="left"
          onClick={onClick}
        >
          {selectedDataSetState &&
          selectedDataSetState?.dataSourceRef &&
          selectedDataSetState?.dataSourceRef.name
            ? `${selectedDataSetState.dataSourceRef?.name}::${selectedDataSetState?.title}`
            : selectedDataSetState?.title}
        </EuiButtonEmpty>
      }
      isOpen={navigatorState.isOpen}
      closePopover={closePopover}
      anchorPosition="downLeft"
      display="block"
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
                          setNavigatorState((prevState) => ({
                            ...prevState,
                            externalDataSources: externalDataSourcesCache.externalDataSources.map(
                              (ds) => ({
                                id: ds.dataSourceRef,
                                name: ds.name,
                                type: SIMPLE_DATA_SOURCE_TYPES.EXTERNAL,
                              })
                            ),
                          }));
                        }
                      },
                    },
                  ]
                : []),
            ],
          },
          createIndexPatternsPanel(),
          createIndexesPanel(),
          createDataSourcesPanel(),
          createS3DataSourcesPanel(),
          createDatabasesPanel(),
          {
            id: 6,
            title: selectedDataSetState?.database ? selectedDataSetState.database.title : 'Tables',
            items: [
              ...navigatorState.cachedTables.map((table) => ({
                name: table.title,
                onClick: async () => {
                  const tableObject: SimpleDataSet = {
                    ...selectedDataSetState,
                    id: `${selectedDataSetState?.dataSourceRef!.name}.${
                      selectedDataSetState?.database?.title
                    }.${table.title}`,
                    title: `${selectedDataSetState?.dataSourceRef!.name}.${
                      selectedDataSetState?.database?.title
                    }.${table.title}`,
                    ...(selectedDataSetState?.dataSourceRef && {
                      dataSourceRef: {
                        id: selectedDataSetState?.dataSourceRef!.id,
                        name: selectedDataSetState?.dataSourceRef!.name,
                        type: selectedDataSetState?.dataSourceRef!.type,
                      } as SimpleDataSource,
                    }),
                    type: SIMPLE_DATA_SET_TYPES.TEMPORARY_ASYNC,
                  };
                  await handleSelectedDataSet(tableObject);
                },
              })),
            ],
            content: (
              <div>{isCatalogCacheFetching(tablesLoadStatus) && createLoadingSpinner()}</div>
            ),
          },
          {
            id: 7,
            title: navigatorState.currentDataSet?.title,
            content:
              !navigatorState.currentDataSet || !navigatorState.currentDataSet?.title ? (
                <div>{createLoadingSpinner()}</div>
              ) : (
                <EuiForm className="dataSetNavigatorFormWrapper">
                  <EuiFormRow
                    label="Time field"
                    helpText="Select the field you want to use for the time filter."
                  >
                    <EuiSelect
                      id="dateFieldSelector"
                      compressed
                      options={[
                        ...(navigatorState.currentDataSet!.timeFields &&
                        navigatorState.currentDataSet!.timeFields.length > 0
                          ? [
                              ...navigatorState.currentDataSet!.timeFields!.map((field: any) => ({
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
                          currentDataSet: {
                            ...prevState.currentDataSet!,
                            timeFieldName:
                              event.target.value !== 'no-time-filter'
                                ? (event.target.value as string)
                                : undefined,
                          },
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
              name: ds.title,
              onClick: async () => {
                setSelectedDataSetState({
                  id: ds.id ?? ds.title,
                  title: ds.title,
                  dataSourceRef: ds.dataSourceRef,
                  database: undefined,
                  timeFieldName: ds.timeFieldName,
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
