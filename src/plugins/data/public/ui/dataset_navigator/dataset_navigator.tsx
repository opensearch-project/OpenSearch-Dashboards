/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

import {
  EuiButtonEmpty,
  EuiContextMenu,
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
import { SavedObjectsClientContract, SimpleSavedObject } from 'opensearch-dashboards/public';
import { DataSourceAttributes } from '../../../../data_source_management/public/types';

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

  return result;
};

const getClusters = async (savedObjectsClient: SavedObjectsClientContract) => {
  return await savedObjectsClient.find<DataSourceAttributes>({
    type: 'data-source',
    perPage: 10000,
  });
};

interface DataSetNavigatorProps {
  savedObjectsClient: SavedObjectsClientContract;
  dataSources: DataSource[];
  indexPatternOptionList: any;
  selectedSources: DataSourceOption[];
  setIndexPatternOptionList: any;
  handleSourceSelection: any;
}

export const DataSetNavigator = ({
  savedObjectsClient,
  dataSources,
  indexPatternOptionList,
  selectedSources,
  setIndexPatternOptionList,
  handleSourceSelection,
}: DataSetNavigatorProps) => {
  const [isDataSetNavigatorOpen, setIsDataSetNavigatorOpen] = useState(false);
  const [clusterList, setClusterList] = useState<SimpleSavedObject<DataSourceAttributes>[]>([]);
  const [dataSetNavigatorPanels, setDataSetNavigatorPanels] = useState<
    EuiContextMenuPanelDescriptor[]
  >([
    {
      id: 0,
      title: 'DATA SETS',
      items: [
        {
          name: 'Index Patterns',
          panel: 1,
        },
        {
          name: 'Connected Data Sources',
          panel: 2,
        },
        {
          name: '...',
          panel: 2,
          onClick: () => console.log('clicked ..')
        },
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
      title: 'Clusters',
      content: <div />,
    },
  ]);

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
    console.log('cluster list:', clusterList);
  }, [clusterList]);

  // useEffect(() => {
  //   setDataSetNavigatorPanels((prevPanels: EuiContextMenuPanelDescriptor[]) => 
  //     prevPanels.map(panel => {
  //       const initialItems = panel.items?.filter(item => item?.panel === 1);
  //       const clusterPanels = clusterList.map((cluster) => ({
  //         name: cluster.attributes.title,
  //       }))
  //       return panel;
  //     })
  //   )
  // }, [clusterList])

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
      <EuiContextMenu initialPanelId={0} panels={dataSetNavigatorPanels} />
    </EuiPopover>
  );
};
