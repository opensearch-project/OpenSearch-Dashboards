/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

import {
  EuiButtonEmpty,
  EuiContextMenu,
  EuiContextMenuItem,
  EuiContextMenuPanelDescriptor,
  EuiPopover,
} from '@elastic/eui';
import {
  DataSetWithDataSource,
  DataSource,
  IndexPatternOption,
} from '../../data_sources/datasource';
import { DataSourceOption } from '../../data_sources/datasource_selector/types';
import { IndexPatternSelectable } from './index_pattern_selectable';
import {
  HttpSetup,
  SavedObjectsClientContract,
  SimpleSavedObject,
} from 'opensearch-dashboards/public';
import { DataSourceAttributes } from '../../../../data_source_management/public/types';
import { ISearchStart } from '../../search/types';
import { map, scan } from 'rxjs/operators';
import { IndexPatternsContract } from '../..';
import { useTypedDispatch, useTypedSelector } from '../../../../data_explorer/public';
import { getUiService, getIndexPatterns } from '../../services';

const getAllIndexPatterns = async (indexPatternsService: IndexPatternsContract) => {
  return indexPatternsService.getIdsWithTitle();
};

const getClusters = async (savedObjectsClient: SavedObjectsClientContract) => {
  return await savedObjectsClient.find<DataSourceAttributes>({
    type: 'data-source',
    perPage: 10000,
  });
};

export const searchResponseToArray = (showAllIndices: boolean) => (response) => {
  const { rawResponse } = response;
  if (!rawResponse.aggregations) {
    return [];
  } else {
    return rawResponse.aggregations.indices.buckets
      .map((bucket: { key: string }) => {
        return bucket.key;
      })
      .filter((indexName: string) => {
        if (showAllIndices) {
          return true;
        } else {
          return !indexName.startsWith('.');
        }
      })
      .map((indexName: string) => {
        return {
          name: indexName,
          // item: {},
        };
      });
  }
};

const buildSearchRequest = (showAllIndices: boolean, pattern: string, dataSourceId?: string) => {
  const request = {
    params: {
      ignoreUnavailable: true,
      expand_wildcards: showAllIndices ? 'all' : 'open',
      index: pattern,
      body: {
        size: 0, // no hits
        aggs: {
          indices: {
            terms: {
              field: '_index',
              size: 100,
            },
          },
        },
      },
    },
    dataSourceId: dataSourceId,
  };

  return request;
};

const getIndices = async (search: ISearchStart, dataSourceId: string) => {
  const request = buildSearchRequest(true, '*', dataSourceId);
  return search
    .search(request)
    .pipe(map(searchResponseToArray(true)))
    .pipe(scan((accumulator = [], value) => accumulator.join(value)))
    .toPromise()
    .catch(() => []);
};

interface DataSetOption {
  id: string;
  name: string;
  dataSourceRef?: string;
}

interface DataSetNavigatorProps {
  http: HttpSetup;
  search: ISearchStart;
  savedObjectsClient: SavedObjectsClientContract;
  indexPatterns: any;
  handleSourceSelection: any;
}

