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

const getAndFormatIndexPatternsFromDataSource = async (
  ds: DataSource
): Promise<DataSetWithDataSource<IndexPatternOption>> => {
  const { dataSets } = await ds.getDataSet();
  return { ds, list: dataSets } as DataSetWithDataSource<IndexPatternOption>;
};

const getAllIndexPatterns = (dataSources: DataSource[]) =>
  dataSources.map((ds) => getAndFormatIndexPatternsFromDataSource(ds));

const consolidateIndexPatternList = (
  dataSets: DataSetWithDataSource<IndexPatternOption>[],
  selectedSources: DataSourceOption[]
): DataSourceOption[] => {
  const result: DataSourceOption[] = [];

  dataSets.forEach((dataSet) => {
    dataSet.list.forEach((indexPatternOption) => {
      const dataSourceOption: DataSourceOption = {
        type: 'indexPattern',
        name: dataSet.ds.getName(),
        ds: dataSet.ds,
        key: indexPatternOption.id as string,
        label: indexPatternOption.title as string,
        value: indexPatternOption.id as string,
      };

      if (selectedSources.length !== 0 && selectedSources[0].value === dataSourceOption.value) {
        dataSourceOption.checked = true;
      }

      result.push(dataSourceOption);
    });
  });
  console.log('results:', result);

  return result;
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

interface DataSetNavigatorProps {
  http: HttpSetup;
  search: ISearchStart;
  savedObjectsClient: SavedObjectsClientContract;
  indexPatterns: IndexPatternsContract;
  dataSources: DataSource[];
  indexPatternOptionList: any;
  selectedSources: DataSourceOption[];
  selectedCluster: any;
  setIndexPatternOptionList: any;
  setSelectedCluster: any;
  handleSourceSelection: any;
}

export const DataSetNavigator = ({
  http,
  search,
  savedObjectsClient,
  indexPatterns,
  dataSources,
  indexPatternOptionList,
  selectedSources,
  selectedCluster,
  setIndexPatternOptionList,
  setSelectedCluster,
  handleSourceSelection,
}: DataSetNavigatorProps) => {
  const [isDataSetNavigatorOpen, setIsDataSetNavigatorOpen] = useState(false);
  const [clusterList, setClusterList] = useState<SimpleSavedObject<DataSourceAttributes>[]>([]);
  const [indexList, setIndexList] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('');

  const onButtonClick = () => setIsDataSetNavigatorOpen((isOpen) => !isOpen);
  const closePopover = () => setIsDataSetNavigatorOpen(false);

  useEffect(() => {
    Promise.all(
      getAllIndexPatterns(
        dataSources.filter((ds) => ds.getMetadata().ui.selector.displayDatasetsAsSource)
      )
    ).then((dataSetResults) => {
      setIndexPatternOptionList(consolidateIndexPatternList(dataSetResults, selectedSources));
    });
  }, [dataSources, setIndexPatternOptionList]);

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
          console.log('res', Object.values(res?.[0]));
          setIndexList(
            Object.values(res?.[0]).map((index: any) => ({
              ...index,
              // panel: 4,
              onClick: async () => {
                setSelectedIndex(index.name);
                const existingIndexPattern = indexPatterns.getByTitle(index.name, true);
                const dataSet = await indexPatterns.create(
                  { id: index.name, title: index.name },
                  !existingIndexPattern?.id
                );
                // save to cache by title because the id is not unique for temporary index pattern created
                indexPatterns.saveToCache(dataSet.title, dataSet);
                handleSourceSelection([
                  {
                    type: 'indexPattern',
                    name: 'OpenSearch Default',
                    ds: selectedCluster,
                    key: index.name,
                    label: index.name,
                    value: index.name,
                  },
                ]);
              },
            }))
          );
        }
      });
      // Update panels related to cluster
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
      {selectedSources.length > 0 ? selectedSources[0].label : 'Datasets'}
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
            content: (
              <IndexPatternSelectable
                indexPatternOptionList={indexPatternOptionList}
                setIndexPatternOptionList={setIndexPatternOptionList}
                handleSourceSelection={handleSourceSelection}
              />
            ),
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
            items: indexList,
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
