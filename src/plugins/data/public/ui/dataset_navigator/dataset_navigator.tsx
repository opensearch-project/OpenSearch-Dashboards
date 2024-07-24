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
import _, { set } from 'lodash';
import { i18n } from '@osd/i18n';
import {
  createDataFrame,
  dataFrameToSpec,
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
import { DataSetContract } from '../../query';
import { useDataSetManager } from '../search_bar/lib/use_dataset_manager';

export interface DataSetNavigatorProps {
  dataSet: DataSetContract;
  savedObjectsClient?: SavedObjectsClientContract;
  http?: HttpStart;
}

export const DataSetNavigator = (props: DataSetNavigatorProps) => {
  const { savedObjectsClient, http, dataSet: dataSetManager } = props;
  const searchService = getSearchService();
  const queryService = getQueryService();
  const uiService = getUiService();
  const indexPatternsService = getIndexPatterns();
  const notifications = getNotifications();

  const { dataSet } = useDataSetManager({ dataSetManager });
  const [isOpen, setIsOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [indexPatterns, setIndexPatterns] = useState<any[]>([]);
  const [dataSources, setDataSources] = useState<SimpleDataSource[]>([]);
  const [isExternalDataSourcesEnabled, setIsExternalDataSourcesEnabled] = useState(false);

  const [selectedTimeFieldName, setSelectedTimeFieldName] = useState<string | undefined>();
  const [selectedObject, setSelectedObject] = useState<SimpleDataSet | undefined>();
  const [selectedDataSource, setSelectedDataSource] = useState<SimpleDataSource | undefined>();
  const [selectedDataSourceObjects, setSelectedDataSourceObjects] = useState<SimpleObject[]>([]);
  const [selectedExternalDataSource, setSelectedExternalDataSource] = useState<SimpleDataSource>();
  const [externalDataSources, setExternalDataSources] = useState<SimpleDataSource[]>([]);

  const [selectedDatabase, setSelectedDatabase] = useState<any>();
  const [cachedDatabases, setCachedDatabases] = useState<any[]>([]);
  const [cachedTables, setCachedTables] = useState<any[]>([]);
  const [failed, setFailed] = useState<boolean>(false);

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

  const closePopover = () => setIsOpen(false);

  // Fetch the data for the root menu on load
  useEffect(() => {
    const isMounted = true;
    setIsLoading(true);
    Promise.all([
      fetchIndexPatterns(savedObjectsClient!, ''),
      fetchDataSources(savedObjectsClient!),
      fetchIfExternalDataSourcesEnabled(http!),
    ])
      .then(([defaultIndexPatterns, defaultDataSources, isExternalDSEnabled]) => {
        if (!isMounted) return;
        setIndexPatterns(defaultIndexPatterns);
        setDataSources(defaultDataSources);
        setIsExternalDataSourcesEnabled(isExternalDSEnabled);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });
  }, [indexPatternsService, savedObjectsClient, http]);

  useEffect(() => {
    const status = dataSourcesLoadStatus.toLowerCase();
    const externalDataSourcesCache = CatalogCacheManager.getExternalDataSourcesCache();
    if (status === DirectQueryLoadingStatus.SUCCESS) {
      setExternalDataSources(
        externalDataSourcesCache.externalDataSources.map((ds) => ({
          id: ds.dataSourceRef,
          name: ds.name,
          type: SIMPLE_DATA_SOURCE_TYPES.EXTERNAL,
        }))
      );
    } else if (
      status === DirectQueryLoadingStatus.CANCELED ||
      status === DirectQueryLoadingStatus.FAILED
    ) {
      setFailed(true);
    }
  }, [dataSourcesLoadStatus]);

  // Retrieve databases from cache upon success
  useEffect(() => {
    const status = databasesLoadStatus.toLowerCase();
    if (selectedExternalDataSource) {
      const dataSourceCache = CatalogCacheManager.getOrCreateDataSource(
        selectedExternalDataSource?.name,
        selectedExternalDataSource?.id
      );
      if (status === DirectQueryLoadingStatus.SUCCESS) {
        setCachedDatabases(dataSourceCache.databases);
      } else if (
        status === DirectQueryLoadingStatus.CANCELED ||
        status === DirectQueryLoadingStatus.FAILED
      ) {
        setFailed(true);
      }
    }
  }, [selectedExternalDataSource, databasesLoadStatus]);

  // Start loading databases for datasource
  const handleSelectExternalDataSource = useCallback(
    async (externalDataSource) => {
      if (selectedExternalDataSource) {
        const dataSourceCache = CatalogCacheManager.getOrCreateDataSource(
          selectedExternalDataSource.name,
          selectedExternalDataSource.id
        );
        if (
          (dataSourceCache.status === CachedDataSourceStatus.Empty ||
            dataSourceCache.status === CachedDataSourceStatus.Failed) &&
          !isCatalogCacheFetching(databasesLoadStatus)
        ) {
          startLoadingDatabases({
            dataSourceName: selectedExternalDataSource.name,
            dataSourceMDSId: selectedExternalDataSource.id,
          });
        } else if (dataSourceCache.status === CachedDataSourceStatus.Updated) {
          setCachedDatabases(dataSourceCache.databases);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedExternalDataSource]
  );

  // Start loading tables for selected database
  const handleSelectExternalDatabase = useCallback(
    async (externalDatabase) => {
      if (selectedExternalDataSource && externalDatabase) {
        let databaseCache;
        try {
          databaseCache = CatalogCacheManager.getDatabase(
            selectedExternalDataSource.name,
            selectedDatabase,
            selectedExternalDataSource.id
          );
        } catch (error) {
          return;
        }
        if (
          databaseCache.status === CachedDataSourceStatus.Empty ||
          (databaseCache.status === CachedDataSourceStatus.Failed &&
            !isCatalogCacheFetching(tablesLoadStatus))
        ) {
          await startLoadingTables({
            dataSourceName: selectedExternalDataSource.name,
            databaseName: externalDatabase,
            dataSourceMDSId: selectedExternalDataSource.id,
          });
          setSelectedDatabase(externalDatabase);
        } else if (databaseCache.status === CachedDataSourceStatus.Updated) {
          setCachedTables(databaseCache.tables);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedExternalDataSource, selectedDatabase]
  );

  // Retrieve tables from cache upon success
  useEffect(() => {
    if (selectedExternalDataSource && selectedDatabase) {
      const tablesStatus = tablesLoadStatus.toLowerCase();
      let databaseCache;
      try {
        databaseCache = CatalogCacheManager.getDatabase(
          selectedExternalDataSource.name,
          selectedDatabase,
          selectedExternalDataSource.id
        );
      } catch (error) {
        return;
      }
      if (tablesStatus === DirectQueryLoadingStatus.SUCCESS) {
        setCachedTables(databaseCache.tables);
      } else if (
        tablesStatus === DirectQueryLoadingStatus.CANCELED ||
        tablesStatus === DirectQueryLoadingStatus.FAILED
      ) {
        setFailed(true);
      }
    }
  }, [selectedExternalDataSource, selectedDatabase, tablesLoadStatus]);

  const handleExternalDataSourcesRefresh = () => {
    if (!isCatalogCacheFetching(dataSourcesLoadStatus) && dataSources.length > 0) {
      startLoadingDataSources(dataSources.map((dataSource) => dataSource.id));
    }
  };

  const handleSelectedDataSource = useCallback(
    async (source) => {
      if (source) {
        setSelectedDataSource(source);
        setIsLoading(true);
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
        setSelectedDataSourceObjects(objects);
        setIsLoading(false);
      }
    },
    [searchService]
  );

  const handleSelectCluster = useCallback(
    async (cluster) => {
      setIsLoading(true);
      if (cluster) {
        const fields = await indexPatternsService.getFieldsForWildcard({
          pattern: cluster.title,
          dataSourceId: cluster.dataSourceRef?.id,
        });

        const timeFields = fields.filter((field: any) => field.type === 'date');
        const timeFieldName = timeFields?.length > 0 ? timeFields[0].name : undefined;
        setSelectedTimeFieldName(timeFieldName);
        setSelectedObject({
          id: object.id,
          title: object.title,
          fields,
          timeFields,
          timeFieldName,
          dataSourceRef: object.dataSourceRef,
          type: SIMPLE_DATA_SET_TYPES.TEMPORARY,
        });
        setIsLoading(false);
      }
    },
    [indexPatternsService]
  );

  const handleSelectedDataSet = useCallback(
    async (selectedDataSet: SimpleDataSet) => {
      if (!selectedDataSet) return;

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
        name: selectedDataSet.title ?? selectedDataSet.id!,
        dataSourceRef: selectedDataSet.dataSourceRef?.id,
      });

      // Update data set manager
      dataSetManager.setDataSet({
        id: selectedDataSet.id,
        title: selectedDataSet.title,
        dataSourceRef: selectedDataSet.dataSourceRef,
        timeFieldName: selectedDataSet.timeFieldName,
        type: selectedDataSet.type,
      });

      closePopover();
    },
    [queryService.dataSet, queryService.queryString, uiService.Settings, dataSetManager]
  );

  const RefreshButton = (
    <EuiButtonEmpty
      iconType="refresh"
      onClick={handleExternalDataSourcesRefresh}
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

  const createIndexPatternPanel = () => ({
    id: 1,
    title: indexPatternsLabel,
    items: indexPatterns.map((indexPattern) => ({
      name: indexPattern.title,
      onClick: () => handleSelectedDataSet(indexPattern),
    })),
    content: <div>{indexPatterns.length === 0 && LoadingSpinner}</div>,
  });

  const createIndexPanel = () => ({
    id: 2,
    title: indicesLabel,
    items: [
      ...dataSources.map((dataSource) => ({
        name: dataSource.name,
        panel: 3,
        onClick: async () => await handleSelectedDataSource(dataSource),
      })),
    ],
    content: <div>{isLoading && LoadingSpinner}</div>,
  });

  const createClusterPanel = () => ({
    id: 3,
    title: selectedDataSource?.name,
    items: selectedDataSourceObjects.map((cluster) => ({
      name: cluster.title,
      panel: 7,
      onClick: async () => {
        await handleSelectCluster({ ...cluster, type: SIMPLE_DATA_SET_TYPES.TEMPORARY });
      },
    })),
    content: <div>{isLoading && LoadingSpinner}</div>,
  });

  return (
    <EuiPopover
      button={
        <EuiButtonEmpty
          className="dataExplorerDSSelect"
          color="text"
          iconType="arrowDown"
          iconSide="right"
          onClick={() => setIsOpen(!isOpen)}
        >
          {`${dataSet?.dataSourceRef ? `${dataSet.dataSourceRef?.name}::` : ''}${dataSet?.title}`}
        </EuiButtonEmpty>
      }
      isOpen={isOpen}
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
            title: 'Data',
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
              ...(isExternalDataSourcesEnabled
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
                          dataSources.length > 0
                        ) {
                          startLoadingDataSources(dataSources.map((dataSource) => dataSource.id));
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
          createIndexPatternPanel(),
          createIndexPanel(),
          createClusterPanel(),
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
              ...externalDataSources.map((ds) => ({
                name: ds.name,
                onClick: () => setSelectedExternalDataSource(ds),
                panel: 5,
              })),
            ],
            content: <div>{dataSourcesLoadStatus && LoadingSpinner}</div>,
          },
          {
            id: 5,
            title: selectedExternalDataSource ? selectedExternalDataSource.name : 'Databases',
            items: [
              ...cachedDatabases.map((db) => ({
                name: db.name,
                onClick: async () => {
                  await handleSelectExternalDatabase(db.name);
                },
                panel: 6,
              })),
            ],
            content: <div>{isCatalogCacheFetching(databasesLoadStatus) && LoadingSpinner}</div>,
          },
          {
            id: 6,
            title: selectedDatabase ? selectedDatabase : 'Tables',
            items: [
              ...cachedTables.map((table) => ({
                name: table.name,
                onClick: async () => {
                  await handleSelectedDataSet({
                    id: table.name,
                    title: `${selectedExternalDataSource!.name}.${selectedDatabase}.${table.name}`,
                    dataSourceRef: {
                      id: selectedExternalDataSource!.id,
                      name: selectedExternalDataSource!.name,
                      type: selectedExternalDataSource!.type,
                    },
                    type: SIMPLE_DATA_SET_TYPES.TEMPORARY_ASYNC,
                  });
                },
              })),
            ],
            content: <div>{isCatalogCacheFetching(tablesLoadStatus) && LoadingSpinner}</div>,
          },
          {
            id: 7,
            title: selectedObject?.title,
            content:
              isLoading || !selectedObject ? (
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
                      options={[
                        ...(selectedObject!.timeFields && selectedObject!.timeFields.length > 0
                          ? [
                              ...selectedObject!.timeFields.map((field: any) => ({
                                value: field.name,
                                text: field.name,
                              })),
                            ]
                          : []),
                        { value: 'no-time-filter', text: "I don't want to use a time filter" },
                      ]}
                      onChange={(event) => {
                        setSelectedTimeFieldName(
                          event.target.value !== 'no-time-filter' ? event.target.value : undefined
                        );
                      }}
                      aria-label="Select a date field"
                    />
                  </EuiFormRow>
                  <EuiButton
                    size="s"
                    fullWidth
                    onClick={async () => {
                      await handleSelectedDataSet({
                        ...selectedObject,
                        timeFieldName: selectedTimeFieldName,
                      } as SimpleDataSet);
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
              onClick: async () =>
                await handleSelectedDataSet({
                  id: ds.id,
                  title: ds.name,
                  dataSourceRef: {
                    id: ds.dataSourceRef!,
                    name: ds.dataSourceRef!,
                    type: SIMPLE_DATA_SOURCE_TYPES.EXTERNAL,
                  },
                  type: SIMPLE_DATA_SET_TYPES.TEMPORARY_ASYNC,
                }),
            })),
          },
        ]}
      />
    </EuiPopover>
  );
};

// eslint-disable-next-line import/no-default-export
export default DataSetNavigator;
