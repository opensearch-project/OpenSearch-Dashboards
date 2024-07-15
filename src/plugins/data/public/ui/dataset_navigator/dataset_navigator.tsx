/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

import { EuiButtonEmpty, EuiContextMenu, EuiPopover } from '@elastic/eui';
import {
  DataSetWithDataSource,
  DataSource,
  IndexPatternOption,
} from '../../data_sources/datasource';
import { DataSourceOption } from '../../data_sources/datasource_selector/types';
import { IndexPatternSelectable } from './index_pattern_selectable';

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

interface DataSetNavigatorProps {
  dataSources: DataSource[];
  indexPatternOptionList: any;
  selectedSources: DataSourceOption[];
  setIndexPatternOptionList: any;
  handleSourceSelection: any;
}

export const DataSetNavigator = ({
  dataSources,
  indexPatternOptionList,
  selectedSources,
  setIndexPatternOptionList,
  handleSourceSelection,
}: DataSetNavigatorProps) => {
  const [isDataSetNavigatorOpen, setIsDataSetNavigatorOpen] = useState(false);

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

  const indexPatternSelectable = (
    <IndexPatternSelectable
      indexPatternOptionList={indexPatternOptionList}
      setIndexPatternOptionList={setIndexPatternOptionList}
      handleSourceSelection={handleSourceSelection}
    />
  );

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

  const dataSetNavigatorPanels = [
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
        },
      ],
    },
    {
      id: 1,
      title: 'Index Patterns',
      content: <div>{indexPatternSelectable}</div>,
    },
    {
      id: 2,
      title: 'Clusters',
      content: <div />,
    },
  ];

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
