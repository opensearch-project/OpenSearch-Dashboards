/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

import { EuiButtonEmpty, EuiContextMenu, EuiPopover } from '@elastic/eui';
import { SavedObjectsClientContract, SimpleSavedObject } from 'opensearch-dashboards/public';
import { map, scan } from 'rxjs/operators';
import { ISearchStart } from '../../search/types';
import { IIndexPattern } from '../..';
import { getUiService, getIndexPatterns, getSearchService } from '../../services';

const getClusters = async (savedObjectsClient: SavedObjectsClientContract) => {
  return await savedObjectsClient.find({
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
    dataSourceId,
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
  savedObjectsClient: SavedObjectsClientContract;
  indexPatterns: Array<IIndexPattern | string>;
}

export const DataSetNavigator = ({ savedObjectsClient, indexPatterns }: DataSetNavigatorProps) => {
  const [isDataSetNavigatorOpen, setIsDataSetNavigatorOpen] = useState(false);
  const [clusterList, setClusterList] = useState<SimpleSavedObject[]>([]);
  const [indexList, setIndexList] = useState<DataSetOption[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<any>();
  const [selectedDataSet, setSelectedDataSet] = useState<DataSetOption>({
    id: indexPatterns[0]?.id,
    name: indexPatterns[0]?.title,
  });
  const [indexPatternList, setIndexPatternList] = useState<DataSetOption[]>([]);
  const search = getSearchService();
  const uiService = getUiService();
  const indexPatternsService = getIndexPatterns();

  const onButtonClick = () => setIsDataSetNavigatorOpen((isOpen) => !isOpen);
  const closePopover = () => setIsDataSetNavigatorOpen(false);

  const onDataSetClick = async (ds: DataSetOption) => {
    const existingIndexPattern = indexPatternsService.getByTitle(ds.id, true);
    const dataSet = await indexPatternsService.create(
      { id: ds.id, title: ds.name },
      !existingIndexPattern?.id
    );
    // save to cache by title because the id is not unique for temporary index pattern created
    indexPatternsService.saveToCache(dataSet.title, dataSet);
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
      getIndices(search, selectedCluster.id).then((res) => {
        setIndexList(
          res.map((index: { name: string }) => ({
            name: index.name,
            id: index.name,
            dataSourceRef: selectedCluster.id,
          }))
        );
      });
    }
  }, [search, selectedCluster, setIndexList]);

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
        className="datasetNavigator"
        panels={[
          {
            id: 0,
            title: 'DATA',
            items: [
              {
                name: 'Index Patterns',
                panel: 1,
              },
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
