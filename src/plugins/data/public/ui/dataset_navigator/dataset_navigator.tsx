/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiContextMenu,
  EuiContextMenuPanelItemDescriptor,
  EuiForm,
  EuiFormRow,
  EuiLoadingSpinner,
  EuiPopover,
  EuiSelect,
  EuiText,
} from '@elastic/eui';
import {
  HttpStart,
  NotificationsStart,
  SavedObjectsClientContract,
} from 'opensearch-dashboards/public';
import _ from 'lodash';
import {
  SIMPLE_DATA_SET_TYPES,
  SimpleDataSet,
  SimpleDataSource,
  SimpleObject,
} from 'src/plugins/data/common';
import { i18n } from '@osd/i18n';
import { IIndexPattern } from '../..';
import {
  useLoadDatabasesToCache,
  useLoadExternalDataSourcesToCache,
  useLoadTablesToCache,
} from './lib/catalog_cache/cache_loader';
import { CatalogCacheManager } from './lib/catalog_cache/cache_manager';
import {
  CachedDataSourceStatus,
  DataSetOption,
  DirectQueryLoadingStatus,
  ExternalDataSource,
} from './lib/types';
import { getIndexPatterns, getQueryService, getSearchService, getUiService } from '../../services';
import { fetchDataSources, fetchIndexPatterns, fetchIndices, isCatalogCacheFetching } from './lib';

export interface DataSetNavigatorProps {
  dataSetId: string | undefined;
  savedObjectsClient?: SavedObjectsClientContract;
  onSelectDataSet: (dataSet: SimpleDataSet) => void;
}

