/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiContextMenu,
  EuiLoadingSpinner,
  EuiPopover,
  EuiText,
} from '@elastic/eui';
import {
  HttpStart,
  NotificationsStart,
  SavedObjectsClientContract,
} from 'opensearch-dashboards/public';
import _ from 'lodash';
import { IIndexPattern } from '../..';
import { fetchClusters } from './utils/fetch_clusters';
import { fetchIndices } from './utils/fetch_indices';
import { fetchExternalDataSources } from './utils/fetch_external_data_sources';
import { Settings } from '../settings';
import {
  useLoadDatabasesToCache,
  useLoadExternalDataSourcesToCache,
  useLoadTablesToCache,
} from './framework/catalog_cache/cache_loader';
import { CatalogCacheManager } from './framework/catalog_cache/cache_manager';
import {
  CachedDataSourceStatus,
  DataSetOption,
  DirectQueryLoadingStatus,
  ExternalDataSource,
} from './framework/types';
import { isCatalogCacheFetching } from './framework/utils/shared';

export interface DataSetNavigatorProps {
  settings: Settings;
  savedObjectsClient: SavedObjectsClientContract;
  indexPattern?: Array<IIndexPattern | string>;
  dataSetId?: string;
  onDataSetSelected: (dataSet: DataSetOption) => void;
  indexPatternsService: any;
  search: any;
  http: HttpStart;
  notifications: NotificationsStart;
}

