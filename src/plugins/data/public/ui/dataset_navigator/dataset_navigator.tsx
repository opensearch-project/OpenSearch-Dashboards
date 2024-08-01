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
import { fetchDataSources, fetchIndexPatterns, fetchIndices, isCatalogCacheFetching } from './lib';
import { useDataSetManager } from '../search_bar/lib/use_dataset_manager';
import { DataSetContract } from '../../query';

export interface DataSetNavigatorProps {
  savedObjectsClient?: SavedObjectsClientContract;
  http?: HttpStart;
  dataSetManager?: DataSetContract;
}

interface SelectedDataSetState extends SimpleDataSet {
  database?: SimpleObject | undefined;
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
  const [dataSources, setDataSources] = useState<SimpleDataSource[]>([]);
  const [externalDataSources, setExternalDataSources] = useState<SimpleDataSource[]>([]);
  const [indexPatterns, setIndexPatterns] = useState<any[]>([]);
  const [cachedDatabases, setCachedDatabases] = useState<SimpleObject[]>([]);
  const [cachedTables, setCachedTables] = useState<SimpleObject[]>([]);
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
    async (ds?: SimpleDataSet) => {
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
        dataSourceRef: selectedDataSet.dataSourceRef,
        timeFieldName: selectedDataSet.timeFieldName,
        type: selectedDataSet.type,
      });

      setSelectedDataSetState({
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
              id: ds.dataSourceRef,
              name: ds.name,
              type: SIMPLE_DATA_SOURCE_TYPES.EXTERNAL,
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
            fields: dataSet.fields,
            ...(dataSet.dataSourceRef
              ? {
                  dataSourceRef: {
                    id: dataSet.dataSourceRef.id,
                    name: dataSet.dataSourceRef.name,
                    type: dataSet.dataSourceRef.type,
                  },
                }
              : { dataSourceRef: undefined }),
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
          id: ds.dataSourceRef,
          name: ds.name,
          type: SIMPLE_DATA_SOURCE_TYPES.EXTERNAL,
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
          setCachedDatabases(
            dataSourceCache.databases.map((db) => ({ id: db.name, title: db.name }))
          );
        }
        setSelectedDataSetState((prevState) => ({
          ...prevState!,
          dataSourceRef: dataSource,
        }));
      }
    },
    [databasesLoadStatus, startLoadingDatabases]
  );

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
          setCachedTables(
            databaseCache.tables.map((table) => ({
              id: table.name,
              title: table.name,
            }))
          );
        }
      }
    },
    [selectedDataSetState?.dataSourceRef, tablesLoadStatus, startLoadingTables]
  );

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
        setCachedDatabases(
          dataSourceCache.databases.map((db) => ({ id: db.name, title: db.name }))
        );
      } else if (
        status === DirectQueryLoadingStatus.CANCELED ||
        status === DirectQueryLoadingStatus.FAILED
      ) {
        notifications.toasts.addWarning('Error loading databases');
      }
    }
  }, [databasesLoadStatus, selectedDataSetState?.dataSourceRef, notifications.toasts]);

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
        setCachedTables(
          databaseCache.tables.map((table) => ({
            id: table.name,
            title: table.name,
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
    selectedDataSetState?.dataSourceRef,
    selectedDataSetState?.database,
    notifications.toasts,
  ]);

  const handleSelectedDataSource = useCallback(
    async (source: SimpleDataSource) => {
      if (source) {
        setIsLoading(true);
        try {
          const indices = await fetchIndices(searchService, source.id);
          const updatedSource = {
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
          };

          setDataSources((prevDataSources) =>
            prevDataSources.map((ds) => (ds.id === source.id ? updatedSource : ds))
          );

          setSelectedDataSetState((prevState) => ({
            ...prevState!,
            dataSourceRef: updatedSource,
          }));
        } finally {
          setIsLoading(false);
        }
      }
    },
    [searchService]
  );

  const handleSelectedObject = useCallback(
    async (object: SimpleObject) => {
      if (object) {
        setIsLoading(true);
        const fields = await indexPatternsService.getFieldsForWildcard({
          pattern: object.title,
          dataSourceId: object.dataSourceRef?.id,
        });

        const timeFields = fields.filter((field: any) => field.type === 'date');
        const timeFieldName = timeFields?.length > 0 ? timeFields[0].name : undefined;
        setSelectedDataSetState((prevState) => ({
          ...prevState,
          id: `${object.dataSourceRef ? object.dataSourceRef.id : ''}.${object.id}`,
          title: object.title,
          fields,
          timeFields,
          timeFieldName,
          dataSourceRef: object.dataSourceRef,
          type: SIMPLE_DATA_SET_TYPES.TEMPORARY,
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
          name: indexPattern.title,
          onClick: () => handleSelectedDataSet(indexPattern),
        })),
        content: indexPatterns.length === 0 && createLoadingSpinner(),
      },
      {
        id: 2,
        title: indicesLabel,
        items: dataSources.map((dataSource) => ({
          name: dataSource.name,
          panel: 3,
          onClick: () => handleSelectedDataSource(dataSource),
        })),
        content: isLoading && createLoadingSpinner(),
      },
      {
        id: 3,
        title: selectedDataSetState?.dataSourceRef?.name ?? indicesLabel,
        items: selectedDataSetState?.dataSourceRef?.indices?.map((object) => ({
          name: object.title,
          panel: 7,
          onClick: () => handleSelectedObject(object),
        })),
        content:
          isLoading && !selectedDataSetState?.dataSourceRef?.indices && createLoadingSpinner(),
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
          name: dataSource.name,
          onClick: async () => await handleSelectExternalDataSource(dataSource),
          panel: 5,
        })),
        content: isCatalogCacheFetching(dataSourcesLoadStatus) && createLoadingSpinner(),
      },
      {
        id: 5,
        title: selectedDataSetState?.dataSourceRef?.name ?? 'Databases',
        items: cachedDatabases.map((db) => ({
          name: db.title,
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
          name: table.title,
          onClick: () => {
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
                          text: field.name,
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
          name: ds.title,
          onClick: () => {
            setSelectedDataSetState({
              id: ds.id ?? ds.title,
              title: ds.title,
              dataSourceRef: ds.dataSourceRef,
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
    selectedDataSetState?.dataSourceRef &&
    selectedDataSetState?.dataSourceRef.name
      ? `${selectedDataSetState.dataSourceRef?.name}::${selectedDataSetState?.title}`
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