export const DataSetNavigator = (props: DataSetNavigatorProps) => {
  const searchService = getSearchService();
  const queryService = getQueryService();
  const uiService = getUiService();
  const indexPatternsService = getIndexPatterns();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDataSet, setSelectedDataSet] = useState<SimpleDataSet | undefined>();
  const [selectedObject, setSelectedObject] = useState<SimpleDataSet | undefined>();
  const [selectedDataSource, setSelectedDataSource] = useState<SimpleDataSource | undefined>();
  const [selectedDataSourceObjects, setSelectedDataSourceObjects] = useState<SimpleObject[]>([]);
  const [selectedExternalDataSource, setSelectedExternalDataSource] = useState<SimpleDataSource>();
  const [dataSources, setDataSources] = useState<SimpleDataSource[]>([]);
  const [externalDataSources, setExternalDataSources] = useState<SimpleDataSource[]>([]);
  // TODO iindexpattern
  const [indexPatterns, setIndexPatterns] = useState<any[]>([]);

  const [selectedDatabase, setSelectedDatabase] = useState<any>();
  const [cacheRefreshable, setCacheRefreshable] = useState<boolean>(false);
  const [cachedDatabases, setCachedDatabases] = useState<any[]>([]);
  const [cachedTables, setCachedTables] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);

  const {
    loadStatus: dataSourcesLoadStatus,
    loadExternalDataSources: startLoadingDataSources,
  } = useLoadExternalDataSourcesToCache(http, notifications);
  const {
    loadStatus: databasesLoadStatus,
    startLoading: startLoadingDatabases,
  } = useLoadDatabasesToCache(http, notifications);
  const { loadStatus: tablesLoadStatus, startLoading: startLoadingTables } = useLoadTablesToCache(
    http,
    notifications
  );

  const onButtonClick = () => setIsOpen(!isOpen);
  const closePopover = () => setIsOpen(false);

  const onDataSetClick = async (dataSet: DataSetOption) => {
    setSelectedDataSet(dataSet);
    onDataSetSelected(dataSet);
    settings.setSelectedDataSet(dataSet);
    CatalogCacheManager.addRecentDataSet(dataSet);
    closePopover();
  };

  const handleExternalDataSourcesRefresh = () => {
    if (!isCatalogCacheFetching(dataSourcesLoadStatus) && clusterList.length > 0) {
      startLoadingDataSources(clusterList.map((cluster) => cluster.id));
    }
  };

  const getInitialQuery = (dataSet: SimpleDataSet) => {
    const language = uiService.Settings.getUserQueryLanguage();
    const input = uiService.Settings.getQueryEnhancements(language)?.searchBar?.queryStringInput
      ?.initialValue;

    if (!dataSet || !input)
      return {
        query: '',
        language,
      };

    return {
      query: input.replace('<data_source>', dataSet.title),
      language,
    };
  };

  useEffect(() => {
    setLoading(true);

    Promise.all([
      fetchIndexPatterns(props.savedObjectsClient!, ''),
      fetchDataSources(props.savedObjectsClient!),
    ])
      .then(([defaultIndexPatterns, defaultDataSources]) => {
        setIndexPatterns(defaultIndexPatterns);
        setDataSources(defaultDataSources);

        if (!selectedDataSet && props.dataSetId) {
          const selectedPattern = defaultIndexPatterns.find(
            (pattern) => pattern.id === props.dataSetId
          );
          if (selectedPattern) {
            setSelectedDataSet({
              id: selectedPattern.id ?? selectedPattern.title,
              title: selectedPattern.title,
              type: SIMPLE_DATA_SET_TYPES.INDEX_PATTERN,
            });
          }
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [indexPatternsService, props.dataSetId, props.savedObjectsClient, selectedDataSet]);

  useEffect(() => {
    if (selectedDataSource) {
      setLoading(true);
      fetchIndices(searchService, selectedDataSource.id).then((indices) => {
        const objects = indices.map(({ indexName }: { indexName: string }) => ({
          id: indexName,
          title: indexName,
          dataSourceRef: {
            id: selectedDataSource.id,
            name: selectedDataSource.name,
            type: selectedDataSource.type,
          },
        }));
        setSelectedDataSourceObjects(objects);
        setLoading(false);
      });
    }
  }, [searchService, selectedDataSource]);

  useEffect(() => {
    const getFieldsForWildcard = async (object: SimpleObject | SimpleDataSet) => {
      const fields = await indexPatternsService.getFieldsForWildcard({
        pattern: object.title,
        dataSourceId: object.dataSourceRef?.id,
      });

      const timeFields = fields.filter((field: any) => field.type === 'date');

      setSelectedObject({
        id: object.id,
        title: object.title,
        fields,
        timeFields,
        ...(timeFields[0]?.name ? { timeFieldName: timeFields[0].name } : {}),
        dataSourceRef: object.dataSourceRef,
        type: SIMPLE_DATA_SET_TYPES.TEMPORARY,
      });
    };

    if (selectedObject) {
      getFieldsForWildcard(selectedObject);
    }
  }, [indexPatternsService, searchService, selectedObject]);

  useEffect(() => {
    const status = dataSourcesLoadStatus.toLowerCase();
    const externalDataSourcesCache = CatalogCacheManager.getExternalDataSourcesCache();
    if (status === DirectQueryLoadingStatus.SUCCESS) {
      setExternalDataSources(externalDataSourcesCache.externalDataSources);
    } else if (
      status === DirectQueryLoadingStatus.CANCELED ||
      status === DirectQueryLoadingStatus.FAILED
    ) {
      setFailed(true);
    }
  }, [dataSourcesLoadStatus]);

  // Start loading databases for datasource
  useEffect(() => {
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
  }, [databasesLoadStatus, selectedExternalDataSource, startLoadingDatabases]);

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

  // Start loading tables for selected database
  useEffect(() => {
    if (selectedExternalDataSource && selectedDatabase) {
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
        startLoadingTables({
          dataSourceName: selectedExternalDataSource.name,
          databaseName: selectedDatabase,
          dataSourceMDSId: selectedExternalDataSource.id,
        });
      } else if (databaseCache.status === CachedDataSourceStatus.Updated) {
        setCachedTables(databaseCache.tables);
      }
    }
  }, [selectedExternalDataSource, selectedDatabase, tablesLoadStatus, startLoadingTables]);

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

  const RefreshButton = (
    <EuiButtonEmpty
      iconType="refresh"
      onClick={handleExternalDataSourcesRefresh}
      isLoading={isCatalogCacheFetching(databasesLoadStatus, tablesLoadStatus)}
    />
  );

  const LoadingSpinner = <EuiLoadingSpinner size="l" />;

  const indexPatternsLabel = i18n.translate('data.query.dataSetNavigator.indexPatternsName', {
    defaultMessage: 'Index patterns',
  });
  const indicesLabel = i18n.translate('data.query.dataSetNavigator.indicesName', {
    defaultMessage: 'Indexes',
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
          {`${selectedDataSet?.dataSourceRef ? `${selectedDataSet.dataSourceRef.name}::` : ''}${
            selectedDataSet?.title ??
            i18n.translate('data.query.dataSetNavigator.selectDataSet', {
              defaultMessage: 'Select data set',
            })
          }`}
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
            id: 0,
            title: 'Data',
            items: [
              ...(CatalogCacheManager.getRecentDataSets().length > 0
                ? [
                    {
                      name: 'Recently Used',
                      panel: 7,
                    },
                  ]
                : []),
              {
                name: indexPatternsLabel,
                panel: 1,
              },
              {
                name: indicesLabel,
                panel: 3,
              },
              {
                name: 'Connected data sources',
                panel: 4,
                onClick: () => {
                  const externalDataSourcesCache = CatalogCacheManager.getExternalDataSourcesCache();
                  if (
                    (externalDataSourcesCache.status === CachedDataSourceStatus.Empty ||
                      externalDataSourcesCache.status === CachedDataSourceStatus.Failed) &&
                    !isCatalogCacheFetching(dataSourcesLoadStatus) &&
                    dataSources.length > 0
                  ) {
                    startLoadingDataSources(dataSources.map((dataSource) => dataSource.id));
                  } else if (externalDataSourcesCache.status === CachedDataSourceStatus.Updated) {
                    setExternalDataSources(externalDataSourcesCache.externalDataSources);
                  }
                },
              },
            ],
          },
          {
            id: 1,
            title: indexPatternsLabel,
            items: indexPatterns.flatMap((indexPattern, indexNum, arr) => [
              {
                name: indexPattern.title,
                onClick: () => {
                  setSelectedDataSet({
                    id: indexPattern.id ?? indexPattern.title,
                    title: indexPattern.title,
                    fields: indexPattern.fields,
                    timeFieldName: indexPattern.timeFieldName,
                    type: SIMPLE_DATA_SET_TYPES.INDEX_PATTERN,
                  });
                },
              },
              ...(indexNum < arr.length - 1 ? [{ isSeparator: true }] : []),
            ]) as EuiContextMenuPanelItemDescriptor[],
            content: <div>{loading && LoadingSpinner}</div>,
          },
          {
            id: 2,
            items: [
              ...dataSources.map((dataSource) => ({
                name: dataSource.name,
                panel: 3,
                onClick: () => setSelectedDataSource(dataSource),
              })),
            ],
            content: <div>{loading && LoadingSpinner}</div>,
          },
          {
            id: 3,
            title: selectedDataSource?.name ?? indicesLabel,
            items: selectedDataSourceObjects.map((object) => ({
              name: object.title,
              onClick: () =>
                setSelectedObject({
                  ...object,
                  type: SIMPLE_DATA_SET_TYPES.TEMPORARY,
                }),
            })),
            content: <div>{loading && LoadingSpinner}</div>,
          },
          {
            id: 4,
            title: (
              <div>
                Connected data sources
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
                onClick: () => setSelectedDatabase(db.name),
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
              })),
            ],
            content: <div>{isCatalogCacheFetching(tablesLoadStatus) && LoadingSpinner}</div>,
          },
          {
            id: 8,
            title: selectedObject?.title,
            content:
              loading && !selectedObject ? (
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
                        setSelectedObject({
                          ...selectedObject,
                          timeFieldName:
                            event.target.value !== 'no-time-filter'
                              ? event.target.value
                              : undefined,
                        } as SimpleDataSet);
                      }}
                      aria-label="Select a date field"
                    />
                  </EuiFormRow>
                  <EuiButton
                    size="s"
                    fullWidth
                    onClick={async () => {
                      setSelectedDataSet(selectedObject);
                    }}
                  >
                    Select
                  </EuiButton>
                </EuiForm>
              ),
          },
          {
            id: 9,
            title: 'Recently Used',
            items: CatalogCacheManager.getRecentDataSets().map((ds) => ({
              name: ds.name,
              onClick: () => onDataSetClick(ds),
            })),
          },
        ]}
      />
    </EuiPopover>
  );
};

// eslint-disable-next-line import/no-default-export
export default DataSetNavigator;