export const DataSetNavigator = ({
  http,
  search,
  savedObjectsClient,
  indexPatterns,
  handleSourceSelection,
}: DataSetNavigatorProps) => {
  const [isDataSetNavigatorOpen, setIsDataSetNavigatorOpen] = useState(false);
  const [clusterList, setClusterList] = useState<SimpleSavedObject<DataSourceAttributes>[]>([]);
  const [indexList, setIndexList] = useState<DataSetOption[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<any>();
  const [selectedIndex, setSelectedIndex] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedDataSet, setSelectedDataSet] = useState<DataSetOption | undefined>();
  const [indexPatternList, setIndexPatternList] = useState<DataSetOption[]>([]);
  const uiService = getUiService();
  const indexPatternsService = getIndexPatterns();

  const onButtonClick = () => setIsDataSetNavigatorOpen((isOpen) => !isOpen);
  const closePopover = () => setIsDataSetNavigatorOpen(false);

  const onDataSetClick = async (ds: DataSetOption) => {
    const existingIndexPattern = indexPatterns.getByTitle(ds.id, true);
    const dataSet = await indexPatterns.create(
      { id: ds.id, title: ds.name },
      !existingIndexPattern?.id
    );
    // save to cache by title because the id is not unique for temporary index pattern created
    indexPatterns.saveToCache(dataSet.title, dataSet);
    uiService.Settings.setSelectedDataSet({
      id: dataSet.id,
      name: dataSet.title,
      dataSourceRef: selectedCluster?.id ?? undefined,
    });
    setSelectedDataSet(ds);
    closePopover();
  };

  useEffect(() => {
    const subscription = uiService.Settings.getSelectedDataSet$().subscribe((dataSet) => {
      console.log('dataset in subscription:', dataSet);
      if (dataSet) {
        setSelectedDataSet(dataSet);
      }
    });
    return () => subscription.unsubscribe();
  }, [uiService]);

  // get all index patterns
  useEffect(() => {
    indexPatternsService.getIdsWithTitle().then((res) =>
      setIndexPatternList(
        res.map((indexPattern: { id: string; title: string }) => ({
          id: indexPattern.id,
          name: indexPattern.title,
        }))
      )
    );
  }, [indexPatternsService]);

  useEffect(() => {
    Promise.all([getClusters(savedObjectsClient)]).then((res) => {
      setClusterList(res.length > 0 ? res?.[0].savedObjects : []);
    });
  }, [savedObjectsClient]);

  useEffect(() => {
    if (selectedCluster) {
      // Get all indexes
      Promise.all([getIndices(search, selectedCluster.id)]).then((res) => {
        if (res && res.length > 0) {
          console.log(res);
          console.log('res', Object.values(res?.[0]));
          setIndexList(
            Object.values(res?.[0]).map((index: any) => ({
              ...index,
              // panel: 4,
              onClick: () => onDataSetClick({ name: index.name, id: index.name }),
            }))
          );
        }
      });
      getIndices(search, selectedCluster.id).then((res) => {
        setIndexList(
          Object.values(res?.[0]).map((index: any) => ({
            name: index.name,
            id: index.name,
            dataSourceRef: selectedCluster.id,
          }))
        );
      });
    }
  }, [selectedCluster, setIndexList, setSelectedIndex]);

  useEffect(() => {
    if (selectedIndex) {
      Promise.all([
        indexPatterns.getFieldsForWildcard({
          pattern: selectedIndex,
          dataSourceId: selectedCluster.id,
        }),
      ]).then((res) => console.log(res));
    }
  }, [selectedIndex]);

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

  return (
    <EuiPopover
      button={dataSetButton}
      isOpen={isDataSetNavigatorOpen}
      closePopover={closePopover}
      anchorPosition="downLeft"
    >
      <EuiContextMenu
        initialPanelId={0}
        panels={[
          {
            id: 0,
            title: 'DATA SETS',
            items: [
              {
                name: 'Index Patterns',
                panel: 1,
              },
              // Use spread operator with conditional mapping
              ...(clusterList
                ? clusterList.map((cluster) => ({
                    name: cluster.attributes.title,
                    panel: 2,
                    onClick: () => {
                      setSelectedCluster(cluster);
                    },
                  }))
                : []),
            ],
          },
          {
            id: 1,
            title: 'Index Patterns',
            items: [
              ...(indexPatternList
                ? indexPatternList.map((indexPattern) => ({
                    name: indexPattern.name,
                    onClick: () => onDataSetClick(indexPattern),
                  }))
                : []),
            ],
          },
          {
            id: 2,
            title: selectedCluster ? selectedCluster.attributes.title : 'Cluster',
            items: [
              {
                name: 'Indexes',
                panel: 3,
              },
              {
                name: 'Connected Data Sources',
              },
            ],
          },
          {
            id: 3,
            title: selectedCluster ? selectedCluster.attributes.title : 'Cluster',
            items: [
              ...(indexList
                ? indexList.map((index) => ({
                    name: index.name,
                    onClick: () => onDataSetClick(index),
                  }))
                : []),
            ],
          },
          {
            id: 4,
            title: 'clicked',
          },
        ]}
      />
    </EuiPopover>
  );
};