export const DataSetNavigator = (props: DataSetNavigatorProps) => {
  const {
    settings,
    indexPatternsService,
    savedObjectsClient,
    search,
    onDataSetSelected,
    http,
    notifications,
  } = props;
  const [isDataSetNavigatorOpen, setIsDataSetNavigatorOpen] = useState(false);
  const [selectedDataSet, setSelectedDataSet] = useState<DataSetOption>();
  const [indexPatternList, setIndexPatternList] = useState([]);
  const [clusterList, setClusterList] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [indexList, setIndexList] = useState([]);
  const [externalDataSourceList, setExternalDataSourceList] = useState<any[]>([]);
  const [selectedExternalDataSource, setSelectedExternalDataSource] = useState<
    ExternalDataSource
  >();
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

  const onButtonClick = () => setIsDataSetNavigatorOpen(!isDataSetNavigatorOpen);
  const closePopover = () => setIsDataSetNavigatorOpen(false);
  const onDataSetClick = async (dataSet: DataSetOption) => {
    setSelectedDataSet(dataSet);
    onDataSetSelected(dataSet);
    settings.setSelectedDataSet(dataSet);
    CatalogCacheManager.addRecentDataSet(dataSet);
    closePopover();
  };
  // const handleRefresh = () => {
  //   if (
  //     !isCatalogCacheFetching(databasesLoadStatus, tablesLoadStatus) &&
  //     selectedExternalDataSource
  //   ) {
  //     startLoadingDatabases({
  //       dataSourceName: selectedExternalDataSource.name,
  //       dataSourceMDSId: selectedExternalDataSource.dataSourceRef,
  //     });
  //   }
  // };
  const handleExternalDataSourcesRefresh = () => {
    if (!isCatalogCacheFetching(dataSourcesLoadStatus) && clusterList.length > 0) {
      startLoadingDataSources(clusterList.map((cluster) => cluster.id));
    }
  };

  useEffect(() => {
    setLoading(true);
    // Fetch index patterns
    indexPatternsService.getIdsWithTitle().then((res) => {
      setIndexPatternList(res.map(({ id, title }) => ({ id, name: title })));
    });

    // Fetch clusters
    fetchClusters(savedObjectsClient).then((res) => {
      setClusterList(res.savedObjects);
    });

    // Fetch indices if a cluster is selected
    if (selectedCluster) {
      fetchIndices(search, selectedCluster.id).then((res) => {
        setIndexList(
          res.map(({ name }) => ({
            name,
            id: name,
            dataSourceRef: selectedCluster.id,
          }))
        );
      });
    }
    setLoading(false);
  }, [indexPatternsService, savedObjectsClient, search, selectedCluster]);

  // Retrieve external datasources from cache upon success
  useEffect(() => {
    const status = dataSourcesLoadStatus.toLowerCase();
    const externalDataSourcesCache = CatalogCacheManager.getExternalDataSourcesCache();
    if (status === DirectQueryLoadingStatus.SUCCESS) {
      setExternalDataSourceList(externalDataSourcesCache.externalDataSources);
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
        selectedExternalDataSource.dataSourceRef
      );
      if (
        (dataSourceCache.status === CachedDataSourceStatus.Empty ||
          dataSourceCache.status === CachedDataSourceStatus.Failed) &&
        !isCatalogCacheFetching(databasesLoadStatus)
      ) {
        startLoadingDatabases({
          dataSourceName: selectedExternalDataSource.name,
          dataSourceMDSId: selectedExternalDataSource.dataSourceRef,
        });
      } else if (dataSourceCache.status === CachedDataSourceStatus.Updated) {
        setCachedDatabases(dataSourceCache.databases);
      }
    }
  }, [selectedExternalDataSource]);

  // Retrieve databases from cache upon success
  useEffect(() => {
    const status = databasesLoadStatus.toLowerCase();
    if (selectedExternalDataSource) {
      const dataSourceCache = CatalogCacheManager.getOrCreateDataSource(
        selectedExternalDataSource?.name,
        selectedExternalDataSource?.dataSourceRef
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
          selectedExternalDataSource.dataSourceRef
        );
      } catch (error) {
        console.error(error);
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
          dataSourceMDSId: selectedExternalDataSource.dataSourceRef,
        });
      } else if (databaseCache.status === CachedDataSourceStatus.Updated) {
        setCachedTables(databaseCache.tables);
      }
    }
  }, [selectedExternalDataSource, selectedDatabase]);

  // Retrieve tables from cache upon success
  useEffect(() => {
    if (selectedExternalDataSource && selectedDatabase) {
      const tablesStatus = tablesLoadStatus.toLowerCase();
      let databaseCache;
      try {
        databaseCache = CatalogCacheManager.getDatabase(
          selectedExternalDataSource.name,
          selectedDatabase,
          selectedExternalDataSource.dataSourceRef
        );
      } catch (error) {
        console.error(error);
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

  const dataSetButton = (
    <EuiButtonEmpty
      className="dataExplorerDSSelect"
      color="text"
      iconType="arrowDown"
      iconSide="right"
      onClick={onButtonClick}
    >
      {selectedDataSet ? selectedDataSet.name : 'Datasets'}
    </EuiButtonEmpty>
  );

  const RefreshButton = (
    <EuiButtonEmpty
      iconType="refresh"
      onClick={handleExternalDataSourcesRefresh}
      isLoading={isCatalogCacheFetching(databasesLoadStatus, tablesLoadStatus)}
    />
  );

  const LoadingSpinner = <EuiLoadingSpinner size="l" />;

  const contextMenuPanels = [
    {
      id: 0,
      // title: (<EuiText size="s">Data</EuiText>),
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
          name: 'Index Patterns',
          panel: 1,
        },
        {
          name: 'Indexes',
          panel: 2,
        },
        {
          name: 'S3',
          panel: 4,
          onClick: () => {
            const externalDataSourcesCache = CatalogCacheManager.getExternalDataSourcesCache();
            if (
              (externalDataSourcesCache.status === CachedDataSourceStatus.Empty ||
                externalDataSourcesCache.status === CachedDataSourceStatus.Failed) &&
              !isCatalogCacheFetching(dataSourcesLoadStatus) &&
              clusterList.length > 0
            ) {
              startLoadingDataSources(clusterList.map((cluster) => cluster.id));
            } else if (externalDataSourcesCache.status === CachedDataSourceStatus.Updated) {
              setExternalDataSourceList(externalDataSourcesCache.externalDataSources);
            }
          },
        },
      ],
    },
    {
      id: 1,
      title: 'Index Patterns',
      items: indexPatternList.map((indexPattern) => ({
        name: indexPattern.name,
        onClick: () => onDataSetClick(indexPattern),
      })),
      content: <div>{loading && LoadingSpinner}</div>,
    },
    {
      id: 2,
      title: 'Clusters',
      items: [
        ...clusterList.map((cluster) => ({
          name: cluster.attributes.title,
          panel: 3,
          onClick: () => setSelectedCluster(cluster),
        })),
      ],
      content: <div>{loading && LoadingSpinner}</div>,
    },
    {
      id: 3,
      title: selectedCluster ? selectedCluster.attributes.title : 'Cluster',
      items: indexList.map((index) => ({
        name: index.name,
        onClick: () => onDataSetClick(index),
      })),
      content: <div>{loading && LoadingSpinner}</div>,
    },
    {
      id: 4,
      title: (
        <div>
          S3 Connections{' '}
          {CatalogCacheManager.getExternalDataSourcesCache().status ===
            CachedDataSourceStatus.Updated && RefreshButton}
        </div>
      ),
      items: [
        ...externalDataSourceList.map((ds) => ({
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
      id: 7,
      title: 'Recently Used',
      items: CatalogCacheManager.getRecentDataSets().map((ds) => ({
        name: ds.name,
        onClick: () => onDataSetClick(ds),
      })),
    },
  ];

  return (
    <EuiPopover
      button={dataSetButton}
      isOpen={isDataSetNavigatorOpen}
      closePopover={closePopover}
      anchorPosition="downLeft"
    >
      <EuiContextMenu initialPanelId={0} className="datasetNavigator" panels={contextMenuPanels} />
    </EuiPopover>
  );
};

// eslint-disable-next-line import/no-default-export
export default DataSetNavigator;
