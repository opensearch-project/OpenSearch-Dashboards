/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { EuiButtonEmpty, EuiContextMenu, EuiPopover } from '@elastic/eui';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import _ from 'lodash';
import { IIndexPattern } from '../..';
import { fetchClusters } from './fetch_clusters';
import { fetchIndices } from './fetch_indices';
import { Settings } from '../settings';

export interface DataSetOption {
  id: string;
  name: string;
  dataSourceRef?: string;
}

export interface DataSetNavigatorProps {
  settings: Settings;
  savedObjectsClient: SavedObjectsClientContract;
  indexPattern?: Array<IIndexPattern | string>;
  dataSetId?: string;
  onDataSetSelected: (dataSet: DataSetOption) => void;
  indexPatternsService: any;
  search: any;
}

interface DataSetNavigatorState {
  isLoading: boolean;
  isOpen: boolean;
  clusters: DataSetOption[];
  indices: DataSetOption[];
  indexPatterns: DataSetOption[];
  selectedDataSet: DataSetOption | undefined;
  selectedCluster: DataSetOption | undefined;
  searchValue: string | undefined;
  dataSourceIdToTitle: Map<string, string>;
}

export const DataSetNavigator = (props: DataSetNavigatorProps) => {
  const { settings, indexPatternsService, savedObjectsClient, search, onDataSetSelected } = props;
  const [indexPatternList, setIndexPatternList] = useState([]);
  const [clusterList, setClusterList] = useState([]);
  const [indexList, setIndexList] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [selectedDataSet, setSelectedDataSet] = useState(null);
  const [isDataSetNavigatorOpen, setIsDataSetNavigatorOpen] = useState(false);

  const onButtonClick = () => setIsDataSetNavigatorOpen(!isDataSetNavigatorOpen);
  const closePopover = () => setIsDataSetNavigatorOpen(false);
  const onDataSetClick = async (dataSet) => {
    setSelectedDataSet(dataSet);
    onDataSetSelected(dataSet);
    settings.setSelectedDataSet(dataSet);
    closePopover();
  };

  useEffect(() => {
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
  }, [indexPatternsService, savedObjectsClient, search, selectedCluster]);

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

  const contextMenuPanels = [
    {
      id: 0,
      title: 'DATA',
      items: [
        {
          name: 'Index Patterns',
          panel: 1,
        },
        ...clusterList.map((cluster) => ({
          name: cluster.attributes.title,
          panel: 2,
          onClick: () => setSelectedCluster(cluster),
        })),
      ],
    },
    {
      id: 1,
      title: 'Index Patterns',
      items: indexPatternList.map((indexPattern) => ({
        name: indexPattern.name,
        onClick: () => onDataSetClick(indexPattern),
      })),
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
      items: indexList.map((index) => ({
        name: index.name,
        onClick: () => onDataSetClick(index),
      })),
    },
    {
      id: 4,
      title: 'clicked',
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
