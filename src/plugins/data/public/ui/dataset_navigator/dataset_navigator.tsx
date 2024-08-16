/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiContextMenu,
  EuiForm,
  EuiFormRow,
  EuiIcon,
  EuiLoadingSpinner,
  EuiPanel,
  EuiPopover,
  EuiSelect,
  EuiToolTip,
} from '@elastic/eui';
import { HttpStart, SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { i18n } from '@osd/i18n';
import { Dataset, DataSource, DataStructure } from '../../../common';
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
import { fetchDataSources, fetchIndexPatterns, fetchIndices, isCatalogCacheFetching } from './lib';
import { useDataSetManager } from '../search_bar/lib/use_dataset_manager';
import { DataSetContract } from '../../query';

export interface DataSetNavigatorProps {
  savedObjectsClient?: SavedObjectsClientContract;
  http?: HttpStart;
  dataSetManager?: DataSetContract;
}

interface SelectedDataSetState extends Dataset {
  database?: DataStructure | undefined;
}

export const DataSetNavigator: React.FC<DataSetNavigatorProps> = ({
  savedObjectsClient,
  http,
  dataSetManager: initialDataSet,
}) => {
  const searchService = getSearchService();
  const queryService = getQueryService();
  const uiService = getUiService();
  const indexPatternsService = getIndexPatterns();
  const notifications = getNotifications();

  const { dataSet } = useDataSetManager({ dataSetManager: initialDataSet! });

  const isInitialized = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [externalDataSources, setExternalDataSources] = useState<DataSource[]>([]);
  const [indexPatterns, setIndexPatterns] = useState<Dataset[]>([]);
  const [cachedDatabases, setCachedDatabases] = useState<DataStructure[]>([]);
  const [cachedTables, setCachedTables] = useState<DataStructure[]>([]);
  const [selectedDataSetState, setSelectedDataSetState] = useState<
    SelectedDataSetState | undefined
  >(undefined);
  const isExternalDataSourcesEnabled = externalDataSources.length > 0;

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

  const togglePopover = () => setIsOpen((prev) => !prev);
  const closePopover = () => setIsOpen(false);

  const onRefresh = useCallback(() => {
    if (!isCatalogCacheFetching(dataSourcesLoadStatus) && dataSources.length > 0) {
      startLoadingDataSources(dataSources);
    }
  }, [dataSourcesLoadStatus, dataSources, startLoadingDataSources]);

  const handleSelectedDataSet = useCallback(
    async (ds?: Dataset) => {
      const selectedDataSet = ds ?? selectedDataSetState;
      if (!selectedDataSet || !selectedDataSet.id) return;

      const language = uiService.Settings.getUserQueryLanguage();
      const queryEnhancements = uiService.Settings.getQueryEnhancements(language);
      const initialInput = queryEnhancements?.searchBar?.queryStringInput?.initialValue;

      const query = initialInput
        ? initialInput.replace('<data_source>', selectedDataSet.title!)
        : '';
      uiService.Settings.setUserQueryString(query);
      queryService.queryString.setQuery({ query, language });

      queryService.dataSetManager.setDataSet(selectedDataSet);

      CatalogCacheManager.addRecentDataSet({
        id: selectedDataSet.id,
        title: selectedDataSet.title ?? selectedDataSet.id!,
        dataSource: selectedDataSet.dataSource,
        timeFieldName: selectedDataSet.timeFieldName,
        type: selectedDataSet.type,
      });

      setSelectedDataSetState({
        id: selectedDataSet.id,
        title: selectedDataSet.title,
        ...(selectedDataSet.dataSource && {
          dataSource: {
            id: selectedDataSet.dataSource?.id,
            title: selectedDataSet.dataSource?.title,
            type: selectedDataSet.dataSource?.type,
          },
        }),
        timeFieldName: selectedDataSet.timeFieldName,
        type: selectedDataSet.type,
      });

      closePopover();
    },
    [queryService, setSelectedDataSetState, selectedDataSetState, uiService.Settings]
  );

  useEffect(() => {
    const initializeData = async () => {
      if (isInitialized.current) return;

      setIsLoading(true);
      try {
        const [fetchedIndexPatterns, fetchedDataSources] = await Promise.all([
          fetchIndexPatterns(savedObjectsClient!, ''),
          fetchDataSources(savedObjectsClient!),
        ]);

        const externalDataSourcesCache = CatalogCacheManager.getExternalDataSourcesCache();
        if (externalDataSourcesCache.status === CachedDataSourceStatus.Updated) {
          setExternalDataSources(
            externalDataSourcesCache.dataSources.map((ds) => ({
              id: ds.id,
              title: ds.title,
              type: ds.type,
            }))
          );
        } else if (fetchedDataSources.length > 0) {
          setExternalDataSources(await startLoadingDataSources(fetchedDataSources));
        }

        setIndexPatterns(fetchedIndexPatterns);
        setDataSources(fetchedDataSources);

        if (dataSet) {
          setSelectedDataSetState({
            id: dataSet.id,
            title: dataSet.title,
            type: dataSet.type,
            timeFieldName: dataSet.timeFieldName,
            ...(dataSet.dataSource
              ? {
                  dataSource: {
                    id: dataSet.dataSource.id,
                    title: dataSet.dataSource.title,
                    type: dataSet.dataSource.type,
                  },
                }
              : { dataSource: undefined }),
            database: undefined,
          });
        }

        isInitialized.current = true;
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const status = dataSourcesLoadStatus.toLowerCase();
    const externalDataSourcesCache = CatalogCacheManager.getExternalDataSourcesCache();
    if (status === DirectQueryLoadingStatus.SUCCESS) {
      setExternalDataSources(
        externalDataSourcesCache.dataSources.map((ds) => ({
          id: ds.id,
          title: ds.title,
          type: ds.type,
        }))
      );
    } else if (
      status === DirectQueryLoadingStatus.CANCELED ||
      status === DirectQueryLoadingStatus.FAILED
    ) {
      notifications.toasts.addWarning('Error loading external data sources');
    }
  }, [dataSourcesLoadStatus, notifications.toasts]);

  const handleSelectExternalDataSource = useCallback(
    async (dataSource: DataSource) => {
      if (dataSource && dataSource.type === 'EXTERNAL') {
        const dataSourceCache = CatalogCacheManager.getOrCreateDataSource(
          dataSource.title,
          dataSource.id!
        );
        if (
          (dataSourceCache.status === CachedDataSourceStatus.Empty ||
            dataSourceCache.status === CachedDataSourceStatus.Failed) &&
          !isCatalogCacheFetching(databasesLoadStatus)
        ) {
          await startLoadingDatabases({
            dataSourceName: dataSource.title,
            dataSourceMDSId: dataSource.id!,
          });
        } else if (dataSourceCache.status === CachedDataSourceStatus.Updated) {
          setCachedDatabases(
            dataSourceCache.databases.map((db) => ({
              id: db.id,
              title: db.title,
              type: 'DATABASE',
            }))
          );
        }
        setSelectedDataSetState((prevState) => ({
          ...prevState!,
          dataSource,
        }));
      }
    },
    [databasesLoadStatus, startLoadingDatabases]
  );

  const handleSelectExternalDatabase = useCallback(
    (externalDatabase: DataStructure) => {
      if (selectedDataSetState?.dataSource && externalDatabase && externalDatabase.title) {
        let databaseCache: CachedDatabase;
        try {
          databaseCache = CatalogCacheManager.getDatabase(
            selectedDataSetState.dataSource.title,
            externalDatabase.title,
            selectedDataSetState.dataSource.id!
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
            dataSourceName: selectedDataSetState.dataSource.title,
            databaseName: externalDatabase.title,
            dataSourceMDSId: selectedDataSetState.dataSource.id!,
          });
        } else if (databaseCache.status === CachedDataSourceStatus.Updated) {
          setCachedTables(
            databaseCache.tables.map((table) => ({
              id: table.title,
              title: table.title,
              type: 'TABLE',
            }))
          );
        }
      }
    },
    [selectedDataSetState?.dataSource, tablesLoadStatus, startLoadingTables]
  );

  useEffect(() => {
    const status = databasesLoadStatus.toLowerCase();
    if (selectedDataSetState?.dataSource && selectedDataSetState.dataSource.type === 'EXTERNAL') {
      const dataSourceCache = CatalogCacheManager.getOrCreateDataSource(
        selectedDataSetState.dataSource.title,
        selectedDataSetState.dataSource.id!
      );
      if (status === DirectQueryLoadingStatus.SUCCESS) {
        setCachedDatabases(
          dataSourceCache.databases.map((db) => ({
            id: db.title,
            title: db.title,
            type: 'DATABASE',
          }))
        );
      } else if (
        status === DirectQueryLoadingStatus.CANCELED ||
        status === DirectQueryLoadingStatus.FAILED
      ) {
        notifications.toasts.addWarning('Error loading databases');
      }
    }
  }, [databasesLoadStatus, selectedDataSetState?.dataSource, notifications.toasts]);

  useEffect(() => {
    if (
      selectedDataSetState?.dataSource &&
      selectedDataSetState.dataSource?.type === 'EXTERNAL' &&
      selectedDataSetState.database
    ) {
      const tablesStatus = tablesLoadStatus.toLowerCase();
      let databaseCache: CachedDatabase;
      try {
        databaseCache = CatalogCacheManager.getDatabase(
          selectedDataSetState.dataSource.title,
          selectedDataSetState.database.title!,
          selectedDataSetState.dataSource.id!
        );
      } catch (error) {
        return;
      }
      if (tablesStatus === DirectQueryLoadingStatus.SUCCESS) {
        setCachedTables(
          databaseCache.tables.map((table) => ({
            id: table.id,
            title: table.title,
            type: 'TABLE',
          }))
        );
      } else if (
        tablesStatus === DirectQueryLoadingStatus.CANCELED ||
        tablesStatus === DirectQueryLoadingStatus.FAILED
      ) {
        notifications.toasts.addWarning('Error loading tables');
      }
    }
  }, [
    tablesLoadStatus,
    selectedDataSetState?.dataSource,
    selectedDataSetState?.database,
    notifications.toasts,
  ]);

  const handleSelectedDataSource = useCallback(
    async (source: DataSource) => {
      if (source) {
        setIsLoading(true);
        try {
          const indices = await fetchIndices(searchService, source.id!);
          const updatedSource = {
            ...source,
            indices: indices.map((indexName: string) => ({
              id: indexName,
              title: indexName,
              dataSource: {
                id: source.id,
                title: source.title,
                type: source.type,
              },
            })),
          };

          setDataSources((prevDataSources) =>
            prevDataSources.map((ds) => (ds.id === source.id ? updatedSource : ds))
          );

          setSelectedDataSetState((prevState) => ({
            ...prevState!,
            dataSource: updatedSource,
          }));
        } finally {
          setIsLoading(false);
        }
      }
    },
    [searchService]
  );

  const handleSelectedObject = useCallback(
    async (object: DataStructure) => {
      if (object) {
        setIsLoading(true);
        const fields = await indexPatternsService.getFieldsForWildcard({
          pattern: object.title,
          dataSourceId: object.parent?.id,
        });

        const timeFields = fields.filter((field: any) => field.type === 'date');
        const timeFieldName = timeFields?.length > 0 ? timeFields[0].title : undefined;
        setSelectedDataSetState((prevState) => ({
          ...prevState!,
          id: `${object.parent ? object.parent.id : ''}.${object.id}`,
          title: object.title,
          fields,
          timeFields,
          timeFieldName,
          dataSource: object.parent,
          type: 'TEMPORARY',
        }));
        setIsLoading(false);
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

  const createRefreshButton = useCallback(
    () => (
      <EuiButtonEmpty
        iconType="refresh"
        onClick={onRefresh}
        isLoading={isCatalogCacheFetching(databasesLoadStatus, tablesLoadStatus)}
      />
    ),
    [onRefresh, databasesLoadStatus, tablesLoadStatus]
  );

  const createLoadingSpinner = () => (
    <EuiPanel hasShadow={false} hasBorder={false}>
      <EuiLoadingSpinner className="dataSetNavigator__loading" size="m" />
    </EuiPanel>
  );

  const panels = useMemo(
    () => [
      {
        id: 0,
        items: [
          ...(CatalogCacheManager.getRecentDataSets().length > 0
            ? [
                {
                  title: 'Recently Used',
                  panel: 8,
                },
              ]
            : []),
          {
            title: indexPatternsLabel,
            panel: 1,
          },
          {
            title: indicesLabel,
            panel: 2,
          },
          ...(isExternalDataSourcesEnabled
            ? [
                {
                  title: S3DataSourcesLabel,
                  panel: 4,
                  onClick: () => {},
                },
              ]
            : []),
        ],
      },
      {
        id: 1,
        title: indexPatternsLabel,
        items: indexPatterns.map((indexPattern) => ({
          title: indexPattern.title,
          onClick: () => handleSelectedDataSet(indexPattern),
        })),
        content: indexPatterns.length === 0 && createLoadingSpinner(),
      },
      {
        id: 2,
        title: indicesLabel,
        items: dataSources.map((dataSource) => ({
          title: dataSource.title,
          panel: 3,
          onClick: () => handleSelectedDataSource(dataSource),
        })),
        content: isLoading && createLoadingSpinner(),
      },
      {
        id: 3,
        title: selectedDataSetState?.dataSource?.title ?? indicesLabel,
        items:
          selectedDataSetState?.dataSource?.indices?.map((object) => ({
            title: object.title,
            panel: 7,
            onClick: () => handleSelectedObject(object),
          })) ?? [],
        content: isLoading && !selectedDataSetState?.dataSource?.indices && createLoadingSpinner(),
      },
      {
        id: 4,
        title: (
          <div>
            {S3DataSourcesLabel}
            {CatalogCacheManager.getExternalDataSourcesCache().status ===
              CachedDataSourceStatus.Updated && createRefreshButton()}
          </div>
        ),
        items: externalDataSources.map((dataSource) => ({
          title: dataSource.title,
          onClick: async () => await handleSelectExternalDataSource(dataSource),
          panel: 5,
        })),
        content: isCatalogCacheFetching(dataSourcesLoadStatus) && createLoadingSpinner(),
      },
      {
        id: 5,
        title: selectedDataSetState?.dataSource?.title ?? 'Databases',
        items: cachedDatabases.map((db) => ({
          title: db.title,
          onClick: () => {
            setSelectedDataSetState((prevState) => ({
              ...prevState!,
              database: db,
            }));
            handleSelectExternalDatabase(db);
          },
          panel: 6,
        })),
        content: isCatalogCacheFetching(databasesLoadStatus) && createLoadingSpinner(),
      },
      {
        id: 6,
        title: selectedDataSetState?.database?.title ?? 'Tables',
        items: cachedTables.map((table) => ({
          title: table.title,
          onClick: () => {
            const tableObject: Dataset = {
              ...selectedDataSetState!,
              // TODO: potential error case where we do not append the MDS ID for ID
              id: `${selectedDataSetState?.dataSource?.meta?.name}.${selectedDataSetState?.database?.title}.${table.title}`,
              title: `${selectedDataSetState?.dataSource?.meta?.name}.${selectedDataSetState?.database?.title}.${table.title}`,
              ...(selectedDataSetState?.dataSource && {
                dataSource: {
                  id: selectedDataSetState?.dataSource!.id,
                  title: selectedDataSetState?.dataSource!.title,
                  type: selectedDataSetState?.dataSource!.type,
                },
              }),
              type: 'TEMPORARY_ASYNC',
            };
            handleSelectedDataSet(tableObject);
          },
        })),
        content: isCatalogCacheFetching(tablesLoadStatus) && createLoadingSpinner(),
      },
      {
        id: 7,
        title: selectedDataSetState?.title,
        content:
          !selectedDataSetState || !selectedDataSetState?.title ? (
            createLoadingSpinner()
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
                    selectedDataSetState.timeFields.length > 0
                      ? selectedDataSetState.timeFields.map((field: any) => ({
                          value: field.value,
                          text: field.title,
                        }))
                      : []),
                    { value: 'no-time-filter', text: "I don't want to use a time filter" },
                  ]}
                  onChange={(event) => {
                    setSelectedDataSetState((prevState) => ({
                      ...prevState!,
                      timeFieldName:
                        event.target.value !== 'no-time-filter' ? event.target.value : undefined,
                    }));
                  }}
                  aria-label="Select a date field"
                />
              </EuiFormRow>
              <EuiButton size="s" fullWidth onClick={() => handleSelectedDataSet()}>
                Select
              </EuiButton>
            </EuiForm>
          ),
      },
      {
        id: 8,
        title: 'Recently Used',
        items: CatalogCacheManager.getRecentDataSets().map((ds) => ({
          title: ds.title,
          onClick: () => {
            setSelectedDataSetState({
              id: ds.id ?? ds.title,
              title: ds.title,
              dataSource: ds.dataSource,
              database: undefined,
              timeFieldName: ds.timeFieldName,
              type: ds.type,
            });
            handleSelectedDataSet();
          },
        })),
      },
    ],
    [
      indexPatternsLabel,
      indicesLabel,
      isExternalDataSourcesEnabled,
      S3DataSourcesLabel,
      indexPatterns,
      dataSources,
      isLoading,
      selectedDataSetState,
      createRefreshButton,
      externalDataSources,
      dataSourcesLoadStatus,
      cachedDatabases,
      databasesLoadStatus,
      cachedTables,
      tablesLoadStatus,
      handleSelectedDataSet,
      handleSelectedDataSource,
      handleSelectedObject,
      handleSelectExternalDataSource,
      handleSelectExternalDatabase,
    ]
  );

  const dataSetTitle =
    selectedDataSetState &&
    selectedDataSetState?.dataSource &&
    selectedDataSetState?.dataSource.title
      ? `${selectedDataSetState.dataSource?.title}::${selectedDataSetState?.title}`
      : selectedDataSetState?.title;

  return (
    <EuiPopover
      button={
        <EuiToolTip content={dataSetTitle}>
          <EuiButtonEmpty
            className="dataSetNavigator"
            color="text"
            iconType="arrowDown"
            iconSide="right"
            flush="left"
            onClick={togglePopover}
          >
            <EuiIcon type="database" className="dataSetNavigator__icon" />
            {dataSetTitle ?? 'Select data set'}
          </EuiButtonEmpty>
        </EuiToolTip>
      }
      isOpen={isOpen}
      closePopover={closePopover}
      anchorPosition="downLeft"
      display="block"
      panelPaddingSize="none"
    >
      <EuiContextMenu
        initialPanelId={0}
        className="dataSetNavigator__menu"
        size="s"
        panels={panels}
      />
    </EuiPopover>
  );
};

// eslint-disable-next-line import/no-default-export
export default React.memo(DataSetNavigator);
