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
  cachedDatabases: any[];
  cachedTables: SimpleObject[];
}

interface SelectedDataSetState extends SimpleDataSet {
  isExternal: boolean;
  database?: any | undefined;
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
    indexPatterns: [],
    cachedDatabases: [],
    cachedTables: [],
  });

  const [selectedDataSetState, setSelectedDataSetState] = useState<SelectedDataSetState>({
    id: dataSet?.id ?? '',
    title: dataSet?.title,
    type: dataSet?.type,
    isExternal: false,
    dataSourceRef: dataSet?.dataSourceRef,
    database: undefined,
    timeFieldName: dataSet?.timeFieldName,
    fields: dataSet?.fields,
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
        const selectedPattern = indexPatterns.find(
          (pattern) => pattern.id === props.dataSet?.getDataSet()?.id
        );
        if (selectedPattern) {
          setSelectedDataSetState({
            id: selectedPattern.id,
            title: selectedPattern.title,
            type: SIMPLE_DATA_SET_TYPES.INDEX_PATTERN,
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
            isExternal: false,
          });
        }
      })
      .finally(() => {
        isLoading(false);
      });
    return () => {
      setNavigatorState((prevState) => ({ ...prevState, isMounted: false }));
    };
  }, [savedObjectsClient, http, navigatorState.isMounted, props.dataSet]);

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
    if (selectedDataSetState.isExternal && selectedDataSetState.dataSourceRef) {
      const dataSourceCache = CatalogCacheManager.getOrCreateDataSource(
        selectedDataSetState.dataSourceRef.name,
        selectedDataSetState.dataSourceRef.id
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
  }, [databasesLoadStatus, selectedDataSetState.isExternal, selectedDataSetState.dataSourceRef]);

  const handleSelectExternalDataSource = useCallback(
    async (dataSource) => {
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
            cachedDatabases: dataSourceCache.databases,
          }));
        }
        setSelectedDataSetState((prevState) => ({
          ...prevState,
          dataSourceRef: dataSource,
          isExternal: true,
        }));
      }
    },
    [databasesLoadStatus, startLoadingDatabases]
  );

  // Start loading tables for selected database
  const handleSelectExternalDatabase = useCallback(
    (externalDatabase: SimpleDataSource) => {
      if (selectedDataSetState.dataSourceRef && externalDatabase) {
        let databaseCache: CachedDatabase;
        try {
          databaseCache = CatalogCacheManager.getDatabase(
            selectedDataSetState.dataSourceRef.name,
            externalDatabase.name,
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
            databaseName: externalDatabase.name,
            dataSourceMDSId: selectedDataSetState.dataSourceRef.id,
          });
        } else if (databaseCache.status === CachedDataSourceStatus.Updated) {
          setNavigatorState((prevState) => ({
            ...prevState,
            cachedTables: databaseCache.tables,
          }));
        }
      }
    },
    [selectedDataSetState.dataSourceRef, tablesLoadStatus, startLoadingTables]
  );

  // Retrieve tables from cache upon success
  useEffect(() => {
    if (
      selectedDataSetState.dataSourceRef &&
      selectedDataSetState.isExternal &&
      selectedDataSetState.database
    ) {
      const tablesStatus = tablesLoadStatus.toLowerCase();
      let databaseCache: CachedDatabase;
      try {
        databaseCache = CatalogCacheManager.getDatabase(
          selectedDataSetState.dataSourceRef.name,
          selectedDataSetState.database,
          selectedDataSetState.dataSourceRef.id
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
    selectedDataSetState.dataSourceRef,
    selectedDataSetState.isExternal,
    selectedDataSetState.database,
    notifications.toasts,
  ]);

  const handleSelectedDataSource = useCallback(
    async (source: SimpleDataSource) => {
      if (source) {
        isLoading(true);
        const indices = await fetchIndices(searchService, source.id);
        setSelectedDataSetState((prevState) => ({
          ...prevState,
          isExternal: false,
          dataSourceRef: {
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
      isLoading(true);
      if (object) {
        const fields = await indexPatternsService.getFieldsForWildcard({
          pattern: object.title,
          dataSourceId: object.dataSourceRef?.id,
        });

        const timeFields = fields.filter((field: any) => field.type === 'date');
        const timeFieldName = timeFields?.length > 0 ? timeFields[0].name : undefined;
        setSelectedDataSetState((prevState) => ({
          ...prevState,
          id: object.id,
          title: object.title,
          fields,
          timeFields,
          timeFieldName,
          type: SIMPLE_DATA_SET_TYPES.TEMPORARY,
        }));
        isLoading(false);
      }
    },
    [indexPatternsService]
  );

  const handleSelectedDataSet = useCallback(
    async (ds?: SimpleDataSet) => {
      const selectedDataSet = ds ?? selectedDataSetState;
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
        dataSourceRef: selectedDataSet.dataSourceRef,
        timeFieldName: selectedDataSet.timeFieldName,
        type: selectedDataSet.type,
      });

      closePopover();
    },
    [
      dataSetManager,
      queryService.dataSet,
      queryService.queryString,
      selectedDataSetState,
      uiService.Settings,
    ]
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
    title: selectedDataSetState.dataSourceRef?.name ?? indicesLabel,
    items: selectedDataSetState.dataSourceRef?.indices?.map((object) => ({
      name: object.title,
      panel: 7,
      onClick: async () =>
        await handleSelectedObject({ ...object, type: SIMPLE_DATA_SET_TYPES.TEMPORARY }),
    })),
    content: <div>{navigatorState.isLoading && createLoadingSpinner()}</div>,
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
    title: selectedDataSetState.dataSourceRef?.name
      ? selectedDataSetState.dataSourceRef?.name
      : 'Databases',
    items: [
      ...navigatorState.cachedDatabases.map((db) => ({
        name: db.name,
        onClick: async () => {
          setSelectedDataSetState((prevState) => ({
            ...prevState,
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
          onClick={onClick}
        >
          {dataSet?.dataSourceRef?.name
            ? `${dataSet.dataSourceRef?.name}::${dataSet?.title}`
            : dataSet?.title}
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
            title: selectedDataSetState.database ? selectedDataSetState.database.name : 'Tables',
            items: [
              ...navigatorState.cachedTables.map((table) => ({
                name: table.name,
                onClick: async () => {
                  const tableObject = {
                    ...selectedDataSetState,
                    id: `${selectedDataSetState.dataSourceRef!.name}.${
                      selectedDataSetState.database.name
                    }.${table.name}`,
                    title: `${selectedDataSetState.dataSourceRef!.name}.${
                      selectedDataSetState.database.name
                    }.${table.name}`,
                    dataSourceRef: {
                      id: selectedDataSetState.dataSourceRef!.id,
                      name: selectedDataSetState.dataSourceRef!.name,
                      type: selectedDataSetState.dataSourceRef!.type,
                    },
                    type: SIMPLE_DATA_SET_TYPES.TEMPORARY_ASYNC,
                  };
                  setSelectedDataSetState(tableObject);
                  handleSelectedDataSet(tableObject);
                },
              })),
            ],
            content: (
              <div>{isCatalogCacheFetching(tablesLoadStatus) && createLoadingSpinner()}</div>
            ),
          },
          {
            id: 7,
            title: selectedDataSetState.title,
            content:
              navigatorState.isLoading || !selectedDataSetState.title ? (
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
                        ...(selectedDataSetState.timeFields &&
                        selectedDataSetState.timeFields!.length > 0
                          ? [
                              ...selectedDataSetState.timeFields!.map((field: any) => ({
                                value: field.name,
                                text: field.name,
                              })),
                            ]
                          : []),
                        { value: 'no-time-filter', text: "I don't want to use a time filter" },
                      ]}
                      onChange={(event) => {
                        setSelectedDataSetState((prevState) => ({
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
              name: ds.title,
              onClick: async () => {
                setSelectedDataSetState({
                  id: ds.id ?? ds.title,
                  title: ds.title,
                  dataSourceRef: ds.dataSourceRef,
                  database: undefined,
                  isExternal: !ds.dataSourceRef?.type?.startsWith('data-source'),
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
