/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, useEffect, useState } from 'react';

import { EuiButtonEmpty, EuiContextMenu, EuiPopover } from '@elastic/eui';
import { SavedObjectsClientContract, SimpleSavedObject } from 'opensearch-dashboards/public';
import { IIndexPattern } from '../..';
import { getUiService, getIndexPatterns, getSearchService, getQueryService } from '../../services';
import { fetchClusters } from './fetch_clusters';
import { fetchIndices } from './fetch_indices';
import _ from 'lodash';
import { fetchIndexPatterns } from './fetch_index_patterns';

export interface DataSetOption {
  id: string;
  name: string;
  dataSourceRef?: string;
}

export interface DataSetNavigatorProps {
  savedObjectsClient: SavedObjectsClientContract;
  indexPatterns: Array<IIndexPattern | string>;
  dataSetId: string;
}

interface DataSetNavigatorState {
  isLoading: boolean;
  options: [];
  selectedDataSet: DataSetOption | undefined;
  searchValue: string | undefined;
  dataSourceIdToTitle: Map<string, string>;
}

// eslint-disable-next-line import/no-default-export
export default class DataSetNavigator extends Component<DataSetNavigatorProps> {
  private isMounted: boolean = false;
  state: DataSetNavigatorState;


  constructor(props: DataSetNavigatorProps) {
    super(props);

    this.state = {
      isLoading: false,
      options: [],
      selectedDataSet: undefined,
      searchValue: undefined,
      dataSourceIdToTitle: new Map(),
    };
  }

  debouncedFetch = _.debounce(async (searchValue: string) => {
    const { savedObjectsClient } = this.props;

    const savedObjectFields = ['title'];
    let savedObjects = await fetchIndexPatterns(savedObjectsClient, searchValue, savedObjectFields);



    if (!this.isMounted) {
      return;
    }

    // We need this check to handle the case where search results come back in a different
    // order than they were sent out. Only load results for the most recent search.
    if (searchValue === this.state.searchValue) {
      const dataSourcesToFetch: Array<{ type: string; id: string }> = [];
      const dataSourceIdSet = new Set();
      savedObjects.map((indexPatternSavedObject: SimpleSavedObject<any>) => {
        const dataSourceReference = getDataSourceReference(indexPatternSavedObject.references);
        if (
          dataSourceReference &&
          !this.state.dataSourceIdToTitle.has(dataSourceReference.id) &&
          !dataSourceIdSet.has(dataSourceReference.id)
        ) {
          dataSourceIdSet.add(dataSourceReference.id);
          dataSourcesToFetch.push({ type: 'data-source', id: dataSourceReference.id });
        }
      });

      const dataSourceIdToTitleToUpdate = new Map();

      if (dataSourcesToFetch.length > 0) {
        const resp = await savedObjectsClient.bulkGet(dataSourcesToFetch);
        resp.savedObjects.map((dataSourceSavedObject: SimpleSavedObject<any>) => {
          dataSourceIdToTitleToUpdate.set(
            dataSourceSavedObject.id,
            dataSourceSavedObject.attributes.title
          );
        });
      }

      const options = savedObjects.map((indexPatternSavedObject: SimpleSavedObject<any>) => {
        const dataSourceReference = getDataSourceReference(indexPatternSavedObject.references);
        if (dataSourceReference) {
          const dataSourceTitle =
            this.state.dataSourceIdToTitle.get(dataSourceReference.id) ||
            dataSourceIdToTitleToUpdate.get(dataSourceReference.id) ||
            dataSourceReference.id;
          return {
            label: `${concatDataSourceWithIndexPattern(
              dataSourceTitle,
              indexPatternSavedObject.attributes.title
            )}`,
            value: indexPatternSavedObject.id,
          };
        }
        return {
          label: indexPatternSavedObject.attributes.title,
          value: indexPatternSavedObject.id,
        };
      });

      if (dataSourceIdToTitleToUpdate.size > 0) {
        const mergedDataSourceIdToTitle = new Map();
        this.state.dataSourceIdToTitle.forEach((k, v) => {
          mergedDataSourceIdToTitle.set(k, v);
        });
        dataSourceIdToTitleToUpdate.forEach((k, v) => {
          mergedDataSourceIdToTitle.set(k, v);
        });
        this.setState({
          dataSourceIdToTitle: mergedDataSourceIdToTitle,
          isLoading: false,
          options,
        });
      } else {
        this.setState({
          isLoading: false,
          options,
        });
      }

      if (onNoIndexPatterns && searchValue === '' && options.length === 0) {
        onNoIndexPatterns();
      }
    }
  }, 300);
  
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
  const queryService = getQueryService();
  const indexPatternsService = getIndexPatterns();

  const onButtonClick = () => setIsDataSetNavigatorOpen((isOpen) => !isOpen);
  const closePopover = () => setIsDataSetNavigatorOpen(false);

  const onDataSetClick = async (ds: DataSetOption) => {
    setSelectedDataSet(ds);
    onSubmit(ds);
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
    Promise.all([fetchClusters(savedObjectsClient)]).then((res) => {
      setClusterList(res.length > 0 ? res?.[0].savedObjects : []);
    });
  }, [savedObjectsClient]);

  useEffect(() => {
    if (selectedCluster) {
      // Get all indexes
      fetchIndices(search, selectedCluster.id).then((res) => {
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
